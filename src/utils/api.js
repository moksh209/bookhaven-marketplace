// Dynamic API Base URL: supports production cloud deployments (Vercel, Render) and relative path for local/tunnel
const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` 
  : '/api';

function getAuthHeaders() {
  const user = localStorage.getItem('bookhaven_user');
  if (user) {
    try {
      const parsed = JSON.parse(user);
      if (parsed?.id) {
        return { 'x-user-id': parsed.id };
      }
    } catch (e) {}
  }
  return {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const authHeaders = getAuthHeaders();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  };

  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth & Captcha
  getCaptchaChallenge: () => request('/auth/captcha-challenge'),
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  signup: (userData) => request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  forgotPassword: (email, newPassword) => request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email, newPassword }),
  }),
  getMe: () => request('/auth/me'),
  updateProfile: (profileData) => request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }),
  updatePaymentSettings: (settings) => request('/auth/payment-settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),
  getSellerPaymentInfo: (sellerId) => request(`/auth/seller-payment-info/${sellerId}`),

  // Categories
  getCategories: () => request('/categories'),

  // Products / Listings
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const qs = query.toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
  },
  getProductById: (id) => request(`/products/${id}`),
  createProduct: (productData) => request('/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  }),
  updateProduct: (id, updates) => request(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  markBookAsSold: (id) => request(`/products/${id}/sold`, {
    method: 'PATCH',
  }),
  deleteProduct: (id) => request(`/products/${id}`, {
    method: 'DELETE',
  }),
  getSellerProducts: (sellerId, includeSold = true) => request(`/products/seller/${sellerId}?includeSold=${includeSold}`),

  // Private Buyer-Seller Chat
  startConversation: (bookId) => request('/chat/start', {
    method: 'POST',
    body: JSON.stringify({ bookId }),
  }),
  getConversations: () => request('/chat/conversations'),
  getConversation: (conversationId) => request(`/chat/${conversationId}`),
  sendMessage: (conversationId, { text, attachmentUrl, messageType }) => request(`/chat/${conversationId}/message`, {
    method: 'POST',
    body: JSON.stringify({ text, attachmentUrl, messageType }),
  }),

  // Orders & Manual Payment
  startOrderPayment: (orderId) => request('/orders/start-payment', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  }),
  submitPaymentProof: (orderData) => request('/orders/submit-payment', {
    method: 'POST',
    body: JSON.stringify(orderData),
  }),
  confirmOrderPayment: (orderId) => request(`/orders/${orderId}/confirm-payment`, {
    method: 'POST',
  }),
  updateOrderStatus: (orderId, status) => request(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  getBuyerOrders: (buyerId) => request(`/orders/buyer/${buyerId}`),
  getSellerOrders: (sellerId) => request(`/orders/seller/${sellerId}`),
  getOrderById: (orderId) => request(`/orders/${orderId}`),

  // Image Upload (Book photos, QR code, Payment screenshots)
  uploadImage: (formData) => request('/upload', {
    method: 'POST',
    body: formData,
  }),

  // Reset database (dev helper)
  resetDatabase: () => request('/reset', {
    method: 'POST',
  }),
};
