import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getItemTarget, isItemActive } from "../../navConfig";

export const DesktopNav = ({ menus = [] }) => {
  const location = useLocation();
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  if (menus.length > 4) {
    const visibleCount = 4;
    const visibleMenus = menus.slice(0, visibleCount);
    const overflowMenus = menus.slice(visibleCount);
    const isOverflowActive = overflowMenus.some((item) =>
      isItemActive(item, location),
    );

    return (
      <nav className="hidden lg:flex items-center gap-2.5 sm:gap-3.5 ml-auto mr-3 shrink-0">
        {visibleMenus.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item, location);
          return (
            <NavLink
              key={`${item.path}${item.hash || item.label}`}
              to={getItemTarget(item)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
                active
                  ? "bg-[#3E63DD] text-white shadow-[0_8px_16px_rgba(62,99,221,0.3)]"
                  : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div
          className="relative"
          onMouseEnter={() => setMoreDropdownOpen(true)}
          onMouseLeave={() => setMoreDropdownOpen(false)}
        >
          <button
            type="button"
            onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 cursor-pointer ${
              isOverflowActive || moreDropdownOpen
                ? "bg-[#3E63DD] text-white shadow-[0_8px_16px_rgba(62,99,221,0.3)]"
                : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <span>More</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${
                moreDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {moreDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="fixed left-0 right-0 top-[4.5rem] z-50 w-full rounded-none border-b border-white/10 bg-[#0F172A]/95 px-3 sm:px-5 lg:px-6 py-2 shadow-xl backdrop-blur-2xl before:absolute before:-top-5 before:left-0 before:right-0 before:h-5"
              >
                <div className="flex flex-wrap items-center justify-start gap-1 sm:gap-2 w-full">
                  {overflowMenus.map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item, location);
                    return (
                      <NavLink
                        key={`${item.path}${item.hash || item.label}`}
                        to={getItemTarget(item)}
                        onClick={() => setMoreDropdownOpen(false)}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
                          active
                            ? "bg-[#3E63DD] text-white shadow-[0_8px_16px_rgba(62,99,221,0.3)]"
                            : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        <Icon size={14} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    );
  }

  return (
    <nav className="hidden lg:flex items-center gap-2.5 sm:gap-3.5 ml-auto mr-3 shrink-0">
      {menus.map((item) => {
        const Icon = item.icon;
        const active = isItemActive(item, location);
        return (
          <NavLink
            key={`${item.path}${item.hash || item.label}`}
            to={getItemTarget(item)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
              active
                ? "bg-[#3E63DD] text-white shadow-[0_8px_16px_rgba(62,99,221,0.3)]"
                : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <Icon size={14} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default DesktopNav;
