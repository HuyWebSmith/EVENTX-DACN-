const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const UserRouter = require("./routes/UserRouter");
const eventRoutes = require("./routes/EventRouter");
const ticketRoutes = require("./routes/ticketRoutes");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const uploadRoute = require("./routes/upload.route");
const orderRouter = require("./routes/order");
require("./services/eventStatusCron"); // cron service

const http = require("http");
const { Server } = require("socket.io");

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/api/user", UserRouter);
app.use("/api/event", eventRoutes);
app.use("/api/product", eventRoutes); // frontend compatibility
app.use("/api/upload-image", uploadRoute);
app.use("/api/tickets", ticketRoutes);
app.use("/api/orders", orderRouter);
// MongoDB connect
mongoose
  .connect(process.env.MONGO_DB)
  .then(() => console.log("Connect Database success!"))
  .catch((err) => console.log(err));

// Socket.IO
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
global._io = io;

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

// Start server
server.listen(port, () => console.log(`Server running on port ${port}`));
