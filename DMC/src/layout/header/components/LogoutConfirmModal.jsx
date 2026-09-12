import { AnimatePresence, motion } from "framer-motion";
import { LogOut } from "lucide-react";

export const LogoutConfirmModal = ({
  open = false,
  onClose,
  onConfirm,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ scale: 0.92, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 15, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-rose-600" />

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4">
              <LogOut size={20} className="stroke-[2.5]" />
            </div>

            <h3 className="text-base font-bold text-white mb-1.5">
              Confirm Log Out
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to log out of Holiday Circuit?
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 py-2.5 hover:bg-slate-700 hover:text-white transition-all active:scale-95 duration-150 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onConfirm();
                }}
                className="rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-650 hover:to-rose-700 text-xs font-bold text-white py-2.5 shadow-[0_2px_10px_rgba(239,68,68,0.25)] transition-all active:scale-95 duration-150 cursor-pointer"
              >
                Yes, Log Out
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LogoutConfirmModal;
