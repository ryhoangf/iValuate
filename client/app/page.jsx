"use client"

import { useState } from "react"
import { ConfigProvider, App, theme, Tabs, Typography, Divider, Alert } from "antd"
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
import ModelDepreciationChart from "@/components/ModelDepreciationChart"
import FeatureCounterfactualPanel from "@/components/FeatureCounterfactualPanel"
import ProductWatchButton from "@/components/ProductWatchButton"

// Import API
import { productApi } from "@/lib/api"

const { Title, Text } = Typography

function isPremiumAnalysis(md) {
  return md?.subscriptionTier === "premium"
}

function formatVnd(n) {
  if (n == null || Number.isNaN(n)) return "—"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
}

// Tách component để dùng useApp hook
function HomePageContent() {
  const { message } = App.useApp()  // ← Thêm hook
  const [searchResults, setSearchResults] = useState(null)
  const [marketPriceData, setMarketPriceData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentKeyword, setCurrentKeyword] = useState("")
  const [activeTab, setActiveTab] = useState("1")
  const [depreciationCurve, setDepreciationCurve] = useState(null)
  const [depreciationLoading, setDepreciationLoading] = useState(false)
  const [depreciationError, setDepreciationError] = useState(null)
  const [counterfactualReport, setCounterfactualReport] = useState(null)
  const [counterfactualLoading, setCounterfactualLoading] = useState(false)
  const [counterfactualError, setCounterfactualError] = useState(null)
  const [counterfactualIncludeAll, setCounterfactualIncludeAll] = useState(false)
  const [lastSearchMlFilters, setLastSearchMlFilters] = useState(null)

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
    hasCable: null,
    hasEarphones: null,
    isSimFree: null,
    fullyFunctional: null,
  })

  // Build features object for market price API from filters
  const buildFeaturesFromFilters = (appliedFilters) => {
    return {
      condition: appliedFilters.condition !== "all" ? appliedFilters.condition : undefined,
      color: appliedFilters.color !== "all" ? appliedFilters.color : undefined,
      battery_health: appliedFilters.minBattery,
      screenCondition: appliedFilters.screenCondition !== "all" ? appliedFilters.screenCondition : undefined,
      bodyCondition: appliedFilters.bodyCondition !== "all" ? appliedFilters.bodyCondition : undefined,
      batteryStatus: appliedFilters.batteryStatus !== "all" ? appliedFilters.batteryStatus : undefined,
      batteryReplaced: appliedFilters.batteryReplaced,
      hasBox: appliedFilters.hasBox,
      hasCharger: appliedFilters.hasCharger,
      hasCable: appliedFilters.hasCable,
      hasEarphones: appliedFilters.hasEarphones,
      isSimFree: appliedFilters.isSimFree,
      fullyFunctional: appliedFilters.fullyFunctional,
    }
  }

  const loadCounterfactual = async (productId, kw, mlFilters, includeAll) => {
    setCounterfactualLoading(true)
    setCounterfactualError(null)
    try {
      const data = await productApi.postCounterfactualImpact({
        productId,
        keyword: kw || undefined,
        filters: mlFilters || {},
        includeAllScenarios: includeAll,
      })
      setCounterfactualReport(data)
    } catch (e) {
      setCounterfactualReport(null)
      setCounterfactualError(e.message || String(e))
    } finally {
      setCounterfactualLoading(false)
    }
  }

  // --- SEARCH FUNCTION - CALLS BACKEND WITH FILTERS ---
  const handleSearch = async (keyword, appliedFilters = filters) => {
    setLoading(true)
    setSearchResults(null)
    setMarketPriceData(null)
    setDepreciationCurve(null)
    setDepreciationError(null)
    setCounterfactualReport(null)
    setCounterfactualError(null)
    setCurrentKeyword(keyword)

    try {
      // Build features for market price
      const features = buildFeaturesFromFilters(appliedFilters)

      // Call both APIs in parallel
      const [searchData, marketData] = await Promise.all([
        productApi.search(keyword, appliedFilters),
        productApi.getMarketPrice(keyword, features).catch(err => {
          console.error("Market price error:", err)
          return null
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

      let mlFiltersForImpact = { ...appliedFilters }
      if (
        searchData.availableFilters?.batteryRange &&
        (mlFiltersForImpact.minBattery == null || mlFiltersForImpact.minBattery === undefined)
      ) {
        mlFiltersForImpact = {
          ...mlFiltersForImpact,
          minBattery: searchData.availableFilters.batteryRange.min,
        }
      }
      setLastSearchMlFilters(mlFiltersForImpact)

      const premium = marketData?.subscriptionTier === "premium"

      if (marketData?.product?.id && premium) {
        setDepreciationLoading(true)
        productApi
          .getDepreciationCurve({ productId: marketData.product.id })
          .then(setDepreciationCurve)
          .catch((e) => {
            setDepreciationCurve(null)
            setDepreciationError(e.message || String(e))
          })
          .finally(() => setDepreciationLoading(false))

        void loadCounterfactual(
          marketData.product.id,
          keyword,
          mlFiltersForImpact,
          counterfactualIncludeAll
        )
      } else {
        setDepreciationCurve(null)
        setDepreciationError(null)
        setDepreciationLoading(false)
        setCounterfactualReport(null)
        setCounterfactualError(null)
        setCounterfactualLoading(false)
      }

      if (!marketData?.product?.id) {
        setCounterfactualReport(null)
        setCounterfactualError(null)
        setCounterfactualLoading(false)
      }

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

  const handleResetFilters = () => {
    const resetFilters = {
      condition: "all",
      color: "all",
      platform: "all",
      batteryStatus: "all",
      screenCondition: "all",
      bodyCondition: "all",
      minBattery: searchResults?.availableFilters?.batteryRange?.min ?? null,
      batteryReplaced: null,
      hasBox: null,
      hasCharger: null,
      hasCable: null,
      hasEarphones: null,
      isSimFree: null,
      fullyFunctional: null,
    }
    setFilters(resetFilters)

    if (currentKeyword) {
      handleSearch(currentKeyword, resetFilters)
    }
  }

  const handleCounterfactualReload = (includeAll) => {
    setCounterfactualIncludeAll(includeAll)
    if (
      marketPriceData?.product?.id &&
      lastSearchMlFilters &&
      isPremiumAnalysis(marketPriceData)
    ) {
      void loadCounterfactual(
        marketPriceData.product.id,
        currentKeyword,
        lastSearchMlFilters,
        includeAll
      )
    }
  }

  // Tab items — thứ tự: tin đăng trước, phân tích & biểu đồ sau
  const tabItems = [
    {
      key: "1",
      label: (
        <span className="inline-flex flex-col items-start sm:items-center sm:text-center leading-tight">
          <span className="font-medium">Tin đăng</span>
          <span className="text-xs font-normal text-muted-foreground hidden sm:inline">
            Bảng & thống kê nhanh
          </span>
        </span>
      ),
      children: (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-white px-4 pt-3 pb-2 sm:px-5 sm:pb-2.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                <Title level={5} className="!mb-0 !mt-0">
                  Kết quả tin đăng
                </Title>
                <Text type="secondary" className="text-sm !mb-0 block leading-snug">
                  Thống kê và danh sách theo bộ lọc phía trên. Sắp xếp, lọc cột trực tiếp trên bảng.
                </Text>
              </div>
              <ProductWatchButton
                marketPriceData={marketPriceData}
                searchResults={searchResults}
                filters={filters}
                variant="compact"
              />
            </div>
          </div>
          {searchResults?.summary && <PriceStats summary={searchResults.summary} />}
          <ListingsTable listings={searchResults?.listings} loading={loading} />
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <span className="inline-flex flex-col items-start sm:items-center sm:text-center leading-tight">
          <span className="font-medium">Phân tích giá</span>
          <span className="text-xs font-normal text-muted-foreground hidden sm:inline">
            Thị trường, lịch sử & mô hình
          </span>
        </span>
      ),
      children: (
        <div className="space-y-8">
          {!marketPriceData && (
            <Alert
              type="info"
              showIcon
              title="Chưa có dữ liệu phân tích cho từ khóa này"
              description="Thử từ khóa cụ thể hơn (vd. đúng tên model trên hệ thống) hoặc kiểm tra kết nối backend / FastAPI nếu bạn dùng đường cong mô hình."
              className="rounded-xl"
            />
          )}

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <Title level={5} className="!mb-0 flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                    1
                  </span>
                  Khoảng giá &amp; tóm tắt thị trường
                </Title>
                <Text type="secondary" className="text-sm">
                  Ước lượng từ dữ liệu thực tế (listings / lịch sử).
                </Text>
              </div>
              <ProductWatchButton
                marketPriceData={marketPriceData}
                searchResults={searchResults}
                filters={filters}
                variant="compact"
              />
            </div>
            {marketPriceData ? (
              <MarketPriceCard marketData={marketPriceData} />
            ) : null}
          </section>

          {isPremiumAnalysis(marketPriceData) &&
            (marketPriceData?.product?.id ||
              counterfactualLoading ||
              counterfactualError ||
              counterfactualReport) && (
              <>
                <Divider className="!my-2" />
                <section className="space-y-4">
                  <div>
                    <Title level={5} className="!mb-0 flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-xs font-bold text-white">
                        2
                      </span>
                      Tác động từng yếu tố (mô hình ML)
                    </Title>
                    <Text type="secondary" className="text-sm">
                      So sánh kịch bản: mỗi hàng chỉ đổi một biến so với baseline hiện tại (pin, hộp, màn, …).
                    </Text>
                  </div>
                  <FeatureCounterfactualPanel
                    report={counterfactualReport}
                    loading={counterfactualLoading}
                    error={counterfactualError}
                    includeAllScenarios={counterfactualIncludeAll}
                    onReload={handleCounterfactualReload}
                  />
                </section>
              </>
            )}

          {isPremiumAnalysis(marketPriceData) && (
            <>
              <Divider className="!my-2" />
              <section className="space-y-4">
                <div>
                  <Title level={5} className="!mb-0 flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-600 text-xs font-bold text-white">
                      3
                    </span>
                    Dữ liệu thực tế theo thời gian
                  </Title>
                  <Text type="secondary" className="text-sm">
                    Lịch sử giá; đường tím (nếu có) là dự báo từ dữ liệu đã lưu.
                  </Text>
                </div>
                {marketPriceData?.priceHistory?.length ? (
                  <PriceHistoryChart
                    priceHistory={marketPriceData.priceHistory}
                    priceForecasts={marketPriceData.priceForecasts}
                  />
                ) : (
                  <Alert
                    type="warning"
                    showIcon
                    title="Chưa có chuỗi lịch sử giá để vẽ biểu đồ"
                    className="rounded-xl"
                  />
                )}
              </section>
            </>
          )}

          {isPremiumAnalysis(marketPriceData) &&
            (marketPriceData?.product?.id || depreciationLoading || depreciationError) && (
              <>
                <Divider className="!my-2" />
                <section className="space-y-4">
                  <div>
                    <Title level={5} className="!mb-0 flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-600 text-xs font-bold text-white">
                        4
                      </span>
                      Mô phỏng theo mô hình (khuyến nghị đọc chú thích)
                    </Title>
                    <Text type="secondary" className="text-sm">
                      Đường cong trượt giá theo tuổi thiết bị — baseline cố định, không thay thế giá niêm yết thực tế.
                    </Text>
                  </div>
                  <ModelDepreciationChart
                    curve={depreciationCurve}
                    loading={depreciationLoading}
                    error={depreciationError}
                  />
                </section>
              </>
            )}

          {marketPriceData?.similarListings?.length ? (
            <>
              <Divider className="!my-2" />
              <section className="space-y-4">
                <div>
                  <Title level={5} className="!mb-0 flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
                      {isPremiumAnalysis(marketPriceData) ? 5 : 2}
                    </span>
                    Tin tương tự trong khoảng giá
                  </Title>
                  <Text type="secondary" className="text-sm">
                    Gợi ý tham khảo từ các listing gần mức giá thị trường.
                  </Text>
                </div>
                <SimilarListingsTable listings={marketPriceData.similarListings} />
              </section>
            </>
          ) : null}

          {marketPriceData && !isPremiumAnalysis(marketPriceData) ? (
            <Alert
              type="info"
              showIcon
              title="Đăng ký Premium để có thêm tính năng phân tích"
              description="Phân tích tác động từng yếu tố (ML), biểu đồ lịch sử giá & dự báo, và đường cong trượt giá theo mô hình. Liên hệ quản trị hoặc nâng cấp tài khoản trong menu tài khoản."
              className="rounded-xl"
            />
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Search Section */}
      <SearchSection onSearch={handleSearch} loading={loading} />
      
      {/* Main Content */}
      {searchResults && (
        <div className="container mx-auto max-w-7xl px-4 py-6 sm:py-8">
          <div className="mb-4">
            <Title level={4} className="!mb-1">
              Kết quả tìm kiếm
            </Title>
            <Text type="secondary" className="text-sm">
              Từ khóa <Text strong>{currentKeyword || "—"}</Text>
              {searchResults?.summary != null && (
                <>
                  {" "}
                  · {searchResults.summary.count} tin
                  {" · "}
                  {formatVnd(searchResults.summary.min)} — {formatVnd(searchResults.summary.max)}
                </>
              )}
            </Text>
          </div>

          <FilterBar
            filters={filters}
            availableFilters={searchResults.availableFilters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            loading={loading}
          />

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
            type="card"
            className="mt-6 w-full [&_.ant-tabs-nav]:mb-6 [&_.ant-tabs-nav]:w-full [&_.ant-tabs-nav-wrap]:w-full [&_.ant-tabs-nav-list]:!flex [&_.ant-tabs-nav-list]:w-full [&_.ant-tabs-tab]:!flex-1 [&_.ant-tabs-tab]:!basis-0 [&_.ant-tabs-tab]:!justify-center [&_.ant-tabs-tab-btn]:!mx-0 [&_.ant-tabs-tab-btn]:flex [&_.ant-tabs-tab-btn]:w-full [&_.ant-tabs-tab-btn]:justify-center"
          />
        </div>
      )}
    </div>
  )
}

// Main component wrapper
export default function HomePage() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: "#1890ff",
          borderRadius: 8,
        },
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <App>
        <HomePageContent />
      </App>
    </ConfigProvider>
  )
}
