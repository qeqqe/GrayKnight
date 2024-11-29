const jwt = require("jsonwebtoken");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token error:", {
      message: error.message,
      token: req.headers.authorization?.substring(0, 20),
    });
    return res.status(401).json({ message: "Authentication failed" });
  }
};

module.exports = verifyToken;
