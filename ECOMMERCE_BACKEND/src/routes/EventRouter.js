const express = require("express");
const router = express.Router();
const EventController = require("../controllers/EventController");
const { authMiddleWare } = require("../middleware/authMiddleware");
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
module.exports = router;
