import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { OwnerShopProvider } from "./auth/OwnerShopContext.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import ReviewPage from "./pages/ReviewPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AdminOverviewPage from "./pages/AdminOverviewPage.jsx";
import AdminAccountsPage from "./pages/AdminAccountsPage.jsx";
import AdminQrCodesPage from "./pages/AdminQrCodesPage.jsx";
import AdminClientsPage from "./pages/AdminClientsPage.jsx";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage.jsx";
import AdminSubscriptionPage from "./pages/AdminSubscriptionPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import SalesmanOverviewPage from "./pages/SalesmanOverviewPage.jsx";
import SalesmanQrCodesPage from "./pages/SalesmanQrCodesPage.jsx";
import SalesmanAccountsPage from "./pages/SalesmanAccountsPage.jsx";
import OwnerOverviewPage from "./pages/OwnerOverviewPage.jsx";
import OwnerBusinessPage from "./pages/OwnerBusinessPage.jsx";
import OwnerQrPage from "./pages/OwnerQrPage.jsx";
import OwnerNotificationsPage from "./pages/OwnerNotificationsPage.jsx";
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
          <Route
            path="/admin/clients"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminClientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subscription"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminSubscriptionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <SettingsPage />
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
          <Route
            path="/salesman/settings"
            element={
              <ProtectedRoute roles={["SALESMAN"]}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Owner */}
          <Route
            path="/my-shops"
            element={
              <ProtectedRoute roles={["OWNER"]}>
                <OwnerShopProvider>
                  <OwnerOverviewPage />
                </OwnerShopProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-shops/business"
            element={
              <ProtectedRoute roles={["OWNER"]}>
                <OwnerShopProvider>
                  <OwnerBusinessPage />
                </OwnerShopProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-shops/qr"
            element={
              <ProtectedRoute roles={["OWNER"]}>
                <OwnerShopProvider>
                  <OwnerQrPage />
                </OwnerShopProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-shops/notifications"
            element={
              <ProtectedRoute roles={["OWNER"]}>
                <OwnerShopProvider>
                  <OwnerNotificationsPage />
                </OwnerShopProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-shops/settings"
            element={
              <ProtectedRoute roles={["OWNER"]}>
                <OwnerShopProvider>
                  <SettingsPage />
                </OwnerShopProvider>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
