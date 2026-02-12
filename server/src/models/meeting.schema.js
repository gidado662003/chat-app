const mongoose = require("mongoose");
const { Schema } = mongoose;

const meetingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    attendees: [
      {
        type: String,
        trim: true,
      },
    ],

    agenda: {
      type: String,
      trim: true,
    },

    minutes: {
      type: String,
      trim: true,
    },

    actionItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "ActionItem" }],

    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
  },
  {
    timestamps: true, // handles createdAt & updatedAt
  },
);

module.exports = mongoose.model("Meeting", meetingSchema);
