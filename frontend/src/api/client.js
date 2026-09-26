const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const TOKEN_KEY = "qr_review_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const resp = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await resp.json();
  return { ok: resp.ok, status: resp.status, data };
}

export function login(email, password) {
  return request(`/api/v1/qr-reviews/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe() {
  return request(`/api/v1/qr-reviews/auth/me`);
}

export function changePassword(payload) {
  return request(`/api/v1/qr-reviews/auth/change-password`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createUser(payload) {
  return request(`/api/v1/qr-reviews/auth/users`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listUsers({ page = 1, limit = 10 } = {}) {
  return request(`/api/v1/qr-reviews/auth/users?page=${page}&limit=${limit}`);
}

export function listAllQrCodes({ page = 1, limit = 10 } = {}) {
  return request(`/api/v1/qr-reviews/qr?page=${page}&limit=${limit}`);
}

export function resolveQrCode(qrId) {
  return request(`/api/v1/qr-reviews/qr/${qrId}/resolve`);
}

export function activateQrCode(qrId, payload) {
  return request(`/api/v1/qr-reviews/qr/${qrId}/activate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function bulkCreateQrCodes(payload) {
  return request(`/api/v1/qr-reviews/qr/bulk`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getReviewSuggestion(payload) {
  return request(`/api/v1/qr-reviews/ai/review-suggestions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function submitFeedback(payload) {
  return request(`/api/v1/qr-reviews/feedback`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function sendFeedbackBeacon(payload) {
  const url = `${API_BASE_URL}/api/v1/qr-reviews/feedback`;
  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  navigator.sendBeacon(url, blob);
}

export function getDashboard(shopId, { page = 1, limit = 12 } = {}) {
  return request(`/api/v1/qr-reviews/dashboard/${shopId}?page=${page}&limit=${limit}`);
}

export function getMyShops() {
  return request(`/api/v1/qr-reviews/shops/mine`);
}

export function createShop(payload) {
  return request(`/api/v1/qr-reviews/shops`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listClients({ page = 1, limit = 10 } = {}) {
  return request(`/api/v1/qr-reviews/shops?page=${page}&limit=${limit}`);
}

export function getShopById(shopId) {
  return request(`/api/v1/qr-reviews/shops/${shopId}`);
}

export function updateShop(shopId, payload) {
  return request(`/api/v1/qr-reviews/shops/${shopId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getShopAnalytics({ page = 1, limit = 20 } = {}) {
  return request(`/api/v1/qr-reviews/shops/analytics?page=${page}&limit=${limit}`);
}

export function getMyShopAnalytics(shopId) {
  return request(`/api/v1/qr-reviews/shops/${shopId}/analytics`);
}

export function getShopActivity(shopId) {
  return request(`/api/v1/qr-reviews/shops/${shopId}/activity`);
}

export async function uploadShopPhoto(file, type = "photo") {
  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const formData = new FormData();
  formData.append("photo", file);

  const resp = await fetch(`${API_BASE_URL}/api/v1/qr-reviews/uploads/shop-photo?type=${type}`, {
    method: "POST",
    headers,
    body: formData,
  });
  const data = await resp.json();
  return { ok: resp.ok, status: resp.status, data };
}

export { API_BASE_URL };
