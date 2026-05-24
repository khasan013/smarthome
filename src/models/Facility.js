const mongoose = require("mongoose");

const facilitySchema = new mongoose.Schema(
  {
    building: { type: mongoose.Schema.Types.ObjectId, ref: "Building", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, default: 0 },
    imageUrl: { type: String, default: "" },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

facilitySchema.index({ building: 1, name: 1 }, { unique: true });

module.exports = mongoose.models.Facility || mongoose.model("Facility", facilitySchema);
