const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: true
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    flatNo: {
      type: String,
      required: true,
      trim: true
    },
    month: {
      type: String,
      required: true,
      trim: true
    },
    rent: {
      type: Number,
      required: true,
      min: 0
    },
    serviceCharge: {
      type: Number,
      default: 0,
      min: 0
    },
    electricity: {
      type: Number,
      default: 0,
      min: 0
    },
    gas: {
      type: Number,
      default: 0,
      min: 0
    },
    water: {
      type: Number,
      default: 0,
      min: 0
    },
    otherCosts: {
      type: Number,
      default: 0,
      min: 0
    },
    invoiceId: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["PAID", "UNPAID", "Paid", "Unpaid", "Overdue"],
      default: "UNPAID"
    },
    dueDate: {
      type: Date
    },
    paidAt: {
      type: Date
    }
  },
  { timestamps: true }
);

billSchema.index({ building: 1, tenant: 1, month: 1 }, { unique: true });
billSchema.index({ building: 1, status: 1 });

module.exports = mongoose.models.Bill || mongoose.model("Bill", billSchema);
