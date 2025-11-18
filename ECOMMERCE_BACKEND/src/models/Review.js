const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: "Event",
    required: true,
    index: true,
  },
  userId: {
    type: String,
    ref: "ApplicationUser",
  },

  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index duy nhất: đảm bảo mỗi user chỉ đánh giá một lần trên mỗi sự kiện
reviewSchema.index({ eventId: 1, userId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Review", reviewSchema);
