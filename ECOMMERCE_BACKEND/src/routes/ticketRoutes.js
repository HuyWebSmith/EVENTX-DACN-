const express = require("express");
const router = express.Router();
const TicketController = require("../controllers/TicketController");

router.get("/event/:eventId", TicketController.getTicketsWithAvailability);
router.post("/hold", TicketController.holdTickets);
module.exports = router;
