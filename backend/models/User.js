const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    avatar: { type: String, default: "" },

    // Debate stats
    rating: { type: Number, default: 1000 }, // ELO-style rating
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    debatesCount: { type: Number, default: 0 },

    // Subscription / payments
    plan: { type: String, enum: ["free", "pro"], default: "free" },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    planRenewsAt: { type: Date, default: null },

    role: { type: String, enum: ["user", "admin"], default: "user" },
    isAI: { type: Boolean, default: false },
  },
  
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    rating: this.rating,
    wins: this.wins,
    losses: this.losses,
    draws: this.draws,
    debatesCount: this.debatesCount,
    plan: this.plan,
    role: this.role,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
