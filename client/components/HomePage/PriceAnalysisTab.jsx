"use client"

import { Typography, Divider, Alert } from "antd"
import MarketPriceCard from "@/components/MarketPriceCard"
import SimilarListingsTable from "@/components/SimilarListingsTable"
import PriceHistoryChart from "@/components/PriceHistoryChart"
import PriceForecast30dPanel, { normalizeForecast30d } from "@/components/PriceForecast30dPanel"
import ModelDepreciationChart from "@/components/ModelDepreciationChart"
import FeatureCounterfactualPanel from "@/components/FeatureCounterfactualPanel"
import FeatureImpactConfigPanel from "@/components/FeatureImpactConfigPanel"
import ProductWatchButton from "@/components/ProductWatchButton"
import PriceAnalysisNav from "@/components/HomePage/PriceAnalysisNav"
import ErrorBoundary from "@/components/ErrorBoundary"
import { ChartSkeleton } from "@/components/LoadingSkeletons"
import { isPremiumAnalysis } from "@/hooks/usePriceAnalysis"

const { Title, Text } = Typography

function SectionHeader({ num, colorClass, title, description }) {
  return (
    <div>
      <Title level={5} className="!mb-0 flex items-center gap-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${colorClass}`}
        >
          {num}
        </span>
        {title}
      </Title>
      {description ? (
        <Text type="secondary" className="text-sm">
          {description}
        </Text>
      ) : null}
    </div>
  )
}

export default function PriceAnalysisTab({
  marketPriceData,
  searchResults,
  filters,
  loading,
  impactConfig,
  setImpactConfig,
  onImpactApply,
  onSuggestImpact,
  counterfactualReport,
  counterfactualLoading,
  counterfactualError,
  counterfactualIncludeAll,
  onCounterfactualReload,
  depreciationCurve,
  depreciationLoading,
  depreciationError,
  forecast30d,
  forecast30dLoading,
  forecast30dError,
}) {
  const premium = isPremiumAnalysis(marketPriceData)
  const hasSimilar = Boolean(marketPriceData?.similarListings?.length)
  const hasPriceHistory = Boolean(marketPriceData?.priceHistory?.length)
  const forecast = normalizeForecast30d(forecast30d)
  const hasForecastPoints = Boolean(forecast?.points?.length)
  // Show history once we have market data (search completed) or while loading
  const showHistorySection = premium && Boolean(marketPriceData || loading)
  // Show forecast whenever it's loading, errored, or the API responded (even empty)
  const showForecastSection =
    premium &&
    Boolean(marketPriceData?.product?.id || forecast30dLoading || forecast30dError != null || forecast30d != null)
  let sectionNum = 1

  return (
    <div className="space-y-8">
      <PriceAnalysisNav isPremium={premium} hasSimilar={hasSimilar} />

      {!marketPriceData ? (
        <Alert
          type="info"
          showIcon
          title="No analysis data for this keyword"
          description="Try a more specific model name, or check that the backend and price service are running."
          className="rounded-xl"
        />
      ) : null}

      <section id="price-section-market" className="scroll-mt-36 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <SectionHeader
            num={sectionNum++}
            colorClass="bg-blue-600"
            title="Market price range & summary"
            description="Fair price range from real listings and price history."
          />
          <ProductWatchButton
            marketPriceData={marketPriceData}
            searchResults={searchResults}
            filters={filters}
            variant="compact"
          />
        </div>
        {marketPriceData ? <MarketPriceCard marketData={marketPriceData} /> : null}
      </section>

      {premium && searchResults ? (
        <>
          <Divider className="!my-2" />
          <section id="price-section-impact" className="scroll-mt-36 space-y-4">
            <SectionHeader
              num={sectionNum++}
              colorClass="bg-amber-500"
              title="Why might this phone sell for less?"
              description="Fill in the phone's specs below, run the analysis, and see exactly which factors pull the price down — ranked by estimated impact."
            />
            <ErrorBoundary section="impact-config" title="Could not show analysis settings">
              <FeatureImpactConfigPanel
                config={impactConfig}
                availableFilters={searchResults?.availableFilters}
                onChange={setImpactConfig}
                onApply={onImpactApply}
                onSuggest={onSuggestImpact}
                loading={counterfactualLoading}
                disabled={loading}
              />
            </ErrorBoundary>
            <ErrorBoundary section="impact-results" title="Could not show price impact results">
              <FeatureCounterfactualPanel
                report={counterfactualReport}
                loading={counterfactualLoading}
                error={counterfactualError}
                includeAllScenarios={counterfactualIncludeAll}
                onReload={onCounterfactualReload}
              />
            </ErrorBoundary>
          </section>
        </>
      ) : null}

      {showHistorySection ? (
        <>
          <Divider className="!my-2" />
          <section id="price-section-history" className="scroll-mt-36 space-y-4">
            <SectionHeader
              num={sectionNum++}
              colorClass="bg-slate-600"
              title="Price over time"
              description="Actual average prices from past listing data."
            />
            <ErrorBoundary section="history" title="Could not load price history">
              {loading && !hasPriceHistory ? (
                <ChartSkeleton />
              ) : hasPriceHistory ? (
                <PriceHistoryChart
                  priceHistory={marketPriceData.priceHistory}
                  loading={loading}
                />
              ) : (
                <Alert
                  type="info"
                  showIcon
                  description="No price history recorded yet for this model. History builds up as listings are tracked over time."
                  className="rounded-xl"
                />
              )}
            </ErrorBoundary>
          </section>
        </>
      ) : null}

      {showForecastSection ? (
        <>
          <Divider className="!my-2" />
          <section id="price-section-forecast" className="scroll-mt-36 space-y-4">
            <SectionHeader
              num={sectionNum++}
              colorClass="bg-violet-600"
              title="Next 30 days (estimate)"
              description="Projected trend based on history and the pricing model — use as a guide, not a guarantee."
            />
            <ErrorBoundary section="forecast" title="Could not load forecast">
              <PriceForecast30dPanel
                forecastRaw={forecast30d}
                priceHistory={marketPriceData?.priceHistory}
                loading={forecast30dLoading}
                error={forecast30dError}
              />
            </ErrorBoundary>
          </section>
        </>
      ) : null}

      {premium &&
      (marketPriceData?.product?.id || depreciationLoading || depreciationError) ? (
        <>
          <Divider className="!my-2" />
          <section id="price-section-depreciation" className="scroll-mt-36 space-y-4">
            <SectionHeader
              num={sectionNum++}
              colorClass="bg-zinc-600"
              title="How value drops as the phone ages"
              description="Model simulation with fixed assumptions — not the same as today&apos;s listing prices."
            />
            <ErrorBoundary section="depreciation" title="Could not load depreciation chart">
              <ModelDepreciationChart
                curve={depreciationCurve}
                loading={depreciationLoading}
                error={depreciationError}
              />
            </ErrorBoundary>
          </section>
        </>
      ) : null}

      {hasSimilar ? (
        <>
          <Divider className="!my-2" />
          <section id="price-section-similar" className="scroll-mt-36 space-y-4">
            <SectionHeader
              num={sectionNum++}
              colorClass="bg-emerald-600"
              title="Similar listings nearby"
              description="Other listings close to the estimated market price for reference."
            />
            <SimilarListingsTable listings={marketPriceData.similarListings} />
          </section>
        </>
      ) : null}

      {marketPriceData && !premium ? (
        <Alert
          type="info"
          showIcon
          title="Upgrade to Premium for deeper analysis"
          description="Price impact breakdown, history charts, 30-day estimate, and depreciation curve. Upgrade from the account menu."
          className="rounded-xl"
        />
      ) : null}
    </div>
  )
}
