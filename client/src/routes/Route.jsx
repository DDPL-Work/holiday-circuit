import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "../layout/Layout";
import AgentDashboard from "../pages/agentPages/AgentDashboard";
import Queries from "../pages/agentPages/Queries";
import Finance from "../pages/agentPages/Finance";
import ActiveBookings from "../pages/agentPages/ActiveBookings";
import DocumentPortal from "../pages/agentPages/DocumentPortal";
import AssetLibrary from "../pages/agentPages/AssetLibrary";
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
import FinanceDashboard from "../pages/financePages/FinanceDashboard";
import PaymentVerification from "../pages/financePages/PaymentVerification";
import InternalInvoice from "../pages/financePages/InternalInvoice";
import AdvancedAnalytics from "../pages/financePages/AdvancedAnalytics";
import Dashboard from "../pages/adminPages/Dashboard";
import SuperAdminDashboard from "../pages/adminPages/SuperAdminDashboard";
import FinanceManagerDashboard from "../pages/managerPages/financeManagerPages/FinanceManagerDashboard";
import AllTeamQueries from "../pages/managerPages/opsManagerPages/AllTeamQueries";
import OperationManagerDashboard from "../pages/managerPages/opsManagerPages/OperationManagerDashboard";
import MyOperationTeam from "../pages/managerPages/opsManagerPages/MyOperationTeam";
import AllTeamTransactions from "../pages/managerPages/financeManagerPages/AllTeamTransactions";
import InternalDMCInvoices from "../pages/managerPages/financeManagerPages/InternalDMCInvoices";
import MyFinanceTeam from "../pages/managerPages/financeManagerPages/MyFinanceTeam";

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
          { path: "/admin/dashboard", element: <Dashboard/>},
          { path: "/admin/superAdminDashboard", element: <SuperAdminDashboard/>},
          { path: "/admin/bookings-management", element:<BookingManagementHub/>},
          {},
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={["operations", "admin"]} />,
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
    element:<ProtectedRoute allowedRoles={["dmc_partner", "admin"]} />,
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
   {
    element:<ProtectedRoute allowedRoles={["finance_partner", "admin"]} />,
    children: [
      { path: "/",
        element: <Layout/>,
        children: [
          { path: "/finance/dashboard", element:<FinanceDashboard/>},
          { path: "/finance/advancedAnalytics", element:<AdvancedAnalytics/>},
          { path: "/finance/paymentVerification", element:<PaymentVerification/>},
          { path: "/finance/internalInvoice", element:<InternalInvoice/>},
        ],
      },
    ],
  },
  {
    element:<ProtectedRoute allowedRoles={["operation_manager"]} />,
    children: [
      { path: "/", element: <Layout/>,
        children: [
          { path: "/operationManager/operationManagerDashboard", element:<OperationManagerDashboard/>},
          { path: "/operationManager/allTeamQueries", element:<AllTeamQueries/>},
          { path: "/operationManager/myTeam", element:<MyOperationTeam/>},
        ],
      },
    ],
  },
  {
    element:<ProtectedRoute allowedRoles={["finance_manager"]} />,
    children: [
      { path: "/", element: <Layout/>,
        children: [
          { path: "/financeManager/financeManagerDashboard", element:<FinanceManagerDashboard/>},
          { path: "/financeManager/allTeamTransaction", element:<AllTeamTransactions/>},
          { path: "/financeManager/internalDmcInvoice", element:<InternalDMCInvoices/>},
          { path: "/financeManager/myFinanceTeam", element:<MyFinanceTeam/>},
        ],
      },
    ],
  },
]);
