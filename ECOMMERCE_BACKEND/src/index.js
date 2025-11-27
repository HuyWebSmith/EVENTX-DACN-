const express = require("express");
const dotenv = require("dotenv");
const { mongo, default: mongoose } = require("mongoose");
const UserRouter = require("./routes/UserRouter");
const eventRoutes = require("./routes/EventRouter");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const uploadRoute = require("./routes/upload.route");
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/api/user", UserRouter);
app.use("/api/event", eventRoutes);
// expose event routes also under /api/product for frontend compatibility
app.use("/api/product", eventRoutes);
app.use("/api/upload-image", uploadRoute);

mongoose
  .connect(`${process.env.MONGO_DB}`)
  .then(() => {
    console.log("Connect Database success!");
  })
  .catch((err) => {
    console.log(err);
  });
app.listen(port, () => {
  console.log("Server is running in port " + port);
});
