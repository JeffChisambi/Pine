/**
 * Pine API client
 *
 * Base URL auto-detection strategy:
 *  - On Expo Go / dev builds: derives host from Metro bundler URL
 *  - Production: falls back to EXPO_PUBLIC_API_URL
 *
 * Includes automatic token injection and 401 refresh logic.
 */
import Constants from 'expo-constants';
import { AuthStore } from './auth-store';

function resolveBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const hostUri: string | undefined =
    (Constants.expoConfig as any)?.hostUri ??
    (Constants as any).manifest?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000/v1`;
  }

  return 'http://localhost:3000/v1';
}

export const API_BASE_URL = resolveBaseUrl();

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Core fetch wrapper with auth ─────────────────────────────────────────────

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  try {
    const refreshToken = await AuthStore.getRefreshToken();
    if (!refreshToken) return false;

    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      await AuthStore.clear();
      return false;
    }

    const json = await res.json();
    const data = json?.data ?? json;
    if (data.accessToken && data.refreshToken) {
      await AuthStore.saveTokens(data.accessToken, data.refreshToken);
      return true;
    }
    return false;
  } catch {
    await AuthStore.clear();
    return false;
  }
}

async function request<T>(path: string, options?: RequestInit & { skipAuth?: boolean }): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> ?? {}),
  };

  // Inject auth token unless explicitly skipped
  if (!options?.skipAuth) {
    const token = await AuthStore.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const { skipAuth, ...fetchOptions } = options ?? {} as any;

  let res = await fetch(url, { ...fetchOptions, headers });

  // Auto-refresh on 401
  if (res.status === 401 && !options?.skipAuth) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = attemptRefresh().finally(() => { isRefreshing = false; });
    }

    const refreshed = await refreshPromise;
    if (refreshed) {
      // Retry with new token
      const newToken = await AuthStore.getAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
      }
      res = await fetch(url, { ...fetchOptions, headers });
    }
  }

  if (!res.ok) {
    let errorBody: any;
    try { errorBody = await res.json(); } catch { errorBody = await res.text().catch(() => res.statusText); }
    const rawMessage = errorBody?.error?.message ?? errorBody?.message;
    const msg =
      (Array.isArray(rawMessage) ? rawMessage.join('. ') : null) ??
      (typeof rawMessage === 'string' ? rawMessage : null) ??
      (typeof errorBody?.error === 'string' ? errorBody.error : null) ??
      (typeof errorBody === 'string' ? errorBody : `Request failed (HTTP ${res.status})`);
    throw new ApiError(res.status, msg, errorBody);
  }

  const json = await res.json();

  // Backend wraps responses in { data, success } envelope
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    phone: string;
    email: string | null;
    firstName: string;
    lastName: string;
    role: string;
    kycStatus: string;
  };
}

export interface UserProfile {
  id: string;
  phone: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: string;
  kycStatus: string;
  isActive: boolean;
  createdAt: string;
}

export const authApi = {
  register: (data: {
    phone: string;
    firstName: string;
    lastName: string;
    password: string;
    email?: string;
    platform?: string;
  }): Promise<AuthTokens> =>
    request<AuthTokens>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, platform: data.platform ?? 'mobile' }),
      skipAuth: true,
    }),

  login: (data: {
    phone?: string;
    email?: string;
    password: string;
    platform?: string;
  }): Promise<AuthTokens> =>
    request<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ ...data, platform: data.platform ?? 'mobile' }),
      skipAuth: true,
    }),

  logout: (): Promise<{ message: string }> =>
    request('/auth/logout', { method: 'POST' }),

  forgotPassword: (phone: string): Promise<{ message: string }> =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ phone }),
      skipAuth: true,
    }),

  resetPassword: (phone: string, otp: string, newPassword: string): Promise<{ message: string }> =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, newPassword }),
      skipAuth: true,
    }),

  sendOtp: (destination: string, purpose: string): Promise<{ message: string; expiresInSeconds: number }> =>
    request('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ destination, purpose }),
      skipAuth: true,
    }),

  verifyOtp: (destination: string, purpose: string, code: string): Promise<{ verified: boolean }> =>
    request('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ destination, purpose, code }),
      skipAuth: true,
    }),

  createPin: (pin: string): Promise<{ message: string }> =>
    request('/auth/pin/create', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),

  verifyPin: (pin: string): Promise<{ pinToken: string }> =>
    request('/auth/pin/verify', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),

  getProfile: (): Promise<UserProfile> =>
    request<UserProfile>('/auth/me'),
};

// ─── Wallet API ───────────────────────────────────────────────────────────────

export interface WalletBalance {
  balance: string;
  availableBalance: string;
  reservedBalance: string;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: string;
  amount: string;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
}

export const walletApi = {
  getBalance: (): Promise<WalletBalance> =>
    request<WalletBalance>('/wallet/balance'),

  getWallet: (): Promise<any> =>
    request('/wallet'),

  getHistory: (limit = 20): Promise<{ transactions: WalletTransaction[]; count: number }> =>
    request(`/wallet/history?limit=${limit}`),

  deposit: (data: { amount: number; method: string; reference?: string }): Promise<any> =>
    request('/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  withdraw: (data: { amount: number; method: string; destination: string; pinToken: string }): Promise<any> =>
    request('/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'x-pin-token': data.pinToken },
    }),
};

// ─── Portfolio API ────────────────────────────────────────────────────────────

export interface PortfolioSummary {
  totalValue: string;
  totalCost: string;
  totalGain: string;
  totalGainPercent: string;
  holdingsCount: number;
}

export interface Holding {
  stockId: string;
  symbol: string;
  name: string;
  quantity: string;
  avgCost: string;
  currentPrice: string;
  marketValue: string;
  gain: string;
  gainPercent: string;
}

export const portfolioApi = {
  getSummary: (): Promise<PortfolioSummary> =>
    request<PortfolioSummary>('/portfolio/summary'),

  getHoldings: (): Promise<Holding[]> =>
    request<Holding[]>('/portfolio/holdings'),

  getPerformance: (period?: string): Promise<any> =>
    request(`/portfolio/performance${period ? `?period=${period}` : ''}`),

  getAllocation: (): Promise<any> =>
    request('/portfolio/allocation'),
};

// ─── Trading API ──────────────────────────────────────────────────────────────

export interface TradeOrder {
  id: string;
  stockId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: string;
  quantity: string;
  price: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  executedAt: string | null;
}

export const tradingApi = {
  buy: (data: {
    stockId: string;
    quantity: number;
    orderType?: string;
    limitPrice?: number;
    pinToken: string;
  }): Promise<TradeOrder> =>
    request<TradeOrder>('/trading/buy', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'x-pin-token': data.pinToken },
    }),

  sell: (data: {
    stockId: string;
    quantity: number;
    orderType?: string;
    limitPrice?: number;
    pinToken: string;
  }): Promise<TradeOrder> =>
    request<TradeOrder>('/trading/sell', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'x-pin-token': data.pinToken },
    }),

  getOrders: (status?: string): Promise<{ orders: TradeOrder[]; count: number }> =>
    request(`/trading/orders${status ? `?status=${status}` : ''}`),

  getOrder: (id: string): Promise<TradeOrder> =>
    request<TradeOrder>(`/trading/orders/${id}`),

  getHistory: (limit = 20): Promise<{ orders: TradeOrder[]; count: number }> =>
    request(`/trading/history?limit=${limit}`),

  cancel: (id: string): Promise<{ message: string }> =>
    request(`/trading/cancel/${id}`, { method: 'POST' }),
};

// ─── KYC API ──────────────────────────────────────────────────────────────────

async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const token = await AuthStore.getAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Do NOT set Content-Type — fetch auto-sets it with the boundary for FormData

  let res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  // Auto-refresh on 401
  if (res.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = attemptRefresh().finally(() => { isRefreshing = false; });
    }
    const refreshed = await refreshPromise;
    if (refreshed) {
      const newToken = await AuthStore.getAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
      }
      res = await fetch(url, { method: 'POST', headers, body: formData });
    }
  }

  const json = await res.json();
  if (!res.ok) {
    throw new ApiError(res.status, json?.error?.message ?? `KYC request failed (${res.status})`, json);
  }
  return json?.data ?? json;
}

export const kycApi = {
  start: (): Promise<{ applicationId: string }> =>
    request('/kyc/start', { method: 'POST', body: JSON.stringify({}) }),

  uploadId: (applicationId: string, imageUri: string, fileName: string): Promise<{ documentId: string }> => {
    const formData = new FormData();
    formData.append('applicationId', applicationId);
    formData.append('file', {
      uri: imageUri,
      name: fileName || 'id_front.jpg',
      type: 'image/jpeg',
    } as any);
    return requestFormData('/kyc/upload-id', formData);
  },

  uploadSelfie: (applicationId: string, imageUri: string): Promise<{ documentId: string }> => {
    const formData = new FormData();
    formData.append('applicationId', applicationId);
    formData.append('file', {
      uri: imageUri,
      name: 'selfie.jpg',
      type: 'image/jpeg',
    } as any);
    return requestFormData('/kyc/upload-selfie', formData);
  },

  process: (applicationId: string): Promise<{ decision: string; confidenceScore: number }> =>
    request('/kyc/process', {
      method: 'POST',
      body: JSON.stringify({ applicationId }),
    }),

  getStatus: (): Promise<{
    applicationId: string;
    status: string;
    verificationStage: string;
    confidenceScore: number | null;
    hasIdDocument: boolean;
    hasSelfie: boolean;
    canProcess: boolean;
  }> =>
    request('/kyc/status'),
};

// ─── Stocks API (already existed, kept for backwards compat) ──────────────────

export interface ApiStock {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  price: string;
  priceRaw: number;
  change: string;
  changePct: number;
  positive: boolean;
  volume: string;
  lastUpdated: string | null;
}

export interface ApiStockDetail extends ApiStock {
  description: string | null;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  listedShares: string | null;
  period: string;
  priceHistory: Array<{
    date: string;
    close: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    changePct: number | null;
  }>;
}

export const stocksApi = {
  list: (sector?: string): Promise<ApiStock[]> => {
    const qs = sector ? `?sector=${encodeURIComponent(sector)}` : '';
    return request<ApiStock[]>(`/stocks${qs}`);
  },

  search: (q: string): Promise<ApiStock[]> =>
    request<ApiStock[]>(`/stocks/search?q=${encodeURIComponent(q)}`),

  detail: (symbol: string, period?: string): Promise<ApiStockDetail> => {
    const qs = period ? `?period=${encodeURIComponent(period)}` : '';
    return request<ApiStockDetail>(`/stocks/${encodeURIComponent(symbol.toUpperCase())}${qs}`);
  },

  sectors: (): Promise<string[]> =>
    request<string[]>('/stocks/sectors'),
};

// ─── Notifications API ────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: string;
  category: string;
  priority: number;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
  [category: string]: {
    push: boolean;
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
}

export const notificationsApi = {
  list: (limit = 30): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> =>
    request(`/notifications?limit=${limit}`),

  unread: (): Promise<{ notifications: Notification[]; count: number }> =>
    request('/notifications/unread'),

  markRead: (notificationId: string): Promise<{ success: boolean }> =>
    request('/notifications/read', { method: 'POST', body: JSON.stringify({ notificationId }) }),

  markAllRead: (): Promise<{ success: boolean; count: number }> =>
    request('/notifications/read-all', { method: 'POST' }),

  delete: (id: string): Promise<{ success: boolean }> =>
    request(`/notifications/${id}`, { method: 'DELETE' }),

  getPreferences: (): Promise<NotificationPreferences> =>
    request('/notifications/preferences'),

  updatePreference: (category: string, prefs: { push?: boolean; email?: boolean; sms?: boolean }): Promise<{ success: boolean }> =>
    request('/notifications/preferences', { method: 'PUT', body: JSON.stringify({ category, ...prefs }) }),
};

// ─── Payments API ─────────────────────────────────────────────────────────────

export interface PaymentSession {
  checkoutUrl: string;
  txRef: string;
  transactionId: string;
  status: string;
}

export interface PaymentVerification {
  txRef: string;
  status: string;
  amount: number;
  currency: string;
  channel?: string;
  completedAt?: string;
}

export const paymentsApi = {
  /** Initiate a PayChangu checkout session */
  initiate: (data: {
    amount: number;
    currency: 'MWK' | 'USD';
    purpose?: string;
    stockSymbol?: string;
    quantity?: number;
  }): Promise<PaymentSession> =>
    request<PaymentSession>('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Verify payment status by txRef */
  verify: (txRef: string): Promise<PaymentVerification> =>
    request<PaymentVerification>(`/payments/verify/${txRef}`),
};
