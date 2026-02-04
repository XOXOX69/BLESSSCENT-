import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};

// Dashboard API
export const dashboardApi = {
  getSummary: (branchId?: string) =>
    api.get('/reports/dashboard', { params: { branchId } }),
  getSalesSummary: (params: { startDate?: string; endDate?: string; branchId?: string }) =>
    api.get('/reports/sales/summary', { params }),
};

// Products API
export const productsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; categoryId?: string }) =>
    api.get('/products', { params }),
  getOne: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  activate: (id: string) => api.patch(`/products/${id}/activate`),
  deactivate: (id: string) => api.patch(`/products/${id}/deactivate`),
  getBrands: () => api.get('/products/brands'),
  getCategories: () => api.get('/products/categories/all'),
};

// Inventory API
export const inventoryApi = {
  getAll: (params?: { branchId?: string; lowStock?: boolean; page?: number; limit?: number }) =>
    api.get('/inventory', { params }),
  getOne: (id: string) => api.get(`/inventory/${id}`),
  create: (data: any) => api.post('/inventory', data),
  adjust: (id: string, data: { adjustment: number; reason?: string }) =>
    api.post(`/inventory/${id}/adjust`, data),
  getLowStock: (branchId?: string) =>
    api.get('/inventory/low-stock', { params: { branchId } }),
};

// Pricing API
export const pricingApi = {
  getProfiles: (variantId?: string) =>
    api.get('/pricing/profiles', { params: { variantId } }),
  getProfile: (id: string) => api.get(`/pricing/profiles/${id}`),
  createProfile: (data: any) => api.post('/pricing/profiles', data),
  updateProfile: (id: string, data: any) => api.put(`/pricing/profiles/${id}`, data),
  deleteProfile: (id: string) => api.delete(`/pricing/profiles/${id}`),
  getPromos: (activeOnly?: boolean) =>
    api.get('/pricing/promos', { params: { activeOnly } }),
  createPromo: (data: any) => api.post('/pricing/promos', data),
  updatePromo: (id: string, data: any) => api.put(`/pricing/promos/${id}`, data),
  deletePromo: (id: string) => api.delete(`/pricing/promos/${id}`),
};

// Members API
export const membersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get('/members', { params }),
  getOne: (id: string) => api.get(`/members/${id}`),
  create: (data: any) => api.post('/members', data),
  update: (id: string, data: any) => api.put(`/members/${id}`, data),
  delete: (id: string) => api.delete(`/members/${id}`),
  adjustPoints: (id: string, data: { points: number; reason: string }) =>
    api.post(`/members/${id}/points/adjust`, data),
  getStatistics: (branchId?: string) =>
    api.get('/members/statistics', { params: { branchId } }),
};

// Resellers API
export const resellersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get('/resellers', { params }),
  getOne: (id: string) => api.get(`/resellers/${id}`),
  create: (data: any) => api.post('/resellers', data),
  update: (id: string, data: any) => api.put(`/resellers/${id}`, data),
  delete: (id: string) => api.delete(`/resellers/${id}`),
  recordPayment: (id: string, data: { amount: number; paymentMethod: string; referenceNumber?: string }) =>
    api.post(`/resellers/${id}/payment`, data),
  adjustCredit: (id: string, data: { amount: number; note?: string }) =>
    api.post(`/resellers/${id}/credit/adjust`, data),
  getStatistics: (branchId?: string) =>
    api.get('/resellers/statistics', { params: { branchId } }),
  getOutstandingBalance: () => api.get('/resellers/outstanding-balance'),
};

// Ledger API
export const ledgerApi = {
  getAll: (params?: { resellerId?: string; page?: number; limit?: number; search?: string }) =>
    api.get('/ledger', { params }),
  getEntries: (params?: { resellerId?: string; page?: number; limit?: number }) =>
    api.get('/ledger', { params }),
  getBalance: (resellerId: string) => api.get(`/ledger/balance/${resellerId}`),
  getAging: () => api.get('/ledger/aging'),
  getOverdue: () => api.get('/ledger/overdue'),
  recordPayment: (data: { resellerId: string; amount: number; paymentMethod: string; notes?: string }) =>
    api.post('/ledger/payment', data),
  createCreditSale: (data: any) => api.post('/ledger/credit-sale', data),
};

// Users API
export const usersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    api.get('/users', { params }),
  getOne: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  resetPassword: (id: string, data: { password: string }) =>
    api.post(`/users/${id}/reset-password`, data),
  activate: (id: string) => api.put(`/users/${id}/activate`),
  deactivate: (id: string) => api.put(`/users/${id}/deactivate`),
};

// Reports API
export const reportsApi = {
  getSales: (params?: { startDate?: string; endDate?: string; branchId?: string }) =>
    api.get('/reports/sales', { params }),
  getInventory: (branchId?: string) =>
    api.get('/reports/inventory', { params: { branchId } }),
  getMembers: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/members', { params }),
  exportSales: (params?: { startDate?: string; endDate?: string; format?: string }) =>
    api.get('/reports/sales/export', { params, responseType: 'blob' }),
};

// Notifications API
export const notificationsApi = {
  getAll: () => api.get('/reports/dashboard'),
  getLowStock: () => api.get('/inventory/low-stock'),
  getOverdue: () => api.get('/ledger/overdue'),
};

// Sales API (for reports)
export const salesApi = {
  getAll: (params?: { branchId?: string; limit?: number; offset?: number }) =>
    api.get('/sales', { params }),
  getOne: (id: string) => api.get(`/sales/${id}`),
  getDaily: (branchId: string, date: string) =>
    api.get('/sales/daily', { params: { branchId, date } }),
};

export default api;
