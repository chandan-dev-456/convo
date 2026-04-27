import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../contexts/Authcontext";

export default function ProtectedRoute() {
  const { userData } = useContext(AuthContext);

  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}