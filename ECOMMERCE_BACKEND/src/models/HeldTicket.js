// models/HeldTicket.js (Sử dụng lại chính xác như bạn đã định nghĩa)
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// 15 phút = 900 giây
const EXPIRE_SECONDS = 15 * 60;

const heldTicketSchema = new Schema({
  // Nếu bạn đang đặt ghế cụ thể, nên thay thế bằng seatId và thêm holdSessionId
  ticketId: {
    type: Schema.Types.ObjectId,
    ref: "Ticket",
    required: true,
  },
  showtimeId: {
    type: Schema.Types.ObjectId,
    ref: "Showtime", // Giả định bạn có model Showtime
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  quantity: {
    // Số lượng vé giữ (Nếu ticketId là loại vé)
    type: Number,
    required: true,
    min: 1,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  heldAt: {
    type: Date,
    default: Date.now,
  },
  // TTL Index: MongoDB tự động xóa sau 15 phút kể từ expiryAt
  expiryAt: {
    type: Date,
    default: () => new Date(Date.now() + EXPIRE_SECONDS * 1000),
    index: { expires: EXPIRE_SECONDS },
  },
});

heldTicketSchema.index({ ticketId: 1, userId: 1 });

const HeldTicket = mongoose.model("HeldTicket", heldTicketSchema);
module.exports = HeldTicket;
