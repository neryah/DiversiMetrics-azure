import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Login";
import Portfolio from "./Pages/Portfolio"; // assuming this is your main page
import RequireAuth from "./Pages/RequireAuth";

import React from 'react';

export default function Layout({ children }) {

return (
    <div className="min-h-screen bg-gray-50">
        {children} 
    </div>
)
}

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
  <Route path="*" element={<Navigate to="/login" replace />} />
</Routes>
