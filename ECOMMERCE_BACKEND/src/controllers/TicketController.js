const Ticket = require("../models/TicketModel");
const HeldTicket = require("../models/HeldTicket");
const mongoose = require("mongoose");

const HOLD_DURATION_MILLISECONDS = 15 * 60 * 1000;

exports.getTicketsWithAvailability = async (req, res) => {
  const { eventId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: "ID sự kiện không hợp lệ." });
  }

  try {
    const tickets = await Ticket.find({ eventId });
    if (!tickets.length) {
      return res.status(404).json({ message: "Không tìm thấy vé." });
    }

    const heldTickets = await HeldTicket.aggregate([
      { $match: { ticketId: { $in: tickets.map((t) => t._id) } } },
      { $group: { _id: "$ticketId", totalHeld: { $sum: "$quantity" } } },
    ]);

    const heldMap = new Map();
    heldTickets.forEach((item) =>
      heldMap.set(item._id.toString(), item.totalHeld)
    );

    const resultTickets = tickets.map((ticket) => {
      const heldCount = heldMap.get(ticket._id.toString()) || 0;
      return {
        ...ticket.toObject(),
        heldCount,
        availability: Math.max(0, ticket.quantity - ticket.sold - heldCount),
      };
    });

    res.json({ status: "OK", data: resultTickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "ERROR", message: err.message });
  }
};

exports.holdTickets = async (req, res) => {
  try {
    const { showtimeId, userId, ticketId, quantity } = req.body;

    if (!showtimeId || !userId || !ticketId || !quantity || quantity <= 0) {
      return res.status(400).json({
        status: "ERROR",
        message:
          "Thiếu dữ liệu bắt buộc (showtimeId, ticketId, userId hoặc số lượng vé là 0).",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(showtimeId) ||
      !mongoose.Types.ObjectId.isValid(ticketId) ||
      userId.trim() === ""
    ) {
      return res.status(400).json({
        status: "ERROR",
        message: "ID sự kiện, vé hoặc người dùng không hợp lệ.",
      });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket)
      return res
        .status(404)
        .json({ status: "ERROR", message: "Không tìm thấy vé." });

    const heldCounts = await HeldTicket.aggregate([
      { $match: { ticketId: ticket._id } },
      { $group: { _id: "$ticketId", totalHeld: { $sum: "$quantity" } } },
    ]);

    const currentHeld = heldCounts[0]?.totalHeld || 0;
    const available = ticket.quantity - ticket.sold - currentHeld;

    if (quantity > available) {
      return res.status(409).json({
        status: "ERROR",
        message: `Không đủ vé. Chỉ còn ${available} vé loại "${ticket.type}".`,
      });
    }

    const expirationTime = new Date(Date.now() + HOLD_DURATION_MILLISECONDS);

    const newHeldTicket = new HeldTicket({
      ticketId: ticket._id,
      showtimeId,
      userId,
      quantity,
      expiresAt: expirationTime,
    });

    const savedHold = await newHeldTicket.save();

    const io = req.app.get("socketio");
    if (io) {
      io.to(showtimeId).emit("ticketUpdate", {
        eventId: showtimeId,
        message: "Kho vé đã thay đổi.",
      });
    }

    res.status(200).json({
      status: "OK",
      message: `Đã giữ thành công ${quantity} vé.`,
      data: {
        holdId: savedHold._id.toString(),
        expirationTime,
        heldQuantity: quantity,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "ERROR", message: `Lỗi Server: ${error.message}` });
  }
};
