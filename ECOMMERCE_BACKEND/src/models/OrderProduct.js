const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ORDER_STATUSES } = require("../utils/constants"); // Giả định

const orderSchema = new Schema(
  {
    userId: {
      type: String,
      ref: "ApplicationUser",
      required: true,
      index: true,
    },
    image: { type: String, require: true },
    totalAmount: { type: Number, required: true, min: 0 },

    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },

    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: "Pending",
    },

    paymentMethod: { type: String, required: true },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    isEmailSent: { type: Boolean, default: false },
  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field cho List<OrderDetail>
orderSchema.virtual("orderDetails", {
  ref: "OrderDetail",
  localField: "_id",
  foreignField: "orderId",
  justOne: false,
});

module.exports = mongoose.model("Order", orderSchema);
