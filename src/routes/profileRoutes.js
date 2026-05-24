const express = require("express");
const { updateProfile } = require("../controllers/profileController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.patch("/", protect, updateProfile);

module.exports = router;
