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
        throw new Error(data.message || 'Đăng nhập thất bại');
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
      throw new Error(data.message || 'Không gửi được yêu cầu');
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
      throw new Error(data.message || 'Đặt lại mật khẩu thất bại');
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
        throw new Error(data.message || 'Đăng ký thất bại');
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
      throw new Error(data.message || 'Không nâng cấp được');
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
      throw new Error(data.message || 'Không hủy gói được');
    }
    return data;
  },

  getMe: async () => {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: optionalBearerHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Không tải được hồ sơ');
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
      throw new Error(data.message || 'Cập nhật thất bại');
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

      const res = await fetch(`${API_URL}/products/search?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi tìm kiếm sản phẩm');
      
      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  // NEW: Get market price range with ALL features
  getMarketPrice: async (keyword, features = {}) => {
    try {
      const params = new URLSearchParams({ keyword });
      
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

      const res = await fetch(`${API_URL}/products/market-price?${params.toString()}`, {
        method: 'GET',
        headers: optionalBearerHeaders(),
        cache: 'no-store'
      });

      const data = await res.json();
      if (!res.ok) throw httpError(res, data, 'Lỗi khi lấy thông tin giá');
      
      return data;
    } catch (error) {
      console.error("API Error:", error);
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
      if (!res.ok) throw httpError(res, data, 'Lỗi khi lấy phân tích feature');
      
      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
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
      throw httpError(res, data, data.detail || data.message || 'Lỗi khi lấy đường cong trượt giá');
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
      throw httpError(res, data, msg || 'Lỗi khi phân tích tác động yếu tố (ML)');
    }
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
      throw new Error(data.message || 'Không tải được danh sách theo dõi');
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
      throw new Error(data.message || 'Không tạo được theo dõi');
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
      throw new Error(data.message || 'Không xóa được');
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
      throw new Error(data.message || 'Lỗi khi ẩn tin');
    }
    return data;
  },
};
