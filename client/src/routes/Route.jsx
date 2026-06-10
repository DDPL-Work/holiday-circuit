import { createElement, lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "../layout/Layout";

const AgentDashboard = lazy(() => import("../pages/agentPages/AgentDashboard"));
const Queries = lazy(() => import("../pages/agentPages/Queries"));
const Finance = lazy(() => import("../pages/agentPages/Finance"));
const ActiveBookings = lazy(() => import("../pages/agentPages/ActiveBookings"));
const DocumentPortal = lazy(() => import("../pages/agentPages/DocumentPortal"));
const AssetLibrary = lazy(() => import("../pages/agentPages/AssetLibrary"));
const Login = lazy(() => import("../auth/login/Login"));
const Register = lazy(() => import("../auth/register/Register"));
const OpsDashboardContent = lazy(() => import("../pages/opsPages/OpsDashboardContent"));
const BookingManagementHub = lazy(() => import("../pages/opsPages/BookingManagementHub"));
const OrderAcceptance = lazy(() => import("../pages/opsPages/OrderAcceptance"));
const QuotationBuilder = lazy(() => import("../pages/opsPages/QuotationBuilder"));
const VoucherManagement = lazy(() => import("../pages/opsPages/VoucherManagement"));
const DmcDashboard = lazy(() => import("../pages/dmcPages/DmcDashboard"));
const ContractedRates = lazy(() => import("../pages/dmcPages/ContractedRates"));
const FulfillmentConfirmation = lazy(() => import("../pages/dmcPages/FulfillmentConfirmation"));
const FinanceDashboard = lazy(() => import("../pages/financePages/FinanceDashboard"));
const PaymentVerification = lazy(() => import("../pages/financePages/PaymentVerification"));
const InternalInvoice = lazy(() => import("../pages/financePages/InternalInvoice"));
const AdvancedAnalytics = lazy(() => import("../pages/financePages/AdvancedAnalytics"));
const Dashboard = lazy(() => import("../pages/adminPages/Dashboard"));
const SuperAdminDashboard = lazy(() => import("../pages/adminPages/SuperAdminDashboard"));
const Discount = lazy(() => import("../pages/adminPages/Discount"));
const FinanceManagerDashboard = lazy(() => import("../pages/managerPages/financeManagerPages/FinanceManagerDashboard"));
const AllTeamQueries = lazy(() => import("../pages/managerPages/opsManagerPages/AllTeamQueries"));
const OperationManagerDashboard = lazy(() => import("../pages/managerPages/opsManagerPages/OperationManagerDashboard"));
const MyOperationTeam = lazy(() => import("../pages/managerPages/opsManagerPages/MyOperationTeam"));
const AllTeamTransactions = lazy(() => import("../pages/managerPages/financeManagerPages/AllTeamTransactions"));
const InternalDMCInvoices = lazy(() => import("../pages/managerPages/financeManagerPages/InternalDMCInvoices"));
const MyFinanceTeam = lazy(() => import("../pages/managerPages/financeManagerPages/MyFinanceTeam"));
const UserManagement = lazy(() => import("../pages/adminPages/UserManagement"));

const routeFallbackElement = (
  <div className="flex min-h-[45vh] items-center justify-center text-sm font-semibold text-slate-500">
    Loading page...
  </div>
);

const lazyPage = (Component) => (
  <Suspense fallback={routeFallbackElement}>
    {createElement(Component)}
  </Suspense>
);

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: lazyPage(Login),
  },
   {
    path: "/register",
     element: lazyPage(Register),
  },

  {
    element: <ProtectedRoute allowedRoles={["agent"]} />,
    children: [
      {
        path: "/",
        element: <Layout/>,
        children: [
          { path: "/agent/dashboard", element: lazyPage(AgentDashboard)},
          { path: "/agent/queries", element: lazyPage(Queries)},
          { path: "/agent/bookings", element: lazyPage(ActiveBookings)},
          { path: "/agent/documents", element: lazyPage(DocumentPortal)},
          { path: "/agent/finance", element: lazyPage(Finance)},
          { path: "/agent/assets", element: lazyPage(AssetLibrary)},
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
          { path: "/admin/dashboard", element: lazyPage(Dashboard)},
          { path: "/admin/superAdminDashboard", element: lazyPage(SuperAdminDashboard)},
          { path: "/admin/discount", element: lazyPage(Discount)},
          { path: "/admin/bookings-management", element: lazyPage(BookingManagementHub)},
          { path: "/admin/user-management", element: lazyPage(UserManagement)},
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={["operations", "admin", "operation_manager"]} />,
    children: [
      {
        path: "/",
        element: <Layout/>,
        children: [
          { path: "/ops/dashboard", element: lazyPage(OpsDashboardContent)},
          { path: "/ops/bookings-management", element: lazyPage(BookingManagementHub)},
          { path: "/ops/order-acceptance", element: lazyPage(OrderAcceptance)},
          {path: "/ops/quotation-builder", element: lazyPage(QuotationBuilder)}, //:queryId dynamic
          {path: "/ops/voucher-management", element: lazyPage(VoucherManagement)},
          
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
          { path: "/dmc/dashboard", element: lazyPage(DmcDashboard)},
          { path: "/dmc/contractedRates", element: lazyPage(ContractedRates)},
          { path: "/dmc/confirmation", element: lazyPage(FulfillmentConfirmation)},
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
          { path: "/finance/dashboard", element: lazyPage(FinanceDashboard)},
          { path: "/finance/advancedAnalytics", element: lazyPage(AdvancedAnalytics)},
          { path: "/finance/paymentVerification", element: lazyPage(PaymentVerification)},
          { path: "/finance/internalInvoice", element: lazyPage(InternalInvoice)},
        ],
      },
    ],
  },
  {
    element:<ProtectedRoute allowedRoles={["operation_manager"]} />,
    children: [
      { path: "/", element: <Layout/>,
        children: [
          { path: "/operationManager/operationManagerDashboard", element: lazyPage(OperationManagerDashboard)},
          { path: "/operationManager/allTeamQueries", element: lazyPage(AllTeamQueries)},
          { path: "/operationManager/myTeam", element: lazyPage(MyOperationTeam)},
        ],
      },
    ],
  },
  {
    element:<ProtectedRoute allowedRoles={["finance_manager"]} />,
    children: [
      { path: "/", element: <Layout/>,
        children: [
          { path: "/financeManager/financeManagerDashboard", element: lazyPage(FinanceManagerDashboard)},
          { path: "/financeManager/advancedAnalytics", element: lazyPage(AdvancedAnalytics)},
          { path: "/financeManager/allTeamTransaction", element: lazyPage(AllTeamTransactions)},
          { path: "/financeManager/internalDmcInvoice", element: lazyPage(InternalDMCInvoices)},
          { path: "/financeManager/myFinanceTeam", element: lazyPage(MyFinanceTeam)},
        ],
      },
    ],
  },
]);
