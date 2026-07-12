const mongoose = require("mongoose");

const argumentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    side: { type: String, enum: ["for", "against"], required: true },
    text: { type: String, required: true },
    aiScore: {
      score: { type: Number, min: 0, max: 10 },
      feedback: { type: String },
    },
  },
  { timestamps: true }
);

const debateSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, default: "General" },
    mode: {
      type: String,
      enum: ["human_vs_human", "human_vs_ai", "ai_vs_ai"],
      default: "human_vs_human",
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        side: { type: String, enum: ["for", "against"], required: true },
      },
    ],

    maxParticipants: { type: Number, default: 2 },
    status: {
      type: String,
      enum: ["waiting", "live", "finished", "cancelled"],
      default: "waiting",
    },

    rounds: [argumentSchema],

    // Optional: link to a tournament
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", default: null },

    winner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    finalVerdict: { type: String, default: "" },

    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    autoPlayStarted: { type: Boolean, default: false },

    // Timer fields
    duration: { type: Number, enum: [5, 10, 15], default: 10 },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Debate", debateSchema);