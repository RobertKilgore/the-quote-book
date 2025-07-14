import QuoteListPage from "../components/QuoteList";

export default function FlaggedQuotesPage() {
  return (
    <QuoteListPage
      fetchUrl="/quotes/flagged/"
      scrollKey="flagged"
      title="Flagged Quotes"
      emptyTitle="No flags at the moment!"
      emptyMessage="There are no flagged quotes currently."
      quoteChipProps={{
        showVisibilityIcon: false,
        showDeleteButton: false,
        showRarity: false,
        showSignButtons: false,
      }}
    />
  );
}
