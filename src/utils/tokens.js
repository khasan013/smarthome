const jwt = require("jsonwebtoken");

function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      building: user.building.toString()
    },
    process.env.JWT_SECRET || "dev-only-secret-change-me",
    { expiresIn: "30d" }
  );
}

module.exports = { signToken };
