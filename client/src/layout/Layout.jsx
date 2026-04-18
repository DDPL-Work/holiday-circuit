import Header from "./header/Header";
import Sidebar from "./sidebar/Sidebar";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState } from "react";

const Layout = () => {
  const { user, loading } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isSuperAdminDashboardRoute = location.pathname === "/admin/superAdminDashboard";
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
          className={`flex-1 overflow-y-scroll bg-gray-50 custom-scroll ${
            isSuperAdminDashboardRoute
              ? "px-0 py-0"
              : "px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5"
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
