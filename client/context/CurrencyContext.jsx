"use client"

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react"
import {
  DEFAULT_YEN_TO_VND,
  DISPLAY_CURRENCY,
  formatJpy,
  formatMoney,
  formatMoneyCompact,
  formatVnd,
  vndToJpy,
} from "@/lib/currency"

const STORAGE_KEY = "ivaluate-display-currency"

const CurrencyContext = createContext(null)

function readStoredCurrency() {
  if (typeof window === "undefined") return DISPLAY_CURRENCY.VND
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === DISPLAY_CURRENCY.JPY ? DISPLAY_CURRENCY.JPY : DISPLAY_CURRENCY.VND
}

function subscribeCurrency(callback) {
  if (typeof window === "undefined") return () => {}
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY) callback()
  }
  const onLocalChange = () => callback()
  window.addEventListener("storage", onStorage)
  window.addEventListener("ivaluate-currency-changed", onLocalChange)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener("ivaluate-currency-changed", onLocalChange)
  }
}

export function CurrencyProvider({ children, yenToVnd = DEFAULT_YEN_TO_VND }) {
  const currency = useSyncExternalStore(
    subscribeCurrency,
    readStoredCurrency,
    () => DISPLAY_CURRENCY.VND
  )

  const setCurrency = useCallback((next) => {
    const c = next === DISPLAY_CURRENCY.JPY ? DISPLAY_CURRENCY.JPY : DISPLAY_CURRENCY.VND
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, c)
      window.dispatchEvent(new CustomEvent("ivaluate-currency-changed", { detail: c }))
    }
  }, [])

  const toggleCurrency = useCallback(() => {
    setCurrency(currency === DISPLAY_CURRENCY.JPY ? DISPLAY_CURRENCY.VND : DISPLAY_CURRENCY.JPY)
  }, [currency, setCurrency])

  const formatFromVnd = useCallback(
    (amountVnd, opts) => formatMoney(amountVnd, currency, { rate: yenToVnd, ...opts }),
    [currency, yenToVnd]
  )

  const formatListingPrice = useCallback(
    (listing) => {
      const vnd = listing?.price ?? listing?.predicted_price
      const jpy = listing?.originalPrice ?? listing?.original_price
      return formatMoney(vnd, currency, { rate: yenToVnd, originalJpy: jpy })
    },
    [currency, yenToVnd]
  )

  const formatCompactFromVnd = useCallback(
    (amountVnd, opts) => formatMoneyCompact(amountVnd, currency, { rate: yenToVnd, ...opts }),
    [currency, yenToVnd]
  )

  const value = useMemo(
    () => ({
      currency,
      isJpy: currency === DISPLAY_CURRENCY.JPY,
      yenToVnd,
      setCurrency,
      toggleCurrency,
      formatFromVnd,
      formatListingPrice,
      formatCompactFromVnd,
      formatVnd,
      formatJpy,
      vndToJpy: (vnd) => vndToJpy(vnd, yenToVnd),
    }),
    [
      currency,
      yenToVnd,
      setCurrency,
      toggleCurrency,
      formatFromVnd,
      formatListingPrice,
      formatCompactFromVnd,
    ]
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    throw new Error("useCurrency must be used within CurrencyProvider")
  }
  return ctx
}
