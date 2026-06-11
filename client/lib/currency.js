/** Tỷ giá ¥→VND (khớp server DEPRECIATION_YEN_TO_VND). */
export const DEFAULT_YEN_TO_VND = Number(
  process.env.NEXT_PUBLIC_YEN_TO_VND || 170
)

export const DISPLAY_CURRENCY = {
  VND: "VND",
  JPY: "JPY",
}

export function vndToJpy(vnd, rate = DEFAULT_YEN_TO_VND) {
  const n = Number(vnd)
  const r = Number(rate)
  if (!Number.isFinite(n) || !Number.isFinite(r) || r <= 0) return null
  return Math.round(n / r)
}

export function formatVnd(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(amount))
}

export function formatJpy(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return "—"
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(Number(amount))
}

/**
 * @param {number} amountVnd — giá đã quy đổi VND trong DB
 * @param {'VND'|'JPY'} currency
 * @param {{ rate?: number, originalJpy?: number|null }} opts — ưu tiên originalJpy khi hiển thị ¥
 */
export function formatMoney(amountVnd, currency, opts = {}) {
  const rate = opts.rate ?? DEFAULT_YEN_TO_VND
  if (currency === DISPLAY_CURRENCY.JPY) {
    const jpy =
      opts.originalJpy != null && !Number.isNaN(Number(opts.originalJpy))
        ? Number(opts.originalJpy)
        : vndToJpy(amountVnd, rate)
    return formatJpy(jpy)
  }
  return formatVnd(amountVnd)
}

/** Nhãn trục biểu đồ (vd. 1.2M / ¥75k) */
export function formatMoneyCompact(amountVnd, currency, opts = {}) {
  const rate = opts.rate ?? DEFAULT_YEN_TO_VND
  if (currency === DISPLAY_CURRENCY.JPY) {
    const jpy =
      opts.originalJpy != null && !Number.isNaN(Number(opts.originalJpy))
        ? Number(opts.originalJpy)
        : vndToJpy(amountVnd, rate)
    if (jpy == null) return "—"
    if (jpy >= 1_000_000) return `¥${(jpy / 1_000_000).toFixed(1)}M`
    if (jpy >= 1_000) return `¥${Math.round(jpy / 1_000)}k`
    return `¥${jpy}`
  }
  const v = Number(amountVnd)
  if (Number.isNaN(v)) return "—"
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  return `${Math.round(v / 1_000)}k`
}
