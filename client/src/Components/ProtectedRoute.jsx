export default function ProtectedRoute({ children }) {
  const { isAuthenticated, verificationStatus } = useSelector(
    (state) => state.auth
  );

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (verificationStatus !== "approved") {
    return <Navigate to="/verification-pending" replace />;
  }

  return children;
}
