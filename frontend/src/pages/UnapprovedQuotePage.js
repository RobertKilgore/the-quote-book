import QuoteListPage from "../components/QuoteList";
import useAppContext from "../context/useAppContext";

export default function UnapprovedQuotesPage() {
  const { user } = useAppContext();
  const title = user?.isSuperuser ? "Unapproved Quotes" : "My Submitted Unapproved Quotes";

  return (
    <QuoteListPage
      fetchUrl="/api/quotes/unapproved/"
      scrollKey="unapproved"
      title={title}
      emptyTitle="Nothing to review!"
      emptyMessage="No unapproved quotes — looks like everyone’s on the same page!"
      quoteChipProps={{
        showVisibilityIcon: false,
        showDeleteButton: true,
        showRarity: false,
        showSignButtons: false,
      }}
    />
  );
}
