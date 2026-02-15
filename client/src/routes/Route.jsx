import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "../layout/Layout";
import AgentDashboard from "../pages/agentPages/AgentDashboard";
import Queries from "../pages/agentPages/Queries";
import Finance from "../pages/agentPages/Finance";
import ActiveBookings from "../pages/agentPages/activeBookings";
import DocumentPortal from "../pages/agentPages/documentPortal";
import AssetLibrary from "../pages/agentPages/assetLibrary";
import Login from "../auth/Login";
import Register from "../auth/Register";
import QueryDetails from "../pages/agentPages/QueryDetails";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element :<Login/>
  },
   {
    path: "/register",
    element :<Register/>
  },

  {
    element: <ProtectedRoute allowedRoles={["agent"]} />,
    children: [
      {
        path: "/",
        element: <Layout/>,
        children: [
          { path: "/agent/dashboard", element: <AgentDashboard/>},
          { path: "/agent/queries", element: <Queries/>},
          { path: "/agent/bookings", element: <ActiveBookings/>},
          { path: "/agent/documents", element: <DocumentPortal/>},
          { path: "/agent/finance", element: <Finance/>},
          { path: "/agent/assets", element: <AssetLibrary/>},
        ],
      },
    ],
  },

  {
    element: <ProtectedRoute allowedRoles={["admin"]} />,
    children: [
      {
        path: "/",
        element: <Layout />,
        children: [
          { path: "/admin/dashboard", // element: <AdminDashboard />,
            },
          {},
        ],
      },
    ],
  },
]);
