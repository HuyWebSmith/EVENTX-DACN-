const HeldTicket = require("../models/HeldTicket"); // Tương đương TemporaryReservation
const IssuedTicket = require("../models/IssuedTicket"); // Vé chính thức
const Ticket = require("../models/TicketModel"); // Thông tin loại vé
const mongoose = require("mongoose");
const { updateTicketSoldCount } = require("./TicketService"); // Hàm dịch vụ giả định

// --- LUỒNG A: XỬ LÝ THANH TOÁN THÀNH CÔNG ---
exports.handlePaymentSuccess = async (req, res) => {
  // Thông tin nhận được từ Payment Gateway (Webhook/Callback)
  const { holdId, paymentReferenceId, ticketData } = req.body;

  // Sử dụng Transaction để đảm bảo tính nhất quán (Atomicity)
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // A1. Xác minh HoldTicket và lấy thông tin
    const heldTickets = await HeldTicket.find({ _id: holdId }).session(session);

    if (heldTickets.length === 0) {
      // Trường hợp hold đã bị xóa (do TTL hoặc đã xử lý), trả về lỗi hoặc OK (nếu đã xử lý)
      return res
        .status(404)
        .json({
          status: "ERR",
          message: "Giao dịch đã bị hết hạn hoặc đã được xử lý.",
        });
    }

    // Cần thực hiện các bước kiểm tra trùng lặp tại đây (nếu có)
    // ...

    let totalTicketsIssued = 0;
    const issuedTickets = [];

    // A2. Tạo Vé Chính thức (IssuedTicket) cho từng loại vé trong Hold
    for (const heldTicket of heldTickets) {
      // Đây là logic đơn giản cho vé không có seatId riêng lẻ (chỉ là số lượng)
      // Trong thực tế, bạn sẽ cần lặp lại (heldTicket.quantity) lần để tạo IssuedTicket nếu cần mỗi vé 1 mã code
      // Vì HeldTicket đang theo dõi quantity (số lượng), chúng ta sẽ tạo IssuedTicket 1 lần

      const newIssuedTicket = new IssuedTicket({
        // Giả định bạn có logic sinh ra ticketCode và orderDetailId
        ticketCode: `TICKET-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        orderDetailId: paymentReferenceId, // Sử dụng ID giao dịch làm orderDetailId tạm thời
        seatId: heldTicket.ticketId, // Ở đây seatId được dùng để tham chiếu loại vé (Ticket Type ID)
        userId: heldTicket.userId,
        // ... thêm các trường khác nếu cần
      });
      issuedTickets.push(newIssuedTicket);
      totalTicketsIssued += heldTicket.quantity;

      // Cập nhật số lượng đã bán trong model Ticket (A4 - Phần 2)
      await updateTicketSoldCount(
        heldTicket.ticketId,
        heldTicket.quantity,
        session
      );
    }

    await IssuedTicket.insertMany(issuedTickets, { session });

    // A3. Hủy Đặt chỗ Tạm thời (Xóa HeldTicket)
    await HeldTicket.deleteMany({ _id: holdId }).session(session);

    await session.commitTransaction();

    // A5. Hoàn tất (Thông báo cho người dùng và cập nhật real-time)
    const io = req.app.get("socketio");
    if (io) {
      io.to(heldTickets[0].showtimeId).emit("ticketUpdate", {
        // Gửi thông báo cập nhật kho vé
        message: "Kho vé đã được cập nhật do giao dịch thành công.",
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

// --- LUỒNG B: XỬ LÝ THANH TOÁN THẤT BẠI ---
exports.handlePaymentFailure = async (req, res) => {
  // Thông tin nhận được từ Payment Gateway (Webhook/Callback)
  const { holdId } = req.body;

  try {
    // B1. Hủy Đặt chỗ Tạm thời (Xóa HeldTicket)
    const heldTicket = await HeldTicket.findOne({ _id: holdId });

    if (!heldTicket) {
      return res
        .status(404)
        .json({ status: "ERR", message: "Không tìm thấy giao dịch giữ chỗ." });
    }

    await HeldTicket.deleteOne({ _id: holdId });

    // B2. Cập nhật trạng thái ghế (trong trường hợp này là gửi Socket.io để client cập nhật)
    const io = req.app.get("socketio");
    if (io) {
      io.to(heldTicket.showtimeId).emit("ticketUpdate", {
        // Thông báo cập nhật kho vé
        message: "Kho vé đã được cập nhật do giao dịch thất bại/hủy.",
      });
    }

    // B3. Hoàn tất
    res
      .status(200)
      .json({ status: "OK", message: "Vé giữ chỗ đã được hủy thành công." });
  } catch (error) {
    console.error("Lỗi khi xử lý thanh toán thất bại:", error);
    res
      .status(500)
      .json({ status: "ERR", message: `Lỗi Server: ${error.message}` });
  }
};
