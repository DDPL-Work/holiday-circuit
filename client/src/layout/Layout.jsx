import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Header from "./header/Header";
import Sidebar from "./sidebar/Sidebar";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import GlobalDatabaseLoader from "../components/GlobalDatabaseLoader";
import FinanceOverdueReminderWidget from "../components/FinanceOverdueReminderWidget";
import OpsOverdueReminderWidget from "../components/OpsOverdueReminderWidget";
import {
  getRequestLoaderSnapshot,
  subscribeToRequestLoader,
} from "../utils/requestLoader.js";

const Layout = () => {
  const { user, loading } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef(null);
  const location = useLocation();
  const isLoaderVisible = useSyncExternalStore(
    subscribeToRequestLoader,
    getRequestLoaderSnapshot,
    getRequestLoaderSnapshot,
  );

  const isSuperAdminDashboardRoute = location.pathname === "/admin/superAdminDashboard";

  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) return;

    mainElement.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [location.pathname, location.search]);

  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) return undefined;

    const sidebarScrollArea = document.querySelector(".sidebar-scrollbar");
    const sidebarContainer = sidebarScrollArea?.closest("aside");
    const elementsToLock = [mainElement, sidebarScrollArea, sidebarContainer].filter(
      Boolean,
    );
    const previousStyles = elementsToLock.map((element) => ({
      element,
      overflow: element.style.overflow,
      overflowY: element.style.overflowY,
      scrollbarWidth: element.style.getPropertyValue("scrollbar-width"),
      msOverflowStyle: element.style.msOverflowStyle,
    }));

    const restoreLockedElements = () => {
      previousStyles.forEach(
        ({ element, overflow, overflowY, scrollbarWidth, msOverflowStyle }) => {
          element.classList.remove("hc-loader-lock-scroll", "hide-scrollbar");
          element.style.overflow = overflow;
          element.style.overflowY = overflowY;
          if (scrollbarWidth) {
            element.style.setProperty("scrollbar-width", scrollbarWidth);
          } else {
            element.style.removeProperty("scrollbar-width");
          }
          element.style.msOverflowStyle = msOverflowStyle;
        },
      );
      document.documentElement.classList.remove("hc-loader-active");
      document.body.classList.remove("hc-loader-active");
    };

    if (isLoaderVisible) {
      elementsToLock.forEach((element) => {
        element.classList.add("hc-loader-lock-scroll", "hide-scrollbar");
        element.style.overflow = "hidden";
        element.style.overflowY = "hidden";
        element.style.setProperty("scrollbar-width", "none");
        element.style.msOverflowStyle = "none";
      });
      document.documentElement.classList.add("hc-loader-active");
      document.body.classList.add("hc-loader-active");
    } else {
      restoreLockedElements();
    }

    return () => {
      restoreLockedElements();
    };
  }, [isLoaderVisible]);

  if (loading) return null;

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden bg-gray-50">
      <Header onMenuToggle={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        {user && (
          <Sidebar
            user={user}
            mobileOpen={sidebarOpen}
            onMobileClose={() => setSidebarOpen(false)}
          />
        )}
        <main
          ref={mainRef}
          className={`relative flex-1 overflow-y-scroll bg-gray-50 custom-scroll ${isSuperAdminDashboardRoute
              ? "px-0 py-0"
              : "px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5"
            }`}
        >
          <GlobalDatabaseLoader scoped label="Loading..." />
          <Outlet />
        </main>
      </div>
      {user?.role === "finance_partner" && <FinanceOverdueReminderWidget />}
      {user?.role === "operations" && <OpsOverdueReminderWidget />}
    </div>
  );
};

export default Layout;
