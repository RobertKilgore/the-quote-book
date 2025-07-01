// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import QuoteDetailPage from "./pages/QuoteDetailPage";
import RequestAccountPage from "./pages/RequestAccountPage";
import CreateQuotePage from "./pages/CreateQuotePage";
import Navbar from "./components/Navbar";
import AdminRoute from "./components/AdminRoute";
import Layout from "./components/Layout";
import axios from "axios";
import PrivateRoute from "./components/PrivateRoute";


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/test-auth/', { withCredentials: true })
      .then(res => {
        setUser({
        username: res.data.user,
        isSuperuser: res.data.is_superuser
        });
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <div className="pt-16 p-4">
        <Routes>

          <Route path="/login" element={<LoginPage user={user} setUser={setUser} />} />
          <Route path="/request-account" element={<RequestAccountPage />} />

          
          <Route
            path="/"
            element={
              <PrivateRoute user={user} loading={loading}>
                <HomePage user={user}/>
              </PrivateRoute>
            }
          />

          <Route
            path="/quote/:id"
            element={
              <PrivateRoute user={user} loading={loading}>
                <QuoteDetailPage user={user}/>
              </PrivateRoute>
            }
          />

          <Route
            path="/create-quote"
            element={
              <AdminRoute user={user} loading={loading}>
                <CreateQuotePage user={user}/>
              </AdminRoute>
            }
          />

          
        </Routes>
      </div>
    </Router>
  );
}

export default App;

