import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ErrorBanner from "../components/ErrorBanner";
import SuccessBanner from "../components/SuccessBanner";
import QuoteFormBox from "../components/QuoteFormBox";

function EditQuotePage() {
  const { id } = useParams();
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
    </>
  );
}

export default EditQuotePage;
