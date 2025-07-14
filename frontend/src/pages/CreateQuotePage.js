import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import QuoteFormBox from "../components/QuoteFormBox";
import LoadingPage from "../pages/LoadingPage";
import useAppContext from "../context/useAppContext";


function CreateQuotePage() {
  const { user, setUser, setError, setSuccess} = useAppContext();
  const navigate = useNavigate();

  const handleSuccess = (message, quoteId) => {
    setSuccess(message);
    setTimeout(() => navigate(`/quote/${quoteId}`), 1500);
  };

  const handleError = (message) => {
    setError(message);
  };

  return ( 
      <QuoteFormBox
        title="Create a New Quote"
        submitText="Submit Quote"
        defaultVisibility={true}
        defaultApproved={true}
        defaultRedacted={false}
        showUserSelect={true}
        showVisibilityOptions={true}
        onSuccess={handleSuccess}
        onError={handleError}
      />
  );
}

export default CreateQuotePage;
