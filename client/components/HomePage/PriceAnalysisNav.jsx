"use client"

import { useEffect, useMemo, useState } from "react"

const SECTIONS = [
  { key: "market", href: "#price-section-market", title: "Market price" },
  { key: "impact", href: "#price-section-impact", title: "Price impact" },
  { key: "history", href: "#price-section-history", title: "Price history" },
  { key: "forecast", href: "#price-section-forecast", title: "30-day forecast" },
  { key: "depreciation", href: "#price-section-depreciation", title: "Depreciation" },
  { key: "similar", href: "#price-section-similar", title: "Similar listings" },
]

function scrollToSection(href) {
  const id = href.replace("#", "")
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: "smooth", block: "start" })
}

export default function PriceAnalysisNav({ isPremium, hasSimilar }) {
  const items = useMemo(() => {
    return SECTIONS.filter((s) => {
      if (
        s.key === "impact" ||
        s.key === "history" ||
        s.key === "forecast" ||
        s.key === "depreciation"
      ) {
        return isPremium
      }
      if (s.key === "similar") return hasSimilar
      return true
    })
  }, [isPremium, hasSimilar])

  const [activeKey, setActiveKey] = useState(items[0]?.key ?? "market")

  useEffect(() => {
    if (items.length === 0) return

    const sectionEls = items
      .map((item) => document.getElementById(item.href.replace("#", "")))
      .filter(Boolean)

    if (sectionEls.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible[0]?.target?.id) {
          const match = items.find((item) => item.href === `#${visible[0].target.id}`)
          if (match) setActiveKey(match.key)
        }
      },
      {
        rootMargin: "-40% 0px -45% 0px",
        threshold: [0, 0.15, 0.35, 0.55],
      }
    )

    sectionEls.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  if (items.length <= 1) return null

  return (
    <nav
      className="sticky top-16 z-40 mb-6 rounded-2xl border border-border bg-card/95 p-2 shadow-md backdrop-blur-md supports-[backdrop-filter]:bg-card/85"
      aria-label="Price analysis sections"
    >
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {items.map((item) => {
          const isActive = activeKey === item.key
          return (
            <a
              key={item.key}
              href={item.href}
              onClick={(e) => {
                e.preventDefault()
                setActiveKey(item.key)
                scrollToSection(item.href)
              }}
              aria-current={isActive ? "true" : undefined}
              className={[
                "rounded-xl px-3.5 py-2 text-xs font-semibold tracking-wide transition-all sm:px-4 sm:text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md ring-1 ring-primary/30"
                  : "bg-muted/50 text-foreground/90 hover:bg-muted hover:text-foreground",
              ].join(" ")}
            >
              {item.title}
            </a>
          )
        })}
      </div>
    </nav>
  )
}
