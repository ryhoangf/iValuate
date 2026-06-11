// client/lib/api.js

// Lấy URL từ biến môi trường hoặc dùng /api (Next rewrite → Express xem next.config.ts)
import { getToken } from "./auth"

function getApiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return "/api";
  const base = raw.replace(/\/$/, "");
  if (base.startsWith("http://") || base.startsWith("https://")) {
    if (!base.endsWith("/api")) return `${base}/api`;
    return base;
  }
  return base.startsWith("/") ? base : `/${base}`;
}

const API_URL = getApiBase();

function optionalBearerHeaders() {
  const h = { 'Content-Type': 'application/json' }
  const t = typeof window !== 'undefined' ? getToken() : null
  if (t) {
    h.Authorization = `Bearer ${t}`
  }
  return h
}

function httpError(res, data, fallbackMsg) {
  const err = new Error((data && data.message) || fallbackMsg)
  err.status = res.status
  if (data && data.code) err.code = data.code
  return err
}

export const authApi = {
  // 1. Đăng nhập
  login: async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Sign in failed');
      }

      // Backend trả về: { message, accessToken (hoặc token), user }
      return data; 
    } catch (error) {
      throw error;
    }
  },

  forgotPassword: async (email) => {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Could not send request');
    }
    return data;
  },

  resetPassword: async (token, newPassword) => {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Password reset failed');
    }
    return data;
  },

  // 2. Đăng ký — planTier: 'lite' | 'premium' (chưa thanh toán; Premium kích hoạt thử ngay)
  register: async (email, password, fullName, planTier = 'lite') => {
    try {
      const tier = planTier === 'premium' ? 'premium' : 'lite'
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          plan_tier: tier,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data; 
    } catch (error) {
      throw error;
    }
  },

  /** Tài khoản Lite đã đăng nhập → thêm PREMIUM dùng thử + nhận token mới. */
  upgradePremiumTrial: async () => {
    const res = await fetch(`${API_URL}/auth/upgrade-premium-trial`, {
      method: 'POST',
      headers: optionalBearerHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Upgrade failed');
    }
    return data;
  },

  /** Premium → hủy về Lite + token mới. */
  downgradePremiumToLite: async () => {
    const res = await fetch(`${API_URL}/auth/downgrade-to-lite`, {
      method: 'POST',
      headers: optionalBearerHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Could not cancel plan');
    }
    return data;
  },

  getMe: async () => {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: optionalBearerHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Could not load profile');
    }
    return data;
  },

  updateProfile: async (payload) => {
    const res = await fetch(`${API_URL}/auth/me`, {
      method: 'PATCH',
      headers: optionalBearerHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Update failed');
    }
    return data;
  },
};

export const productApi = {
  search: async (keyword, filters = {}) => {
    try {
      // Build query parameters
      const params = new URLSearchParams({ keyword });
      
      // Add filters if they exist and are not 'all'
      if (filters.condition && filters.condition !== 'all') {
        params.append('condition', filters.condition);
      }
      if (filters.color && filters.color !== 'all') {
        params.append('color', filters.color);
      }
      if (filters.batteryStatus && filters.batteryStatus !== 'all') {
        params.append('batteryStatus', filters.batteryStatus);
      }
      if (filters.screenCondition && filters.screenCondition !== 'all') {
        params.append('screenCondition', filters.screenCondition);
      }
      if (filters.bodyCondition && filters.bodyCondition !== 'all') {
        params.append('bodyCondition', filters.bodyCondition);
      }
      
      // Boolean filters
      if (filters.batteryReplaced === true) {
        params.append('batteryReplaced', '1');
      }
      if (filters.hasBox === true) {
        params.append('hasBox', '1');
      }
      if (filters.hasCharger === true) {
        params.append('hasCharger', '1');
      }
      if (filters.hasCable === true) {
        params.append('hasCable', '1');
      }
      if (filters.hasEarphones === true) {
        params.append('hasEarphones', '1');
      }
      if (filters.isSimFree === true) {
        params.append('isSimFree', '1');
      }
      if (filters.fullyFunctional === true) {
        params.append('fullyFunctional', '1');
      }
      
      // Only add minBattery if it's a valid number and not null/undefined
      if (filters.minBattery != null && !isNaN(filters.minBattery)) {
        params.append('minBattery', filters.minBattery);
      }
      if (filters.minPrice) {
        params.append('minPrice', filters.minPrice);
      }
      if (filters.maxPrice) {
        params.append('maxPrice', filters.maxPrice);
      }
      if (filters.platform && filters.platform !== 'all') {
        params.append('platform', filters.platform);
      }
      if (filters.storage && filters.storage !== 'all') {
        params.append('storage', filters.storage);
      }
      if (filters.ram && filters.ram !== 'all') {
        params.append('ram', filters.ram);
      }

      const res = await fetch(`${API_URL}/products/search?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      const data = await res.json();
      if (!res.ok) throw httpError(res, data, 'Product search failed');
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  // NEW: Get market price range with ALL features
  getMarketPrice: async (keyword, features = {}, productId) => {
    try {
      const params = new URLSearchParams({ keyword });
      if (productId) params.set('product_id', productId);
      
      // Basic features
      if (features.condition && features.condition !== 'all') {
        params.append('condition', features.condition);
      }
      if (features.battery_health != null && !isNaN(features.battery_health)) {
        params.append('battery_health', features.battery_health);
      }
      if (features.color && features.color !== 'all') {
        params.append('color', features.color);
      }
      
      // Condition features
      if (features.screenCondition && features.screenCondition !== 'all') {
        params.append('screenCondition', features.screenCondition);
      }
      if (features.bodyCondition && features.bodyCondition !== 'all') {
        params.append('bodyCondition', features.bodyCondition);
      }
      if (features.batteryStatus && features.batteryStatus !== 'all') {
        params.append('batteryStatus', features.batteryStatus);
      }
      
      // Boolean features - accessories
      if (features.batteryReplaced === true) {
        params.append('batteryReplaced', '1');
      }
      if (features.hasBox === true) {
        params.append('hasBox', '1');
      }
      if (features.hasCharger === true) {
        params.append('hasCharger', '1');
      }
      if (features.hasCable === true) {
        params.append('hasCable', '1');
      }
      if (features.hasEarphones === true) {
        params.append('hasEarphones', '1');
      }
      
      // Boolean features - functionality
      if (features.isSimFree === true) {
        params.append('isSimFree', '1');
      }
      if (features.fullyFunctional === false) {
        params.append('fullyFunctional', '0');
      } else if (features.fullyFunctional === true) {
        params.append('fullyFunctional', '1');
      }
      if (features.storage) params.append('storage', features.storage);
      if (features.ram) params.append('ram', features.ram);

      const res = await fetch(`${API_URL}/products/market-price?${params.toString()}`, {
        method: 'GET',
        headers: optionalBearerHeaders(),
        cache: 'no-store'
      });

      const data = await res.json();
      if (res.status === 404) return null;
      if (!res.ok) throw httpError(res, data, 'Failed to load price data');
      
      return data;
    } catch (error) {
      if (error?.status !== 404) {
        console.error("API Error:", error);
      }
      throw error;
    }
  },

  // NEW: Get feature impact analysis
  getFeatureImpact: async (keyword, features = {}) => {
    try {
      const params = new URLSearchParams({ keyword });
      
      // Add all features similar to getMarketPrice
      if (features.condition) params.append('condition', features.condition);
      if (features.battery_health) params.append('battery_health', features.battery_health);
      if (features.screenCondition) params.append('screenCondition', features.screenCondition);
      if (features.bodyCondition) params.append('bodyCondition', features.bodyCondition);
      if (features.hasBox === true) params.append('hasBox', '1');
      if (features.hasCharger === true) params.append('hasCharger', '1');

      const res = await fetch(`${API_URL}/products/feature-impact?${params.toString()}`, {
        method: 'GET',
        headers: optionalBearerHeaders(),
        cache: 'no-store'
      });

      const data = await res.json();
      if (!res.ok) throw httpError(res, data, 'Failed to load feature analysis');
      
      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  getPriceForecast30d: async ({ productId, keyword, horizonDays } = {}) => {
    const params = new URLSearchParams();
    if (productId) params.set('product_id', productId);
    if (keyword) params.set('keyword', keyword);
    if (horizonDays != null && horizonDays > 0) {
      params.set('horizon_days', String(horizonDays));
    }
    const qs = params.toString();
    const res = await fetch(
      `${API_URL}/products/price-forecast-30d${qs ? `?${qs}` : ''}`,
      { method: 'GET', headers: optionalBearerHeaders(), cache: 'no-store' }
    );
    const data = await res.json();
    if (!res.ok) {
      throw httpError(res, data, data.detail || data.message || 'Failed to load 30-day forecast');
    }
    return data;
  },

  getDepreciationCurve: async ({ productId, keyword }) => {
    const params = new URLSearchParams();
    if (productId) params.set('product_id', productId);
    if (keyword) params.set('keyword', keyword);
    const qs = params.toString();
    const res = await fetch(
      `${API_URL}/products/depreciation-curve${qs ? `?${qs}` : ''}`,
      { method: 'GET', headers: optionalBearerHeaders(), cache: 'no-store' }
    );
    const data = await res.json();
    if (!res.ok) {
      throw httpError(res, data, data.detail || data.message || 'Failed to load depreciation curve');
    }
    return data;
  },

  /**
   * ML counterfactual feature impact (FastAPI). Khác GET /feature-impact (Node heuristic).
   */
  postCounterfactualImpact: async ({ productId, keyword, filters = {}, includeAllScenarios = false }) => {
    const res = await fetch(`${API_URL}/products/counterfactual-impact`, {
      method: 'POST',
      headers: optionalBearerHeaders(),
      body: JSON.stringify({
        product_id: productId,
        keyword,
        filters,
        include_all_scenarios: includeAllScenarios,
      }),
      cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok) {
      const d = data.detail ?? data.message;
      const msg =
        typeof d === 'string'
          ? d
          : Array.isArray(d)
            ? d.map((x) => (x.msg != null ? x.msg : JSON.stringify(x))).join('; ')
            : typeof d === 'object' && d != null
              ? JSON.stringify(d)
              : data.message;
      throw httpError(res, data, msg || 'Failed to load feature impact (ML)');
    }
    return data;
  },

  /** Hãng + model có nhiều tin đăng nhất (menu trang chủ) */
  getBrandCatalog: async (opts = {}) => {
    const params = new URLSearchParams();
    if (opts.maxBrands != null) params.set('maxBrands', String(opts.maxBrands));
    if (opts.perBrand != null) params.set('perBrand', String(opts.perBrand));
    const qs = params.toString();
    const res = await fetch(`${API_URL}/products/brand-catalog${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load brand catalog');
    return data;
  },
};

function authJsonHeaders() {
  const h = { 'Content-Type': 'application/json' };
  const t = typeof window !== 'undefined' ? getToken() : null;
  if (t) {
    h.Authorization = `Bearer ${t}`;
  }
  return h;
}

/** Theo dõi sản phẩm (JWT Bearer) — cần bảng product_watches (xem server/sql/product_watches.sql) */
export const watchApi = {
  list: async (includeOpportunities = true) => {
    const q = includeOpportunities ? '' : '?include=0';
    const res = await fetch(`${API_URL}/watches${q}`, {
      headers: authJsonHeaders(),
      cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to load watches');
    }
    return data;
  },

  create: async (body) => {
    const res = await fetch(`${API_URL}/watches`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Could not create watch');
    }
    return data;
  },

  remove: async (watchId) => {
    const res = await fetch(`${API_URL}/watches/${watchId}`, {
      method: 'DELETE',
      headers: authJsonHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Could not delete watch');
    }
    return data;
  },

  dismiss: async (watchId, listingId) => {
    const res = await fetch(`${API_URL}/watches/${watchId}/dismiss`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ listing_id: listingId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Failed to hide listing');
    }
    return data;
  },
};
