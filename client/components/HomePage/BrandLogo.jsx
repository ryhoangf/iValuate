"use client"

import { useState } from "react"
import Image from "next/image"
import { BRAND_LOGO_EXTENSIONS, getBrandLogoSrc } from "@/lib/brandLogos"

/** Display height for banner logos in the brand strip. */
export const BRAND_LOGO_DISPLAY_HEIGHT_PX = 32

export default function BrandLogo({ brandId, label }) {
  const [extIndex, setExtIndex] = useState(0)
  const [failed, setFailed] = useState(false)

  const src = getBrandLogoSrc(brandId, extIndex)

  if (failed || !src) {
    return (
      <span className="brand-logo-surface flex h-8 w-full items-center justify-center rounded-md px-1.5 text-[10px] font-bold leading-none text-foreground sm:h-9 sm:text-[11px]">
        {label || brandId}
      </span>
    )
  }

  return (
    <span className="brand-logo-surface flex h-8 w-full items-center justify-center rounded-md px-2 py-1 sm:h-9">
      <Image
        src={src}
        alt={label ? `${label} logo` : ""}
        width={128}
        height={BRAND_LOGO_DISPLAY_HEIGHT_PX}
        className="brand-market-logo h-6 w-full max-w-full object-contain object-center sm:h-7"
        loading="lazy"
        draggable={false}
        onError={() => {
          if (extIndex < BRAND_LOGO_EXTENSIONS.length - 1) {
            setExtIndex((i) => i + 1)
            return
          }
          setFailed(true)
        }}
      />
    </span>
  )
}
