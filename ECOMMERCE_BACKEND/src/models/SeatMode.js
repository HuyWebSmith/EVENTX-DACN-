const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Schema này đại diện cho một ghế ngồi vật lý trong rạp/sân vận động/sự kiện.
const seatSchema = new Schema({
  // Tên ghế (ví dụ: A1, B15)
  name: {
    type: String,
    required: true,
  },

  // ID phòng chiếu/khu vực mà ghế này thuộc về
  showtimeId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },

  // Loại vé áp dụng cho ghế này (Standard, VIP, Economy,...)
  ticketTypeId: {
    type: Schema.Types.ObjectId,
    ref: "Ticket",
    required: true,
  },

  // Trạng thái hiện tại của ghế
  status: {
    type: String,
    enum: ["AVAILABLE", "HELD", "CONFIRMED"],
    default: "AVAILABLE",
  },
});

seatSchema.index({ showtimeId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Seat", seatSchema);
