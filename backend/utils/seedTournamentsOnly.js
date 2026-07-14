// backend/utils/seedTournamentsOnly.js
require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");
const Tournament = require("../models/Tournament");

const run = async () => {
  await connectDB();

  // Uses your real account instead of wiping and creating test users.
  // Change this email to match your actual account if different.
  const me = await User.findOne({ email: "sthasushil9814@gmail.com" });

  if (!me) {
    console.error("Couldn't find your user account — check the email above matches your signup.");
    process.exit(1);
  }

  const now = Date.now();

  await Tournament.create([
    {
      name: "Winter Clash Championship",
      description: "Quarterfinals",
      topic: "Technology",
      maxParticipants: 64,
      participants: [me._id],
      status: "in_progress",
      startDate: new Date(now - 5 * 86400000),
      prize: "$2,000",
      createdBy: me._id,
    },
    {
      name: "Climate Debate Cup",
      topic: "Science",
      maxParticipants: 32,
      participants: [me._id],
      status: "registration_open",
      startDate: new Date(now + 7 * 86400000),
      prize: "$800",
      createdBy: me._id,
    },
    {
      name: "AI Ethics Invitational",
      topic: "Technology",
      maxParticipants: 16,
      participants: [me._id],
      status: "registration_open",
      startDate: new Date(now + 3 * 86400000),
      prize: "$1,200",
      createdBy: me._id,
    },
  ]);

  console.log("Added 3 tournaments without touching existing data.");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});