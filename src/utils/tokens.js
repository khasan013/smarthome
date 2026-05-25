const jwt = require("jsonwebtoken");

function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      building: user.building.toString()
    },
    process.env.JWT_SECRET || "dev-only-secret-change-me",
    { expiresIn: process.env.JWT_EXPIRES_IN || "2h" }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      type: "refresh"
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "dev-only-secret-change-me",
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d" }
  );
}

function verifyRefreshToken(token) {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "dev-only-secret-change-me"
  );
}

module.exports = { signToken, signRefreshToken, verifyRefreshToken };
