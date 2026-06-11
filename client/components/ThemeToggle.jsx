"use client"

import { Button, Tooltip } from "antd"
import { MoonOutlined, SunOutlined } from "@ant-design/icons"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

function subscribeMounted() {
  return () => {}
}

export default function ThemeToggle({ size = "middle" }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useSyncExternalStore(subscribeMounted, () => true, () => false)

  if (!mounted) {
    return (
      <Button size={size} type="text" icon={<MoonOutlined />} aria-hidden disabled />
    )
  }

  const isDark = (resolvedTheme || theme) === "dark"

  return (
    <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
      <Button
        type="text"
        size={size}
        icon={isDark ? <SunOutlined /> : <MoonOutlined />}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        onClick={() => setTheme(isDark ? "light" : "dark")}
      />
    </Tooltip>
  )
}
