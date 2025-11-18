const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ORDER_STATUSES } = require("./constants"); // Giả định

const orderSchema = new Schema(
  {
    userId: {
      type: String, // Khóa ngoại string tới ApplicationUser
      ref: "ApplicationUser",
      required: true,
      index: true,
    },
    image: { type: String, require: true },
    totalAmount: {
      type: Number, // decimal(10,2)
      required: true,
      min: 0,
    },

    // Thông tin người mua
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },

    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: "Pending",
      required: true,
    },
    paymentMethod: {
      type: String,
      require: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isEmailSent: {
      type: Boolean,
      default: false,
    },
  },
  {
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
