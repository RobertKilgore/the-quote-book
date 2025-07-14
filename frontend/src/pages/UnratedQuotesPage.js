import QuoteListPage from "../components/QuoteList";

export default function UnratedQuotesPage() {
  return (
    <QuoteListPage
      fetchUrl="/quotes/unrated/"
      scrollKey="unrated"
      title="Unrated Quotes"
      emptyTitle="You're all caught up!"
      emptyMessage="No unrated quotes left — thanks for participating!"
      quoteChipProps={{
        showVisibilityIcon: false,
        showDeleteButton: false,
        showRarity: true,
        showSignButtons: false,
      }}
    />
  );
}