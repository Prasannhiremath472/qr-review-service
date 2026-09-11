import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import ReviewPage from "./pages/ReviewPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AdminOverviewPage from "./pages/AdminOverviewPage.jsx";
import AdminAccountsPage from "./pages/AdminAccountsPage.jsx";
import AdminQrCodesPage from "./pages/AdminQrCodesPage.jsx";
import SalesmanOverviewPage from "./pages/SalesmanOverviewPage.jsx";
import SalesmanQrCodesPage from "./pages/SalesmanQrCodesPage.jsx";
import SalesmanAccountsPage from "./pages/SalesmanAccountsPage.jsx";
import OwnerDashboardPage from "./pages/OwnerDashboardPage.jsx";
import OwnerShopsPage from "./pages/OwnerShopsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/r/:qrId" element={<ReviewPage />} />
          <Route
            path="/dashboard/:shopId"
            element={
              <ProtectedRoute roles={["ADMIN", "SALESMAN", "OWNER"]} allowReturnTo={false}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/accounts"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminAccountsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/qr-codes"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminQrCodesPage />
              </ProtectedRoute>
            }
          />

          {/* Salesman */}
          <Route
            path="/salesman"
            element={
              <ProtectedRoute roles={["SALESMAN"]}>
                <SalesmanOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/salesman/qr-codes"
            element={
              <ProtectedRoute roles={["SALESMAN"]}>
                <SalesmanQrCodesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/salesman/accounts"
            element={
              <ProtectedRoute roles={["SALESMAN"]}>
                <SalesmanAccountsPage />
              </ProtectedRoute>
            }
          />

          {/* Owner */}
          <Route
            path="/my-shops"
            element={
              <ProtectedRoute roles={["OWNER"]}>
                <OwnerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-shops/all"
            element={
              <ProtectedRoute roles={["OWNER"]}>
                <OwnerShopsPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
