import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
  const user = {isAuthenticated: true, role: ["agent", "admin", "operations", "dmc_partner","finance_partner"]};

  if (!user.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.some(role => user.role.includes(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;