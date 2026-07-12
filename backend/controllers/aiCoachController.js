const asyncHandler = require("express-async-handler");
const { getCoachFeedback, getCoachChatReply } = require("../utils/aiService/index");

// @desc    Get AI coach feedback on a practice argument
// @route   POST /api/ai-coach/feedback
// @access  Private
const getFeedback = asyncHandler(async (req, res) => {
  const { topic, side, argumentText } = req.body;

  if (!topic || !side || !argumentText) {
    res.status(400);
    throw new Error("topic, side, and argumentText are required");
  }
  if (!["for", "against"].includes(side)) {
    res.status(400);
    throw new Error('side must be "for" or "against"');
  }

  const feedback = await getCoachFeedback({ topic, side, argumentText });
  res.json({ success: true, feedback });
});

// @desc    Chat with the AI debate coach
// @route   POST /api/ai-coach/chat
// @access  Private
const chatWithCoach = asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || !message.trim()) {
    res.status(400);
    throw new Error("message is required");
  }

  const reply = await getCoachChatReply({ message, history });
  res.json({ success: true, data: { reply } });
});

module.exports = { getFeedback, chatWithCoach };