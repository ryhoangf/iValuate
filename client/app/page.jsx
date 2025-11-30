"use client"

import { useState } from "react"
import { ConfigProvider, theme, message } from "antd"
import viVN from "antd/locale/vi_VN"

// Import Components
import Navbar from "@/components/Navbar"
import HeroSection from "@/components/HomePage/HeroSection"
import SearchSection from "@/components/HomePage/SearchSection"
import FilterBar from "@/components/HomePage/FilterBar"
import PriceStats from "@/components/HomePage/PriceStats"
import ListingsTable from "@/components/HomePage/ListingsTable"

// Import API
import { productApi } from "@/lib/api"

export default function HomePage() {
  const [searchResults, setSearchResults] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const [filters, setFilters] = useState({
    condition: "all",
    storage: "all",
    color: "all",
  })

  // --- HÀM TÌM KIẾM GỌI BE ---
  const handleSearch = async (keyword) => {
    setLoading(true)
    setSearchResults(null) // Reset kết quả cũ

    try {
      // Gọi API thật
      const data = await productApi.search(keyword)

      // Cập nhật State với dữ liệu từ BE
      setSearchResults(data)
      
      const count = data.listings ? data.listings.length : 0
      if (count > 0) {
        message.success(`Tìm thấy ${count} kết quả`)
      } else {
        message.info("Không tìm thấy sản phẩm nào")
      }
    } catch (error) {
      message.error(error.message || "Lỗi kết nối server")
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (filterKey, value) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }))
  }

  // --- LOGIC LỌC TẠI FE ---
  const getFilteredListings = () => {
    if (!searchResults?.listings) return []

    return searchResults.listings.filter((listing) => {
      // Lọc theo Tình trạng
      if (filters.condition !== "all" && listing.condition !== filters.condition) return false
      
      // LƯU Ý: Nếu BE chưa trả về trường 'storage' và 'color', 2 bộ lọc dưới sẽ làm ẩn hết dữ liệu.
      // Bạn cần đảm bảo câu SQL Select trong Backend có lấy cột storage và color.
      if (filters.storage !== "all" && listing.storage !== filters.storage) return false
      if (filters.color !== "all" && listing.color !== filters.color) return false
      
      return true
    })
  }

  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#4F46E5",
          colorInfo: "#3B82F6",
          colorSuccess: "#10B981",
          colorError: "#EF4444",
          borderRadius: 8,
          fontSize: 14,
        },
      }}
    >
      <div className="min-h-screen bg-background">
        <Navbar />

        <main>
          {/* Hero Section ẩn khi đã có kết quả */}
          {!searchResults && <HeroSection />}

          {/* Search Section */}
          <div className={searchResults ? "pt-8" : ""}>
             <SearchSection onSearch={handleSearch} loading={loading} />
          </div>

          {/* Kết quả tìm kiếm */}
          {searchResults && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <FilterBar filters={filters} onFilterChange={handleFilterChange} />

              {/* Thống kê giá (chỉ hiện khi có summary) */}
              {searchResults.summary && (
                <PriceStats summary={searchResults.summary} />
              )}

              {/* Bảng danh sách */}
              <ListingsTable listings={getFilteredListings()} loading={loading} />
            </div>
          )}
        </main>

        <footer className="mt-20 py-8 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-muted-foreground">© 2025 iValuate. Launched by nhihoangf.</p>
          </div>
        </footer>
      </div>
    </ConfigProvider>
  )
}
