import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiX, FiPlus } from "react-icons/fi";
import api from "../api/axios";
import getCookie from "../utils/getCookie";
import { useSignature } from "../context/SignatureContext";
import { useUnapprovedQuotes } from "../context/UnapprovedQuoteContext";

export default function QuoteFormBox({
  title = "New Quote",
  submitText = "Submit",
  isEdit = false,
  quoteId = null,
  showUserSelect = true,
  showVisibilityOptions = true,
  defaultVisibility = false,
  defaultApproved = false,
  defaultRedacted = false,
  onSuccess = () => {},
  onError = () => {},
}) {
  const navigate = useNavigate();
  const [lines, setLines] = useState([{ userId: "", speaker_name: "", text: "" }]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [visible, setVisible] = useState(defaultVisibility);
  const [redacted, setRedacted] = useState(defaultRedacted);
  const [approved, setApproved] = useState(defaultApproved);
  const [users, setUsers] = useState([]);
  const { refreshCount } = useSignature();
  const { refreshUnapprovedCount } = useUnapprovedQuotes();

  useEffect(() => {
    api.get("/api/users/", { withCredentials: true })
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Failed to load users", err));
  }, []);

  useEffect(() => {
    if (isEdit && quoteId) {
      api.get(`/api/quotes/${quoteId}/`, { withCredentials: true })
        .then((res) => {
          const quote = res.data;
          setDate(quote.date || "");
          setTime(quote.time || "");
          setVisible(quote.visible);
          setRedacted(quote.redacted);
          setApproved(quote.approved);
          setLines(quote.lines.map(line => ({
            speaker_name: line.speaker_name,
            text: line.text,
            userId: line.user_id || ""
          })));
        })
        .catch((err) => onError("Failed to load quote."));
    }
  }, [isEdit, quoteId]);

  const handleLineChange = (idx, field, value) => {
    setLines(prevLines => {
      const updated = [...prevLines];
      updated[idx] = { ...updated[idx], [field]: value };

      // Autofill speaker_name if user is selected and name is still blank
      if (
        field === "userId" &&
        !updated[idx].speaker_name &&     // name field is empty
        value                             // a user is selected
      ) {
        const selectedUser = users.find(u => u.id.toString() === value.toString());
        if (selectedUser) {
          updated[idx].speaker_name = selectedUser.username;
        }
      }

      return updated;
    });
  };

  const handleAddLine = () => {
    setLines([...lines, { userId: "", speaker_name: "", text: "" }]);
  };

  const handleRemoveLine = (idx) => {
    const updated = [...lines];
    updated.splice(idx, 1);
    setLines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onError(null);

    const processedLines = lines.map((line) => ({
      speaker_name: line.speaker_name,
      text: line.text,
      user_id: line.userId || null
    }));

    const participantIds = lines.map((line) => line.userId).filter(Boolean);

    const payload = {
      date: date || null,
      time: time || null,
      visible,
      redacted,
      approved,
      lines: processedLines,
      participants: participantIds,
    };

    try {
      const response = isEdit
        ? await api.put(`/api/quotes/${quoteId}/`, payload, {
            withCredentials: true,
            headers: { "X-CSRFToken": getCookie("csrftoken") },
          })
        : await api.post("/api/quotes/", payload, {
            withCredentials: true,
            headers: { "X-CSRFToken": getCookie("csrftoken") },
          });
      refreshUnapprovedCount();
      refreshCount();
      onSuccess(
        isEdit ? "Quote updated successfully!" : "Quote created!",
        response.data.id
      );
    } catch (err) {
      console.error(err);
      onError("Failed to submit quote. Please check the form and try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">{title}</h2>
      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
        <div className="space-y-4">
          {lines.map((line, idx) => (
            <div key={idx} className="p-4 border border-gray-300 rounded-md bg-gray-50 space-y-2">
              <div className="flex flex-wrap items-end gap-4">
                {showUserSelect && (
                  <div className="flex-1 min-w-[150px] max-w-[180px]">
                    <label className="block font-medium">User</label>
                    <select
                      className="w-full border rounded px-2 py-1"
                      value={line.userId}
                      onChange={(e) => handleLineChange(idx, "userId", e.target.value)}
                    >
                      <option value="">None</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>{user.username}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex-1 min-w-[150px] max-w-[180px]">
                  <label className="block font-medium">Speaker Name</label>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-1"
                    value={line.speaker_name}
                    onChange={(e) => handleLineChange(idx, "speaker_name", e.target.value)}
                    required
                  />
                </div>

                <div className="flex-[2] min-w-[250px]">
                  <label className="block font-medium">Quote</label>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-1"
                    value={line.text}
                    onChange={(e) => handleLineChange(idx, "text", e.target.value)}
                    required
                  />
                </div>

                <div className="items-start">
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    className="text-red-600 text-xl hover:text-red-800 transition"
                    title="Remove Line"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddLine}
          className="flex items-center gap-2 text-gray-700 bg-gray-100 px-4 py-2 rounded hover:bg-gray-200 transition"
        >
          <FiPlus className="text-xl" />
          <span className="font-medium">Add Line</span>
        </button>

        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block font-medium">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block font-medium">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          {showVisibilityOptions && (
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => setVisible(e.target.checked)}
                  id="visible-checkbox"
                  className="h-4 w-4"
                />
                <label htmlFor="visible-checkbox" className="text-sm">Public</label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={approved}
                  onChange={(e) => setApproved(e.target.checked)}
                  id="approved-checkbox"
                  className="h-4 w-4"
                />
                <label htmlFor="approved-checkbox" className="text-sm">Approved</label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={redacted}
                  onChange={(e) => setRedacted(e.target.checked)}
                  id="redacted-checkbox"
                  className="h-4 w-4"
                />
                <label htmlFor="redacted-checkbox" className="text-sm">Redacted</label>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          {submitText}
        </button>
      </form>
    </div>
  );
}
