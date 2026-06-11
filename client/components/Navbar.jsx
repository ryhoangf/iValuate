"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Dropdown, Button, App, Tag, Modal } from "antd"  // ← Thêm App, xóa message
import { UserOutlined, LogoutOutlined, LoginOutlined, UserAddOutlined, MobileOutlined, BellOutlined, CrownOutlined } from "@ant-design/icons"
import { clearAuth, setAuth, normalizeUserFromApi } from "@/lib/auth"
import { authApi } from "@/lib/api"
import AuthModal from "./AuthModal"
import WatchesDrawer from "./WatchesDrawer"
import CurrencyToggle from "./CurrencyToggle"
import ThemeToggle from "./ThemeToggle"

function subscribeAuth(callback) {
  if (typeof window === "undefined") return () => {}
  const notify = () => callback()
  window.addEventListener("storage", notify)
  window.addEventListener("ivaluate-auth-changed", notify)
  window.addEventListener("ivaluate-logout", notify)
  return () => {
    window.removeEventListener("storage", notify)
    window.removeEventListener("ivaluate-auth-changed", notify)
    window.removeEventListener("ivaluate-logout", notify)
  }
}

function getAuthSnapshot() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem("user")
}

export default function Navbar() {
  const { message } = App.useApp()  // ← Dùng hook
  const router = useRouter()
  const pathname = usePathname()
  const userSnapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => null)
  const user = useMemo(() => {
    if (!userSnapshot) return null
    try {
      const raw = JSON.parse(userSnapshot)
      return normalizeUserFromApi(raw) ?? raw
    } catch {
      return null
    }
  }, [userSnapshot])
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState("login") // 'login' or 'register'
  const [watchesOpen, setWatchesOpen] = useState(false)
  const handleLogout = () => {
    clearAuth()
    message.success("Signed out. You are viewing Lite content (or not signed in).")
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ivaluate-logout"))
    }
    window.location.reload()
  }

  const handleAuthSuccess = () => {
    setAuthModalOpen(false)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ivaluate-auth-changed"))
    }
  }

  const openLoginModal = () => {
    setAuthMode("login")
    setAuthModalOpen(true)
  }

  const openRegisterModal = () => {
    setAuthMode("register")
    setAuthModalOpen(true)
  }

  const handleUpgradePremiumTrial = () => {
    Modal.confirm({
      title: "Upgrade to Premium (trial)?",
      content:
        "Payment is not integrated yet. After confirming, you can use price history charts, forecasts, and ML analysis immediately. Your session will be refreshed.",
      okText: "Activate Premium",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const data = await authApi.upgradePremiumTrial()
          const normalized = normalizeUserFromApi(data.user) ?? data.user
          setAuth(data.token, normalized)
          message.success(data.message || "Upgraded to Premium.")
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("ivaluate-auth-changed"))
          }
        } catch (e) {
          message.error(e.message || "Upgrade failed")
          return Promise.reject(e)
        }
      },
    })
  }

  const userMenuItems = (u) => {
    const items = [
    {
      key: "plan",
      disabled: true,
      label: (
        <div className="max-w-[240px] whitespace-normal py-1 text-xs text-muted-foreground leading-snug">
          {u?.subscriptionTier === "premium" ? (
            <>
              <span className="font-medium text-foreground">Premium</span>
              — Price history, forecasts, ML feature impact, depreciation curves.
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">Lite</span>
              — Market price range &amp; similar listings. Upgrade to Premium for deep analysis.
            </>
          )}
        </div>
      ),
    },
    { type: "divider" },
    ]

    if (u?.subscriptionTier !== "premium") {
      items.push({
        key: "upgrade",
        icon: <CrownOutlined className="text-amber-500" />,
        label: "Upgrade Premium (trial)",
        onClick: () => handleUpgradePremiumTrial(),
      })
    }

    items.push(
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
      onClick: () => router.push("/profile"),
    },
    {
      key: "watches",
      icon: <BellOutlined />,
      label: "Price watches",
      onClick: () => setWatchesOpen(true),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Sign out",
      onClick: handleLogout,
      danger: true,
    },
    )

    return items
  }

  const handleLogoClick = (e) => {
    if (pathname === "/") {
      e.preventDefault()
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ivaluate-go-home-top"))
      }
    }
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b-2 border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo — luôn về trang chủ, cuộn lên đầu */}
            <Link
              href="/"
              onClick={handleLogoClick}
              className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring hover:opacity-90 transition-opacity"
              aria-label="Go to home"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MobileOutlined className="text-white text-lg" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                iValuate
              </span>
            </Link>

            {/* Auth Section */}
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle size="middle" />
              <CurrencyToggle size="middle" />
              {user ? (
                <Dropdown menu={{ items: userMenuItems(user) }} placement="bottomRight" arrow>
                  <Button type="text" className="flex items-center gap-2 h-10 max-w-[min(100vw-6rem,420px)]">
                    <UserOutlined className="text-base shrink-0" />
                    <Tag
                      color={user.subscriptionTier === "premium" ? "gold" : "default"}
                      className="!mr-0 shrink-0"
                    >
                      {user.subscriptionTier === "premium" ? "Premium" : "Lite"}
                    </Tag>
                    <span className="hidden sm:inline truncate">
                      Hello, {user.fullName || user.full_name || user.email}
                    </span>
                  </Button>
                </Dropdown>
              ) : (
                <>
                  <Button
                    type="default"
                    icon={<LoginOutlined />}
                    onClick={openLoginModal}
                    className="hidden sm:inline-flex"
                  >
                    Sign in
                  </Button>
                  <Button type="primary" icon={<UserAddOutlined />} onClick={openRegisterModal}>
                    <span className="hidden sm:inline">Sign up</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onCancel={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        onModeChange={setAuthMode}
      />
      <WatchesDrawer open={watchesOpen} onClose={() => setWatchesOpen(false)} />
    </>
  )
}
