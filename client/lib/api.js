// lib/api.js

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
      // Bạn cần đảm bảo return đúng cấu trúc để AuthModal sử dụng
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
        // LƯU Ý QUAN TRỌNG:
        // FE dùng biến "fullName", nhưng BE của bạn (AuthController) yêu cầu "full_name"
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
  search: async (keyword) => {
    try {
      const res = await fetch(`${API_URL}/search?keyword=${encodeURIComponent(keyword)}`, {
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
  }
};
