// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import QuoteDetailPage from "./pages/QuoteDetailPage";
import RequestAccountPage from "./pages/RequestAccountPage";
import CreateQuotePage from "./pages/CreateQuotePage";
import Navbar from "./components/Navbar";
import Layout from "./components/Layout";
import axios from "axios";
//
function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/test-auth/', { withCredentials: true })
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null));
  }, []);

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <div className="p-4">
        <Routes>
          <Route path="/login" element={<LoginPage />} />          
          <Route path="/" element={<HomePage />} /> 
          <Route path="/quote/:id" element={<QuoteDetailPage />} />
          <Route path="/create-quote" element={<CreateQuotePage />} />
          <Route path="/request-account" element={<RequestAccountPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

