const express = require("express");
const router = express.Router();
const Order = require("../models/OrderProduct");
const OrderDetail = require("../models/OrderDetail");
const IssuedTicket = require("../models/IssuedTicket");
const Ticket = require("../models/TicketModel"); // sửa đường dẫn nếu cần
const HeldTicket = require("../models/HeldTicket");

// POST /api/orders/create-paypal
router.post("/create-paypal", async (req, res) => {
  try {
    const {
      holdId,
      selectedQuantities,
      totalPrice,
      totalQuantity,
      customerInfo,
      paypalOrderId,
    } = req.body;

    // Kiểm tra dữ liệu cơ bản
    if (!holdId) return res.status(400).json({ message: "Thiếu holdId" });
    if (!selectedQuantities || Object.keys(selectedQuantities).length === 0)
      return res.status(400).json({ message: "Không có vé nào được chọn" });
    if (!totalPrice || totalPrice <= 0)
      return res.status(400).json({ message: "Tổng tiền không hợp lệ" });
    console.log("customerInfo", customerInfo);
    // 1️⃣ Tạo Order
    const newOrder = await Order.create({
      userId: customerInfo?.userId,
      totalAmount: totalPrice,
      fullName: customerInfo?.fullName || "Khách vãng lai",
      email: customerInfo?.email || "",
      phoneNumber: customerInfo?.phoneNumber || "",
      address: customerInfo?.address || "",
      orderStatus: "Completed",
      paymentMethod: "PayPal",
      paypalOrderId: paypalOrderId || "",
      createdAt: new Date(),
    });

    console.log("Order created:", newOrder._id);

    // 2️⃣ Tạo OrderDetail và IssuedTicket
    for (const [ticketId, quantity] of Object.entries(selectedQuantities)) {
      if (quantity <= 0) continue;

      const price = 100000; // Hoặc lấy từ DB ticket
      const orderDetail = await OrderDetail.create({
        orderId: newOrder._id,
        ticketId,
        quantity,
        price,
      });

      for (let i = 0; i < quantity; i++) {
        await IssuedTicket.create({
          ticketCode: `${ticketId}-${Date.now()}-${i}`,
          orderDetailId: orderDetail._id,

          userId: customerInfo.userId || "guest",
          soldDate: new Date(),
        });
      }
      await Ticket.findByIdAndUpdate(ticketId, { $inc: { sold: quantity } });
    }
    console.log(holdId);

    await HeldTicket.deleteMany({
      userId: customerInfo.userId,
      ticketId: { $in: Object.keys(selectedQuantities) },
    });
    res.status(200).json({ orderId: newOrder._id });
  } catch (err) {
    console.error("Lỗi create-paypal:", err);
    res
      .status(500)
      .json({ message: "Tạo đơn hàng thất bại", error: err.message });
  }
});
router.get("/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate({
        path: "orderDetails", // field ref trong model Order
        populate: { path: "ticketId", model: "Ticket" }, // nếu muốn lấy tên vé từ Ticket
      })
      .lean(); // xóa populate nếu ko cần
    if (!order)
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    order.orderDetails = order.orderDetails.map((detail) => ({
      _id: detail._id,
      ticketName: detail.ticketId?.type || "Vé",
      ticketType: detail.ticketId?.description || "Vé",
      price: detail.price,
      quantity: detail.quantity,
    }));
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});
module.exports = router;
