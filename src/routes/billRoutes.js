const express = require("express");
const {
  createBill,
  downloadBill,
  listBills,
  updateBill
} = require("../controllers/billController");
const { adminOnly, protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/", listBills);
router.post("/", adminOnly, createBill);
router.patch("/:id", updateBill);
router.get("/:id/pdf", downloadBill);

module.exports = router;
