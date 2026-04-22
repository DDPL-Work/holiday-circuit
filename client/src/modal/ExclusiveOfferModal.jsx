import { useState, useEffect } from "react";
import { Copy, Check, BadgePercent, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Confetti particles
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.cos((i / 18) * Math.PI * 2) * (55 + Math.random() * 30),
  y: Math.sin((i / 18) * Math.PI * 2) * (55 + Math.random() * 30),
  color: ["#6366f1","#a855f7","#22c55e","#f59e0b","#3b82f6","#ec4899","#14b8a6"][i % 7],
  size: 5 + Math.random() * 5,
  rotate: Math.random() * 360,
  shape: i % 3 === 0 ? "circle" : i % 3 === 1 ? "rect" : "star",
}));

function Particle({ p, burst }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: "50%",
        top: "50%",
        width: p.size,
        height: p.shape === "rect" ? p.size * 0.5 : p.size,
        borderRadius: p.shape === "circle" ? "50%" : "2px",
        background: p.color,
        clipPath: p.shape === "star"
          ? "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"
          : "none",
      }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
      animate={burst ? { x: p.x, y: p.y, opacity: [1, 1, 0], scale: [0, 1.2, 0.8], rotate: p.rotate } : {}}
      transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
    />
  );
}

export default function ExclusiveOfferModal({ open = true, onClose }) {
  const [copied, setCopied] = useState(false);
  const [burst, setBurst] = useState(false);
  const code = "25TODAYONLY";

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setBurst(true), 100);
      return () => clearTimeout(t);
    } else {
      setBurst(false);
    }
  }, [open]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.50)", backdropFilter: "blur(8px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
        >
          {/* Card unfolds like gift box lid */}
          <motion.div
            className="relative w-full max-w-sm overflow-visible"
            initial={{ opacity: 0, scaleY: 0.05, scaleX: 0.7, y: -40 }}
            animate={{ opacity: 1, scaleY: 1, scaleX: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30, rotate: -3 }}
            transition={{
              opacity: { duration: 0.18 },
              scaleY: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] },
              scaleX: { duration: 0.35, ease: [0.34, 1.4, 0.64, 1] },
              y: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Confetti burst */}
            <div className="absolute" style={{ top: 60, left: "50%", zIndex: 60 }}>
              {PARTICLES.map((p) => <Particle key={p.id} p={p} burst={burst} />)}
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(99,102,241,0.25)]"
              style={{ border: "1px solid rgba(199,210,254,0.5)" }}>

              {/* Gradient top */}
              <div className="absolute inset-x-0 top-0 h-36 rounded-t-3xl"
                style={{
                  background: "linear-gradient(135deg,#c7d2fe 0%,#ddd6fe 35%,#e0e7ff 60%,#bfdbfe 100%)",
                  opacity: 0.80,
                }} />

              {/* Close */}
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 transition-all"
                style={{ background: "rgba(255,255,255,0.70)", border: "1px solid rgba(226,232,240,0.8)" }}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{ delay: 0.55, duration: 0.25 }}
              >
                <X size={13} />
              </motion.button>

              <div className="relative px-6 pt-8 pb-6">

                {/* Icon bounce */}
                <motion.div
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
                  style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, duration: 0.5, ease: [0.34, 1.7, 0.64, 1] }}
                >
                  <BadgePercent size={26} className="text-white" strokeWidth={2} />
                </motion.div>

                {/* Title */}
                <motion.div className="flex items-center gap-2.5 mb-2"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.42, duration: 0.3, ease: "easeOut" }}>
                  <h2 className="text-xl font-bold text-slate-900">Unlock exclusive offer</h2>
                  <span className="rounded-full px-3 py-0.5 text-xs font-semibold text-slate-700"
                    style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>25% Off</span>
                </motion.div>

                {/* Description */}
                <motion.p className="text-sm text-slate-500 leading-6 mb-5"
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.50, duration: 0.28, ease: "easeOut" }}>
                  Grab 25% off on all plans today only! Don't miss out – this deal ends tomorrow 🚀
                </motion.p>

                {/* Code box */}
                <motion.div
                  className="flex items-center justify-between rounded-2xl px-4 py-3 mb-4"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.56, duration: 0.28, ease: "easeOut" }}>
                  <span className="text-sm text-slate-500">
                    Code: <span className="font-bold text-slate-900 tracking-wider">{code}</span>
                  </span>
                  <button onClick={handleCopy}
                    className="flex h-8 w-8 items-center justify-center rounded-xl transition-all"
                    style={{ background: copied ? "#dcfce7" : "#f1f5f9", border: `1px solid ${copied ? "#bbf7d0" : "#e2e8f0"}` }}>
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div key="check" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }} transition={{ duration: 0.2 }}>
                          <Check size={14} className="text-green-600" />
                        </motion.div>
                      ) : (
                        <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }}
                          exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
                          <Copy size={14} className="text-slate-400" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>

                {/* Checkpoints stagger */}
                <div className="flex flex-col gap-2 mb-6">
                  {["Works on any plan", "30-day money-back guarantee"].map((item, i) => (
                    <motion.div key={item} className="flex items-center gap-2"
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.62 + i * 0.08, duration: 0.25, ease: "easeOut" }}>
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </div>
                      <span className="text-sm text-slate-600">{item}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA */}
                <motion.button
                  className="w-full rounded-2xl py-3.5 text-sm font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%)",
                    boxShadow: "0 6px 20px rgba(139,92,246,0.38)",
                  }}
                  initial={{ opacity: 0, y: 16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.72, duration: 0.32, ease: [0.34, 1.3, 0.64, 1] }}
                  whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(139,92,246,0.50)" }}
                  whileTap={{ scale: 0.97 }}
                >
                  Grab the Offer
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}