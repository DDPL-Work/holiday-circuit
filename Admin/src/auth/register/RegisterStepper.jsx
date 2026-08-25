import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

const TOTAL_STEPS = 3;

export default function RegisterStepper({ currentStep = 1, isActive = false }) {
  const safeStep = Math.min(Math.max(Number(currentStep || 1), 1), TOTAL_STEPS);
  const animationCycleKey = `${safeStep}-${isActive ? "active" : "idle"}`;

  return (
    <motion.div
      key={animationCycleKey}
      initial={isActive ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="mb-4 px-1"
    >
      <div className="flex items-center">
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < safeStep;
          const isCurrent = stepNumber === safeStep;

          return (
            <div key={stepNumber} className="flex flex-1 items-center last:flex-none">
              <motion.div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                      ? "bg-blue-900 text-white"
                      : "bg-slate-200 text-slate-600"
                }`}
                initial={isActive ? { scale: 0.78, opacity: 0.75 } : false}
                animate={
                  isCompleted
                    ? { scale: isActive ? [0.82, 1.12, 1] : 1, opacity: 1 }
                    : isCurrent
                      ? { scale: isActive ? [0.88, 1.06, 1] : 1, opacity: 1 }
                      : { scale: 1, opacity: 1 }
                }
                transition={{ duration: 0.42, ease: "easeOut", delay: index * 0.08 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isCompleted ? (
                    <motion.span
                      key={`done-${stepNumber}`}
                      initial={isActive ? { scale: 0.35, opacity: 0, rotate: -28 } : false}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.7, opacity: 0 }}
                      transition={{ duration: 0.34, ease: "easeOut", delay: 0.08 + index * 0.08 }}
                    >
                      <Check size={15} strokeWidth={3.2} />
                    </motion.span>
                  ) : (
                    <motion.span
                      key={`step-${stepNumber}`}
                      initial={isActive ? { opacity: 0, scale: 0.7 } : false}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.24, delay: index * 0.06 }}
                    >
                      {stepNumber}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              {stepNumber < TOTAL_STEPS ? (
                <div className="mx-1.5 h-1 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <motion.div
                    className="h-full rounded-full bg-blue-900"
                    initial={isActive ? { width: "0%" } : false}
                    animate={{ width: stepNumber < safeStep ? "100%" : "0%" }}
                    transition={{
                      duration: 0.55,
                      ease: "easeOut",
                      delay: stepNumber < safeStep && isActive ? 0.14 + index * 0.1 : 0,
                    }}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
