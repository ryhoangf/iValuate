"use client"

import { useEffect, useRef } from "react"
import { Tabs, Typography } from "antd"
import Navbar from "@/components/Navbar"
import HeroSection from "@/components/HomePage/HeroSection"
import BrandMarketHeader from "@/components/HomePage/BrandMarketHeader"
import FilterBar from "@/components/FilterBar"
import ListingsTab from "@/components/HomePage/ListingsTab"
import PriceAnalysisTab from "@/components/HomePage/PriceAnalysisTab"
import { useCurrency } from "@/context/CurrencyContext"
import { useSearch } from "@/hooks/useSearch"
import { usePriceAnalysis } from "@/hooks/usePriceAnalysis"

const { Title, Text } = Typography

function HomePageContent() {
  const { formatFromVnd } = useCurrency()
  const formatVnd = (n) => formatFromVnd(n)
  const analysisHandlers = useRef({})

  const search = useSearch({
    onSearchStart: () => analysisHandlers.current.resetAnalysis?.(),
    onSearchSuccess: (bundle) =>
      analysisHandlers.current.loadPremiumSideEffects?.(bundle.keyword, bundle, false),
  })

  const analysis = usePriceAnalysis({
    currentKeyword: search.currentKeyword,
    searchResults: search.searchResults,
    marketPriceData: search.marketPriceData,
  })
  const { resetAnalysis, loadPremiumSideEffects } = analysis
  const { resetToHomeTop } = search

  useEffect(() => {
    analysisHandlers.current = {
      resetAnalysis,
      loadPremiumSideEffects,
    }
  }, [resetAnalysis, loadPremiumSideEffects])

  useEffect(() => {
    const onGoHomeTop = () => {
      resetAnalysis()
      resetToHomeTop()
    }
    window.addEventListener("ivaluate-go-home-top", onGoHomeTop)
    return () => window.removeEventListener("ivaluate-go-home-top", onGoHomeTop)
  }, [resetAnalysis, resetToHomeTop])

  const tabItems = [
    {
      key: "1",
      label: (
        <span className="inline-flex flex-col items-start sm:items-center sm:text-center leading-tight">
          <span className="font-medium">Listings</span>
          <span className="text-xs font-normal text-foreground/65 hidden sm:inline">
            Table & quick stats
          </span>
        </span>
      ),
      children: (
        <ListingsTab
          searchResults={search.searchResults}
          marketPriceData={search.marketPriceData}
          filters={search.filters}
          loading={search.loading}
        />
      ),
    },
    {
      key: "2",
      label: (
        <span className="inline-flex flex-col items-start sm:items-center sm:text-center leading-tight">
          <span className="font-medium">Price analysis</span>
          <span className="text-xs font-normal text-foreground/65 hidden sm:inline">
            Market, history & models
          </span>
        </span>
      ),
      children: (
        <PriceAnalysisTab
          marketPriceData={search.marketPriceData}
          searchResults={search.searchResults}
          filters={search.filters}
          loading={search.loading}
          impactConfig={analysis.impactConfig}
          setImpactConfig={analysis.setImpactConfig}
          onImpactApply={analysis.handleImpactConfigApply}
          onSuggestImpact={analysis.handleSuggestImpactFromListings}
          counterfactualReport={analysis.counterfactualReport}
          counterfactualLoading={analysis.counterfactualLoading}
          counterfactualError={analysis.counterfactualError}
          counterfactualIncludeAll={analysis.counterfactualIncludeAll}
          onCounterfactualReload={analysis.handleCounterfactualReload}
          depreciationCurve={analysis.depreciationCurve}
          depreciationLoading={analysis.depreciationLoading}
          depreciationError={analysis.depreciationError}
          forecast30d={analysis.forecast30d}
          forecast30dLoading={analysis.forecast30dLoading}
          forecast30dError={analysis.forecast30dError}
        />
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-background relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-20 -left-24 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute top-40 -right-20 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background/50 to-background" />
      </div>

      <div className="relative">
        <Navbar />

        <HeroSection />

        <BrandMarketHeader
          onSelectModel={search.handleSearchFromUi}
          onSearch={search.handleSearchFromUi}
          keyword={search.searchKeyword}
          onKeywordChange={search.setSearchKeyword}
          loading={search.loading}
          disabled={search.loading}
        />

        {search.searchResults ? (
          <div className="container mx-auto max-w-7xl px-4 py-6 sm:py-8">
            <div className="mb-4">
              <Title level={4} className="!mb-1">
                Search results
              </Title>
              <Text type="secondary" className="text-sm">
                Keyword <Text strong>{search.currentKeyword || "—"}</Text>
                {search.searchResults?.summary != null ? (
                  <>
                    {" "}
                    · {search.searchResults.summary.count} listing
                    {search.searchResults.summary.count === 1 ? "" : "s"}
                    {" · "}
                    {formatVnd(search.searchResults.summary.min)} —{" "}
                    {formatVnd(search.searchResults.summary.max)}
                  </>
                ) : null}
              </Text>
            </div>

            <FilterBar
              filters={search.filters}
              availableFilters={search.searchResults.availableFilters}
              onFilterChange={search.handleFilterChange}
              onResetFilters={search.handleResetFilters}
            />

            <Tabs
              activeKey={search.activeTab}
              onChange={search.setActiveTab}
              items={tabItems}
              size="middle"
              className={[
                "mt-4 w-full min-w-0",
                // nav container
                "[&_.ant-tabs-nav]:mb-4",
                "[&_.ant-tabs-nav]:w-full",
                "[&_.ant-tabs-nav::before]:!border-b-0",
                // nav list — pill container
                "[&_.ant-tabs-nav-wrap]:w-full",
                "[&_.ant-tabs-nav-list]:!flex [&_.ant-tabs-nav-list]:w-full",
                "[&_.ant-tabs-nav-list]:rounded-xl [&_.ant-tabs-nav-list]:bg-muted/50 [&_.ant-tabs-nav-list]:p-1",
                "[&_.ant-tabs-nav-list]:border [&_.ant-tabs-nav-list]:border-border",
                // each tab pill
                "[&_.ant-tabs-tab]:!flex-1 [&_.ant-tabs-tab]:!basis-0 [&_.ant-tabs-tab]:!justify-center",
                "[&_.ant-tabs-tab]:!m-0 [&_.ant-tabs-tab]:!rounded-lg [&_.ant-tabs-tab]:!border-0",
                "[&_.ant-tabs-tab]:!px-4 [&_.ant-tabs-tab]:!py-2 [&_.ant-tabs-tab]:transition-all",
                // active tab — card-like lift
                "[&_.ant-tabs-tab-active]:!bg-card [&_.ant-tabs-tab-active]:!shadow-sm",
                // tab button
                "[&_.ant-tabs-tab-btn]:!mx-0 [&_.ant-tabs-tab-btn]:flex [&_.ant-tabs-tab-btn]:w-full [&_.ant-tabs-tab-btn]:justify-center",
                // hide ink bar
                "[&_.ant-tabs-ink-bar]:!hidden",
                // content
                "[&_.ant-tabs-content]:min-w-0 [&_.ant-tabs-tabpane]:min-w-0",
              ].join(" ")}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function HomePage() {
  return <HomePageContent />
}
