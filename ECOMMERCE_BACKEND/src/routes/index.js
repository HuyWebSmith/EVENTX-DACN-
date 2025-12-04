const UserRouter = require("./UserRouter");
const EventRouter = require("./EventRouter");
const ticketRoutes = require("./ticketRoutes");
const routes = (app) => {
  app.use("/api/user", UserRouter);
  app.use("/api/event", EventRouter);
  app.use("/api/tickets", ticketRoutes);
  app.use("/api/product", EventRouter);
};
module.exports = routes;
