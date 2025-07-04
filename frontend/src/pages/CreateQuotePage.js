import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorBanner from "../components/ErrorBanner";
import SuccessBanner from "../components/SuccessBanner";
import QuoteFormBox from "../components/QuoteFormBox";
import LoadingPage from "../pages/LoadingPage";


function CreateQuotePage({user, loading}) {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSuccess = (message, quoteId) => {
    setSuccess(message);
    setTimeout(() => {
      navigate(`/quote/${quoteId}`);
    }, 1500);
  };
  
  if (loading) return <LoadingPage />;
  return (
    <>
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      
      <QuoteFormBox
        title="Create a New Quote"
        submitText="Submit Quote"
        defaultVisibility={true}
        defaultApproved={true}
        defaultRedacted={false}
        showUserSelect={true}
        showVisibilityOptions={true}
        onSuccess={(msg, id) => {
          setSuccess(msg);
          setTimeout(() => navigate(`/quote/${id}`), 1500);
        }}
        onError={setError}
      />
    </>
  );
}

export default CreateQuotePage;
