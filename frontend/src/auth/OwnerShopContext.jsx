import { createContext, useContext, useEffect, useState } from "react";
import { getMyShops } from "../api/client.js";
import { useAuth } from "./AuthContext.jsx";

const OwnerShopContext = createContext(null);

const SELECTED_SHOP_KEY = "qr_review_selected_shop";

// OwnerShopProvider loads every shop linked to the logged-in OWNER and tracks
// which one is currently selected (persisted so a refresh keeps the choice).
// All owner-side pages (header, Dashboard & Analytics, My Business, My QR,
// Notifications) read the selected shop from here instead of re-fetching.
export function OwnerShopProvider({ children }) {
  const { user } = useAuth();
  const [shops, setShops] = useState(null);
  const [selectedShopId, setSelectedShopId] = useState(() => localStorage.getItem(SELECTED_SHOP_KEY) || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "OWNER") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data } = await getMyShops();
        if (cancelled) return;
        if (data.success) {
          setShops(data.data);
          setSelectedShopId((prev) => {
            if (prev && data.data.some((s) => s.id === prev)) return prev;
            return data.data[0]?.id || "";
          });
        } else {
          setError(data.message || "Failed to load your shops");
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load your shops");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  function selectShop(shopId) {
    setSelectedShopId(shopId);
    localStorage.setItem(SELECTED_SHOP_KEY, shopId);
  }

  const selectedShop = shops?.find((s) => s.id === selectedShopId) || null;

  return (
    <OwnerShopContext.Provider value={{ shops, selectedShop, selectedShopId, selectShop, loading, error }}>
      {children}
    </OwnerShopContext.Provider>
  );
}

export function useOwnerShop() {
  const ctx = useContext(OwnerShopContext);
  if (!ctx) throw new Error("useOwnerShop must be used within OwnerShopProvider");
  return ctx;
}
