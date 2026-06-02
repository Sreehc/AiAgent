import { Navigate, Outlet, useLocation } from "react-router-dom";
import { readSession } from "../stores/auth";

export function ProtectedRoute() {
  const location = useLocation();
  const session = readSession();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

