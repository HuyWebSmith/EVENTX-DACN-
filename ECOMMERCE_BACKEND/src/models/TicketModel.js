const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { TICKET_TYPES, TICKET_STATUSES } = require("../utils/constants"); // Giả định

const ticketSchema = new Schema({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: "Event",
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
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
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  description: { type: String, maxLength: 500 },
  ticketCode: { type: String, maxLength: 100 },
  discount: { type: Number },
  currency: { type: String, default: "VND" },
  trangThai: {
    type: String,
    enum: TICKET_STATUSES,
    default: "ConVe",
  },
  ticketSaleStart: { type: Date },
  ticketSaleEnd: { type: Date },

  // --- MỚI: hỗ trợ vé theo khu vực sân khấu ---
  stageImageUrl: { type: String }, // URL ảnh sân khấu
  areaCoords: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  isStageImageUrl: { type: Boolean, default: false },
});

module.exports = mongoose.model("Ticket", ticketSchema);
