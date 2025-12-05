const express = require("express");
const router = express.Router();
const TicketController = require("../controllers/TicketController");
const Order = require("../models/OrderProduct"); // hoặc đường dẫn đúng tới model

router.get("/event/:eventId", TicketController.getTicketsWithAvailability);
router.post("/hold", TicketController.holdTickets);
// GET /api/orders/:orderId

module.exports = router;
