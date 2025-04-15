// src/components/Auth/Login.js
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert } from "../ui/alert";

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    try {
      const fn = isRegistering ? api.registerUser : api.loginUser;
      const response = await fn(email, password);

      if (response && response.message === "Login successful!") {
        localStorage.setItem("email", email);
        navigate("/portfolio");
      } else {
        setError("Wrong email or password.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow text-center">
      <h2 className="text-2xl font-bold mb-6">{isRegistering ? "Register" : "Login"}</h2>
      {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Loading..." : isRegistering ? "Register" : "Login"}
        </Button>
      </form>
      <button
        className="mt-4 text-sm text-blue-600 underline"
        onClick={() => setIsRegistering(!isRegistering)}
      >
        {isRegistering ? "Already have an account? Login" : "No account? Register"}
      </button>
    </div>
  );
};
