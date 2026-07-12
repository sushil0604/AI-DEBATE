const express = require("express");
const router = express.Router();
const {
  createCheckoutSession,
  getMyPayments,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

// NOTE: the webhook route is mounted separately in server.js because it
// needs raw (non-JSON-parsed) body for Stripe signature verification.

router.post("/create-checkout-session", protect, createCheckoutSession);
router.get("/my-history", protect, getMyPayments);

module.exports = router;
