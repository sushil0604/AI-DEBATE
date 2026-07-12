const asyncHandler = require("express-async-handler");
const Stripe = require("stripe");
const User = require("../models/User");
const Payment = require("../models/Payment");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

// @desc    Create a Stripe Checkout session for the Pro plan
// @route   POST /api/payments/create-checkout-session
// @access  Private
const createCheckoutSession = asyncHandler(async (req, res) => {
  const user = req.user;

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user._id.toString() },
    });
    customerId = customer.id;
    user.stripeCustomerId = customerId;
    await user.save();
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_PRO_MONTHLY,
        quantity: 1,
      },
    ],
    success_url: `${process.env.CLIENT_URL}/pricing?success=true`,
    cancel_url: `${process.env.CLIENT_URL}/pricing?canceled=true`,
    metadata: { userId: user._id.toString() },
  });

  await Payment.create({
    user: user._id,
    plan: "pro",
    amount: 0, // filled in on webhook completion
    stripeCheckoutSessionId: session.id,
    status: "pending",
  });

  res.json({ success: true, url: session.url, sessionId: session.id });
});

// @desc    Stripe webhook - handles checkout completion / subscription events
// @route   POST /api/payments/webhook
// @access  Public (verified via Stripe signature)
// NOTE: this route must use express.raw({type: 'application/json'}) body parsing,
// wired up in server.js BEFORE the global express.json() middleware.
const handleWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;

      const payment = await Payment.findOne({ stripeCheckoutSessionId: session.id });
      if (payment) {
        payment.status = "completed";
        payment.amount = session.amount_total;
        payment.stripeSubscriptionId = session.subscription;
        await payment.save();
      }

      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          user.plan = "pro";
          user.stripeSubscriptionId = session.subscription;
          await user.save();
        }
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const user = await User.findOne({ stripeSubscriptionId: subscription.id });
      if (user) {
        user.plan = "free";
        user.stripeSubscriptionId = null;
        await user.save();
      }
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
});

// @desc    Get current user's payment history
// @route   GET /api/payments/my-history
// @access  Private
const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, payments });
});

module.exports = { createCheckoutSession, handleWebhook, getMyPayments };
