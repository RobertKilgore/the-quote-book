import { FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useNavbar } from "../context/NavbarContext";
import QuoteListPage from "../components/QuoteList";
import useAppContext from "../context/useAppContext";


export default function HomePage() {
  const { user, setUser, setError, setSuccess, loading, setLoading } = useAppContext();
  const navigate = useNavigate();
  const { collapsed } = useNavbar();

  return (
    <>
      <QuoteListPage
        fetchUrl="/api/quotes/"
        scrollKey="home"
        title="Quotes"
        emptyTitle="All quiet here!"
        emptyMessage="No quotes yet, but the ink is ready!"
        quoteChipProps={{
          showVisibilityIcon: true,
          showSignButtons: true,
        }}
      />

      {user && (
        <button
          onClick={() =>
            navigate(user.isSuperuser ? "/create-quote" : "/request-quote")
          }
          className={`fixed ${
            collapsed ? "bottom-[6rem]" : "bottom-6"
          } right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center`}
          title={user.isSuperuser ? "Create Quote" : "Request Quote"}
        >
          <FiPlus className="text-3xl" />
        </button>
      )}
    </>
  );
}
