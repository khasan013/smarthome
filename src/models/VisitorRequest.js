const mongoose = require("mongoose");

const visitorRequestSchema = new mongoose.Schema(
  {
    building: { type: mongoose.Schema.Types.ObjectId, ref: "Building", required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    visitorName: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
    purpose: { type: String, default: "", trim: true },
    visitDate: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

visitorRequestSchema.index({ building: 1, status: 1, createdAt: -1 });
visitorRequestSchema.index({ building: 1, tenant: 1, createdAt: -1 });

module.exports = mongoose.models.VisitorRequest || mongoose.model("VisitorRequest", visitorRequestSchema);
