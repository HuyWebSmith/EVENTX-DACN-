const express = require("express");
const router = express.Router();
const IssuedTicket = require("../models/IssuedTicket");
const OrderDetail = require("../models/OrderDetail");
const Order = require("../models/OrderProduct");
const Event = require("../models/EventModel");
const Ticket = require("../models/TicketModel"); // ticket type
const {
  authMiddleWare,
  authUserMiddleWare,
} = require("../../src/middleware/authMiddleware");

router.get("/get-all-by-event/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    const tickets = await IssuedTicket.find()
      .populate({
        path: "orderDetailId",
        populate: [
          { path: "orderId", model: Order },
          {
            path: "ticketId",
            model: Ticket,
            populate: {
              path: "eventId",
              model: Event,
              populate: { path: "locations" },
            },
          },
        ],
      })
      .populate({ path: "seatId", model: "Seat" })
      .lean();

    const filtered = tickets.filter(
      (t) => t.orderDetailId?.ticketId?.eventId?._id.toString() === eventId
    );

    return res.status(200).json({
      success: true,
      data: filtered,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});
router.get("/get-all-by-user", authUserMiddleWare, async (req, res) => {
  try {
    const userId = req.user.id;

    const tickets = await IssuedTicket.find({ userId })
      .populate({
        path: "orderDetailId",
        populate: [
          {
            path: "ticketId",
            populate: {
              path: "eventId",
              populate: [
                { path: "locations" }, // 🔥 LẤY ĐỊA ĐIỂM
              ],
            },
          },
          { path: "orderId" },
        ],
      })
      .populate("seatId")
      .lean();

    // Debug cực mạnh
    console.log(
      "POPULATED EVENT:",
      JSON.stringify(tickets[0]?.orderDetailId?.ticketId?.eventId, null, 2)
    );

    res.json({ success: true, data: tickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
