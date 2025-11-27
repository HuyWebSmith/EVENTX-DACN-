const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const locationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      maxLength: 255,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },

    address: {
      type: String,
      required: true,
      maxLength: 255,
    },

    ward: {
      type: String,
      required: false,
      maxLength: 100,
    },

    district: {
      type: String,
      required: true,
      maxLength: 100,
    },

    city: {
      type: String,
      required: true,
      maxLength: 100,
    },

    // OPTIONAL: Nếu muốn tự động check còn chỗ ngồi
    capacity: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Location", locationSchema);
