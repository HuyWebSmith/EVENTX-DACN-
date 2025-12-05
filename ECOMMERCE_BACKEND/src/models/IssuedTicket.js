const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Đây là schema cho vé đã được thanh toán và phát hành chính thức
const issuedTicketSchema = new Schema({
  ticketCode: {
    type: String,
    required: true,
    unique: true, // Mã vé là duy nhất
    trim: true,
  },

  orderDetailId: {
    type: Schema.Types.ObjectId,
    ref: "OrderDetail",
    required: true,
    index: true,
  },

  // Bổ sung: ID chỗ ngồi, vĩnh viễn được gán sau khi thanh toán thành công.
  // Đây là ID chỗ ngồi đã được giữ tạm thời (Temporary Hold) và được xác nhận (Confirmed).
  seatId: {
    type: Schema.Types.ObjectId,
    ref: "Seat", // Giả định bạn có một bảng "Seat"
    required: true,
    index: true,
  },

  userId: {
    type: String, // Khóa ngoại string tới ApplicationUser
    ref: "ApplicationUser",
    index: true,
  },

  isCheckedIn: {
    type: Boolean,
    default: false,
  },
  checkinTime: {
    type: Date,
    default: null,
  },
  soldDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("IssuedTicket", issuedTicketSchema);
