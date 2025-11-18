const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sliderSchema = new Schema({
  title: { type: String },
  description: { type: String },
  imageUrl: { type: String, trim: true },
  link: { type: String, trim: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdDate: { type: Date, default: Date.now },
  videoUrl: { type: String, trim: true },

  // Loại bỏ ImageFile và VideoFile ([NotMapped])
});

module.exports = mongoose.model("Slider", sliderSchema);
