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
      enum: ["Open", "Under Review", "Resolved", "Pending", "In Progress"],
      default: "Open"
    }
  },
  { timestamps: true }
);

complaintSchema.index({ building: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.Complaint || mongoose.model("Complaint", complaintSchema);
