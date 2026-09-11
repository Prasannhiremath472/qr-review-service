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
      const { ok, data } = await getMe();
      if (ok && data.success) {
        setUser(data.data);
      } else {
        clearToken();
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
