import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useAppContext from "../context/useAppContext";
import QuoteFormBox from "../components/QuoteFormBox";
import LoadingPage from "../pages/LoadingPage";

function EditQuotePage({loading}) {
  const { user, setUser, setError, setSuccess } = useAppContext();
  const { id } = useParams();
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
        title="Edit Quote"
        submitText="Save Changes"
        isEdit={true}
        quoteId={id}
        showUserSelect={true}
        showVisibilityOptions={true}
        defaultVisibility={false}
        defaultApproved={false}
        defaultRedacted={false}
        onSuccess={handleSuccess}
        onError={handleError}
      />
  );
}

export default EditQuotePage;
