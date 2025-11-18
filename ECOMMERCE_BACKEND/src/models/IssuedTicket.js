const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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
