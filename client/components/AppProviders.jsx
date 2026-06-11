"use client"

import { useState } from "react"
import { ConfigProvider, App, theme } from "antd"
import enUS from "antd/locale/en_US"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider, useTheme } from "next-themes"
import { CurrencyProvider } from "@/context/CurrencyContext"

function AntdAppShell({ children }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <ConfigProvider
      locale={enUS}
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 8,
          colorText: isDark ? "rgba(255, 255, 255, 0.92)" : "rgba(15, 23, 42, 0.92)",
          colorTextSecondary: isDark ? "rgba(255, 255, 255, 0.68)" : "rgba(51, 65, 85, 0.88)",
          colorTextTertiary: isDark ? "rgba(255, 255, 255, 0.52)" : "rgba(71, 85, 105, 0.78)",
          colorBorder: isDark ? "#3d4460" : "#cbd5e1",
          colorBgContainer: isDark ? "#1e2233" : "#ffffff",
          colorBgLayout: isDark ? "#141722" : "#f1f5f9",
          colorFillSecondary: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)",
        },
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  )
}

export default function AppProviders({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <CurrencyProvider>
          <AntdAppShell>{children}</AntdAppShell>
        </CurrencyProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
