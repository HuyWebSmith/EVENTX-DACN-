// routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const OrderDetail = require("../models/OrderDetail");
const HeldTicket = require("../models/HeldTicket");

router.post("/create", async (req, res) => {
  try {
    const { holdId, fullName, email, phoneNumber, address, paymentMethod } =
      req.body;

    if (!holdId)
      return res.status(400).json({ status: "ERROR", message: "Thiếu holdId" });

    // 1. Lấy thông tin hold
    const held = await HeldTicket.findById(holdId);
    if (!held)
      return res
        .status(404)
        .json({ status: "ERROR", message: "Không tìm thấy vé giữ" });

    // 2. Tạo Order
    const totalAmount = held.quantity * held.ticketPrice; // ticketPrice lưu ở HeldTicket hoặc tính ra
    const order = new Order({
      userId: held.userId,
      fullName,
      email,
      phoneNumber,
      address,
      paymentMethod,
      totalAmount,
      image: held.ticketImage || "",
    });
    const savedOrder = await order.save();

    // 3. Tạo OrderDetail
    const orderDetail = new OrderDetail({
      orderId: savedOrder._id,
      ticketId: held.ticketId,
      quantity: held.quantity,
      price: held.ticketPrice,
    });
    await orderDetail.save();

    // 4. Xoá hoặc đánh dấu hold ticket đã sử dụng
    await HeldTicket.findByIdAndDelete(holdId);

    res.status(200).json({
      status: "OK",
      orderId: savedOrder._id,
      orderDetailId: orderDetail._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "ERROR", message: err.message });
  }
});

module.exports = router;
