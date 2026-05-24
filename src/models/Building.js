const mongoose = require("mongoose");

const buildingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    emergencyContact: {
      type: String,
      default: ""
    },
    securityGuard: {
      type: String,
      default: ""
    },
    electrician: {
      type: String,
      default: ""
    },
    plumber: {
      type: String,
      default: ""
    },
    profilePhoto: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Building || mongoose.model("Building", buildingSchema);
