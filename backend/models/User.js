const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // BUGFIX: password is only required for accounts created the normal way
    // (email + password signup). Google/GitHub OAuth accounts are created
    // with no password at all — this used to be `required: true`
    // unconditionally, which meant a brand new Google/GitHub signup would
    // throw a validation error the moment User.create() ran, because there
    // was no password to satisfy the requirement.
    password: {
      type: String,
      required: function () {
        return !this.provider || this.provider === "local";
      },
      minlength: 6,
      select: false,
    },

    // NEW: these were being passed in by the Google/GitHub Passport
    // strategies already, but since they weren't declared on the schema,
    // Mongoose's default strict mode silently dropped them — they were
    // never actually being saved. Adding them here so account provenance
    // (which login method created this account) is actually recorded.
    provider: { type: String, enum: ["local", "google", "github"], default: "local" },
    providerId: { type: String, default: null },

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
  // If a "set password" flow ever tries to save an empty string, don't hash
  // and store garbage — just skip.
  if (!this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // OAuth-only account, no password to compare
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    provider: this.provider,
    hasPassword: !!this.password, // lets the frontend show/hide "Set password" UI
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