"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dropdown, Button, App, Tag, Modal } from "antd"  // ← Thêm App, xóa message
import { UserOutlined, LogoutOutlined, LoginOutlined, UserAddOutlined, MobileOutlined, BellOutlined, CrownOutlined } from "@ant-design/icons"
import { getUser, clearAuth, setAuth, normalizeUserFromApi } from "@/lib/auth"
import { authApi } from "@/lib/api"
import AuthModal from "./AuthModal"
import WatchesDrawer from "./WatchesDrawer"

export default function Navbar() {
  const { message } = App.useApp()  // ← Dùng hook
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState("login") // 'login' or 'register'
  const [watchesOpen, setWatchesOpen] = useState(false)

  useEffect(() => {
    setUser(getUser())
  }, [])

  const handleLogout = () => {
    clearAuth()
    setUser(null)
    message.success("Đã đăng xuất. Bạn đang xem nội dung gói Lite (hoặc chưa đăng nhập).")
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ivaluate-logout"))
    }
    window.location.reload()
  }

  const handleAuthSuccess = (userData) => {
    setUser(userData)
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
      title: "Nâng cấp Premium (dùng thử)?",
      content:
        "Chưa tích hợp thanh toán. Sau khi xác nhận, bạn dùng ngay biểu đồ lịch sử, dự báo và phân tích ML. Phiên đăng nhập sẽ được làm mới.",
      okText: "Kích hoạt Premium",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const data = await authApi.upgradePremiumTrial()
          const normalized = normalizeUserFromApi(data.user) ?? data.user
          setAuth(data.token, normalized)
          setUser(normalized)
          message.success(data.message || "Đã nâng cấp Premium.")
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("ivaluate-auth-changed"))
          }
        } catch (e) {
          message.error(e.message || "Không nâng cấp được")
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
              — Biểu đồ lịch sử, dự báo, phân tích yếu tố ML, đường trượt giá.
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">Lite</span>
              — Khoảng giá &amp; tin tương tự. Nâng cấp Premium để mở phân tích sâu.
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
        label: "Nâng cấp Premium (dùng thử)",
        onClick: () => handleUpgradePremiumTrial(),
      })
    }

    items.push(
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Hồ sơ",
      onClick: () => router.push("/profile"),
    },
    {
      key: "watches",
      icon: <BellOutlined />,
      label: "Theo dõi giá",
      onClick: () => setWatchesOpen(true),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      onClick: handleLogout,
      danger: true,
    },
    )

    return items
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MobileOutlined className="text-white text-lg" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                iValuate
              </span>
            </div>

            {/* Auth Section */}
            <div className="flex items-center gap-3">
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
                      Xin chào, {user.fullName || user.full_name || user.email}
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
                    Đăng nhập
                  </Button>
                  <Button type="primary" icon={<UserAddOutlined />} onClick={openRegisterModal}>
                    <span className="hidden sm:inline">Đăng ký</span>
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
