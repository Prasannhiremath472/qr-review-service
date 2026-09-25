import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { useOwnerShop } from "../auth/OwnerShopContext.jsx";

const ICONS = {
  dashboard: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  ),
  accounts: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  ),
  qr: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M3.75 4.5A.75.75 0 014.5 3.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5zm0 10.5a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5zm10.5-10.5a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5z" />
  ),
  shop: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
  ),
  clients: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.964 0a9 9 0 10-11.964 0m11.964 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  ),
  analytics: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  ),
  settings: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.828c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.828c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </>
  ),
  subscription: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  ),
  notifications: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  ),
};

export const NAV_CONFIG = {
  ADMIN: [
    { to: "/admin", label: "Dashboard", end: true, icon: "dashboard" },
    {
      label: "Clients",
      icon: "clients",
      match: "/admin/clients",
      children: [
        { to: "/admin/clients", label: "All Clients", end: true },
        { to: "/admin/clients?tab=add", label: "Add Client", matchQuery: "tab=add" },
      ],
    },
    {
      label: "QR Codes",
      icon: "qr",
      match: "/admin/qr-codes",
      children: [{ to: "/admin/qr-codes", label: "All QR Codes", end: true }],
    },
    { to: "/admin/analytics", label: "Analytics", icon: "analytics" },
    { to: "/admin/subscription", label: "Subscription", icon: "subscription" },
    { to: "/admin/settings", label: "Settings", icon: "settings" },
  ],
  SALESMAN: [
    { to: "/salesman", label: "Dashboard", end: true, icon: "dashboard" },
    { to: "/salesman/qr-codes", label: "QR Codes", icon: "qr" },
    { to: "/salesman/accounts", label: "Accounts", icon: "accounts" },
    { to: "/salesman/settings", label: "Settings", icon: "settings" },
  ],
  OWNER: [
    { to: "/my-shops", label: "Dashboard & Analytics", end: true, icon: "dashboard" },
    { to: "/my-shops/business", label: "My Business", icon: "shop" },
    { to: "/my-shops/qr", label: "My QR", icon: "qr" },
    { to: "/my-shops/notifications", label: "Notifications", icon: "notifications" },
    { to: "/my-shops/settings", label: "Settings", icon: "settings" },
  ],
};

export default function AppLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = NAV_CONFIG[user?.role] || [];

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-zinc-900 text-zinc-300 flex flex-col z-40 transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10 flex-shrink-0">
          {user?.role === "OWNER" && <OwnerHeaderName />}
          <img
            src="/siteidentity1.png"
            alt="ReviewGenie"
            className="w-9 h-9 rounded-xl object-cover flex-shrink-0 bg-white"
          />
          {user?.role !== "OWNER" && (
            <span className="font-bold text-white text-[15px] leading-tight">ReviewGenie</span>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) =>
            item.children ? (
              <NavGroup key={item.label} item={item} location={location} onNavigate={() => setMobileOpen(false)} />
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-violet-600 text-white"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {ICONS[item.icon]}
                </svg>
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {(user?.name || user?.email || "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || user?.email}</p>
              <p className="text-xs text-zinc-500 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn-ghost w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3" />
            </svg>
            Log Out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col lg:pl-0">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-zinc-200 no-print">
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="btn-ghost lg:hidden -ml-1 p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 flex-shrink-0"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-zinc-900 truncate">{title}</h1>
                {subtitle && <p className="text-xs text-zinc-500 truncate hidden sm:block">{subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              {user?.role === "OWNER" && <OwnerHeaderRight />}
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-sm font-medium text-zinc-700 truncate max-w-[200px]">
                  {user?.name || user?.email}
                </span>
                <span className="text-[11px] text-zinc-400 capitalize">{user?.role?.toLowerCase()}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {(user?.name || user?.email || "?")[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

function OwnerHeaderName() {
  const { selectedShop } = useOwnerShop();
  if (!selectedShop) return null;
  return (
    <span className="font-bold text-white text-[15px] leading-tight truncate max-w-[110px]">
      {selectedShop.name}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function OwnerHeaderRight() {
  const { shops, selectedShop, selectedShopId, selectShop } = useOwnerShop();

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {selectedShop && (
        <div className="hidden md:flex flex-col items-end leading-tight px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-100">
          <span className="text-[10px] font-semibold text-violet-500 uppercase tracking-wide">Subscription</span>
          <span className="text-xs font-medium text-violet-800">
            {formatDate(selectedShop.subscription_start_date)} &ndash; {formatDate(selectedShop.subscription_end_date)}
          </span>
        </div>
      )}
      {shops && shops.length > 1 && (
        <select
          value={selectedShopId}
          onChange={(e) => selectShop(e.target.value)}
          className="field-input text-sm font-medium text-zinc-700 border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-white max-w-[140px]"
          aria-label="Switch business"
        >
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function NavGroup({ item, location, onNavigate }) {
  const groupActive = location.pathname.startsWith(item.match || "");
  const [open, setOpen] = useState(groupActive);

  useEffect(() => {
    if (groupActive) setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupActive]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          groupActive ? "text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
        }`}
      >
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {ICONS[item.icon]}
        </svg>
        <span className="flex-1 text-left">{item.label}</span>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {open && (
        <div className="ml-5 mt-1 space-y-1 border-l border-white/10 pl-3">
          {item.children.map((child) => {
            const childActive = child.matchQuery
              ? location.pathname === child.to.split("?")[0] &&
                location.search.replace("?", "") === child.matchQuery
              : location.pathname === child.to && !location.search;
            return (
              <NavLink
                key={child.to}
                to={child.to}
                end={child.end}
                onClick={onNavigate}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  childActive ? "bg-violet-600 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {child.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
