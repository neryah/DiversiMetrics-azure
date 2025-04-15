import { Navigate } from "react-router-dom";

export default function RequireAuth({ children }) {
  const email = localStorage.getItem("email");
  return email ? children : <Navigate to="/login" replace />;
}
