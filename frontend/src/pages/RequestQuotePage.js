import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorBanner from "../components/ErrorBanner";
import SuccessBanner from "../components/SuccessBanner";
import QuoteFormBox from "../components/QuoteFormBox";

export default function RequestQuotePage() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSuccess = (message, quoteId) => {
    setSuccess(message);
    setTimeout(() => navigate(`/quote/${quoteId}`), 1500);
  };

  const handleError = (message) => {
    setError(message);
  };

  return (
    <>
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
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
    </>
  );
}
