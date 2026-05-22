const express = require("express");
const {
  createFlat,
  deleteFlat,
  listFlats,
  updateFlat
} = require("../controllers/flatController");
const { adminOnly, protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/", listFlats);
router.post("/", adminOnly, createFlat);
router.patch("/:id", adminOnly, updateFlat);
router.delete("/:id", adminOnly, deleteFlat);

module.exports = router;
