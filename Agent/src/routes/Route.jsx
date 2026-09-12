import  React ,{ createElement, lazy, Suspense } from "react";
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
const Terms = lazy(() => import("../pages/agentPages/Terms"));
const CreateTerm = lazy(() => import("../pages/agentPages/CreateTerm"));
const TermDetails = lazy(() => import("../pages/agentPages/TermDetails"));
const EditTerm = lazy(() => import("../pages/agentPages/EditTerm"));


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
          { path: "/agent/terms", element: lazyPage(Terms)},
          { path: "/agent/terms/create", element: lazyPage(CreateTerm)},
          { path: "/agent/terms/:id", element: lazyPage(TermDetails)},
          { path: "/agent/terms/:id/edit", element: lazyPage(EditTerm)},
        ],
      },
    ],
  },
]);
