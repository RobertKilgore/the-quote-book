import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import EditQuotePage from "./pages/EditQuotePage";
import RequestQuotePage from "./pages/RequestQuotePage";
import QuoteDetailPage from "./pages/QuoteDetailPage";
import RequestAccountPage from "./pages/RequestAccountPage";
import CreateQuotePage from "./pages/CreateQuotePage";
import Navbar from "./components/Navbar";
import AdminRoute from "./components/AdminRoute";
import PrivateRoute from "./components/PrivateRoute";
import PendingSignatures from "./pages/PendingSignatures";
import UnapprovedQuotePage from "./pages/UnapprovedQuotePage";
import axios from "axios";
import 'react-confirm-alert/src/react-confirm-alert.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingSignatureCount, setPendingSignatureCount] = useState(0);
  const [unapprovedCount, setUnapprovedCount] = useState(0);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/test-auth/', { withCredentials: true })
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

  return (
    <Router>
      <Navbar user={user} setUser={setUser} pendingSignatureCount={pendingSignatureCount} unapprovedCount={unapprovedCount} />
      <div className="pt-16 p-4">
        <AppRoutes
          user={user}
          loading={loading}
          setUser={setUser}
          setPendingSignatureCount={setPendingSignatureCount}
          setUnapprovedCount={setUnapprovedCount}
        />
      </div>
    </Router>
  );
}

// ✅ This is the child component where useLocation is allowed
function AppRoutes({ user, loading, setUser, setPendingSignatureCount, setUnapprovedCount }) {
  const location = useLocation();

  useEffect(() => {
    if (user) {
      axios.get('http://127.0.0.1:8000/api/signatures/pending/count/', { withCredentials: true })
        .then(res => setPendingSignatureCount(res.data.count || 0))
        .catch(() => setPendingSignatureCount(0));
      if (user.isSuperuser) {
        axios.get('http://127.0.0.1:8000/api/quotes/unapproved/count/', { withCredentials: true })
          .then(res => setUnapprovedCount(res.data.count || 0))
          .catch(() => setUnapprovedCount(0));
    }
    }
  }, [user, location.pathname]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage user={user} setUser={setUser} />} />
      <Route path="/request-account" element={<RequestAccountPage />} />
      
      
      <Route
        path="/signatures/pending"
        element={
          <PrivateRoute user={user} loading={loading}>
            <PendingSignatures user={user} setPendingSignatureCount={setPendingSignatureCount}/>
          </PrivateRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute user={user} loading={loading}>
            <HomePage user={user} />
          </PrivateRoute>
        }
      />
      <Route
        path="/quote/:id"
        element={
          <PrivateRoute user={user} loading={loading}>
            <QuoteDetailPage user={user} />
          </PrivateRoute>
        }
      />

      <Route
        path="/request-quote"
        element={
          <PrivateRoute user={user} loading={loading}>
            <RequestQuotePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/create-quote"
        element={
          <AdminRoute user={user} loading={loading}>
            <CreateQuotePage user={user} />
          </AdminRoute>
        }
      />

      <Route
        path="/quote/:id/edit"
        element={
          <AdminRoute user={user} loading={loading}>
            <EditQuotePage user={user} />
          </AdminRoute>
        }
      />

      <Route
        path="/unapproved-quotes"
        element={
          <AdminRoute user={user} loading={loading}>
            <UnapprovedQuotePage  user={user} />
          </AdminRoute>
        }
      />
    </Routes>
  );
}

export default App;
