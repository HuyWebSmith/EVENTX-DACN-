const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const voucherImageSchema = new Schema({
  imageUrl: { type: String, required: true, trim: true },
  link: { type: String, trim: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("VoucherImage", voucherImageSchema);
