import React, { createElement, lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "../layout/Layout";
import { RouteErrorFallback } from "../components/ErrorBoundary";

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
const CreatePackage = lazy(() => import("../pages/opsPages/CreatePackage"));
const DmcDashboard = lazy(() => import("../pages/dmcPages/DmcDashboard"));
const ContractedRates = lazy(() => import("../pages/dmcPages/ContractedRates"));
const FulfillmentConfirmation = lazy(() => import("../pages/dmcPages/FulfillmentConfirmation"));
const SettlementCenter = lazy(() => import("../pages/dmcPages/SettlementCenter"));
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
  <div className="absolute inset-0 bg-black/25 backdrop-blur-[5px] flex items-center justify-center z-50 select-none pointer-events-none w-full h-full min-h-[30vh]">
    <div className="relative flex items-center justify-center">
      {/* Outer glowing pulse */}
      <div className="absolute w-12 h-12 rounded-full border border-blue-500/30 animate-ping opacity-60"></div>
      {/* Middle rotating ring */}
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-b-transparent border-l-blue-600 border-r-zinc-900 animate-spin"></div>
      {/* Center glowing dot */}
      <div className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-zinc-950 shadow-[0_0_8px_rgba(37,99,235,0.85)]"></div>
    </div>
  </div>
);

const lazyPage = (Component) => (
  <Suspense fallback={routeFallbackElement}>
    {createElement(Component)}
  </Suspense>
);

export const appRouter = createBrowserRouter([
  {
    errorElement: <RouteErrorFallback />,
    children: [
      {
        path: "/",
        element: lazyPage(Login),
      },
      {
        path: "/register",
        element: lazyPage(Register),
      },
      {
        element: <ProtectedRoute allowedRoles={["operations", "admin", "operation_manager"]} />,
        children: [
          {
            path: "/",
            element: <Layout />,
            children: [
              { path: "/ops/dashboard", element: lazyPage(OpsDashboardContent) },
              { path: "/ops/bookings-management", element: lazyPage(BookingManagementHub) },
              { path: "/ops/order-acceptance", element: lazyPage(OrderAcceptance) },
              { path: "/ops/quotation-builder", element: lazyPage(QuotationBuilder) }, //:queryId dynamic
              { path: "/ops/create-package", element: lazyPage(CreatePackage) },
              { path: "/ops/voucher-management", element: lazyPage(VoucherManagement) },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={["operation_manager"]} />,
        children: [
          {
            path: "/",
            element: <Layout />,
            children: [
              { path: "/operationManager/operationManagerDashboard", element: lazyPage(OperationManagerDashboard) },
              { path: "/operationManager/allTeamQueries", element: lazyPage(AllTeamQueries) },
              { path: "/operationManager/myTeam", element: lazyPage(MyOperationTeam) },
            ],
          },
        ],
      },
    ],
  },
]);

