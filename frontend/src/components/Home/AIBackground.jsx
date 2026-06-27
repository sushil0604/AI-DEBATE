import { useEffect, useRef } from "react";


const AIBackground = ({ fixed = true }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animId;
    let width, height;

    const resize = () => {
      width  = canvas.width  = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    /* ── Nodes ── */
    const NODE_COUNT = 70;
    const nodeColors = [
      { r: 139, g: 92,  b: 246 }, // violet
      { r: 59,  g: 130, b: 246 }, // blue
      { r: 34,  g: 211, b: 238 }, // cyan
    ];

    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x:          Math.random() * (window.innerWidth  || 1200),
      y:          Math.random() * (window.innerHeight || 800),
      vx:         (Math.random() - 0.5) * 0.38,
      vy:         (Math.random() - 0.5) * 0.38,
      r:          Math.random() * 2.5 + 1,
      pulse:      Math.random() * Math.PI * 2,
      pulseSpeed: 0.018 + Math.random() * 0.022,
      type:       Math.floor(Math.random() * 3),
    }));

    /* ── Travelling data signals ── */
    const signals = [];
    const SIGNAL_COUNT = 22;

    const spawnSignal = () => {
      const a = Math.floor(Math.random() * NODE_COUNT);
      let b   = Math.floor(Math.random() * NODE_COUNT);
      while (b === a) b = Math.floor(Math.random() * NODE_COUNT);
      signals.push({
        from:  a,
        to:    b,
        t:     0,
        speed: 0.003 + Math.random() * 0.006,
        color: nodeColors[Math.floor(Math.random() * 3)],
      });
    };
    for (let i = 0; i < SIGNAL_COUNT; i++) spawnSignal();

    /* ── Hex grid ── */
    const HEX_SIZE = 46;
    const drawHexGrid = () => {
      ctx.save();
      const rows = Math.ceil(height / (HEX_SIZE * 1.5)) + 2;
      const cols = Math.ceil(width  / (HEX_SIZE * Math.sqrt(3))) + 2;
      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const cx = col * HEX_SIZE * Math.sqrt(3) + (row % 2 === 0 ? 0 : HEX_SIZE * Math.sqrt(3) / 2);
          const cy = row * HEX_SIZE * 1.5;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const px = cx + HEX_SIZE * Math.cos(angle);
            const py = cy + HEX_SIZE * Math.sin(angle);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.strokeStyle = "rgba(99,102,241,0.065)";
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        }
      }
      ctx.restore();
    };

    /* ── Scan line ── */
    let scanY = 0;

    /* ── Draw loop ── */
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      /* deep-space base */
      ctx.fillStyle = "#060918";
      ctx.fillRect(0, 0, width, height);

      /* radial centre glow */
      const grad = ctx.createRadialGradient(
        width * 0.5, height * 0.42, 0,
        width * 0.5, height * 0.42, width * 0.68,
      );
      grad.addColorStop(0,   "rgba(79,46,220,0.20)");
      grad.addColorStop(0.45,"rgba(37,99,235,0.08)");
      grad.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      /* secondary accent glow (bottom-right) */
      const grad2 = ctx.createRadialGradient(
        width * 0.85, height * 0.8, 0,
        width * 0.85, height * 0.8, width * 0.4,
      );
      grad2.addColorStop(0, "rgba(34,211,238,0.09)");
      grad2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      drawHexGrid();

      /* scan line sweep */
      scanY = (scanY + 0.55) % height;
      const scanGrad = ctx.createLinearGradient(0, scanY - 50, 0, scanY + 2);
      scanGrad.addColorStop(0, "rgba(99,102,241,0)");
      scanGrad.addColorStop(1, "rgba(99,102,241,0.09)");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 50, width, 52);

      /* move nodes */
      nodes.forEach(n => {
        n.x     += n.vx;
        n.y     += n.vy;
        n.pulse += n.pulseSpeed;
        if (n.x < 0 || n.x > width)  n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      });

      /* edges */
      const EDGE_DIST = 140;
      for (let i = 0; i < NODE_COUNT; i++) {
        for (let j = i + 1; j < NODE_COUNT; j++) {
          const dx   = nodes[i].x - nodes[j].x;
          const dy   = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < EDGE_DIST) {
            const alpha = (1 - dist / EDGE_DIST) * 0.28;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${alpha})`;
            ctx.lineWidth   = 0.65;
            ctx.stroke();
          }
        }
      }

      /* signals */
      for (let idx = signals.length - 1; idx >= 0; idx--) {
        const sig = signals[idx];
        sig.t += sig.speed;
        if (sig.t >= 1) { signals.splice(idx, 1); spawnSignal(); continue; }

        const from = nodes[sig.from];
        const to   = nodes[sig.to];
        const sx   = from.x + (to.x - from.x) * sig.t;
        const sy   = from.y + (to.y - from.y) * sig.t;
        const { r, g, b } = sig.color;

        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 12);
        glow.addColorStop(0, `rgba(${r},${g},${b},0.75)`);
        glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, sy, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${r},${g},${b},1)`;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      /* nodes */
      nodes.forEach(n => {
        const { r: cr, g: cg, b: cb } = nodeColors[n.type];
        const pulse  = 0.5 + 0.5 * Math.sin(n.pulse);
        const radius = n.r + pulse * 1.3;

        const nodeGlow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius * 5.5);
        nodeGlow.addColorStop(0, `rgba(${cr},${cg},${cb},${0.24 * pulse})`);
        nodeGlow.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = nodeGlow;
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius * 5.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.78 + 0.22 * pulse})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const posStyle = fixed
    ? { position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 0, display: "block", pointerEvents: "none" }
    : { position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, display: "block", pointerEvents: "none" };

  return <canvas ref={canvasRef} style={posStyle} />;
};

export default AIBackground;
