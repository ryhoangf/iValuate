"use client"

import { Button, Tooltip } from "antd"
import { SwapOutlined } from "@ant-design/icons"
import { useCurrency } from "@/context/CurrencyContext"
import { DISPLAY_CURRENCY } from "@/lib/currency"

export default function CurrencyToggle({ size = "middle" }) {
  const { currency, toggleCurrency, isJpy, yenToVnd } = useCurrency()

  return (
    <Tooltip
      title={
        isJpy
          ? `Showing ¥ (from original_price / conversion). Click for VND. Rate ~${yenToVnd} ₫/¥`
          : `Showing VND. Click for ¥ (JPY from listing). Rate ~${yenToVnd} ₫/¥`
      }
    >
      <Button
        size={size}
        type={isJpy ? "primary" : "default"}
        icon={<SwapOutlined />}
        onClick={toggleCurrency}
        className="shrink-0 font-medium tabular-nums"
        aria-label={isJpy ? "Switch display to VND" : "Switch display to Japanese yen"}
      >
        {currency === DISPLAY_CURRENCY.JPY ? "¥ JPY" : "₫ VND"}
      </Button>
    </Tooltip>
  )
}
