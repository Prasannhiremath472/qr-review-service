import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

const HOME_BY_ROLE = {
  ADMIN: { to: "/admin", label: "Admin" },
  SALESMAN: { to: "/salesman", label: "Home" },
  OWNER: { to: "/my-shops", label: "My Shops" },
};

export default function TopNav({ title, subtitle }) {
  const { user, logout } = useAuth();
  const home = user?.role ? HOME_BY_ROLE[user.role] : null;

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-zinc-200 no-print">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-zinc-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-zinc-500 truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {home && (
            <Link
              to={home.to}
              className="btn-ghost hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-violet-700 px-3 py-2 rounded-lg hover:bg-violet-50"
            >
              {home.label}
            </Link>
          )}
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm font-medium text-zinc-700 truncate max-w-[160px]">{user?.email}</span>
            <span className="text-[11px] text-zinc-400 capitalize">{user?.role?.toLowerCase()}</span>
          </div>
          <button
            onClick={logout}
            className="btn-ghost text-sm font-medium text-zinc-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50"
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}
