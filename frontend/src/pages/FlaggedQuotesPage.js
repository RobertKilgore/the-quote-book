import QuoteListPage from "../components/QuoteListPage";

export default function FlaggedQuotesPage({ user }) {
  return (
    <QuoteListPage
      user={user}
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
