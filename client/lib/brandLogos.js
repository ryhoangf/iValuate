/** Public folder for brand logo assets (see `public/brands/README.md`). */
export const BRAND_LOGO_DIR = "/brands"

/** Extensions tried in order when resolving a logo URL. Prefer WebP. */
export const BRAND_LOGO_EXTENSIONS = ["webp", "png", "svg"]

/** Brands that only ship a non-WebP asset (avoids 404 noise in dev). */
export const BRAND_LOGO_EXT_OVERRIDES = {
  sharp: "png",
}

/** Fixed brand strip on the home page (order matters). */
export const MARKET_BRANDS = [
  { id: "apple", label: "Apple" },
  { id: "samsung", label: "Samsung" },
  { id: "sony", label: "Sony" },
  { id: "sharp", label: "SHARP" },
  { id: "google", label: "Google" },
  { id: "xiaomi", label: "Xiaomi" },
  { id: "oppo", label: "OPPO" },
  { id: "huawei", label: "Huawei" },
]

export const MARKET_BRAND_ID_SET = new Set(MARKET_BRANDS.map((b) => b.id))

/**
 * Build logo URL for a catalog brand id.
 * @param {string} brandId - slug from brand catalog API (e.g. "apple")
 * @param {number} [extIndex=0]
 */
export function getBrandLogoSrc(brandId, extIndex = 0) {
  const id = String(brandId || "").trim()
  if (!id) return null
  const override = BRAND_LOGO_EXT_OVERRIDES[id]
  if (override && extIndex === 0) {
    return `${BRAND_LOGO_DIR}/${id}.${override}`
  }
  const ext = BRAND_LOGO_EXTENSIONS[extIndex] ?? BRAND_LOGO_EXTENSIONS[0]
  return `${BRAND_LOGO_DIR}/${id}.${ext}`
}

/** Keep only fixed market brands, in catalog order, with stable labels. */
export function filterMarketBrands(brands) {
  const byId = new Map(
    (Array.isArray(brands) ? brands : [])
      .filter((b) => b?.id && MARKET_BRAND_ID_SET.has(b.id))
      .map((b) => [b.id, b])
  )

  return MARKET_BRANDS.map(({ id, label }) => {
    const fromApi = byId.get(id)
    return fromApi
      ? { ...fromApi, label }
      : { id, label, models: [] }
  })
}
