import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function ProtectedRoute({ roles, allowReturnTo = true, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="app-bg min-h-screen" />;
  }

  if (!user) {
    const state = allowReturnTo ? { from: location, allowedRoles: roles } : undefined;
    return <Navigate to="/login" state={state} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="app-bg min-h-screen flex items-center justify-center p-4">
        <div className="app-card fade-in max-w-sm w-full text-center px-8 py-10">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-zinc-900 mb-1.5">Access Denied</h1>
          <p className="text-sm text-zinc-500">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return children;
}
