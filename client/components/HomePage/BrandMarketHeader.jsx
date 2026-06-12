"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Input, Button, Spin } from "antd"
import { SearchOutlined } from "@ant-design/icons"
import { productApi } from "@/lib/api"
import { filterMarketBrands } from "@/lib/brandLogos"
import BrandLogo from "@/components/HomePage/BrandLogo"

function modelDisplayName(model) {
  return typeof model === "string" ? model : model?.name ?? ""
}

function modelSearchKeyword(model) {
  if (typeof model === "string") return model
  return model?.searchKeyword || model?.name || ""
}

export default function BrandMarketHeader({
  onSelectModel,
  onSearch,
  loading,
  keyword: keywordProp,
  onKeywordChange,
  disabled,
}) {
  const [openId, setOpenId] = useState(null)
  const rootRef = useRef(null)
  const brandRowRef = useRef(null)
  const brandBtnRefs = useRef({})

  const [dropdownStyle, setDropdownStyle] = useState(null)
  const [brands, setBrands] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState(null)

  const [keywordLocal, setKeywordLocal] = useState("")
  const keyword = keywordProp !== undefined ? keywordProp : keywordLocal
  const setKeyword = onKeywordChange ?? setKeywordLocal

  const activeBrand = brands.find((b) => b.id === openId)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setCatalogLoading(true)
      setCatalogError(null)
      try {
        const data = await productApi.getBrandCatalog({ maxBrands: 12, perBrand: 6 })
        if (cancelled) return
        setBrands(filterMarketBrands(data.brands))
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : [])
      } catch (e) {
        if (!cancelled) {
          setCatalogError(e.message || "Failed to load catalog")
          setBrands([])
          setSuggestions([])
        }
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const updateDropdownPosition = useCallback(() => {
    if (!openId || !rootRef.current) {
      setDropdownStyle(null)
      return
    }
    const btn = brandBtnRefs.current[openId]
    const brand = brands.find((b) => b.id === openId)
    if (!btn || !brand?.models?.length) return

    const rootRect = rootRef.current.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    const names = brand.models.map(modelDisplayName)
    const longestChars = names.reduce((max, n) => Math.max(max, n.length), 0)
    const width = Math.min(Math.max(280, longestChars * 8 + 40), rootRect.width - 16)

    let left = btnRect.left - rootRect.left
    left = Math.max(8, Math.min(left, rootRect.width - width - 8))

    setDropdownStyle({
      left,
      top: btnRect.bottom - rootRect.top,
      width,
    })
  }, [openId, brands])

  useEffect(() => {
    if (keywordProp !== undefined) {
      setKeywordLocal(keywordProp)
    }
  }, [keywordProp])

  useEffect(() => {
    updateDropdownPosition()
    if (!openId) return

    window.addEventListener("resize", updateDropdownPosition)
    return () => {
      window.removeEventListener("resize", updateDropdownPosition)
    }
  }, [openId, updateDropdownPosition])

  useEffect(() => {
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpenId(null)
      }
    }
    const onEsc = (e) => {
      if (e.key === "Escape") setOpenId(null)
    }
    document.addEventListener("mousedown", onDocClick)
    document.addEventListener("keydown", onEsc)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      document.removeEventListener("keydown", onEsc)
    }
  }, [])

  const isDisabled = disabled || loading

  const handleSelect = (model) => {
    if (isDisabled || !model) return
    setOpenId(null)
    const keyword = modelSearchKeyword(model)
    const productId = typeof model === "object" ? model?.productId : undefined
    onSelectModel?.({ keyword, productId })
  }

  const handleSearch = () => {
    const k = keyword.trim()
    if (k) onSearch?.(k)
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch()
  }

  const pickSuggestion = (suggestion) => {
    setKeyword(suggestion)
    onSearch?.(suggestion)
  }

  const openBrand = (brandId) => {
    if (isDisabled) return
    setOpenId(brandId)
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <section
        ref={rootRef}
        className="brand-market-header relative z-40 mx-auto max-w-7xl overflow-visible rounded-2xl border-2 border-border text-foreground shadow-lg"
        aria-label="Choose brand and search"
      >
        <div className="relative overflow-visible">
          {catalogLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Spin size="small" />
              Loading market catalog…
            </div>
          ) : catalogError ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">{catalogError}</div>
          ) : brands.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No listings yet — use the search box below.
            </div>
          ) : (
            <div
              ref={brandRowRef}
              className="brand-market-brands grid w-full grid-cols-4 sm:grid-cols-8 divide-x divide-y sm:divide-y-0 divide-border"
            >
              {brands.map((brand) => {
                const isOpen = openId === brand.id

                return (
                  <div key={brand.id} className="min-w-0">
                    <button
                      ref={(el) => {
                        brandBtnRefs.current[brand.id] = el
                      }}
                      type="button"
                      disabled={isDisabled}
                      aria-label={brand.label}
                      className={`flex h-full w-full items-center justify-center px-2 py-3 transition-colors sm:px-2.5 sm:py-3.5 ${
                        isOpen ? "bg-primary/10" : "hover:bg-card/80"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                      aria-expanded={isOpen}
                      onClick={() => setOpenId(isOpen ? null : brand.id)}
                      onMouseEnter={() => {
                        if (
                          typeof window !== "undefined" &&
                          window.matchMedia("(min-width: 1024px)").matches
                        ) {
                          openBrand(brand.id)
                        }
                      }}
                    >
                      <BrandLogo brandId={brand.id} label={brand.label} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {activeBrand && dropdownStyle && activeBrand.models?.length > 0 ? (
            <ul
              className="brand-market-dropdown absolute z-[60] rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-xl"
              style={{
                left: dropdownStyle.left,
                top: dropdownStyle.top,
                width: dropdownStyle.width,
                minWidth: 280,
              }}
              role="menu"
              onMouseLeave={() => {
                if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
                  setOpenId(null)
                }
              }}
            >
              {activeBrand.models.map((model) => {
                const label = modelDisplayName(model)
                const keyword = modelSearchKeyword(model)
                return (
                  <li key={model.productId || label} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      title={keyword}
                      className="w-full px-4 py-2.5 text-left text-sm font-medium leading-snug text-foreground whitespace-normal break-words transition-colors hover:bg-primary/10 hover:text-primary"
                      onClick={() => handleSelect(model)}
                    >
                      {label}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>

        <div className="relative z-10 border-t border-border bg-muted/40 px-4 py-4 sm:px-5 sm:py-5">
          <div className="mx-auto flex max-w-3xl gap-3 items-start">
            <div className="min-w-0 flex-1">
              <Input
                size="large"
                placeholder="Enter phone model, e.g. iPhone 15 Pro Max"
                prefix={<SearchOutlined className="text-muted-foreground" />}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isDisabled}
                className="text-base w-full"
              />
              {suggestions.length > 0 ? (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-sm text-muted-foreground">Suggestions:</span>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => pickSuggestion(suggestion)}
                      className="text-sm px-3 py-1 rounded-full border border-border bg-card font-medium text-foreground shadow-sm hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={loading}
              disabled={isDisabled && !loading}
              className="px-6 sm:px-8 shrink-0"
            >
              Search
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
