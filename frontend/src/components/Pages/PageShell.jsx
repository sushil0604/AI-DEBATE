import AIBackground from "../Home/AIBackground";

/**
 * Shared page wrapper for DebateAI inner pages.
 * Keeps the dark/violet glassmorphism look consistent across pages.
 */
const PageShell = ({ eyebrow, title, subtitle, children }) => {
  return (
    <div
      className="relative min-h-screen text-white overflow-x-hidden"
      style={{ fontFamily: "'Exo 2', sans-serif" }}
    >
      <AIBackground fixed={true} />

      <div className="relative z-10 min-h-screen flex flex-col">
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-8">
          {(eyebrow || title) && (
            <div className="mb-8">
              {eyebrow && (
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black tracking-widest mb-3"
                  style={{
                    background: "rgba(124,58,237,0.15)",
                    border: "1px solid rgba(124,58,237,0.3)",
                    color: "#c4b5fd",
                  }}
                >
                  {eyebrow}
                </div>
              )}
              {title && (
                <h1
                  className="text-4xl md:text-5xl font-black leading-tight mb-2"
                  style={{ textShadow: "0 0 40px rgba(124,58,237,0.3)" }}
                >
                  {title}
                </h1>
              )}
              {subtitle && <p className="text-gray-400 text-base">{subtitle}</p>}
            </div>
          )}

          {children}
        </main>

        <footer
          className="text-center py-4 text-gray-600 text-xs"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          © 2026 DebateAI · All rights reserved
        </footer>
      </div>
    </div>
  );
};

export default PageShell;
