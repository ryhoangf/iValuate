// Mock data for development - sử dụng khi chưa kết nối backend

export const mockListings = [
  {
    id: "1",
    name: "iPhone 15 Pro Max 256GB",
    price: 28500000,
    condition: "99%",
    storage: "256GB",
    color: "Titan Tự Nhiên",
    platform: "Shopee",
    source_url: "https://shopee.vn/product-123",
    updated_at: "2025-01-15",
  },
  {
    id: "2",
    name: "iPhone 15 Pro Max 256GB",
    price: 27800000,
    condition: "98%",
    storage: "256GB",
    color: "Titan Đen",
    platform: "Chợ Tốt",
    source_url: "https://chotot.com/product-456",
    updated_at: "2025-01-14",
  },
  {
    id: "3",
    name: "iPhone 15 Pro Max 512GB",
    price: 32000000,
    condition: "99%",
    storage: "512GB",
    color: "Titan Xanh",
    platform: "Shopee",
    source_url: "https://shopee.vn/product-789",
    updated_at: "2025-01-15",
  },
  {
    id: "4",
    name: "iPhone 15 Pro Max 256GB",
    price: 26500000,
    condition: "95%",
    storage: "256GB",
    color: "Titan Trắng",
    platform: "Facebook Marketplace",
    source_url: "https://facebook.com/marketplace/item-012",
    updated_at: "2025-01-13",
  },
  {
    id: "5",
    name: "iPhone 15 Pro Max 128GB",
    price: 25000000,
    condition: "99%",
    storage: "128GB",
    color: "Titan Đen",
    platform: "Shopee",
    source_url: "https://shopee.vn/product-345",
    updated_at: "2025-01-15",
  },
  {
    id: "6",
    name: "Samsung Galaxy S24 Ultra 256GB",
    price: 24500000,
    condition: "99%",
    storage: "256GB",
    color: "Đen",
    platform: "Shopee",
    source_url: "https://shopee.vn/product-678",
    updated_at: "2025-01-14",
  },
  {
    id: "7",
    name: "Samsung Galaxy S24 Ultra 512GB",
    price: 27000000,
    condition: "98%",
    storage: "512GB",
    color: "Tím",
    platform: "Chợ Tốt",
    source_url: "https://chotot.com/product-901",
    updated_at: "2025-01-15",
  },
  {
    id: "8",
    name: "Xiaomi 14 256GB",
    price: 16500000,
    condition: "99%",
    storage: "256GB",
    color: "Đen",
    platform: "Shopee",
    source_url: "https://shopee.vn/product-234",
    updated_at: "2025-01-15",
  },
]

// Generate mock search results based on keyword
export const getMockSearchResults = (keyword) => {
  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Filter listings by keyword
      const filtered = mockListings.filter((item) => item.name.toLowerCase().includes(keyword.toLowerCase()))

      if (filtered.length === 0) {
        resolve({
          summary: { min: 0, max: 0, avg: 0 },
          listings: [],
        })
        return
      }

      // Calculate summary statistics
      const prices = filtered.map((item) => item.price)
      const summary = {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      }

      resolve({
        summary,
        listings: filtered,
      })
    }, 800) // Simulate 800ms network delay
  })
}
