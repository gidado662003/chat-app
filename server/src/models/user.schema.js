// models/User.js
const mongoose = require("mongoose");

// Add to your User schema or create Chat schema

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Laravel Integration
    laravel_id: {
      type: Number,
      default: null,
    },

    department: {
      type: String,
      default: null,
    },

    // Profile

    displayName: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    avatar: {
      type: String, // URL to profile picture
      default: null,
    },

    bio: {
      type: String,
      maxlength: 200,
      default: "",
    },

    // Status & Activity
    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },

    socketId: {
      type: String,
      default: null, // For Socket.IO connection tracking
    },

    // Chat-related
    joinedRooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
      },
    ],

    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Account Management
    isVerified: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  },
);

// Index for performance
userSchema.index({ isOnline: 1 });
userSchema.index({ email: 1 });
userSchema.index({ laravel_id: 1 });

module.exports = mongoose.model("User", userSchema);
