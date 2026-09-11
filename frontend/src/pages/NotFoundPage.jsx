import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-4">
      <div className="app-card fade-in max-w-sm w-full text-center px-8 py-10">
        <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto mb-5 text-2xl font-bold">
          ?
        </div>
        <h1 className="text-lg font-semibold text-zinc-900 mb-1.5">Page not found</h1>
        <p className="text-sm text-zinc-500 mb-6">
          The page you're looking for doesn't exist or the link may be incorrect.
        </p>
        <Link
          to="/login"
          className="btn-gradient inline-flex items-center justify-center text-white py-3 px-6 rounded-xl font-semibold text-sm"
        >
          Go to Sign In
        </Link>
      </div>
    </div>
  );
}
