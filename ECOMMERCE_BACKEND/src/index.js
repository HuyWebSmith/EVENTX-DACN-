const express = require("express");
const dotenv = require("dotenv");
const { mongo, default: mongoose } = require("mongoose");
const userRoutes = require("./routes/UserRouter");
const eventRoutes = require("./routes/EventRouter");
const bodyParser = require("body-parser");
const cors = require("cors");
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

app.use("/api/user", userRoutes);
app.use("/api/event", eventRoutes);

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
