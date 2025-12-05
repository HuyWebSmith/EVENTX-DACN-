const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Schema này quản lý TỪNG CHỖ NGỒI đang được giữ tạm thời.
const heldSeatReservationSchema = new Schema({
  // ID của chỗ ngồi CỤ THỂ đang được giữ.
  seatId: {
    type: Schema.Types.ObjectId,
    ref: "Seat",
    required: true,
    unique: true, // Đảm bảo 1 ghế chỉ được giữ 1 lần
    index: true,
  },

  // ID loại vé mà ghế này thuộc về (dùng cho việc tính giá và cập nhật kho)
  ticketTypeId: {
    type: Schema.Types.ObjectId,
    ref: "Ticket",
    required: true,
  },

  showtimeId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },

  userId: {
    type: String,
    index: true,
    required: true,
  },

  // Thời gian giữ chỗ hết hạn (ví dụ: 15 phút).
  expirationTime: {
    type: Date,
    required: true,
    // Dùng index TTL (Time-To-Live) để MongoDB tự động xóa khi hết hạn
    index: { expires: "0s" },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  "HeldSeatReservation",
  heldSeatReservationSchema
);
