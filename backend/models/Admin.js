const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  profileImage: String,
  phone: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    enum: ["management", "support", "technical", "medical"],
    default: "management",
  },
  permissions: [
    {
      module: String,
      canView: { type: Boolean, default: true },
      canEdit: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
    },
  ],
  lastActivity: Date,
  activityLog: [
    {
      action: String,
      timestamp: { type: Date, default: Date.now },
      details: mongoose.Schema.Types.Mixed,
    },
  ],
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-generate full name
adminSchema.pre("save", function (next) {
  this.fullName = `${this.firstName} ${this.lastName}`.trim();
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Admin", adminSchema);
