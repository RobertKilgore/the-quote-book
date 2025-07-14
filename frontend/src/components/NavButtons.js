import { Link } from "react-router-dom";
import { FaPenFancy, FaStarHalfAlt, FaFlag } from "react-icons/fa";
import { MdOutlineGavel } from "react-icons/md";
import { FaUserShield } from "react-icons/fa6";
import { useSignature } from "../context/SignatureContext";
import { useUnapprovedQuotes } from "../context/UnapprovedQuoteContext";
import { useUnapprovedUserCount } from "../context/UnapprovedUserContext";
import { useUnratedQuotes } from "../context/UnratedQuoteContext";
import { useFlaggedQuotes } from "../context/FlaggedQuoteContext";
import useAppContext from "../context/useAppContext";

export default function NavButtons({
  layout = "row", // "row" (top) | "bar" (bottom)
}) {
  const { user, setUser, setError, setSuccess } = useAppContext();
  const { pendingCount } = useSignature();
  const { unapprovedCount } = useUnapprovedQuotes();
  const { unapprovedUserCount } = useUnapprovedUserCount();
  const { unratedCount } = useUnratedQuotes();
  const { flaggedCount } = useFlaggedQuotes();
  const isAdmin = user?.isSuperuser

  const isBar = layout === "bar";

  const wrapperClass = isBar
    ? "flex justify-between items-center w-full"
    : "flex flex-nowrap space-x-4";

  const baseButton =
    "relative inline-flex items-center justify-center rounded bg-gray-800 shadow-lg hover:bg-gray-600 transition";

  const buttonClass = isBar
    ? `${baseButton} flex-1 mx-1 h-16 text-xl`
    : `${baseButton} flex-none w-11 h-11`;

  return (
    <div className={wrapperClass}>
      {/* Pending Signatures */}
      <Link to="/signatures/pending" className={buttonClass}>
        <FaPenFancy size={isBar ? 24 : 20} title="Signatures Needed" />
        {pendingCount > 0 && (
          <span className="absolute -top-0 -right-0 bg-purple-500 text-white text-xs font-bold px-1 py-0 rounded-full">
            {pendingCount}
          </span>
        )}
      </Link>

      {/* Unapproved Quotes */}
      <Link
        to={isAdmin ? "/unapproved-quotes" : "/quotes/submitted"}
        className={buttonClass}
      >
        <MdOutlineGavel
          size={isBar ? 24 : 20}
          title={isAdmin ? "Unapproved Quotes" : "Your Unapproved Submissions"}
        />
        {isAdmin && unapprovedCount > 0 && (
          <span className="absolute -top-0 right-1 bg-purple-500 text-white text-xs font-bold px-1 py-0 rounded-full">
            {unapprovedCount}
          </span>
        )}
      </Link>

      {/* Unrated Quotes */}
      <Link to="/quotes/unrated" className={buttonClass}>
        <FaStarHalfAlt size={isBar ? 24 : 20} title="Unrated Quotes" />
        {unratedCount > 0 && (
          <span className="absolute -top-0 -right-0 bg-purple-500 text-white text-xs font-bold px-1 py-0 rounded-full">
            {unratedCount}
          </span>
        )}
      </Link>

      {/* Flagged Quotes (Admin only) */}
      {isAdmin && (
        <Link to="/quotes/flagged" className={buttonClass}>
          <FaFlag size={isBar ? 22 : 18} title="Flagged Quotes" />
          {flaggedCount > 0 && (
            <span className="absolute -top-0 -right-0 bg-purple-500 text-white text-xs font-bold px-1 py-0 rounded-full">
              {flaggedCount}
            </span>
          )}
        </Link>
      )}

      {/* Account Requests (Admin only) */}
      {isAdmin && (
        <Link to="/users" className={buttonClass}>
          <FaUserShield size={isBar ? 22 : 18} title="Pending User Requests" />
          {unapprovedUserCount > 0 && (
            <span className="absolute -top-0 -right-0 bg-purple-500 text-white text-xs font-bold px-1 py-0 rounded-full">
              {unapprovedUserCount}
            </span>
          )}
        </Link>
      )}
    </div>
  );
}
