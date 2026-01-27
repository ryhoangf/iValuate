// client/lib/api.js

// Lấy URL từ biến môi trường hoặc dùng mặc định localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; 

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

  // 2. Đăng ký
  register: async (email, password, fullName) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          full_name: fullName 
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
  }
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

  // New method: Get market price range
  getMarketPrice: async (keyword, features = {}) => {
    try {
      const params = new URLSearchParams({ keyword });
      
      if (features.condition) {
        params.append('condition', features.condition);
      }
      if (features.battery_health) {
        params.append('battery_health', features.battery_health);
      }

      const res = await fetch(`${API_URL}/products/market-price?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi lấy thông tin giá');
      
      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }
};
