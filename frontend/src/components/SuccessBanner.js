export default function SuccessBanner({ message }) {
  if (!message) return null;

  return (
    <div className="fixed top-[56px] left-0 w-full bg-green-100 text-green-700 px-4 py-2 text-sm text-center shadow z-40">
      {message}
    </div>
  );
}
