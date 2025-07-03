export default function ErrorBanner({ message }) {
  if (!message) return null;

  return (
    <div className="fixed top-[69px] left-0 w-full bg-red-100 text-red-700 px-4 py-2 text-sm text-center shadow z-40">
      {message}
    </div>
  );
}