import { Routes, Route } from "react-router-dom";
import Register from "../auth/Register";
import CompanyDetails from "../auth/CompanyDetails";
import KycVerification from "../auth/KycVerification";
import VerificationInProgress from "../auth/VerificationInProgress";
import Login from "../auth/Login";
import RegisterLayout from "../Layouts/Registerlayout";
import ProtectedRoute from "../Components/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route path="/register" element={<RegisterLayout />}>
        <Route index element={<Register />} />
        <Route path="company" element={<CompanyDetails />} />
        <Route path="kyc" element={<KycVerification />} />
        <Route path="verify" element={<VerificationInProgress />} />
      </Route>

      {/* Example Protected Dashboard Route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <h1 className="text-3xl text-center mt-10">
              Dashboard (Protected)
            </h1>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
