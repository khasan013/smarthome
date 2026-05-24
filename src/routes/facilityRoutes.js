const express = require("express");
const {
  createBooking,
  listFacilities,
  updateBooking
} = require("../controllers/facilityController");
const { adminOnly, protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/", listFacilities);
router.post("/bookings", createBooking);
router.patch("/bookings/:id", adminOnly, updateBooking);

module.exports = router;
