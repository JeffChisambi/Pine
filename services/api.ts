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
import { normalizeMalawiPhoneNumber } from './phone';

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

// In production builds, refuse to communicate over plain HTTP.
// The http:// fallbacks above are only reachable in dev (EXPO_PUBLIC_API_URL unset).
if (!__DEV__ && !API_BASE_URL.startsWith('https://')) {
  throw new Error(
    'API_BASE_URL must use HTTPS in production. ' +
    'Set EXPO_PUBLIC_API_URL to an https:// URL in your EAS Build environment.',
  );
}

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

// ─── User-facing error helpers ────────────────────────────────────────────────

/** Friendly fallback copy when the server didn't send a usable message. */
function statusFallbackMessage(status: number): string {
  if (!status || status === 0) return "Can't reach the server. Check your internet connection and try again.";
  if (status === 400) return 'Some of the details are invalid. Please check them and try again.';
  if (status === 401) return "Your details are incorrect or your session has expired. Please try again.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "We couldn't find what you were looking for.";
  if (status === 408) return 'The request timed out. Please try again.';
  if (status === 409) return 'That conflicts with the current state. Please refresh and try again.';
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (status >= 500) return 'Something went wrong on our end. Please try again shortly.';
  return 'Something went wrong. Please try again.';
}

/**
 * Turn any thrown value into a clear, human-readable message safe to show a
 * user. Prefers the backend's own message; otherwise falls back to friendly,
 * status-aware copy. Never returns raw stack traces or "[object Object]".
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const backendMsg = err.body?.error?.message ?? err.message;
    // Use the backend message unless it's our generic "Request failed (HTTP n)".
    if (typeof backendMsg === 'string' && backendMsg.trim() && !/^request failed \(http/i.test(backendMsg)) {
      return backendMsg;
    }
    return statusFallbackMessage(err.status);
  }
  if (err instanceof Error) {
    if (/network|failed to fetch|timeout|timed out|abort/i.test(err.message)) {
      return "Can't reach the server. Check your internet connection and try again.";
    }
    return err.message?.trim() || 'Something went wrong. Please try again.';
  }
  if (typeof err === 'string' && err.trim()) return err;
  return 'Something went wrong. Please try again.';
}

/**
 * Log a handled/expected error for developers WITHOUT the red LogBox overlay
 * that console.error triggers in Expo dev (which makes an ordinary, handled
 * error look like a crash). No-op in production. Use this in catch blocks that
 * already show the user a friendly message.
 */
export function logHandledError(context: string, err: unknown): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const detail = err instanceof ApiError ? { status: err.status, message: err.message } : err;
    // console.log (not warn/error) → no LogBox notification.
    console.log(`[${context}]`, detail);
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
      (Array.isArray(rawMessage) && rawMessage.length > 0 ? rawMessage.join('. ') : null) ??
      (typeof rawMessage === 'string' && rawMessage.length > 0 ? rawMessage : null) ??
      (typeof errorBody?.error === 'string' && errorBody.error.length > 0 ? errorBody.error : null) ??
      (typeof errorBody === 'string' && errorBody.length > 0 ? errorBody : `Request failed (HTTP ${res.status})`);
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
    dateOfBirth: string | null;
    gender: string | null;
    role: string;
    kycStatus: string;
    hasPinSet: boolean;
    avatarUrl: string | null;
    createdAt?: string;
  };
}

export interface UserProfile {
  id: string;
  phone: string;
  email: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string | null;
  role: string;
  kycStatus: string;
  hasPinSet: boolean;
  avatarUrl: string | null;
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
    /** ISO 8601 date (YYYY-MM-DD). */
    dateOfBirth?: string;
    /** 'M' | 'F'. */
    gender?: string;
    platform?: string;
  }): Promise<AuthTokens> =>
    request<AuthTokens>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        phone: normalizeMalawiPhoneNumber(data.phone),
        platform: data.platform ?? 'mobile',
      }),
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
      body: JSON.stringify({
        ...data,
        phone: data.phone ? normalizeMalawiPhoneNumber(data.phone) : undefined,
        platform: data.platform ?? 'mobile',
      }),
      skipAuth: true,
    }),

  logout: (): Promise<{ message: string }> =>
    request('/auth/logout', { method: 'POST' }),

  forgotPassword: (phone: string): Promise<{ message: string }> =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ phone: normalizeMalawiPhoneNumber(phone) }),
      skipAuth: true,
    }),

  resetPassword: (phone: string, otp: string, newPassword: string): Promise<{ message: string }> =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ phone: normalizeMalawiPhoneNumber(phone), otp, newPassword }),
      skipAuth: true,
    }),

  sendOtp: (destination: string, purpose: string): Promise<{ message: string; expiresInSeconds: number }> =>
    request('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ destination: normalizeMalawiPhoneNumber(destination), purpose }),
      skipAuth: true,
    }),

  verifyOtp: (destination: string, purpose: string, code: string): Promise<{ verified: boolean }> =>
    request('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ destination: normalizeMalawiPhoneNumber(destination), purpose, code }),
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

  changePassword: (currentPassword: string, newPassword: string): Promise<{ message: string }> =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  changePin: (currentPin: string, newPin: string): Promise<{ message: string }> =>
    request('/auth/pin/change', {
      method: 'POST',
      body: JSON.stringify({ currentPin, newPin }),
    }),
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

  withdraw: (data: { amount: number; pinToken: string; idempotencyKey?: string }): Promise<any> =>
    request('/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount: data.amount, idempotencyKey: data.idempotencyKey }),
      headers: { 'x-pin-token': data.pinToken },
    }),
};

// ─── Portfolio API ────────────────────────────────────────────────────────────

// Mirrors the backend's GET /portfolio/summary response exactly. The previous
// shape ({totalValue, totalGain, ...}) never matched the server, so the
// portfolio balance always rendered as 0 while holdings updated fine.
export interface PortfolioSummary {
  cashBalance: number;
  totalInvested: number;
  totalMarketValue: number;
  totalUnrealizedPnl: number;
  totalPnlPercent: number;
  portfolioValue: number;
  dailyChange: number;
  dailyChangePct: number;
}

// Mirrors the backend's HoldingDetail (GET /portfolio/holdings) exactly.
export interface Holding {
  stockId: string;
  symbol: string;
  name: string;
  sector: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  previousClose: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  pnlPercent: number;
  dailyChange: number;
  dailyChangePct: number;
  weight: number;
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

  /** Total dividends received + recent payouts (Dividends card). */
  getDividends: (): Promise<DividendsSummary> =>
    request<DividendsSummary>('/portfolio/dividends'),
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
  buy: ({ pinToken, ...data }: {
    stockSymbol: string;
    quantity: number;
    orderType: 'MARKET' | 'LIMIT';
    limitPrice?: number;
    idempotencyKey?: string;
    /** Short-lived token from POST /auth/pin/verify — required by PinGuard. */
    pinToken: string;
  }): Promise<TradeOrder> =>
    request<TradeOrder>('/trading/buy', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'x-pin-token': pinToken },
    }),

  sell: ({ pinToken, ...data }: {
    stockSymbol: string;
    quantity: number;
    orderType: 'MARKET' | 'LIMIT';
    limitPrice?: number;
    idempotencyKey?: string;
    /** Short-lived token from POST /auth/pin/verify — required by PinGuard. */
    pinToken: string;
  }): Promise<TradeOrder> =>
    request<TradeOrder>('/trading/sell', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'x-pin-token': pinToken },
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

/**
 * Build a fresh Authorization header from the current token.
 * FormData bodies can only be streamed once on some React Native implementations,
 * so we delegate re-sending to the caller (which rebuilds the FormData).
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AuthStore.getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // Do NOT set Content-Type — fetch auto-sets multipart/form-data with the correct boundary
  return headers;
}

/**
 * POST multipart/form-data to the given path.
 * `buildFormData` is a factory called each time so we can safely rebuild
 * the body on a 401 retry (a consumed FormData cannot be re-sent).
 */
async function requestFormData<T>(path: string, buildFormData: () => FormData): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  let headers = await getAuthHeaders();

  let res = await fetch(url, { method: 'POST', headers, body: buildFormData() });

  // Auto-refresh on 401 — rebuild FormData so the body is fresh
  if (res.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = attemptRefresh().finally(() => { isRefreshing = false; });
    }
    const refreshed = await refreshPromise;
    if (refreshed) {
      headers = await getAuthHeaders();
      res = await fetch(url, { method: 'POST', headers, body: buildFormData() });
    }
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    let errorBody: any = null;
    if (errorText) {
      try { errorBody = JSON.parse(errorText); } catch { errorBody = errorText; }
    }
    const rawMessage = errorBody?.error?.message ?? errorBody?.message;
    const msg =
      (Array.isArray(rawMessage) && rawMessage.length > 0 ? rawMessage.join('. ') : null) ??
      (typeof rawMessage === 'string' && rawMessage.length > 0 ? rawMessage : null) ??
      (typeof errorBody?.error === 'string' && errorBody.error.length > 0 ? errorBody.error : null) ??
      `Upload failed (HTTP ${res.status})`;
    throw new ApiError(res.status, msg, errorBody);
  }

  const json = await res.json();
  return json?.data ?? json;
}

/** Derive a safe filename+MIME from a URI when the caller doesn't supply one. */
function inferFileInfo(uri: string, fallbackName: string, fallbackMime: string) {
  const ext = uri.split('.').pop()?.toLowerCase();
  // HEIC/HEIF from iOS gallery — map to jpeg so the server accepts it
  if (ext === 'heic' || ext === 'heif') {
    return { name: fallbackName.replace(/\.jpg$/, '.jpg'), mimeType: 'image/jpeg' };
  }
  if (ext === 'png') {
    return { name: fallbackName.replace(/\.jpg$/, '.png'), mimeType: 'image/png' };
  }
  return { name: fallbackName, mimeType: fallbackMime };
}

export const kycApi = {
  start: (): Promise<{ applicationId: string }> =>
    request('/kyc/start', { method: 'POST', body: JSON.stringify({}) }),

  uploadId: (
    applicationId: string,
    imageUri: string,
    fileName: string,
    mimeType?: string,
  ): Promise<{ documentId: string }> => {
    const { name, mimeType: type } = inferFileInfo(imageUri, fileName || 'id_front.jpg', mimeType ?? 'image/jpeg');
    return requestFormData('/kyc/upload-id', () => {
      const fd = new FormData();
      fd.append('applicationId', applicationId);
      fd.append('file', { uri: imageUri, name, type } as any);
      return fd;
    });
  },

  uploadIdBack: (
    applicationId: string,
    imageUri: string,
    mimeType?: string,
  ): Promise<{ documentId: string }> => {
    const { name, mimeType: type } = inferFileInfo(imageUri, 'id_back.jpg', mimeType ?? 'image/jpeg');
    return requestFormData('/kyc/upload-id-back', () => {
      const fd = new FormData();
      fd.append('applicationId', applicationId);
      fd.append('file', { uri: imageUri, name, type } as any);
      return fd;
    });
  },

  uploadSelfie: (
    applicationId: string,
    imageUri: string,
    mimeType?: string,
  ): Promise<{ documentId: string }> => {
    const { name, mimeType: type } = inferFileInfo(imageUri, 'selfie.jpg', mimeType ?? 'image/jpeg');
    return requestFormData('/kyc/upload-selfie', () => {
      const fd = new FormData();
      fd.append('applicationId', applicationId);
      fd.append('file', { uri: imageUri, name, type } as any);
      return fd;
    });
  },

  /**
   * Upload proof of address (utility bill / bank statement).
   * Accepts JPEG, PNG or PDF. Max 8 MB enforced on the mobile side;
   * the backend enforces 10 MB as an additional safety net.
   */
  uploadProofOfResidence: (
    applicationId: string,
    fileUri: string,
    fileName: string,
    mimeType: string,
  ): Promise<{ documentId: string }> =>
    requestFormData('/kyc/upload-proof-of-residency', () => {
      const fd = new FormData();
      fd.append('applicationId', applicationId);
      fd.append('file', { uri: fileUri, name: fileName, type: mimeType } as any);
      return fd;
    }),

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
    submittedAt: string | null;
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
  /** Optional analytics the backend may include on the detail payload. */
  turnover?: string | null;
  marketCap?: string | null;
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

// ─── Dividends (portfolio) ────────────────────────────────────────────────────

export type DividendsSummary = {
  totalDividends: number;
  count: number;
  recent: Array<{
    id: string;
    type: string;
    amount: number;
    description: string | null;
    createdAt: string;
  }>;
};

// ─── News API ─────────────────────────────────────────────────────────────────

/** News item as returned by the backend — matches the mobile NewsItem shape. */
export type ApiNewsItem = {
  id: string;
  category: string;
  title: string;
  summary: string | null;
  body: string[];
  /** Pre-formatted display string, e.g. "30 Mar 2026". */
  time: string;
  source: string;
  /** Hero image URL (or null). */
  image: string | null;
  featured: boolean;
};

export const newsApi = {
  list: (category?: string): Promise<ApiNewsItem[]> => {
    const qs = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
    return request<ApiNewsItem[]>(`/news${qs}`);
  },

  detail: (id: string): Promise<ApiNewsItem> =>
    request<ApiNewsItem>(`/news/${encodeURIComponent(id)}`),

  categories: (): Promise<string[]> =>
    request<string[]>('/news/categories'),
};

// ─── Support API (Help & Support / Report a problem) ──────────────────────────

export type SupportCategory =
  | 'DEPOSITS' | 'WITHDRAWALS' | 'TRADING' | 'TREASURY' | 'ACCOUNT' | 'OTHER';

export type SupportAuthorType = 'USER' | 'ADMIN' | 'SYSTEM';

export type SupportMessage = {
  id: string;
  authorType: SupportAuthorType;
  authorName: string | null;
  body: string;
  attachmentUrl: string | null;
  createdAt: string;
};

export type SupportTicketSummary = {
  ticketId: string;
  reference: string;
  category: SupportCategory;
  subject: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
  statusLabel: string;
  unread: boolean;
  relatedTransactionId: string | null;
  lastMessageAt: string;
  createdAt: string;
  lastMessage: { authorType: SupportAuthorType; authorName: string | null; preview: string; createdAt: string } | null;
};

export type SupportTicketThread = SupportTicketSummary & {
  messages: SupportMessage[];
};

export type SupportAttachment = { uri: string; name: string; type: string };

export const supportApi = {
  list: (): Promise<SupportTicketSummary[]> =>
    request<SupportTicketSummary[]>('/support'),

  thread: (id: string): Promise<SupportTicketThread> =>
    request<SupportTicketThread>(`/support/${encodeURIComponent(id)}`),

  create: (
    data: { category: SupportCategory; subject: string; message: string; relatedTransactionId?: string },
    attachment?: SupportAttachment,
  ): Promise<SupportTicketThread> => {
    if (attachment) {
      return requestFormData<SupportTicketThread>('/support', () => {
        const fd = new FormData();
        fd.append('category', data.category);
        fd.append('subject', data.subject);
        fd.append('message', data.message);
        if (data.relatedTransactionId) fd.append('relatedTransactionId', data.relatedTransactionId);
        fd.append('attachment', { uri: attachment.uri, name: attachment.name, type: attachment.type } as any);
        return fd;
      });
    }
    return request<SupportTicketThread>('/support', { method: 'POST', body: JSON.stringify(data) });
  },

  reply: (id: string, message: string, attachment?: SupportAttachment): Promise<SupportTicketThread> => {
    const path = `/support/${encodeURIComponent(id)}/messages`;
    if (attachment) {
      return requestFormData<SupportTicketThread>(path, () => {
        const fd = new FormData();
        fd.append('message', message);
        fd.append('attachment', { uri: attachment.uri, name: attachment.name, type: attachment.type } as any);
        return fd;
      });
    }
    return request<SupportTicketThread>(path, { method: 'POST', body: JSON.stringify({ message }) });
  },
};

// ─── Account API ──────────────────────────────────────────────────────────────

export const accountApi = {
  /** Close (delete) the account — PIN-verified, deactivate + anonymize. */
  deleteAccount: (pinToken: string): Promise<{ message: string }> =>
    request<{ message: string }>('/users/me', {
      method: 'DELETE',
      headers: { 'x-pin-token': pinToken },
    }),
};

// ─── Mobile theme (broker-configurable brand colors) ──────────────────────────

export type MobileThemeColors = {
  primary?: string; accent?: string; background?: string; card?: string;
  text?: string; mutedForeground?: string; border?: string; destructive?: string;
};

export const mobileThemeApi = {
  /** Public: the active brand theme (null colors → app uses the Pine default). */
  get: (): Promise<{ colors: MobileThemeColors | null }> =>
    request<{ colors: MobileThemeColors | null }>('/mobile-theme', { skipAuth: true }),
};

// ─── Treasury API ─────────────────────────────────────────────────────────────

/** T-bill product as returned by the backend — matches the mobile TBillOption. */
export type ApiTBillProduct = {
  id: string;
  label: string;
  duration: number;         // tenor days (91 | 182 | 364)
  yieldPct: number;
  minInvestment: number;
  maxInvestment: number | null;
  riskLevel: string;        // "Very Low" | "Low"
  nextAuction: string;      // "28 Jul 2026"
  auctionDate: string;
  issueDate: string;
  maturityDate: string;
  status: string;           // "open" | "closing_soon" | "closed"
  currency: string;
};

export type ApiTBillInvestment = {
  investmentId: string;
  status: string;
  amount: string;
  yieldPercent: number;
  earnings: string;
  maturityValue: string;
  maturityDate: string;
  createdAt: string;
  product?: ApiTBillProduct;
};

export const treasuryApi = {
  products: (): Promise<ApiTBillProduct[]> =>
    request<ApiTBillProduct[]>('/treasury/products'),

  investments: (): Promise<ApiTBillInvestment[]> =>
    request<ApiTBillInvestment[]>('/treasury/investments'),

  invest: (data: { productId: string; amount: number }): Promise<ApiTBillInvestment> =>
    request<ApiTBillInvestment>('/treasury/invest', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  investment: (id: string): Promise<ApiTBillInvestment> =>
    request<ApiTBillInvestment>(`/treasury/investments/${encodeURIComponent(id)}`),
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

  clearAll: (): Promise<{ success: boolean; count: number }> =>
    request('/notifications', { method: 'DELETE' }),

  delete: (id: string): Promise<{ success: boolean }> =>
    request(`/notifications/${id}`, { method: 'DELETE' }),

  getPreferences: (): Promise<NotificationPreferences> =>
    request('/notifications/preferences'),

  updatePreference: (category: string, prefs: { push?: boolean; email?: boolean; sms?: boolean }): Promise<{ success: boolean }> =>
    request('/notifications/preferences', { method: 'PUT', body: JSON.stringify({ category, ...prefs }) }),

  /**
   * Register this device's Expo push token with the backend so it can receive
   * remote push notifications. Idempotent — safe to call on every app launch
   * and whenever the token rotates. Backend endpoint: see BACKEND_API.md.
   */
  registerDevice: (
    token: string,
    platform: 'ios' | 'android' | 'web',
    meta?: { deviceName?: string; appVersion?: string },
  ): Promise<{ success: boolean }> =>
    request('/notifications/devices', {
      method: 'POST',
      body: JSON.stringify({ token, platform, ...meta }),
    }),

  /** Remove this device's push token (e.g. on logout or when push is disabled). */
  unregisterDevice: (token: string): Promise<{ success: boolean }> =>
    request('/notifications/devices', {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    }),
};

// ─── Payments API ─────────────────────────────────────────────────────────────

// ─── Bank Card Payments API ───────────────────────────────────────────────────

export interface CardPaymentSession {
  txRef: string;
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  message: string;
  processorReference?: string;
  last4?: string;
  cardBrand?: string;
}

export interface CardPaymentVerification {
  txRef: string;
  status: string;
  amount: number;
  currency: string;
  processorReference?: string;
  updatedAt: string;
  failureReason?: string;
}

export const cardPaymentsApi = {
  /**
   * Charge a bank card and credit the wallet. The server responds only after
   * the charge outcome is final: status SUCCESS (wallet already credited) or
   * FAILED (with a user-safe message). `idempotencyKey` makes duplicate
   * submissions safe; `testScenario` runs the flow through the mock gateway.
   */
  initiateCardPayment: (data: {
    amount: number;
    currency: 'MWK' | 'USD';
    cardholderName: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    purpose?: string;
    stockSymbol?: string;
    quantity?: number;
    idempotencyKey?: string;
    testScenario?: string;
  }): Promise<CardPaymentSession> =>
    request<CardPaymentSession>('/payments/card/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Poll for the current status of a bank card payment */
  verifyCardPayment: (txRef: string): Promise<CardPaymentVerification> =>
    request<CardPaymentVerification>(`/payments/card/verify/${txRef}`),
};


