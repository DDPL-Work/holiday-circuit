import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getItemTarget, isItemActive } from "../../navConfig";

export const DesktopNav = ({ menus = [], onOpenAgentOrgModal }) => {
  const location = useLocation();
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  const regularItems = menus.filter(
    (item) => !item.isModalAction && item.path !== "#agent-organization" && !item.forceMore,
  );
  const modalOrMoreItems = menus.filter(
    (item) => item.isModalAction || item.path === "#agent-organization" || item.forceMore,
  );

  const maxVisibleRegular = 4;
  const visibleMenus = regularItems.slice(0, maxVisibleRegular);
  const overflowMenus = [
    ...regularItems.slice(maxVisibleRegular),
    ...modalOrMoreItems,
  ];

  const hasOverflow = overflowMenus.length > 0;
  const isOverflowActive = overflowMenus.some((item) =>
    isItemActive(item, location),
  );

  const renderNavItem = (item, isOverflow = false) => {
    const Icon = item.icon;
    const active = isItemActive(item, location);

    if (item.isModalAction || item.path === "#agent-organization") {
      return (
        <button
          key={item.label}
          type="button"
          onClick={() => {
            if (isOverflow) setMoreDropdownOpen(false);
            onOpenAgentOrgModal?.();
          }}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-all duration-200 cursor-pointer text-left w-full ${
            isOverflow
              ? "text-blue-300 hover:bg-blue-500/15 hover:text-white"
              : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
          }`}
        >
          {Icon && <Icon size={15} className={`shrink-0 ${isOverflow ? "text-blue-400" : ""}`} />}
          <span className="whitespace-nowrap">{item.label}</span>
        </button>
      );
    }

    return (
      <NavLink
        key={`${item.path}${item.hash || item.label}`}
        to={getItemTarget(item)}
        onClick={() => isOverflow && setMoreDropdownOpen(false)}
        className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
          isOverflow
            ? active
              ? "bg-[#3E63DD] text-white"
              : "text-slate-300 hover:bg-white/[0.06] hover:text-white w-full"
            : active
              ? "bg-[#3E63DD] text-white shadow-[0_4px_12px_rgba(62,99,221,0.35)]"
              : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
        }`}
      >
        {Icon && <Icon size={15} className="shrink-0" />}
        <span className="whitespace-nowrap">{item.label}</span>
      </NavLink>
    );
  };

  return (
    <nav className="hidden lg:flex items-center gap-1.5 sm:gap-2 ml-auto mr-3 shrink-0">
      {visibleMenus.map((item) => renderNavItem(item, false))}

      {hasOverflow && (
        <div
          className="relative"
          onMouseEnter={() => setMoreDropdownOpen(true)}
          onMouseLeave={() => setMoreDropdownOpen(false)}
        >
          <button
            type="button"
            onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
              isOverflowActive || moreDropdownOpen
                ? "bg-[#3E63DD] text-white shadow-[0_4px_12px_rgba(62,99,221,0.35)]"
                : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <span className="whitespace-nowrap">More</span>
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
                className="absolute right-0 top-full mt-2 z-50 min-w-[200px] w-max rounded-xl border border-white/10 bg-[#0F172A]/95 p-1.5 shadow-2xl backdrop-blur-2xl before:absolute before:-top-2 before:left-0 before:right-0 before:h-2"
              >
                <div className="flex flex-col items-stretch gap-0.5 w-full">
                  {overflowMenus.map((item) => renderNavItem(item, true))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </nav>
  );
};

export default DesktopNav;
