const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const authMiddleWare = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.token;
  if (!authHeader || typeof authHeader !== "string") {
    return res
      .status(401)
      .json({ message: "Missing authentication token", status: "ERROR" });
  }
  const parts = authHeader.split(" ");
  const token = parts.length > 1 ? parts[1] : parts[0];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, user) {
    if (err) {
      return res
        .status(401)
        .json({ message: "Invalid or expired token", status: "ERROR" });
    }
    const { payload } = user;
    if (payload && payload.isAdmin) {
      return next();
    }
    return res
      .status(403)
      .json({ message: "Admin privileges required", status: "ERROR" });
  });
};

const authUserMiddleWare = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.token;
  if (!authHeader || typeof authHeader !== "string") {
    return res
      .status(401)
      .json({ message: "Missing authentication token", status: "ERROR" });
  }
  const parts = authHeader.split(" ");
  const token = parts.length > 1 ? parts[1] : parts[0];
  const userId = req.params.id;

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, user) {
    if (err) {
      return res
        .status(401)
        .json({ message: "Invalid or expired token", status: "ERROR" });
    }
    const { payload } = user;
    if (payload && (payload.isAdmin || payload.id === userId)) {
      return next();
    }
    return res.status(403).json({ message: "Not authorized", status: "ERROR" });
  });
};
module.exports = {
  authMiddleWare,
  authUserMiddleWare,
};
