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
import UsersPage from "./pages/UsersPage";
import DebugJobsPage from "./pages/DebugJobsPage";
import UnratedQuotesPage from "./pages/UnratedQuotesPage";
import FlaggedQuotesPage from "./pages/FlaggedQuotesPage";

import useAppContext from "./context/useAppContext";

import Navbar from "./components/Navbar";
import AdminRoute from "./components/AdminRoute";
import PrivateRoute from "./components/PrivateRoute";

import useRefreshAllQuoteContexts from "./utils/refreshAllQuoteContexts";

import ErrorBanner from "./components/ErrorBanner";
import SuccessBanner from "./components/SuccessBanner";
import "react-confirm-alert/src/react-confirm-alert.css";


function App() {
  const refreshAll = useRefreshAllQuoteContexts();
  const { user, setUser, setError, setSuccess } = useAppContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/test-auth/", { withCredentials: true })
      .then(res => {
        setUser({
          id: res.data.id,
          name: res.data.name,
          username: res.data.username,
          email: res.data.email,
          isSuperuser: res.data.is_superuser,
        });

        refreshAll(); // from useSignature

      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      refreshAll(); // from useSignature
    }
  }, [user]);


  if (loading) return <LoadingPage />;  // ✅ Prevent flashing during initial load
  return (
    // Wrap the entire app with Router to provide routing context for useLocation
    <Router>
      <ErrorBanner /> 
      <SuccessBanner />
      <Navbar/>
      <div className="pt-16 p-4">
        <AppRoutes loading={loading} />
      </div>
    </Router>
  );
}

function AppRoutes({ user, loading, setUser }) {
  const location = useLocation(); // Can now safely use useLocation() because Router is wrapping the app

  return (
    <Routes>
      <Route path="/login" element={<LoginPage loading={loading}/>} />
      <Route path="/request-account" element={<RequestAccountPage loading={loading}/>} />

      <Route
        path="/home"
        element={
          <PrivateRoute loading={loading}>
            <HomePage loading={loading}/>
          </PrivateRoute>
        }
      />

      <Route
        path="/quote/:id"
        element={
          <PrivateRoute loading={loading}>
            <QuoteDetailPage loading={loading}/>
          </PrivateRoute>
        }
      />

      <Route
        path="/request-quote"
        element={
          <PrivateRoute loading={loading}>
            <RequestQuotePage loading={loading}/>
          </PrivateRoute>
        }
      />

      <Route
        path="/quotes/submitted"
        element={
          <PrivateRoute loading={loading}>
            <SubmittedQuotesPage loading={loading}/>
          </PrivateRoute>
        }
      />

      <Route
        path="/signatures/pending"
        element={
          <PrivateRoute loading={loading}>
            <PendingSignatures loading={loading}/>
          </PrivateRoute>
        }
      />

      <Route
        path="/create-quote"
        element={
          <AdminRoute loading={loading}>
            <CreateQuotePage loading={loading}/>
          </AdminRoute>
        }
      />

      <Route
        path="/quote/:id/edit"
        element={
          <AdminRoute loading={loading}>
            <EditQuotePage loading={loading}/>
          </AdminRoute>
        }
      />

      <Route
        path="/unapproved-quotes"
        element={
          <AdminRoute loading={loading}>
            <UnapprovedQuotePage loading={loading}/>
          </AdminRoute>
        }
      />

      <Route
        path="/Users"
        element={
          <AdminRoute loading={loading}>
            <UsersPage/>
          </AdminRoute>
        }
      />

      <Route 
        path="/quotes/unrated" 
        element={
          <PrivateRoute loading={loading}>
            <UnratedQuotesPage/>
          </PrivateRoute>
        } 
      />

      <Route 
        path="/quotes/flagged" 
        element={
          <AdminRoute loading={loading}>
            <FlaggedQuotesPage/>
          </AdminRoute>
        } 
      />

      {/* <Route
        path="/debug-jobs"
        element={
          <AdminRoute loading={loading}>
            <DebugJobsPage/>
          </AdminRoute>
        }
      /> */}
    </Routes>
  );
}

export default App;
