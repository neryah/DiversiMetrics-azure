// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Login } from '@/components/Auth/Login';
import { Signup } from '@/components/Auth/Signup';
import Portfolio from '@/pages/Portfolio';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Portfolio />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;