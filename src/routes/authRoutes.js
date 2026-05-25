const express = require("express");
const {
  login,
  me,
  refresh,
  registerAdmin,
  registerUser
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register/admin", registerAdmin);
router.post("/register/user", registerUser);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", protect, me);

module.exports = router;
