"use client"

import { useState } from "react"
import { ConfigProvider, theme, message, Tabs } from "antd"
import viVN from "antd/locale/vi_VN"

// Import Components
import Navbar from "@/components/Navbar"
import HeroSection from "@/components/HomePage/HeroSection"
import SearchSection from "@/components/HomePage/SearchSection"
import FilterBar from "@/components/FilterBar"
import PriceStats from "@/components/HomePage/PriceStats"
import ListingsTable from "@/components/ListingsTable"
import MarketPriceCard from "@/components/MarketPriceCard"
import SimilarListingsTable from "@/components/SimilarListingsTable"
import PriceHistoryChart from "@/components/PriceHistoryChart"

// Import API
import { productApi } from "@/lib/api"

export default function HomePage() {
  const [searchResults, setSearchResults] = useState(null)
  const [marketPriceData, setMarketPriceData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentKeyword, setCurrentKeyword] = useState("")
  const [activeTab, setActiveTab] = useState("1")

  const [filters, setFilters] = useState({
    condition: "all",
    color: "all",
    platform: "all",
    batteryStatus: "all",
    screenCondition: "all",
    bodyCondition: "all",
    minBattery: null,
    batteryReplaced: null,
    hasBox: null,
    hasCharger: null,
    isSimFree: null,
    fullyFunctional: null,
  })

  // --- SEARCH FUNCTION - CALLS BACKEND WITH FILTERS ---
  const handleSearch = async (keyword, appliedFilters = filters) => {
    setLoading(true)
    setSearchResults(null)
    setMarketPriceData(null)
    setCurrentKeyword(keyword)

    try {
      // Call both APIs in parallel
      const [searchData, marketData] = await Promise.all([
        productApi.search(keyword, appliedFilters),
        productApi.getMarketPrice(keyword, {
          condition: appliedFilters.condition !== 'all' ? appliedFilters.condition : undefined,
          battery_health: appliedFilters.minBattery
        }).catch(err => {
          console.error("Market price error:", err)
          return null // Don't fail the whole search if market price fails
        })
      ])

      // Initialize battery filter with min value from results
      if (searchData.availableFilters?.batteryRange && filters.minBattery === null) {
        setFilters(prev => ({
          ...prev,
          minBattery: searchData.availableFilters.batteryRange.min
        }))
      }

      // Update state with data from backend
      setSearchResults(searchData)
      setMarketPriceData(marketData)

      const count = searchData.listings ? searchData.listings.length : 0
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

  // --- FILTER CHANGE HANDLER - RE-SEARCH WITH NEW FILTERS ---
  const handleFilterChange = async (filterKey, value) => {
    const newFilters = { ...filters, [filterKey]: value }
    setFilters(newFilters)

    // Re-search with new filters if we have a keyword
    if (currentKeyword) {
      await handleSearch(currentKeyword, newFilters)
    }
  }

  // Tab items
  const tabItems = [
    {
      key: '1',
      label: 'Tất Cả Sản Phẩm',
      children: (
        <>
          {/* Price Statistics */}
          {searchResults?.summary && (
            <PriceStats summary={searchResults.summary} />
          )}

          {/* Listings Table */}
          <ListingsTable 
            listings={searchResults?.listings} 
            loading={loading} 
          />
        </>
      ),
    },
    {
      key: '2',
      label: 'Giá Thị Trường & Sản Phẩm Tương Tự',
      children: (
        <div className="space-y-6">
          {/* Market Price Card */}
          {marketPriceData && (
            <MarketPriceCard marketData={marketPriceData} />
          )}

          {/* Price History Chart */}
          {marketPriceData?.priceHistory && marketPriceData.priceHistory.length > 0 && (
            <PriceHistoryChart priceHistory={marketPriceData.priceHistory} />
          )}

          {/* Similar Listings Table */}
          {marketPriceData?.similarListings && (
            <SimilarListingsTable 
              listings={marketPriceData.similarListings} 
              loading={loading}
            />
          )}

          {!marketPriceData && !loading && (
            <div className="text-center py-12 text-gray-500">
              Không có dữ liệu giá thị trường
            </div>
          )}
        </div>
      ),
    },
  ]

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
          {/* Hero Section - hidden when results exist */}
          {!searchResults && <HeroSection />}

          {/* Search Section */}
          <div className={searchResults ? "pt-8" : ""}>
             <SearchSection onSearch={(keyword) => handleSearch(keyword)} loading={loading} />
          </div>

          {/* Search Results */}
          {searchResults && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Filter Bar */}
              <FilterBar 
                filters={filters} 
                onFilterChange={handleFilterChange}
                availableFilters={searchResults.availableFilters}
              />

              {/* Tabs for different views */}
              <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <Tabs 
                    activeKey={activeTab} 
                    onChange={setActiveTab} 
                    items={tabItems}
                    size="large"
                  />
                </div>
              </div>
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
