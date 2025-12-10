const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

// Lấy token chuẩn từ header
function getToken(req) {
  const authHeader = req.headers.authorization || req.headers.token;
  if (!authHeader || typeof authHeader !== "string") return null;

  // Nếu dạng "Bearer <token>"
  if (authHeader.startsWith("Bearer ")) return authHeader.split(" ")[1];

  return authHeader; // dạng token thẳng
}

// Middleware kiểm tra admin
const authMiddleWare = (req, res, next) => {
  const token = getToken(req);
  if (!token)
    return res.status(401).json({ message: "Missing token", status: "ERROR" });

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      console.log("JWT Error:", err.message); // chỉ log message
      return res
        .status(401)
        .json({ message: "Token invalid or expired", status: "ERROR" });
    }

    if (!decoded.isAdmin)
      return res.status(403).json({ message: "Admin only", status: "ERROR" });

    req.user = decoded;
    next();
  });
};

// Middleware kiểm tra user (admin hoặc chính user)
const authUserMiddleWare = (req, res, next) => {
  const token = getToken(req);
  if (!token)
    return res.status(401).json({ message: "Missing token", status: "ERROR" });

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      console.log("JWT Error:", err.message);
      return res
        .status(401)
        .json({ message: "Token invalid or expired", status: "ERROR" });
    }

    // Chỉ cần token hợp lệ, gán user
    req.user = decoded;
    next();
  });
};

module.exports = { authMiddleWare, authUserMiddleWare };
