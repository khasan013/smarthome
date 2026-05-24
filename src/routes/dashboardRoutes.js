const express = require("express");
const { getDashboard, downloadMonthlyReport } = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getDashboard);
router.get("/report.pdf", protect, downloadMonthlyReport);

module.exports = router;
