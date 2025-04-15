// const BASE_URL = "https://diversimetrics-api.azurewebsites.net/api";
// // REACT_APP_API_BASE_URL=https://diversimetrics-api.azurewebsites.net/api
// src/api.js
const API_BASE = process.env.REACT_APP_API_BASE_URL;

async function registerUser(email, password) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return await res.json();
}

async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return await res.json();
}

export default {
  registerUser,
  loginUser
};

