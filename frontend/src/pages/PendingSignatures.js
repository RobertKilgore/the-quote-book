import QuoteListPage from "../components/QuoteListPage";

export default function PendingSignaturesPage({ user }) {
  return (
    <QuoteListPage
      user={user}
      fetchUrl="/api/signatures/pending/"
      scrollKey="pending"
      title="Pending Signatures"
      emptyTitle="You're all caught up!"
      emptyMessage="No signatures needed right now."
      quoteChipProps={{
        showVisibilityIcon: true,
        showRarity: false,
        showSignButtons: true,
        fadeBackIn: false,
      }}
    />
  );
}
