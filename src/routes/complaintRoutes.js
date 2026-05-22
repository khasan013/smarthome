const express = require("express");
const {
  createComplaint,
  listComplaints,
  updateComplaint
} = require("../controllers/complaintController");
const { adminOnly, protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/", listComplaints);
router.post("/", createComplaint);
router.patch("/:id", adminOnly, updateComplaint);

module.exports = router;
