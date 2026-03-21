import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "../layout/Layout";
import AgentDashboard from "../pages/agentPages/AgentDashboard";
import Queries from "../pages/agentPages/Queries";
import Finance from "../pages/agentPages/Finance";
import ActiveBookings from "../pages/agentPages/activeBookings";
import DocumentPortal from "../pages/agentPages/documentPortal";
import AssetLibrary from "../pages/agentPages/assetLibrary";
import Login from "../auth/login/Login";
import Register from "../auth/register/Register";
import OpsDashboardContent from "../pages/opsPages/OpsDashboardContent";
import BookingManagementHub from "../pages/opsPages/BookingManagementHub";
import OrderAcceptance from "../pages/opsPages/OrderAcceptance";
import QuotationBuilder from "../pages/opsPages/QuotationBuilder";
import VoucherManagement from "../pages/opsPages/VoucherManagement";
import DmcDashboard from "../pages/dmcPages/DmcDashboard"
import ContractedRates from "../pages/dmcPages/ContractedRates";
import FulfillmentConfirmation from "../pages/dmcPages/FulfillmentConfirmation";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element :<Login/>
  },
   {
    path: "/register",
     element: <Register />,
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
          { path: "/admin/dashboard", //element: <AdminDashboard />,
            },
          {},
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={["operations"]} />,
    children: [
      {
        path: "/",
        element: <Layout/>,
        children: [
          { path: "/ops/dashboard", element:<OpsDashboardContent/>},
          { path: "/ops/bookings-management", element:<BookingManagementHub/>},
          { path: "/ops/order-acceptance", element:<OrderAcceptance/>},
          {path: "/ops/quotation-builder", element: <QuotationBuilder />}, //:queryId dynamic 
          {path: "/ops/voucher-management", element: <VoucherManagement/>}, 
          
        ],
      },
    ],
  }, 
  {
    element:<ProtectedRoute allowedRoles={["dmc_partner"]} />,
    children: [
      {
        path: "/",
        element: <Layout/>,
        children: [
          { path: "/dmc/dashboard", element:<DmcDashboard/>},
          { path: "/dmc/contractedRates", element:<ContractedRates/>},
          { path: "/dmc/confirmation", element:<FulfillmentConfirmation/>},
        ],
      },
    ],
  },
]);
