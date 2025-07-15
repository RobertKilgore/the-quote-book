import React from "react";
import { useNavigate } from "react-router-dom";
import { FaTrash, FaEdit, FaFlag } from "react-icons/fa";
import useAppContext from "../context/useAppContext";
import useRefreshAllQuoteContexts from "../utils/refreshAllQuoteContexts";
import api from "../api/axios";
import getCookie from "../utils/getCookie";
import { confirmAlert } from "react-confirm-alert";

export default function QuoteActions({ quote, setQuote }) {
  const navigate = useNavigate();
  const { user, setError, setSuccess } = useAppContext();
  const refreshAll = useRefreshAllQuoteContexts();

  const refreshQuote = async () => {
    const res = await api.get(`/api/quotes/${quote.id}/`, { withCredentials: true });
    setQuote(res.data);
    refreshAll();
    return res.data;
  };

  const handleDelete = () => {
    confirmAlert({
      title: "Confirm Delete",
      message: "Are you sure you want to delete this quote?",
      buttons: [
        {
          label: "Cancel",
          onClick: () => {},
          className: "cancel-button",
        },
        {
          label: "Yes, Delete it",
          onClick: async () => {
            try {
              await api.delete(`/api/quotes/${quote.id}/`, {
                withCredentials: true,
                headers: { "X-CSRFToken": getCookie("csrftoken") },
              });
              refreshAll();
              setSuccess(`Success: Quote ${quote.id} Deleted`);
              navigate("/home");
            } catch {
              setError("Failed to delete quote.");
            }
          },
          className: "delete-button",
        },
      ],
      closeOnEscape: true,
      closeOnClickOutside: true,
    });
  };

  const handleFlagQuote = async () => {
    confirmAlert({
      title: "Flag For Review",
      message: "Are you sure you want to flag this quote for review?",
      buttons: [
        {
          label: "Cancel",
          onClick: () => {},
          className: "cancel-button",
        },
        {
          label: "Yes, Flag it",
          onClick: async () => {
            try {
              await api.post(`/quotes/${quote.id}/flag/`, {}, {
                withCredentials: true,
                headers: { "X-CSRFToken": getCookie("csrftoken") },
              });
              refreshQuote();
            } catch {
              setError("Failed to flag quote.");
            }
          },
          className: "delete-button",
        },
      ],
      closeOnEscape: true,
      closeOnClickOutside: true,
    });
  };

  return (
    <div className="flex flex-wrap gap-3 justify-center">
{user?.isSuperuser && (
  <>
    <button
      onClick={() => navigate(`/quote/${quote.id}/edit`)}
      className="bg-blue-600 text-white px-3 py-2 min-w-[44px] rounded-full hover:bg-blue-700 transition shadow-md flex justify-center items-center"
      title="Edit Quote"
    >
      <FaEdit size={16} />
    </button>

    <button
      onClick={handleDelete}
      className="bg-red-600 text-white px-3 py-2 min-w-[44px] rounded-full hover:bg-red-700 transition shadow-md flex justify-center items-center"
      title="Delete Quote"
    >
      <FaTrash size={16} />
    </button>
  </>
)}

      {quote.visible && (
        <button
          onClick={handleFlagQuote}
          disabled={quote.has_flagged}
          className={`px-4 py-2 px-3 py-2 min-w-[44px] rounded-full shadow-md text-sm font-medium transition ${
            quote.has_flagged
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-yellow-500 text-white hover:bg-yellow-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <FaFlag />

          </div>
        </button>
      )}
    </div>
  );
}
