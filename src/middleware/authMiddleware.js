const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("./asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : req.query.token || null;

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, token missing");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-only-secret-change-me");
  const user = await User.findById(decoded.id);

  if (!user) {
    res.status(401);
    throw new Error("Not authorized, user not found");
  }

  req.user = user;
  next();
});

function adminOnly(req, res, next) {
  if (req.user && req.user.role === "admin") {
    next();
    return;
  }

  res.status(403);
  next(new Error("Admin access required"));
}

module.exports = { protect, adminOnly };
