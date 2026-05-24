const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    building: { type: mongoose.Schema.Types.ObjectId, ref: "Building", required: true },
    facility: { type: mongoose.Schema.Types.ObjectId, ref: "Facility", required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    note: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

bookingSchema.index({ building: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
