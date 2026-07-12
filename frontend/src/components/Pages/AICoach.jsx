import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { FaRobot, FaBolt, FaBullseye, FaBookOpen, FaMicrophone, FaChartLine, FaPaperPlane } from "react-icons/fa";
import PageShell from "../Pages/PageShell";
import { aiCoachApi } from "../../services/api";

const drills = [
  { icon: <FaBullseye />, title: "Rebuttal Speed Drill", desc: "React to live counterarguments in under 30 seconds.", color: "#3b82f6" },
  { icon: <FaBookOpen />, title: "Evidence Builder", desc: "Practice backing claims with credible sources on the fly.", color: "#22c55e" },
  { icon: <FaMicrophone />, title: "Delivery & Tone", desc: "Get feedback on pacing, confidence, and clarity.", color: "#a855f7" },
  { icon: <FaChartLine />, title: "Logical Fallacy Spotter", desc: "Identify weak points in your own and others' arguments.", color: "#f59e0b" },
];

const initialMessages = [
  { from: "ai", text: "I'm your AI debate coach. Tell me a topic or paste an argument, and I'll help you sharpen it." },
];

const AICoach = () => {
  const location = useLocation();
  const sampleAnalysis = location.state?.analysis;

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (sampleAnalysis) {
      const text = typeof sampleAnalysis === "string"
        ? sampleAnalysis
        : sampleAnalysis.summary || JSON.stringify(sampleAnalysis);
      setMessages([
        { from: "ai", text: "Here's a sample analysis to show you how feedback works:" },
        { from: "ai", text },
      ]);
    }
  }, [sampleAnalysis]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg = { from: "user", text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setSending(true);

    try {
      const res = await aiCoachApi.chat(text, nextMessages);
      setMessages((prev) => [...prev, { from: "ai", text: res.data.reply }]);
    } catch (err) {
      setError(err.message || "Coach Atlas is offline right now — try again in a moment.");
    } finally {
      setSending(false);
    }
  };

  return (
    <PageShell
      eyebrow="TRAINING"
      title="AI Coach"
      subtitle="Sharpen your arguments with personalized, real-time feedback"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat panel */}
        <div
          className="lg:col-span-2 rounded-2xl flex flex-col h-[520px]"
          style={{
            background: "rgba(8,12,30,0.78)",
            backdropFilter: "blur(18px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
          }}
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
            >
              <FaRobot className="text-white text-base" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Coach Atlas</p>
              <p className="text-green-400 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Online
              </p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.from === "user" ? "text-white" : "text-gray-200"
                  }`}
                  style={
                    m.from === "user"
                      ? { background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }
                      : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div
                  className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm text-gray-400"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  Coach Atlas is thinking…
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mx-5 mb-3 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="px-5 py-4 border-t border-white/5 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your argument or question..."
              disabled={sending}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none px-4 py-2.5 rounded-xl disabled:opacity-60"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 hover:brightness-110 transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
            >
              <FaPaperPlane className="text-sm" />
            </button>
          </div>
        </div>

        {/* Drills sidebar */}
        <div className="flex flex-col gap-3">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider text-gray-400 mb-1">Practice Drills</h3>
          {drills.map((d) => (
            <div
              key={d.title}
              onClick={() => setInput(`Let's do the "${d.title}" drill. `)}
              className="rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:-translate-y-0.5 transition-all duration-200"
              style={{
                background: "rgba(8,12,30,0.7)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                style={{ background: `${d.color}1a`, border: `1px solid ${d.color}40`, color: d.color }}
              >
                {d.icon}
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-0.5">{d.title}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{d.desc}</p>
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              const random = drills[Math.floor(Math.random() * drills.length)];
              setInput(`Let's do the "${random.title}" drill. `);
            }}
            className="mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-bold text-sm hover:brightness-110 transition-all"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}
          >
            <FaBolt /> Start Random Drill
          </button>
        </div>
      </div>
    </PageShell>
  );
};

export default AICoach;