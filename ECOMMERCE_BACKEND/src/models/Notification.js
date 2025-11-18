const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { NOTIFICATION_TYPES } = require("../utils/constants"); // Giả định

const notificationSchema = new Schema({
  userId: {
    type: String,
    ref: "ApplicationUser",
    required: true,
    index: true,
  },

  message: { type: String, required: true },

  type: {
    type: String,
    enum: NOTIFICATION_TYPES,
    required: true,
  },

  isRead: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
