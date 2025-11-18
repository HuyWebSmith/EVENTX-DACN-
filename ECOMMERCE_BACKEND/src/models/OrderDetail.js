const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderDetailSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number, // decimal(10,2)
      required: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field cho List<IssuedTicket>
orderDetailSchema.virtual("issuedTickets", {
  ref: "IssuedTicket",
  localField: "_id",
  foreignField: "orderDetailId",
  justOne: false,
});

module.exports = mongoose.model("OrderDetail", orderDetailSchema);
