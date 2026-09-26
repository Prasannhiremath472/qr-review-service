import { createContext, useContext, useEffect, useState } from "react";
import { getToken, setToken, clearToken, getMe } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // Retry a couple of times on network failure — a dev-server restart
      // or brief backend blip shouldn't bounce a valid session to the
      // login page; only a genuine 401 should.
      const MAX_ATTEMPTS = 3;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const { ok, status, data } = await getMe();
          if (ok && data.success) {
            setUser(data.data);
            break;
          }
          if (status === 401) {
            clearToken();
            break;
          }
          // Non-401 failure (5xx, malformed response) — fall through to retry.
        } catch (err) {
          // Network error (backend unreachable) — fall through to retry.
        }
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  function loginWithToken(token, userProfile) {
    setToken(token);
    setUser(userProfile);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
