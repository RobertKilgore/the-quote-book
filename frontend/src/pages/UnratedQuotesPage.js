import QuoteListPage from "../components/QuoteListPage";

export default function UnratedQuotesPage({ user }) {
  return (
    <QuoteListPage
      user={user}
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