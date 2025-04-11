// src/api.js
const BASE_URL = "https://diversimetrics-api.azurewebsites.net/api";
// REACT_APP_API_BASE_URL=https://diversimetrics-api.azurewebsites.net/api


const api = {
  async loginUser(email, password) {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  
    const text = await res.text();
    console.log("Login response status:", res.status);
    console.log("Login response body:", text);
  
    return res.ok;
  },  

  async registerUser(email, password) {
    const res = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return res.ok;
  },

  // later:
  // async getPortfolio(email) { ... }
  // async savePortfolio(email, portfolio) { ... }
};

export default api;
