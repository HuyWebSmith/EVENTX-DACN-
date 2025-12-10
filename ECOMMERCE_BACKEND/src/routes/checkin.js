const express = require("express");
const router = express.Router();
const IssuedTicket = require("../models/IssuedTicket");

router.post("/scan", async (req, res) => {
  try {
    const { ticketCode } = req.body;

    if (!ticketCode)
      return res.json({ success: false, message: "Thiếu ticketCode" });

    // Tìm vé theo mã
    const ticket = await IssuedTicket.findOne({ ticketCode })
      .populate({
        path: "orderDetailId",
        populate: { path: "ticketId", model: "Ticket" },
      })
      .lean();

    if (!ticket)
      return res.json({
        success: false,
        status: "Invalid",
        message: "Vé không tồn tại",
      });

    // Check đã check-in
    if (ticket.isCheckedIn)
      return res.json({
        success: false,
        status: "CheckedIn",
        message: "Vé này đã check-in!",
        data: ticket,
      });

    // Check-in thành công
    await IssuedTicket.updateOne(
      { ticketCode },
      { isCheckedIn: true, status: "CheckedIn", checkinTime: new Date() }
    );

    return res.json({
      success: true,
      status: "CheckedIn",
      message: "Check-in thành công!",
      data: ticket,
    });
  } catch (err) {
    console.error("Check-in error:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
