import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Portfolio from "./Pages/Portfolio";
import { Login } from './components/Auth/Login';
import { AuthProvider } from "./contexts/AuthContext";

function RequireAuth({ children }) {
  const email = localStorage.getItem("email");
  return email ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/portfolio"
            element={
              <RequireAuth>
                <Portfolio />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/portfolio" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
