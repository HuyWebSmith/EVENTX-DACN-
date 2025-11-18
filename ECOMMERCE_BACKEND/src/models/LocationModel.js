const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const eventImageSchema = new Schema({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: "Event",
    required: true,
    index: true,
  },
  imageURL: {
    type: String,
    required: true,
    maxLength: 255,
  },
});

module.exports = mongoose.model("EventImage", eventImageSchema);
