const Ticket = require("../models/TicketModel");
const HeldTicket = require("../models/HeldTicket");
const mongoose = require("mongoose");

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

    // 2. Lấy tổng số lượng vé đang bị giữ (HeldTicket)
    // Group by ticketId để biết mỗi loại vé đang bị giữ bao nhiêu
    const heldTickets = await HeldTicket.aggregate([
      {
        $match: {
          // Lọc chỉ những HeldTicket có ticketId thuộc các vé của eventId này
          ticketId: { $in: tickets.map((t) => t._id) },
        },
      },
      {
        $group: {
          _id: "$ticketId",
          totalHeld: { $sum: "$quantity" },
        },
      },
    ]);

    // Chuyển đổi mảng heldTickets thành một Map để truy cập nhanh
    const heldMap = new Map();
    heldTickets.forEach((item) =>
      heldMap.set(item._id.toString(), item.totalHeld)
    );

    // 3. Tính toán số lượng vé khả dụng thực tế
    const resultTickets = tickets.map((ticket) => {
      const ticketIdStr = ticket._id.toString();
      const heldCount = heldMap.get(ticketIdStr) || 0;

      // Công thức: Tổng - Đã bán - Đang giữ
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
const HOLD_DURATION_MILLISECONDS = 15 * 60 * 1000;

exports.holdTickets = async (req, res) => {
  try {
    const { showtimeId, seatIds, userId } = req.body;

    // 1. Validation Dữ liệu Bắt Buộc
    if (!showtimeId || !seatIds || !userId || seatIds.length === 0) {
      return res.status(400).json({
        status: "ERROR",
        message:
          "Thiếu dữ liệu bắt buộc (showtimeId, seatIds, userId hoặc số lượng vé là 0).",
      });
    }

    // Validation ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(showtimeId) || userId.trim() === "") {
      return res.status(400).json({
        status: "ERROR",
        message: "ID sự kiện hoặc người dùng không hợp lệ.",
      });
    }

    // 2. Gom nhóm số lượng vé theo loại (Do Frontend gửi ID loại vé lặp lại)
    const ticketCounts = seatIds.reduce((acc, ticketId) => {
      // Kiểm tra ID loại vé có phải là ObjectId hợp lệ không
      if (!mongoose.Types.ObjectId.isValid(ticketId)) {
        throw new Error(`Ticket ID không hợp lệ: ${ticketId}`);
      }
      acc[ticketId] = (acc[ticketId] || 0) + 1;
      return acc;
    }, {});

    const ticketIdsToHold = Object.keys(ticketCounts);

    // 3. Kiểm tra tính khả dụng (Quan trọng nhất)

    // A. Lấy thông tin tổng thể của các loại vé
    const ticketsInDB = await Ticket.find({
      _id: { $in: ticketIdsToHold },
    }).select("quantity sold type");

    // B. Lấy số lượng vé đang được giữ hiện tại
    const heldCounts = await HeldTicket.aggregate([
      {
        $match: {
          ticketId: {
            $in: ticketIdsToHold.map((id) => new mongoose.Types.ObjectId(id)),
          },
        },
      },
      { $group: { _id: "$ticketId", totalHeld: { $sum: "$quantity" } } },
    ]);
    const heldMap = heldCounts.reduce(
      (map, item) => map.set(item._id.toString(), item.totalHeld),
      new Map()
    );

    // C. So sánh số lượng yêu cầu và khả dụng
    for (const ticket of ticketsInDB) {
      const ticketIdStr = ticket._id.toString();
      const requestedQuantity = ticketCounts[ticketIdStr] || 0;
      const currentHeld = heldMap.get(ticketIdStr) || 0;
      const totalAvailability = ticket.quantity - ticket.sold - currentHeld;

      if (requestedQuantity > totalAvailability) {
        return res.status(409).json({
          status: "ERROR",
          message: `Lỗi: Vé loại "${
            ticket.type
          }" không đủ số lượng. Chỉ còn lại ${Math.max(
            0,
            totalAvailability
          )} vé.`,
        });
      }
    }

    // 4. Tạo và Lưu Bản Ghi HeldTicket

    // Thiết lập thời gian hết hạn sau 15 phút
    const expirationTime = new Date(Date.now() + HOLD_DURATION_MILLISECONDS);
    let totalHeldQuantity = 0;
    let holdId;

    const holds = [];
    for (const [ticketIdStr, quantity] of Object.entries(ticketCounts)) {
      const newHeldTicket = new HeldTicket({
        ticketId: new mongoose.Types.ObjectId(ticketIdStr),
        showtimeId: new mongoose.Types.ObjectId(showtimeId),
        userId: userId,
        quantity: quantity,
        expiresAt: expirationTime, // Thiết lập TTL
      });

      const savedHold = await newHeldTicket.save();
      holds.push(savedHold);
      totalHeldQuantity += quantity;
    }

    if (holds.length > 0) {
      // Lấy ID của bản ghi đầu tiên làm Hold ID
      holdId = holds[0]._id.toString();

      const io = req.app.get("socketio");
      if (io) {
        io.to(showtimeId).emit("ticketUpdate", {
          eventId: showtimeId,
          message: "Kho vé đã thay đổi.",
        });
      }
    }

    // 5. Phản hồi Thành công
    res.status(200).json({
      status: "OK",
      message: `Đã giữ thành công ${totalHeldQuantity} vé.`,
      data: {
        holdId: holdId,
        expirationTime: expirationTime,
        heldQuantity: totalHeldQuantity,
      },
    });
  } catch (error) {
    console.error("Lỗi khi giữ vé:", error);
    res.status(500).json({
      status: "ERROR",
      message: `Lỗi Server: ${error.message}`,
    });
  }
};
