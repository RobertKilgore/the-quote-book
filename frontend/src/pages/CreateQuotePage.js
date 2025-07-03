import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { FiX } from "react-icons/fi";

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function CreateQuotePage() {
  const navigate = useNavigate();
  const [lines, setLines] = useState([{ userId: "", speaker_name: "", text: "" }]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [visible, setVisible] = useState(true);
  const [redacted, setRedacted] = useState(false);
  const [approved, setApproved] = useState(true); 
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get("/api/users/", { withCredentials: true })
      .then(res => setUsers(res.data))
      .catch(err => console.error("Failed to load users", err));
  }, []);

  const handleAddLine = () => {
    setLines([...lines, { userId: "", speaker_name: "", text: "" }]);
  };

  const handleRemoveLine = (index) => {
    const updated = [...lines];
    updated.splice(index, 1);
    setLines(updated);
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;
    setLines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    console.log(lines);
    const processedLines = lines.map(line => ({
      speaker_name: line.speaker_name,
      text: line.text,
      user_id: line.userId || null  // ✅ Include user_id explicitly
    }));
    console.log(processedLines);
    const participantIds = lines.map(line => line.userId).filter(Boolean);

    try {
      await api.post("/api/quotes/", {
        date: date || null,
        time: time || null,
        visible,
        redacted,
        approved, // default false
        lines: processedLines,
        participants: participantIds
      }, {
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") }
      });

      setSuccess(true);
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      console.error(err);
      setError("Failed to create quote. Please ensure required fields are filled.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Create a New Quote</h2>

      {error && <div className="text-red-600 mb-4">{error}</div>}
      {success && <div className="text-green-600 mb-4">Quote created! Redirecting...</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {lines.map((line, idx) => (
            <div key={idx} className="p-4 border border-gray-300 rounded-md bg-gray-50 space-y-2">
                          <div className="flex flex-wrap items-end gap-4">
                            <div className="flex-1 min-w-[150px] max-w-[180px]">
                              <label className="block font-medium">User</label>
                              <select
                                className="w-full border rounded px-2 py-1"
                                value={line.userId}
                                onChange={(e) => handleLineChange(idx, "userId", e.target.value)}
                              >
                                <option value="">None</option>
                                {users.map(user => (
                                  <option key={user.id} value={user.id}>{user.username}</option>
                                ))}
                              </select>
                            </div>
            
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
          className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
        >
          ➕ Add Line
        </button>

        <div className="flex flex-wrap gap-4">
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
        
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Submit Quote
        </button>
      </form>
    </div>
  );
}

export default CreateQuotePage;
