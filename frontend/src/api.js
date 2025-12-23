const BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

function getUserId() {
  return localStorage.getItem("userId") || "";
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const userId = getUserId();
    if (userId) headers["x-user-id"] = userId;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || data?.raw || res.statusText;
    throw new Error(`${res.status} ${msg}`);
  }

  return data;
}

export const api = {
  // auth
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  register: (email, password) => request("/auth/register", { method: "POST", body: { email, password }, auth: false }),
  me: () => request("/auth/me"),

  // products + skus
  products: () => request("/products", { auth: false }),
  product: (id) => request(`/products/${id}`, { auth: false }),
  skus: () => request("/skus", { auth: false }),

  // cart
  cart: () => request("/cart"),
  addToCart: (skuId, qty) => request("/cart/items", { method: "POST", body: { skuId, qty } }),
  deleteCartItem: (itemId) => request(`/cart/items/${itemId}`, { method: "DELETE" }),

  // orders
  createOrder: () => request("/orders", { method: "POST" }),
  orders: () => request("/orders"),

  // payments (mock)
  createPaymentIntent: (orderId) => request("/payments/intents", { method: "POST", body: { orderId } }),
  confirmPayment: (paymentId) => request(`/payments/intents/${paymentId}/confirm`, { method: "POST" }),

  // seller
  sellerProducts: () => request("/seller/products"),
  sellerCreateProduct: (payload) => request("/seller/products", { method: "POST", body: payload }),
  sellerUpdateProduct: (id, payload) => request(`/seller/products/${id}`, { method: "PUT", body: payload }),
  sellerDeleteProduct: (id) => request(`/seller/products/${id}`, { method: "DELETE" }),

  // admin
  adminUsers: () => request("/admin/users"),
  adminPatchUser: (id, payload) => request(`/admin/users/${id}`, { method: "PATCH", body: payload }),

  adminOrders: () => request("/admin/orders"),
  adminDeleteOrder: (orderId) => request(`/admin/orders/${orderId}`, { method: "DELETE" }),

  adminProducts: () => request("/admin/products"),
  adminPatchProduct: (id, payload) => request(`/admin/products/${id}`, { method: "PATCH", body: payload }),
  adminDeleteProduct: (id) => request(`/admin/products/${id}`, { method: "DELETE" }),
};
