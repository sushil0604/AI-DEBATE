require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");
const Debate = require("../models/Debate");
const Tournament = require("../models/Tournament");

const run = async () => {
  await connectDB();

  await Promise.all([User.deleteMany(), Debate.deleteMany(), Tournament.deleteMany()]);

  const alice = await User.create({ name: "Alice", email: "alice@example.com", password: "password123", rating: 1200, role: "admin" });
  const bob = await User.create({ name: "Bob", email: "bob@example.com", password: "password123", rating: 1100 });
  const carol = await User.create({ name: "Carol", email: "carol@example.com", password: "password123", rating: 1050 });

  await Debate.create({
    topic: "Should AI systems be required to disclose when content is AI-generated?",
    createdBy: alice._id,
    participants: [
      { user: alice._id, side: "for" },
      { user: bob._id, side: "against" },
    ],
    status: "waiting",
  });

  await Tournament.create({
    name: "Summer AI Debate Cup",
    description: "A friendly tournament to kick off the season.",
    topic: "Technology and society",
    createdBy: alice._id,
    participants: [alice._id, bob._id, carol._id],
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    maxParticipants: 8,
  });

  console.log("Seed complete. Users: alice@example.com / bob@example.com / carol@example.com (password: password123)");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
