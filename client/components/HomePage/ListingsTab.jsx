"use client"

import { Typography } from "antd"
import PriceStats from "@/components/HomePage/PriceStats"
import ListingsTable from "@/components/ListingsTable"
import ProductWatchButton from "@/components/ProductWatchButton"

const { Title, Text } = Typography

export default function ListingsTab({
  searchResults,
  marketPriceData,
  filters,
  loading,
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card px-4 pt-3 pb-2 sm:px-5 sm:pb-2.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 flex flex-col gap-0.5">
            <Title level={5} className="!mb-0 !mt-0">
              Compare listings at a glance
            </Title>
            <Text type="secondary" className="text-sm !mb-0 block leading-snug">
              Start with the difference checklist: storage, condition, battery, included items,
              warnings, then compare the price against the median.
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
      {searchResults?.summary ? <PriceStats summary={searchResults.summary} /> : null}
      <ListingsTable listings={searchResults?.listings} loading={loading} />
    </div>
  )
}
