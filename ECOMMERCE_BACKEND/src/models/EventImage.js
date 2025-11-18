const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const eventImageSchema = new Schema({
  // ImageID (Mongoose tự động tạo _id)

  eventId: {
    type: Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },

  imageUrl: {
    type: String,
    required: true,
    maxLength: 255,
  },
  isPrimary: {
    // Đề xuất: Đánh dấu ảnh đại diện
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("EventImage", eventImageSchema);
