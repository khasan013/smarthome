const express = require("express");
const { markNotificationsRead } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.patch("/read", markNotificationsRead);

module.exports = router;
