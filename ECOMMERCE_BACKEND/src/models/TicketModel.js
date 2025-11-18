const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { TICKET_TYPES, TICKET_STATUSES } = require("./constants"); // Giả định

const ticketSchema = new Schema({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: "Event",
    required: true,
    index: true,
  },

  type: {
    type: String,
    enum: TICKET_TYPES,
    default: "GeneralAdmission",
    required: true,
  },

  price: {
    type: Number, // decimal(10,2)
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  sold: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Available (Quantity - Sold) là trường tính toán (computed property), không cần lưu

  startDate: { type: Date, required: true }, // Ngày có hiệu lực
  endDate: { type: Date, required: true }, // Ngày hết hiệu lực

  description: { type: String, maxLength: 500 },
  ticketCode: { type: String, maxLength: 100 }, // Mã loại vé (VD: VIP01, STANDA)
  discount: { type: Number }, // decimal(5,2)
  currency: { type: String, default: "VND" },

  trangThai: {
    type: String,
    enum: TICKET_STATUSES,
    default: "ConVe",
  },
  ticketSaleStart: { type: Date },
  ticketSaleEnd: { type: Date },
});

module.exports = mongoose.model("Ticket", ticketSchema);
