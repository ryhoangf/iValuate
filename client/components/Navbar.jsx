"use client"

import { useState, useEffect } from "react"
import { Dropdown, Button, message } from "antd"
import { UserOutlined, LogoutOutlined, LoginOutlined, UserAddOutlined, MobileOutlined } from "@ant-design/icons"
import { getUser, clearAuth } from "@/lib/auth"
import AuthModal from "./AuthModal"

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState("login") // 'login' or 'register'

  useEffect(() => {
    setUser(getUser())
  }, [])

  const handleLogout = () => {
    clearAuth()
    setUser(null)
    message.success("Logged out successfully!")
    window.location.reload()
  }

  const handleAuthSuccess = (userData) => {
    setUser(userData)
    setAuthModalOpen(false)
  }

  const openLoginModal = () => {
    setAuthMode("login")
    setAuthModalOpen(true)
  }

  const openRegisterModal = () => {
    setAuthMode("register")
    setAuthModalOpen(true)
  }

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "My Profile",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
      danger: true,
    },
  ]

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
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                  <Button type="text" className="flex items-center gap-2 h-10">
                    <UserOutlined className="text-base" />
                    <span className="hidden sm:inline">Hello, {user.fullName || user.email}</span>
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
                    Sign In
                  </Button>
                  <Button type="primary" icon={<UserAddOutlined />} onClick={openRegisterModal}>
                    <span className="hidden sm:inline">Register</span>
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
    </>
  )
}
