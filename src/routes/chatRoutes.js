const express = require("express");
const { createMessage, listMessages } = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/", listMessages);
router.post("/", createMessage);

module.exports = router;
