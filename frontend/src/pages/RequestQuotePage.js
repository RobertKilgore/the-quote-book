import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAppContext from "../context/useAppContext";
import QuoteFormBox from "../components/QuoteFormBox";
import LoadingPage from "../pages/LoadingPage";

export default function RequestQuotePage() {
  const navigate = useNavigate();
  const { user, setUser, setError, setSuccess} = useAppContext();

  const handleSuccess = (message, quoteId) => {
    setSuccess(message);
    setTimeout(() => navigate(`/quote/${quoteId}`), 1500);
  };

  const handleError = (message) => {
    setError(message);
  };

  return (
      <QuoteFormBox
        title="Request a New Quote"
        submitText="Submit Quote Request"
        isEdit={false}
        showUserSelect={false}
        showVisibilityOptions={true}
        defaultVisibility={false}
        defaultApproved={false}
        defaultRedacted={false}
        onSuccess={handleSuccess}
        onError={handleError}
      />
  );
}
