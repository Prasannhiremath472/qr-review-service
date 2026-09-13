import { useOwnerShop } from "../auth/OwnerShopContext.jsx";
import AppLayout from "./AppLayout.jsx";

// OwnerShopGate renders the shared loading/error/empty states for every
// owner-side page, and calls `children(selectedShop)` once a shop is ready.
export default function OwnerShopGate({ title, subtitle, children }) {
  const { shops, selectedShop, loading, error } = useOwnerShop();

  if (loading) {
    return (
      <AppLayout title={title} subtitle={subtitle}>
        <div className="skeleton-block h-64 shimmer" />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title={title} subtitle={subtitle}>
        <div className="app-card fade-in max-w-sm mx-auto text-center px-8 py-10">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-sm text-zinc-500">{error}</p>
        </div>
      </AppLayout>
    );
  }

  if (!shops || shops.length === 0) {
    return (
      <AppLayout title={title} subtitle={subtitle}>
        <div className="app-card p-12 sm:p-16 text-center fade-in">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          <p className="text-zinc-500">No shops linked to your account yet.</p>
          <p className="text-zinc-400 text-sm mt-1">Ask your salesman or admin to link a QR code to your business.</p>
        </div>
      </AppLayout>
    );
  }

  return children(selectedShop);
}
