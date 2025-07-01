import React, { useEffect, useState } from "react";
import axios from "axios";

function HomePage() {
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/quotes/", { withCredentials: true })
      .then(res => setQuotes(res.data))
      .catch(err => console.error("Failed to fetch quotes", err));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Quotes</h1>
      <div className="space-y-4">
        {quotes.map((quote) => (
          <div key={quote.id} className="p-4 border rounded shadow hover:shadow-md transition">
            <p className="italic">"{quote.quote}"</p>
            <p className="text-sm text-gray-600 mt-2">— {quote.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HomePage;
