const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: true
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    flatNo: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      trim: true,
      default: ""
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    photoUrl: {
      type: String,
      default: ""
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    },
    adminComment: {
      type: String,
      default: ""
    },
    assignedAction: {
      type: String,
      default: ""
    },
    timeline: [
      {
        status: String,
        comment: String,
        at: {
          type: Date,
          default: Date.now
        }
      }
    ],
    status: {
      type: String,
      enum: ["Pending", "Assigned", "Accepted", "Rejected", "Resolved", "Completed", "Open", "Under Review", "In Progress"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

complaintSchema.index({ building: 1, status: 1, createdAt: -1 });
complaintSchema.index({ building: 1, tenant: 1, createdAt: -1 });

module.exports = mongoose.models.Complaint || mongoose.model("Complaint", complaintSchema);
