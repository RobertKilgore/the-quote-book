export function sortQuotes(items, sortBy, sortDirection) {
  const normalized = [...items];
  const rankOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
  const direction = sortDirection === "asc" ? 1 : -1;

  const getRankValue = (value) => {
    const normalizedValue = String(value || "common").toLowerCase();
    return rankOrder[normalizedValue] ?? 99;
  };

  normalized.sort((a, b) => {
    if (sortBy === "date") {
      const aDate = new Date(a.date || 0).getTime();
      const bDate = new Date(b.date || 0).getTime();
      if (aDate !== bDate) {
        return (aDate - bDate) * direction;
      }

      const aCreated = new Date(a.created_at || 0).getTime();
      const bCreated = new Date(b.created_at || 0).getTime();
      return (aCreated - bCreated) * direction;
    }

    if (sortBy === "created") {
      const aCreated = new Date(a.created_at || 0).getTime();
      const bCreated = new Date(b.created_at || 0).getTime();
      return (aCreated - bCreated) * direction;
    }

    if (sortBy === "rarity") {
      const aRank = getRankValue(a.rank);
      const bRank = getRankValue(b.rank);
      return (aRank - bRank) * direction;
    }

    return 0;
  });

  return normalized;
}
