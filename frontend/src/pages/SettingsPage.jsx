import { useState } from "react";
import AppLayout from "../components/AppLayout.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { changePassword } from "../api/client.js";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <AppLayout title="Settings" subtitle="Account details and password">
      <div className="max-w-lg space-y-5">
        <div className="app-card p-5 sm:p-6 fade-in">
          <h2 className="text-base font-semibold text-zinc-900 mb-4">Account</h2>
          <div className="space-y-2.5 text-sm">
            <Row label="Name" value={user?.name || "—"} />
            <Row label="Email" value={user?.email} />
            <Row label="Role" value={user?.role} />
          </div>
        </div>

        <ChangePasswordCard />
      </div>
    </AppLayout>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-zinc-50 last:border-0">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-800">{value}</span>
    </div>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      if (data.success) {
        setSuccess("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.message || "Failed to update password");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="app-card p-5 sm:p-6 space-y-4 fade-in">
      <h2 className="text-base font-semibold text-zinc-900">Change Password</h2>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Current Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
        />
      </div>

      {error && <div className="text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{error}</div>}
      {success && <div className="text-emerald-700 text-sm bg-emerald-50 px-4 py-2.5 rounded-xl">{success}</div>}

      <button
        type="submit"
        disabled={submitting}
        className="btn-gradient text-white py-2.5 px-6 rounded-xl font-semibold text-sm inline-flex items-center gap-2"
      >
        {submitting && <Spinner />}
        {submitting ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg>
  );
}
