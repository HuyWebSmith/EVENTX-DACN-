const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { EVENT_STATUSES } = require("../utils/constants");

const eventSchema = new Schema(
  {
    organizerId: { type: String, required: true },
    organizerEmail: { type: String, required: true, trim: true },
    organizerName: { type: String, required: true, maxLength: 255 },
    organizerInfo: { type: String, maxLength: 1000 },
    organizerLogoUrl: { type: String, trim: true },
    organizerBannerUrl: { type: String, trim: true },

    title: { type: String, required: true, maxLength: 255, index: true },
    description: { type: String },

    eventDate: { type: Date, required: true },
    eventStartTime: { type: Date, required: true },
    eventEndTime: { type: Date, required: true },

    status: {
      type: String,
      enum: EVENT_STATUSES,
      default: "Pending",
      required: true,
    },

    buyerMessage: { type: String },
    image: { type: String },
    createdAt: { type: Date, default: Date.now },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

eventSchema.virtual("eventImages", {
  ref: "EventImage",
  localField: "_id",
  foreignField: "eventId",
  justOne: false,
});
eventSchema.virtual("tickets", {
  ref: "Ticket",
  localField: "_id",
  foreignField: "eventId",
  justOne: false,
});
eventSchema.virtual("locations", {
  ref: "Location",
  localField: "_id",
  foreignField: "eventId",
  justOne: false,
});
eventSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "eventId",
  justOne: false,
});
eventSchema.virtual("paymentInfos", {
  ref: "PaymentInfo",
  localField: "_id",
  foreignField: "eventId",
  justOne: false,
});
eventSchema.virtual("redInvoices", {
  ref: "RedInvoice",
  localField: "_id",
  foreignField: "eventId",
  justOne: false,
});

module.exports = mongoose.model("Event", eventSchema);
