import { useState } from "react";
import { FaCheck, FaRobot, FaBolt } from "react-icons/fa";
import PageShell from "../Pages/PageShell";

const plans = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    tagline: "Get a feel for the arena",
    features: ["5 debates per month", "Basic AI Judge feedback", "Public leaderboard access", "Join community topics"],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: { monthly: 12, yearly: 9 },
    tagline: "For serious debaters",
    features: [
      "Unlimited debates",
      "Advanced AI Coach sessions",
      "Detailed performance analytics",
      "Tournament entry included",
      "Priority matchmaking",
    ],
    cta: "Go Pro",
    highlight: true,
  },
  {
    name: "Team",
    price: { monthly: 39, yearly: 29 },
    tagline: "For clubs & classrooms",
    features: [
      "Everything in Pro",
      "Up to 20 member seats",
      "Custom tournament hosting",
      "Instructor dashboard",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

const Pricing = () => {
  const [yearly, setYearly] = useState(true);

  return (
    <PageShell
      eyebrow="PLANS"
      title="Simple, Fair Pricing"
      subtitle="Start free. Upgrade when you're ready to compete at the next level."
    >
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-sm font-semibold ${!yearly ? "text-white" : "text-gray-500"}`}>Monthly</span>
        <button
          onClick={() => setYearly(!yearly)}
          className="w-12 h-6 rounded-full relative transition-all"
          style={{ background: yearly ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.15)" }}
        >
          <span
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200"
            style={{ left: yearly ? "26px" : "2px" }}
          />
        </button>
        <span className={`text-sm font-semibold ${yearly ? "text-white" : "text-gray-500"}`}>
          Yearly <span className="text-green-400 text-xs">(save 25%)</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`rounded-2xl p-6 flex flex-col relative ${p.highlight ? "md:-mt-3" : ""}`}
            style={{
              background: p.highlight
                ? "linear-gradient(160deg,rgba(124,58,237,0.18),rgba(8,12,30,0.85))"
                : "rgba(8,12,30,0.78)",
              backdropFilter: "blur(18px)",
              border: p.highlight ? "1px solid rgba(124,58,237,0.5)" : "1px solid rgba(255,255,255,0.07)",
              boxShadow: p.highlight ? "0 8px 36px rgba(124,58,237,0.25)" : "0 4px 24px rgba(0,0,0,0.35)",
            }}
          >
            {p.highlight && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase text-white flex items-center gap-1"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 0 16px rgba(124,58,237,0.5)" }}
              >
                <FaBolt className="text-[8px]" /> Most Popular
              </span>
            )}

            <h3 className="text-white font-extrabold text-xl mb-1 mt-2">{p.name}</h3>
            <p className="text-gray-500 text-sm mb-5">{p.tagline}</p>

            <div className="mb-6">
              <span className="text-4xl font-black text-white">${yearly ? p.price.yearly : p.price.monthly}</span>
              <span className="text-gray-500 text-sm">/mo</span>
            </div>

            <ul className="flex flex-col gap-3 mb-6 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <FaCheck className="text-green-400 text-xs mt-1 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              className="py-2.5 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-95"
              style={
                p.highlight
                  ? { background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }
                  : { background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }
              }
            >
              {p.cta}
            </button>
          </div>
        ))}
      </div>

      {/* AI note */}
      <div
        className="mt-10 rounded-2xl p-5 flex items-center gap-4"
        style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <FaRobot className="text-violet-300 text-2xl flex-shrink-0" />
        <p className="text-gray-300 text-sm">
          Every plan includes AI Judge scoring on all debates — fair, consistent, available 24/7.
        </p>
      </div>
    </PageShell>
  );
};

export default Pricing;
