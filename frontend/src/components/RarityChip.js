const rarityStyles = {
  common: "bg-gray-100 text-gray-800 border border-gray-300",
  uncommon: "bg-green-100 text-green-800 border border-green-300",
  rare: "bg-blue-100 text-blue-800 border border-blue-300",
  epic: "bg-purple-100 text-purple-800 border border-purple-300",
  legendary: "bg-yellow-100 text-yellow-800 border border-yellow-300",
};

export default function RarityChip({ rarity, size = "responsive" }) {
  if (!rarity) return null;

  const rarityStyle = rarityStyles[rarity.toLowerCase()] || rarityStyles.common;

  const sizeClasses =
    size === "large"
      ? "text-lg px-4 py-1.5"
      : size === "small"
      ? "text-xs px-2 py-0.5"
      : // ✅ Responsive: small by default, large on bigger screens
        "text-xs px-2 py-0.5 sm:text-lg sm:px-4 sm:py-1.5";

  return (
    <div
      className={`inline-block font-semibold rounded-full ${rarityStyle} ${sizeClasses}`}
    >
      {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
    </div>
  );
}
