const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["pro"], default: "pro" },
    amount: { type: Number, required: true }, // in smallest currency unit (e.g. cents)
    currency: { type: String, default: "usd" },

    stripeCheckoutSessionId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    stripePaymentIntentId: { type: String, default: null },

    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
