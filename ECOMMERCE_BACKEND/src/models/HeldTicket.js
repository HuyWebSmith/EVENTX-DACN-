const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const EXPIRE_SECONDS = 15 * 60; // 15 phút (900 giây)

const heldTicketSchema = new Schema({
  ticketId: {
    type: Schema.Types.ObjectId,
    ref: "Ticket",
    required: true,
  },
  userId: {
    type: String, // Người dùng đang giữ vé
    ref: "ApplicationUser",
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
  },

  heldAt: {
    type: Date,
    default: Date.now,
  },

  // Sử dụng TTL Index để MongoDB tự động xóa bản ghi sau 15 phút
  expiryAt: {
    type: Date,
    default: () => new Date(Date.now() + EXPIRE_SECONDS * 1000),
    index: { expires: EXPIRE_SECONDS }, // TTL Index
  },

  // Không cần IsReserved vì mục đích chính của bảng này là giữ chỗ
});

// Index để tìm kiếm nhanh vé được giữ bởi TicketId và UserId
heldTicketSchema.index({ ticketId: 1, userId: 1 });

module.exports = mongoose.model("HeldTicket", heldTicketSchema);
