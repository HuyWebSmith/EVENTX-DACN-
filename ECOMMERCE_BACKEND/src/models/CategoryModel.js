const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema(
  {
    name: { type: String, required: true, maxLength: 100, unique: true },
    description: { type: String, maxLength: 255 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field: Lấy danh sách Events thuộc Category này
categorySchema.virtual("events", {
  ref: "Event",
  localField: "_id",
  foreignField: "categoryId",
  justOne: false,
});

module.exports = mongoose.model("Category", categorySchema);
