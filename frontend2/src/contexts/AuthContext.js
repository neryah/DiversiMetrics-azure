// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [email, setEmail] = useState(localStorage.getItem("email"));

  const login = async (email, password) => {
    const success = await api.loginUser(email, password);
    if (success) {
      localStorage.setItem("email", email);
      setEmail(email);
    } else {
      throw new Error("Invalid credentials");
    }
  };

  const register = async (email, password) => {
    const success = await api.registerUser(email, password);
    if (success) {
      localStorage.setItem("email", email);
      setEmail(email);
    } else {
      throw new Error("Registration failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("email");
    setEmail(null);
  };

  const isAuthenticated = !!email;

  return (
    <AuthContext.Provider value={{ email, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
