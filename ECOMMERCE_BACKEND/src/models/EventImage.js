const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const eventImageSchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true, // tối ưu query
    },

    imageUrl: {
      type: String,
      required: true,
      maxLength: 255,
    },

    isPrimary: {
      type: Boolean,
      default: false, // ảnh đại diện
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EventImage", eventImageSchema);
