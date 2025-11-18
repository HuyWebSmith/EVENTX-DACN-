const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentInfoSchema = new Schema({
  accountHolder: { type: String, required: true, maxLength: 100 },
  accountNumber: { type: String, required: true, maxLength: 20 },
  bankName: { type: String, required: true, maxLength: 100 },
  branch: { type: String, maxLength: 100 },

  creatorId: {
    type: String, // ID người tạo (Host/Organizer)
    ref: "ApplicationUser",
  },

  eventId: {
    type: Schema.Types.ObjectId,
    ref: "Event",
    index: true,
  },
});

module.exports = mongoose.model("PaymentInfo", paymentInfoSchema);
