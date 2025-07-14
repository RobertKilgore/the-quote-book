import { useError } from "../context/ErrorContext";

export default function ErrorBanner() {
  const { error } = useError();

  if (!error) return null;

  return (
    <div className="fixed top-[64px] left-0 w-full bg-red-100 text-red-700 px-4 py-2 text-sm text-center shadow z-40">
      {error}
    </div>
  );
}