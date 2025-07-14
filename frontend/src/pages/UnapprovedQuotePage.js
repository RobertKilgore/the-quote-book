import QuoteListPage from "../components/QuoteList";

export default function UnapprovedQuotesPage() {
  return (
    <QuoteListPage
      fetchUrl="/api/quotes/unapproved/"
      scrollKey="unapproved"
      title="Unapproved Quotes"
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
