import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getItemTarget, isItemActive } from "../navConfig";

export const MobileNav = ({
  menus = [],
  mobileNavOpen = false,
  setMobileNavOpen,
}) => {
  const location = useLocation();
  const mobileNavRef = useRef(null);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.search, setMobileNavOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
        aria-label="Toggle navigation"
      >
        {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              ref={mobileNavRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-[4.5rem] left-0 right-0 z-50 max-h-[calc(100vh-4.5rem)] overflow-y-auto border-b border-white/10 bg-[#0F172A] lg:hidden custom-scroll"
            >
              <nav className="space-y-1 p-3">
                {menus.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item, location);
                  return (
                    <NavLink
                      key={`${item.path}${item.hash || item.label}`}
                      to={getItemTarget(item)}
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        active
                          ? "bg-[#3E63DD] text-white shadow-[0_8px_16px_rgba(62,99,221,0.3)]"
                          : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <Icon size={15} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNav;
