export default function ErrorBox({ message }) {
  return (
    <div className="p-4 rounded-lg bg-red-100 border border-red-400 text-red-700 text-sm">
      ⚠️ {message}
    </div>
  );
} 