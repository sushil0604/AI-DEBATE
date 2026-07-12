const { getCoachFeedback }   = require("./getCoachFeedback");
const { judgeArgument }      = require("./judgeArgument");
const { judgeDebate }        = require("./judgeDebate");
const { getCoachChatReply }  = require("./getCoachChatReply");
const { generateAIArgument } = require("./generateAIArgument");

module.exports = {
  getCoachFeedback,
  judgeArgument,
  judgeDebate,
  getCoachChatReply,
  generateAIArgument,
};