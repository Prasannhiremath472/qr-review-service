import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getShopById, updateShop } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import AppLayout from "../components/AppLayout.jsx";
import ClientForm from "../components/ClientForm.jsx";

const BACK_PATH_BY_ROLE = {
  ADMIN: "/admin/clients",
  SALESMAN: "/salesman/clients",
};

// EditClientPage lets an admin or salesman edit every business detail for an
// existing client (same fields collected on "Add Client"), pre-filled from
// the shop's current profile.
export default function EditClientPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const backPath = BACK_PATH_BY_ROLE[user?.role] || "/login";

  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const { data } = await getShopById(shopId);
        if (cancelled) return;
        if (data.success) {
          setShop(data.data);
        } else {
          setError(data.message || "Failed to load client");
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load client");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [shopId]);

  return (
    <AppLayout title="Edit Client" subtitle={shop?.name || "Edit business details"}>
      <div className="max-w-2xl space-y-4">
        <button
          onClick={() => navigate(backPath)}
          className="btn-ghost inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-violet-700 -ml-1 px-2 py-1.5 rounded-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Clients
        </button>

        {loading ? (
          <div className="app-card p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-block h-12 shimmer" />
            ))}
          </div>
        ) : error ? (
          <div className="app-card p-6 text-sm text-red-600">{error}</div>
        ) : (
          <ClientForm
            key={shop.id}
            initialValues={shop}
            submitLabel="Save Changes"
            onSubmit={async (payload) => {
              const { data } = await updateShop(shopId, payload);
              if (data.success) {
                navigate(backPath);
              }
              return data;
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
