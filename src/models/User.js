const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 4,
      select: false
    },
    role: {
      type: String,
      enum: ["admin", "tenant"],
      required: true
    },
    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: true
    },
    flatNo: {
      type: String,
      trim: true,
      default: ""
    },
    rent: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ["Pending", "Active", "Inactive"],
      default: "Active"
    }
  },
  { timestamps: true }
);

userSchema.index({ phone: 1, building: 1 }, { unique: true });
userSchema.index(
  { flatNo: 1, building: 1 },
  {
    unique: true,
    partialFilterExpression: { flatNo: { $type: "string", $gt: "" } }
  }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function matchPassword(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
