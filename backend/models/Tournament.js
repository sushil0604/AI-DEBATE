const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    topic: { type: String, default: "" },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    maxParticipants: { type: Number, default: 8 },

    debates: [{ type: mongoose.Schema.Types.ObjectId, ref: "Debate" }],

    status: {
      type: String,
      enum: ["upcoming", "registration_open", "in_progress", "completed", "cancelled"],
      default: "registration_open",
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },

    winner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    prize: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tournament", tournamentSchema);
