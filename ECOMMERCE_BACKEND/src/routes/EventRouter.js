const express = require("express");
const router = express.Router();
const EventController = require("../controllers/EventController");
const { authMiddleWare } = require("../middleware/authMiddleware");
const Event = require("../models/EventModel"); // ✅ thêm dòng này

// Các route khác
router.post("/create", EventController.createEvent);
router.put("/update/:id", authMiddleWare, EventController.updateEvent);
router.delete("/delete/:id", authMiddleWare, EventController.deleteEvent);
router.get("/get-all", EventController.getAllEvent);
router.get("/get-details/:id", EventController.getDetailEvent);
router.get("/delete-many", authMiddleWare, EventController.deleteMany);
router.get(
  "/get-by-organizer/:organizerId",
  EventController.getEventsByOrganizer
);

// Update status route
router.put("/update-status/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["Pending", "Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Trạng thái không hợp lệ" });
  }

  try {
    // ✅ Kiểm tra ID hợp lệ
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const event = await Event.findByIdAndUpdate(id, { status }, { new: true });
    if (!event)
      return res.status(404).json({ message: "Không tìm thấy sự kiện" });

    // Nếu có socket.io, emit update để frontend realtime
    if (global._io) {
      global._io.emit("event-status-updated", {
        id: event._id,
        status: event.status,
      });
    }

    res.json({ message: "Cập nhật trạng thái thành công", data: event });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ status: "ERR", message: err.message });
  }
});

module.exports = router;
