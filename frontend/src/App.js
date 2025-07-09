import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import axios from "axios";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import EditQuotePage from "./pages/EditQuotePage";
import RequestQuotePage from "./pages/RequestQuotePage";
import QuoteDetailPage from "./pages/QuoteDetailPage";
import RequestAccountPage from "./pages/RequestAccountPage";
import CreateQuotePage from "./pages/CreateQuotePage";
import PendingSignatures from "./pages/PendingSignatures";
import UnapprovedQuotePage from "./pages/UnapprovedQuotePage";
import SubmittedQuotesPage from "./pages/SubmittedQuotesPage";
import LoadingPage from "./pages/LoadingPage";
import AdminApprovalPage from "./pages/AdminApprovalPage";

import Navbar from "./components/Navbar";
import AdminRoute from "./components/AdminRoute";
import PrivateRoute from "./components/PrivateRoute";


import { useSignature } from "./context/SignatureContext";
import { useUnapprovedQuotes } from "./context/UnapprovedQuoteContext";


import "react-confirm-alert/src/react-confirm-alert.css";

function App() {
 
  const { refreshCount } = useSignature();
  const { refreshUnapprovedCount } = useUnapprovedQuotes();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/test-auth/", { withCredentials: true })
      .then(res => {
        setUser({
          id: res.data.id,
          username: res.data.user,
          isSuperuser: res.data.is_superuser
        });
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      refreshCount(); // from useSignature
      refreshUnapprovedCount(); // from useUnapprovedQuotes
    }
  }, [user]);

  if (loading) {
    return <LoadingPage />;  // ✅ Prevent flashing during initial load
  }

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <div className="pt-16 p-4">
        <AppRoutes user={user} loading={loading} setUser={setUser} />
      </div>
    </Router>
  );
}

function AppRoutes({ user, loading, setUser }) {
  const location = useLocation();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage user={user} setUser={setUser} loading={loading}/>} />
      <Route path="/request-account" element={<RequestAccountPage loading={loading}/>} />

      <Route
        path="/"
        element={
          <PrivateRoute user={user} loading={loading}>
            <HomePage user={user} loading={loading}/>
          </PrivateRoute>
        }
      />

      <Route
        path="/quote/:id"
        element={
          <PrivateRoute user={user} loading={loading}>
            <QuoteDetailPage user={user} loading={loading}/>
          </PrivateRoute>
        }
      />

      <Route
        path="/request-quote"
        element={
          <PrivateRoute user={user} loading={loading}>
            <RequestQuotePage user={user} loading={loading}/>
          </PrivateRoute>
        }
      />

      <Route
        path="/quotes/submitted"
        element={
          <PrivateRoute user={user} loading={loading}>
            <SubmittedQuotesPage user={user} loading={loading}/>
          </PrivateRoute>
        }
      />

      <Route
        path="/signatures/pending"
        element={
          <PrivateRoute user={user} loading={loading}>
            <PendingSignatures user={user} loading={loading}/>
          </PrivateRoute>
        }
      />

      <Route
        path="/create-quote"
        element={
          <AdminRoute user={user} loading={loading}>
            <CreateQuotePage user={user} loading={loading}/>
          </AdminRoute>
        }
      />

      <Route
        path="/quote/:id/edit"
        element={
          <AdminRoute user={user} loading={loading}>
            <EditQuotePage user={user} loading={loading}/>
          </AdminRoute>
        }
      />

      <Route
        path="/unapproved-quotes"
        element={
          <AdminRoute user={user} loading={loading}>
            <UnapprovedQuotePage user={user} loading={loading}/>
          </AdminRoute>
        }
      />

      <Route
        path="/account-requests"
        element={
          <AdminRoute user={user} loading={loading}>
            <AdminApprovalPage />
          </AdminRoute>
        }
      />
    </Routes>
  );
}

export default App;
