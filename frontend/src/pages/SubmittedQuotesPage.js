import QuoteListPage from "../components/QuoteList";

export default function SubmittedQuotesPage() {
  return (
    <QuoteListPage
      fetchUrl="/api/quotes/submitted/"
      scrollKey="submitted"
      title="Unapproved Quotes"
      emptyTitle="Nothing to review!"
      emptyMessage="No unapproved quotes — looks like everyone’s on the same page!"
      quoteChipProps={{
        showVisibilityIcon: false,
        showSignButtons: false,
      }}
      enableLocalRemove={false}
    />
  );
}
