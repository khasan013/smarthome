const express = require("express");
const {
  createNotice,
  deleteNotice,
  listNotices
} = require("../controllers/noticeController");
const { adminOnly, protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/", listNotices);
router.post("/", adminOnly, createNotice);
router.delete("/:id", adminOnly, deleteNotice);

module.exports = router;
