const express = require("express");
const router = express.Router();
const userController = require("../controllers/UserController");
const {
  authMiddleWare,
  authUserMiddleWare,
} = require("../middleware/authMiddleware");
const { sendMailForOrder } = require("../controllers/EmailController.js");
router.post("/send-mail/:orderId", sendMailForOrder);

module.exports = router;
