import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios";
import QuoteChip from "./QuoteChip";
import EmptyState from "./EmptyState";
import useScrollRestoration from "../hooks/useScrollRestoration";
import useAppContext from "../context/useAppContext";
import { normalizePageUrl } from "../utils/pagination";
import { sortQuotes } from "../utils/sortQuotes";

export default function QuoteListPage({
  fetchUrl,
  title,
  emptyTitle,
  emptyMessage,
  scrollKey = null,
  quoteChipProps = {},
  enableLocalRemove = true,
}) {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [sortBy, setSortBy] = useState(() => {
    if (typeof window === "undefined") return "date";
    return localStorage.getItem(`${scrollKey || "quotes"}:sortBy`) || "date";
  });
  const [sortDirection, setSortDirection] = useState(() => {
    if (typeof window === "undefined") return "desc";
    return localStorage.getItem(`${scrollKey || "quotes"}:sortDirection`) || "desc";
  });
  const { setError } = useAppContext();
  const sentinelRef = useRef(null);
  const isDebugMode = typeof window !== "undefined" && window.location.search.includes("debug=1");

  const buildRequestUrl = useCallback((url) => {
    const params = new URLSearchParams();
    params.set("sort_by", sortBy);
    params.set("sort_direction", sortDirection);

    if (!url) return url;

    const [base, query = ""] = url.split("?");
    const existing = new URLSearchParams(query);

    existing.forEach((value, key) => {
      if (!params.has(key)) {
        params.set(key, value);
      }
    });

    const queryString = params.toString();
    return queryString ? `${base}?${queryString}` : base;
  }, [sortBy, sortDirection]);

  useScrollRestoration({key: scrollKey, loading});

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`${scrollKey || "quotes"}:sortBy`, sortBy);
      localStorage.setItem(`${scrollKey || "quotes"}:sortDirection`, sortDirection);
    }
  }, [scrollKey, sortBy, sortDirection]);

  const applySort = useCallback((items) => {
    return sortQuotes(items, sortBy, sortDirection);
  }, [sortBy, sortDirection]);

  useEffect(() => {
    setLoading(true);
    setLoadingMore(false);
    setQuotes([]);
    setNextPage(null);

    api.get(buildRequestUrl(fetchUrl), { withCredentials: true })
      .then(res => {
        const data = res.data;
        const items = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
        setQuotes(applySort(items));
        setNextPage(normalizePageUrl(data?.next));
        setError(null);
      })
      .catch(() => {
        setError("Failed to load quotes. Please try again later.");
        setQuotes([]);
        setNextPage(null);
      })
      .finally(() => setLoading(false));
  }, [applySort, fetchUrl, setError]);

  const handleLoadMore = useCallback(() => {
    if (!nextPage || loadingMore) return;

    setLoadingMore(true);
    api.get(buildRequestUrl(nextPage), { withCredentials: true })
      .then(res => {
        const data = res.data;
        const items = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
        setQuotes(prev => {
          const seenIds = new Set(prev.map(item => item.id));
          const newItems = items.filter(item => !seenIds.has(item.id));
          return applySort([...prev, ...newItems]);
        });
        setNextPage(normalizePageUrl(data?.next));
      })
      .catch(() => setError("Failed to load more quotes. Please try again later."))
      .finally(() => setLoadingMore(false));
  }, [applySort, loadingMore, nextPage, setError]);

  useEffect(() => {
    if (isDebugMode || !nextPage || loadingMore) return;

    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [handleLoadMore, isDebugMode, loadingMore, nextPage]);

  useEffect(() => {
    setQuotes(prev => applySort(prev));
  }, [applySort]);

  const handleSortChange = (nextSortBy) => {
    setSortBy(nextSortBy);
  };

  const handleDirectionChange = (nextDirection) => {
    setSortDirection(nextDirection);
  };

  const handleRemove = id => {
    if (!enableLocalRemove) return;
    setQuotes(prev => prev.filter(q => q.id !== id));
  };


  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            <span className="mr-2">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="rounded border border-gray-300 px-3 py-2"
            >
              <option value="date">Date</option>
              <option value="created">Creation date</option>
              <option value="rarity">Rarity</option>
            </select>
          </label>

          <div className="flex rounded border border-gray-300 overflow-hidden h-10">
            <button
              type="button"
              onClick={() => handleDirectionChange("asc")}
              aria-label="Ascending"
              className={`flex h-full items-center justify-center px-3 text-lg leading-none ${sortDirection === "asc" ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => handleDirectionChange("desc")}
              aria-label="Descending"
              className={`flex h-full items-center justify-center px-3 text-lg leading-none border-l border-gray-300 ${sortDirection === "desc" ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
            >
              ↓
            </button>
          </div>
        </div>
      </div>

      {(quotes.length === 0 && !loading) ? (
        <EmptyState title={emptyTitle} message={emptyMessage} />
      ) : (
        <>
          {quotes.map(q => (
            <QuoteChip
              key={q.id}
              quote={q}
              onError={setError}
              onRemove={() => handleRemove(q.id)}
              {...quoteChipProps}
            />
          ))}

          {nextPage && (
            <div className="flex flex-col items-center gap-2 py-2 text-sm text-gray-500">
              {isDebugMode && (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="rounded border border-blue-600 px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingMore ? "Loading more..." : "Load more (debug)"}
                </button>
              )}
              <div ref={sentinelRef} className="h-1" />
              {loadingMore ? "Loading more..." : ""}
            </div>
          )}
        </>
      )}
    </div>
  );
}
