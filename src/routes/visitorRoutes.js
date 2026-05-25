const express = require("express");
const { createVisitor, listVisitors, updateVisitor } = require("../controllers/visitorController");
const { adminOnly, protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/", listVisitors);
router.post("/", createVisitor);
router.patch("/:id", adminOnly, updateVisitor);

module.exports = router;
