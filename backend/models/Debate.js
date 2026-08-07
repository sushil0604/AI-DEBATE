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
    roomMode: { type: String, enum: ["text", "video"], default: null },
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
    // BUGFIX: this enum must match VALID_DURATIONS in debateController.js —
    // it didn't, which is why picking "1 min" on the frontend passed the
    // controller's own validation fine, but then failed here at save time
    // with "`1` is not a valid enum value for path `duration`." These two
    // lists are independent and Mongoose doesn't know about the controller's
    // constant, so if the allowed durations ever change again, update BOTH
    // this enum and VALID_DURATIONS together.
    duration: { type: Number, enum: [1, 5, 10], default: 5 },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Debate", debateSchema);