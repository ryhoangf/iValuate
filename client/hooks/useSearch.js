"use client"

import { useCallback, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { App } from "antd"
import {
  INITIAL_FILTERS,
  getResetFilters,
  serializeFiltersForCache,
} from "@/lib/filters"
import { runSearchPipeline } from "@/lib/searchPipeline"

function searchCacheKey(keyword, filters) {
  return ["searchBundle", keyword, serializeFiltersForCache(filters)]
}

export function useSearch({ onSearchStart, onSearchSuccess } = {}) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [currentKeyword, setCurrentKeyword] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [searchResults, setSearchResults] = useState(null)
  const [marketPriceData, setMarketPriceData] = useState(null)
  const [activeTab, setActiveTab] = useState("1")

  const applyBundle = useCallback((bundle) => {
    setSearchResults(bundle.searchData)
    setMarketPriceData(bundle.marketData)
    return bundle
  }, [])

  const searchMutation = useMutation({
    mutationFn: async ({ keyword, appliedFilters, productId, skipCache }) => {
      const cacheKey = searchCacheKey(keyword, appliedFilters)
      if (!skipCache) {
        const cached = queryClient.getQueryData(cacheKey)
        if (cached) return cached
      }
      const bundle = await runSearchPipeline(keyword, appliedFilters, productId)
      queryClient.setQueryData(cacheKey, bundle)
      return bundle
    },
    onMutate: () => {
      onSearchStart?.()
    },
    onSuccess: (bundle, variables) => {
      applyBundle(bundle)
      onSearchSuccess?.(bundle, variables)

      if (
        bundle.searchData.availableFilters?.batteryRange &&
        variables.appliedFilters.minBattery === null
      ) {
        setFilters((prev) => ({
          ...prev,
          minBattery: bundle.searchData.availableFilters.batteryRange.min,
        }))
      }

      const count = bundle.searchData.listings?.length ?? 0
      if (count > 0) {
        message.success(`Found ${count} result${count === 1 ? "" : "s"}`)
      } else {
        message.info("No products found")
      }
    },
    onError: (error) => {
      if (error?.status >= 500) {
        message.error("Could not reach the product database. Please check the MySQL tunnel and try again.")
        return
      }
      message.error(error.message || "Server connection error")
    },
  })

  const resetToHomeTop = useCallback(() => {
    setSearchResults(null)
    setMarketPriceData(null)
    setCurrentKeyword("")
    setActiveTab("1")
    setSearchKeyword("")
    setFilters(INITIAL_FILTERS)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const handleSearch = useCallback(
    async (keyword, appliedFilters = filters, productId) => {
      setCurrentKeyword(keyword)
      return searchMutation.mutateAsync({
        keyword,
        appliedFilters,
        productId,
        skipCache: false,
      })
    },
    [filters, searchMutation]
  )

  const handleSearchFromUi = useCallback(
    (input) => {
      const payload =
        typeof input === "object" && input != null
          ? input
          : { keyword: String(input || "").trim() }
      const k = String(payload.keyword || "").trim()
      if (!k) return
      setSearchKeyword(k)
      void handleSearch(k, filters, payload.productId)
    },
    [filters, handleSearch]
  )

  const handleFilterChange = useCallback(
    async (filterKey, value) => {
      const newFilters = { ...filters, [filterKey]: value }
      setFilters(newFilters)
      if (currentKeyword) {
        await handleSearch(currentKeyword, newFilters)
      }
    },
    [filters, currentKeyword, handleSearch]
  )

  const handleResetFilters = useCallback(() => {
    const resetFilters = getResetFilters(searchResults?.availableFilters)
    setFilters(resetFilters)
    if (currentKeyword) {
      void handleSearch(currentKeyword, resetFilters)
    }
  }, [searchResults?.availableFilters, currentKeyword, handleSearch])

  return {
    filters,
    setFilters,
    currentKeyword,
    searchKeyword,
    setSearchKeyword,
    searchResults,
    marketPriceData,
    loading: searchMutation.isPending,
    activeTab,
    setActiveTab,
    handleSearch,
    handleSearchFromUi,
    handleFilterChange,
    handleResetFilters,
    resetToHomeTop,
  }
}
