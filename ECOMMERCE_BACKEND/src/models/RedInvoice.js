const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { BUSINESS_TYPES } = require("../utils/constants"); // Giả định

const redInvoiceSchema = new Schema({
  businessType: {
    type: String,
    enum: BUSINESS_TYPES,
    required: true,
  },

  fullName: { type: String, required: true, maxLength: 100 },
  address: { type: String, required: true, maxLength: 200 },
  taxCode: { type: String, required: true, maxLength: 20 },

  // Lưu ý: Trường này nên liên kết với OrderId (tốt hơn) nhưng giữ EventId theo C#
  eventId: {
    type: Schema.Types.ObjectId,
    ref: "Event",
    required: true,
    index: true,
  },
});

module.exports = mongoose.model("RedInvoice", redInvoiceSchema);
