const HeldSeatReservation = require("../models/HeldSeatReservation"); // MỚI: Giữ chỗ từng ghế
const Seat = require("../models/SeatModel"); // MỚI: Thông tin ghế vật lý
const IssuedTicket = require("../models/IssuedTicket"); // Vé chính thức (cũ)
const Ticket = require("../models/TicketModel"); // Thông tin loại vé (cũ)
const mongoose = require("mongoose");
const { updateTicketSoldCount } = require("./TicketService"); // Hàm dịch vụ giả định

// Thời gian giữ chỗ
const HOLD_DURATION_MILLISECONDS = 15 * 60 * 1000;

/**
 * Endpoint để lấy thông tin các loại vé kèm theo số lượng khả dụng thực tế.
 * (Logic này vẫn giữ nguyên vì nó tính dựa trên loại vé, không phải ghế cá nhân)
 */
exports.getTicketsWithAvailability = async (req, res) => {
  const { eventId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: "ID sự kiện không hợp lệ." });
  }

  try {
    const tickets = await Ticket.find({ eventId });

    if (tickets.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy loại vé nào cho sự kiện này." });
    }

    // 2. Lấy tổng số lượng vé đang bị giữ (HeldSeatReservation)
    // Group by ticketTypeId để biết mỗi loại vé đang bị giữ bao nhiêu
    const heldSeats = await HeldSeatReservation.aggregate([
      {
        $match: {
          // Lọc chỉ những HeldSeatReservation có ticketTypeId thuộc các vé của eventId này
          ticketTypeId: { $in: tickets.map((t) => t._id) },
        },
      },
      {
        $group: {
          _id: "$ticketTypeId",
          totalHeld: { $sum: 1 }, // Đếm số lượng HeldSeatReservation (mỗi document là 1 ghế)
        },
      },
    ]);

    // Chuyển đổi mảng heldSeats thành một Map để truy cập nhanh
    const heldMap = new Map();
    heldSeats.forEach((item) =>
      heldMap.set(item._id.toString(), item.totalHeld)
    );

    // 3. Tính toán số lượng vé khả dụng thực tế
    const resultTickets = tickets.map((ticket) => {
      const ticketIdStr = ticket._id.toString();
      const heldCount = heldMap.get(ticketIdStr) || 0;

      // Công thức: Tổng - Đã bán - Đang giữ
      // Chú ý: Cần đảm bảo ticket.quantity/ticket.sold là số lượng VÉ, không phải số lượng GHẾ
      // Trong mô hình này, ta cần lấy tổng số lượng ghế của loại vé đó từ bảng Seat để chính xác hơn
      // Hiện tại, ta vẫn dùng ticket.quantity và ticket.sold có sẵn.
      const availability = ticket.quantity - ticket.sold - heldCount;

      return {
        ...ticket.toObject(),
        heldCount, // Số lượng đang được giữ
        availability: Math.max(0, availability), // Đảm bảo số lượng còn lại không âm
      };
    });

    res.json({
      status: "OK",
      data: resultTickets,
    });
  } catch (error) {
    console.error("Error fetching tickets with availability:", error);
    res.status(500).json({ status: "ERR", message: error.message });
  }
};

/**
 * Endpoint để giữ chỗ tạm thời cho TỪNG GHẾ (seatId) cụ thể.
 * Hàm này đã được sửa lỗi logic và sử dụng HeldSeatReservation mới.
 */
exports.holdTickets = async (req, res) => {
  // Lưu ý: seatIds giờ là MẢNG CÁC ID GHẾ CỤ THỂ
  const { showtimeId, seatIds, userId } = req.body;

  // Sử dụng Transaction để đảm bảo tính nhất quán (Atomicity)
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validation Dữ liệu Bắt Buộc
    if (
      !showtimeId ||
      !seatIds ||
      !userId ||
      !Array.isArray(seatIds) ||
      seatIds.length === 0
    ) {
      await session.abortTransaction();
      return res.status(400).json({
        status: "ERROR",
        message:
          "Thiếu dữ liệu bắt buộc (showtimeId, seatIds, userId, hoặc seatIds không phải mảng).",
      });
    }

    const seatObjectIds = seatIds.map((id) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`ID Ghế không hợp lệ: ${id}`);
      }
      return new mongoose.Types.ObjectId(id);
    });

    // 2. Kiểm tra tính khả dụng và lấy thông tin loại vé (ticketTypeId)

    // A. Kiểm tra xem các ghế đã bị giữ bởi người khác chưa
    const heldSeats = await HeldSeatReservation.find({
      seatId: { $in: seatObjectIds },
    }).session(session);

    if (heldSeats.length > 0) {
      const heldSeatIds = heldSeats.map((s) => s.seatId.toString());
      await session.abortTransaction();
      return res.status(409).json({
        status: "ERROR",
        message: `Lỗi: Các ghế sau đã bị giữ hoặc đang chờ thanh toán: ${heldSeatIds.join(
          ", "
        )}`,
      });
    }

    // B. Lấy thông tin chi tiết các ghế (đặc biệt là ticketTypeId)
    const seatsInDB = await Seat.find({
      _id: { $in: seatObjectIds },
      showtimeId: showtimeId,
      status: "AVAILABLE", // Đảm bảo ghế phải có trạng thái AVAILABLE
    }).session(session);

    if (seatsInDB.length !== seatIds.length) {
      await session.abortTransaction();
      return res.status(409).json({
        status: "ERROR",
        message:
          "Lỗi: Một hoặc nhiều ghế không tồn tại, không thuộc suất chiếu hoặc không khả dụng (đã bán/đang giữ).",
      });
    }

    // 3. Tạo và Lưu Bản Ghi HeldSeatReservation cho TỪNG GHẾ

    const expirationTime = new Date(Date.now() + HOLD_DURATION_MILLISECONDS);
    let totalHeldQuantity = 0;
    let holdIds = []; // Dùng để theo dõi tất cả các ID giữ chỗ

    const holdsToCreate = seatsInDB.map((seat) => {
      totalHeldQuantity++;
      return {
        seatId: seat._id,
        ticketTypeId: seat.ticketTypeId,
        showtimeId: showtimeId,
        userId: userId,
        expirationTime: expirationTime, // Thiết lập TTL
      };
    });

    const savedHolds = await HeldSeatReservation.insertMany(holdsToCreate, {
      session,
    });
    holdIds = savedHolds.map((h) => h._id.toString());

    // 4. Cập nhật trạng thái ghế trong bảng Seat
    await Seat.updateMany(
      { _id: { $in: seatObjectIds } },
      { $set: { status: "HELD" } }
    ).session(session);

    // 5. Phản hồi Thành công và Socket.io

    await session.commitTransaction();

    const io = req.app.get("socketio");
    if (io) {
      // Gửi tín hiệu Socket.io để client cập nhật bản đồ ghế và kho vé
      io.to(showtimeId).emit("seatStatusUpdate", {
        showtimeId: showtimeId,
        heldSeatIds: seatIds, // Gửi các ghế vừa được giữ
        message: "Một số ghế đã được giữ tạm thời.",
      });
    }

    // Phản hồi Thành công
    res.status(200).json({
      status: "OK",
      message: `Đã giữ thành công ${totalHeldQuantity} ghế.`,
      data: {
        holdIds: holdIds, // Trả về ID của các bản ghi giữ chỗ
        expirationTime: expirationTime,
        heldQuantity: totalHeldQuantity,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Lỗi khi giữ vé/ghế:", error);
    res.status(500).json({
      status: "ERROR",
      message: `Lỗi Server: ${error.message}`,
    });
  } finally {
    session.endSession();
  }
};

// --- LUỒNG A: XỬ LÝ THANH TOÁN THÀNH CÔNG (Cập nhật để sử dụng HeldSeatReservation) ---
exports.handlePaymentSuccess = async (req, res) => {
  // Thông tin nhận được từ Payment Gateway (Webhook/Callback)
  // Lưu ý: holdId bây giờ có thể là một MẢNG ID nếu giao dịch bao gồm nhiều ghế
  const { holdIds, paymentReferenceId, userId } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // A1. Xác minh HeldSeatReservation và lấy thông tin
    const heldReservations = await HeldSeatReservation.find({
      _id: { $in: holdIds },
    }).session(session);

    if (heldReservations.length === 0) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({
          status: "ERR",
          message: "Giao dịch giữ chỗ đã bị hết hạn hoặc đã được xử lý.",
        });
    }

    // Lấy danh sách các SeatId và TicketTypeId cần xử lý
    const seatIdsToConfirm = heldReservations.map((r) => r.seatId);
    const ticketCounts = heldReservations.reduce((acc, curr) => {
      const id = curr.ticketTypeId.toString();
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});

    let totalTicketsIssued = 0;
    const issuedTickets = [];

    // A2. Tạo Vé Chính thức (IssuedTicket) cho từng ghế
    for (const reservation of heldReservations) {
      const newIssuedTicket = new IssuedTicket({
        ticketCode: `TICKET-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        orderDetailId: paymentReferenceId,
        seatId: reservation.seatId, // RẤT QUAN TRỌNG: Đây là ID GHẾ CỤ THỂ
        userId: reservation.userId,
        // ...
      });
      issuedTickets.push(newIssuedTicket);
      totalTicketsIssued++;
    }

    await IssuedTicket.insertMany(issuedTickets, { session });

    // A3. Hủy Đặt chỗ Tạm thời (Xóa HeldSeatReservation)
    await HeldSeatReservation.deleteMany({ _id: { $in: holdIds } }).session(
      session
    );

    // A4. Cập nhật Trạng thái Ghế (Seat) và Số lượng Đã bán (Ticket)
    await Seat.updateMany(
      { _id: { $in: seatIdsToConfirm } },
      { $set: { status: "CONFIRMED" } }
    ).session(session);

    // Cập nhật số lượng đã bán trong model Ticket (vì một vé đã được bán)
    for (const [ticketId, quantity] of Object.entries(ticketCounts)) {
      await updateTicketSoldCount(
        new mongoose.Types.ObjectId(ticketId),
        quantity,
        session
      );
    }

    await session.commitTransaction();

    // A5. Hoàn tất (Thông báo cho người dùng và cập nhật real-time)
    const io = req.app.get("socketio");
    if (io) {
      io.to(heldReservations[0].showtimeId).emit("seatStatusUpdate", {
        // Gửi thông báo cập nhật bản đồ ghế
        confirmedSeatIds: seatIdsToConfirm,
      });
    }

    res
      .status(200)
      .json({
        status: "OK",
        message: `Đã phát hành thành công ${totalTicketsIssued} vé.`,
        tickets: issuedTickets,
      });
  } catch (error) {
    await session.abortTransaction();
    console.error("Lỗi khi xử lý thanh toán thành công:", error);
    res
      .status(500)
      .json({ status: "ERR", message: `Lỗi Server: ${error.message}` });
  } finally {
    session.endSession();
  }
};

// --- LUỒNG B: XỬ LÝ THANH TOÁN THẤT BẠI (Cập nhật để sử dụng HeldSeatReservation) ---
exports.handlePaymentFailure = async (req, res) => {
  // Thông tin nhận được từ Payment Gateway (Webhook/Callback)
  const { holdIds } = req.body; // holdIds có thể là mảng

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Lấy thông tin để biết ghế nào cần giải phóng và suất chiếu nào cần cập nhật
    const heldReservations = await HeldSeatReservation.find({
      _id: { $in: holdIds },
    }).session(session);

    if (heldReservations.length === 0) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ status: "ERR", message: "Không tìm thấy giao dịch giữ chỗ." });
    }

    const seatIdsToRelease = heldReservations.map((r) => r.seatId);
    const showtimeId = heldReservations[0].showtimeId;

    // B1. Hủy Đặt chỗ Tạm thời (Xóa HeldSeatReservation)
    await HeldSeatReservation.deleteMany({ _id: { $in: holdIds } }).session(
      session
    );

    // B2. Giải phóng trạng thái ghế (Seat)
    await Seat.updateMany(
      { _id: { $in: seatIdsToRelease } },
      { $set: { status: "AVAILABLE" } }
    ).session(session);

    await session.commitTransaction();

    // B3. Hoàn tất (Gửi Socket.io để client cập nhật bản đồ ghế)
    const io = req.app.get("socketio");
    if (io) {
      io.to(showtimeId).emit("seatStatusUpdate", {
        releasedSeatIds: seatIdsToRelease, // Gửi các ghế vừa được giải phóng
      });
    }

    res
      .status(200)
      .json({
        status: "OK",
        message: "Các ghế giữ chỗ đã được hủy thành công và giải phóng.",
      });
  } catch (error) {
    await session.abortTransaction();
    console.error("Lỗi khi xử lý thanh toán thất bại:", error);
    res
      .status(500)
      .json({ status: "ERR", message: `Lỗi Server: ${error.message}` });
  } finally {
    session.endSession();
  }
};
