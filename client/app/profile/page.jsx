"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ConfigProvider,
  App,
  theme,
  Typography,
  Tabs,
  Card,
  Form,
  Input,
  Button,
  Table,
  Modal,
  Popconfirm,
} from "antd"
import viVN from "antd/locale/vi_VN"
import {
  CrownOutlined,
  ArrowLeftOutlined,
  BellOutlined,
  UserOutlined,
  LockOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
import Navbar from "@/components/Navbar"
import WatchesDrawer from "@/components/WatchesDrawer"
import { isAuthenticated, getToken, setAuth, normalizeUserFromApi } from "@/lib/auth"
import { authApi, watchApi } from "@/lib/api"

const { Title } = Typography

function formatVnd(n) {
  if (n == null || Number.isNaN(n)) return "—"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
}

function ProfileContent() {
  const { message } = App.useApp()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState(null)
  const [watches, setWatches] = useState([])
  const [wLoading, setWLoading] = useState(false)
  const [wDrawerOpen, setWDrawerOpen] = useState(false)
  const [infoForm] = Form.useForm()
  const [pwForm] = Form.useForm()

  const loadWatches = useCallback(async () => {
    if (!isAuthenticated()) return
    setWLoading(true)
    try {
      const list = await watchApi.list(false)
      setWatches(Array.isArray(list) ? list : [])
    } catch {
      setWatches([])
    } finally {
      setWLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/")
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await authApi.getMe()
        if (cancelled) return
        const u = data.user
        setProfile(u)
        infoForm.setFieldsValue({
          full_name: u.full_name,
          email: u.email,
        })
      } catch {
        router.replace("/")
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    void loadWatches()
    return () => {
      cancelled = true
    }
  }, [router, infoForm, loadWatches])

  const onSaveInfo = async (values) => {
    const payload = {}
    if (values.full_name !== profile.full_name) payload.full_name = values.full_name
    if (values.email !== profile.email) payload.email = values.email
    if (Object.keys(payload).length === 0) {
      message.info("Không có thay đổi để lưu.")
      return
    }
    try {
      const data = await authApi.updateProfile(payload)
      const u = normalizeUserFromApi(data.user) ?? data.user
      setAuth(getToken(), u)
      setProfile(u)
      message.success(data.message || "Đã cập nhật.")
      window.dispatchEvent(new CustomEvent("ivaluate-auth-changed"))
    } catch (e) {
      message.error(e.message || "Lỗi")
    }
  }

  const onChangePassword = async (values) => {
    try {
      await authApi.updateProfile({
        current_password: values.current_password,
        new_password: values.new_password,
      })
      message.success("Đã đổi mật khẩu.")
      pwForm.resetFields()
    } catch (e) {
      message.error(e.message || "Lỗi")
    }
  }

  const handleUpgrade = () => {
    Modal.confirm({
      title: "Nâng cấp Premium (dùng thử)?",
      content:
        "Chưa tích hợp thanh toán. Sau khi xác nhận bạn dùng ngay biểu đồ lịch sử, dự báo và phân tích ML. Phiên đăng nhập được làm mới.",
      okText: "Kích hoạt Premium",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const data = await authApi.upgradePremiumTrial()
          const normalized = normalizeUserFromApi(data.user) ?? data.user
          setAuth(data.token, normalized)
          setProfile((p) => (p ? { ...p, ...normalized } : normalized))
          message.success(data.message || "Đã nâng cấp.")
          window.dispatchEvent(new CustomEvent("ivaluate-auth-changed"))
        } catch (e) {
          message.error(e.message || "Không nâng cấp được")
          return Promise.reject(e)
        }
      },
    })
  }

  const handleDowngradePremium = () => {
    Modal.confirm({
      title: "Hủy gói Premium?",
      content: "Tài khoản chuyển về Lite. Phiên đăng nhập sẽ được làm mới.",
      okText: "Hủy gói Premium",
      okType: "danger",
      cancelText: "Giữ Premium",
      onOk: async () => {
        try {
          const data = await authApi.downgradePremiumToLite()
          const normalized = normalizeUserFromApi(data.user) ?? data.user
          setAuth(data.token, normalized)
          setProfile((p) => (p ? { ...p, ...normalized } : normalized))
          message.success(data.message || "Đã chuyển về Lite.")
          window.dispatchEvent(new CustomEvent("ivaluate-auth-changed"))
        } catch (e) {
          message.error(e.message || "Không hủy được")
          return Promise.reject(e)
        }
      },
    })
  }

  const removeWatch = async (id) => {
    try {
      await watchApi.remove(id)
      message.success("Đã xóa theo dõi.")
      await loadWatches()
      window.dispatchEvent(new CustomEvent("ivaluate-watches-changed"))
    } catch (e) {
      message.error(e.message || "Lỗi")
    }
  }

  if (!ready || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto max-w-3xl px-4 py-12 text-center text-muted-foreground">
          Đang tải hồ sơ…
        </div>
      </div>
    )
  }

  const tier = profile.subscriptionTier === "premium" ? "premium" : "lite"

  const tabItems = [
    {
      key: "info",
      label: (
        <span className="inline-flex items-center gap-2">
          <UserOutlined className="shrink-0" />
          <span className="text-left leading-tight">Thông tin hiển thị</span>
        </span>
      ),
      children: (
        <Card variant="borderless" className="shadow-sm bg-white">
          <Title level={5} className="!mt-0 !mb-4">
            Thông tin hiển thị
          </Title>
          <Form form={infoForm} layout="vertical" onFinish={onSaveInfo} className="max-w-lg">
            <Form.Item
              name="full_name"
              label="Tên hiển thị"
              rules={[{ required: true, message: "Nhập họ tên" }]}
            >
              <Input autoComplete="name" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email đăng nhập"
              rules={[
                { required: true, message: "Nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input type="email" autoComplete="email" />
            </Form.Item>
            <Form.Item className="!mb-0">
              <Button type="primary" htmlType="submit">
                Lưu thay đổi
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: "security",
      label: (
        <span className="inline-flex items-center gap-2">
          <LockOutlined className="shrink-0" />
          <span className="text-left leading-tight">Bảo mật</span>
        </span>
      ),
      children: (
        <Card variant="borderless" className="shadow-sm bg-white">
          <Title level={5} className="!mt-0 !mb-4">
            Đổi mật khẩu
          </Title>
          <Form form={pwForm} layout="vertical" onFinish={onChangePassword} className="max-w-lg">
            <Form.Item
              name="current_password"
              label="Mật khẩu hiện tại"
              rules={[{ required: true, message: "Bắt buộc" }]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <Form.Item
              name="new_password"
              label="Mật khẩu mới"
              rules={[
                { required: true, message: "Nhập mật khẩu mới" },
                { min: 6, message: "Tối thiểu 6 ký tự" },
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              name="confirm_password"
              label="Nhập lại mật khẩu mới"
              dependencies={["new_password"]}
              rules={[
                { required: true, message: "Xác nhận mật khẩu" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("new_password") === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error("Không khớp mật khẩu mới"))
                  },
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item className="!mb-0">
              <Button type="primary" htmlType="submit">
                Đổi mật khẩu
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: "plan",
      label: (
        <span className="inline-flex items-center gap-2">
          <CrownOutlined className="shrink-0" />
          <span className="text-left leading-tight">Gói dịch vụ</span>
        </span>
      ),
      children: (
        <div
          className={
            tier === "premium"
              ? "rounded-2xl bg-gradient-to-b from-amber-50 via-white to-white px-5 py-8 sm:px-8 sm:py-10 shadow-sm ring-1 ring-amber-200/70 dark:from-amber-950/30 dark:ring-amber-900/40"
              : "rounded-2xl bg-white px-5 py-8 sm:px-8 sm:py-10 shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-700/60"
          }
        >
          <Title level={5} type="secondary" className="!mt-0 !mb-4 !text-xs !font-normal uppercase tracking-wider">
            Gói dịch vụ
          </Title>
          {tier === "premium" ? (
            <>
              <div className="text-4xl sm:text-5xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
                Premium
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button danger size="large" onClick={handleDowngradePremium}>
                  Hủy gói — về Lite
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                Lite
              </div>
              <div className="mt-8">
                <Button type="primary" size="large" icon={<CrownOutlined />} onClick={handleUpgrade}>
                  Nâng cấp Premium (dùng thử)
                </Button>
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      key: "watches",
      label: (
        <span className="inline-flex items-center gap-2">
          <BellOutlined className="shrink-0" />
          <span className="text-left leading-tight">
            Theo dõi giá
            <span className="block text-xs font-normal text-muted-foreground">(quan tâm)</span>
          </span>
        </span>
      ),
      children: (
        <Card
          variant="borderless"
          className="shadow-sm bg-white"
          extra={
            <Button type="link" icon={<BellOutlined />} onClick={() => setWDrawerOpen(true)}>
              Cơ hội & tin mới
            </Button>
          }
        >
          <Title level={5} className="!mt-0 !mb-4">
            Theo dõi giá — quan tâm
          </Title>
          <Table
            size="small"
            loading={wLoading}
            rowKey="watch_id"
            dataSource={watches}
            pagination={false}
            scroll={{ x: "max-content" }}
            locale={{ emptyText: "Chưa có sản phẩm theo dõi" }}
            columns={[
              {
                title: "Sản phẩm",
                dataIndex: "product_name_snapshot",
                ellipsis: true,
              },
              {
                title: "Mốc giá",
                dataIndex: "reference_price",
                width: 140,
                render: (v) => formatVnd(Number(v)),
              },
              {
                title: "Tạo lúc",
                dataIndex: "created_at",
                width: 120,
                render: (d) => (d ? dayjs(d).format("DD/MM/YYYY") : "—"),
              },
              {
                title: "",
                key: "act",
                width: 88,
                align: "right",
                render: (_, row) => (
                  <Popconfirm title="Ngừng theo dõi?" onConfirm={() => removeWatch(row.watch_id)}>
                    <Button type="link" danger size="small">
                      Xóa
                    </Button>
                  </Popconfirm>
                ),
              },
            ]}
          />
        </Card>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeftOutlined />
            Về trang chủ
          </Link>
        </div>

        <Title level={3} className="!mb-6">
          Hồ sơ tài khoản
        </Title>

        <div className="mt-6 rounded-xl bg-white p-2 sm:p-4">
          <Tabs
            tabPlacement="left"
            size="large"
            items={tabItems}
            className="profile-settings-tabs min-h-[420px] [&_.ant-tabs-nav]:min-w-[200px] [&_.ant-tabs-nav]:sm:min-w-[220px] [&_.ant-tabs-content]:min-h-[360px]"
          />
        </div>
      </div>

      <WatchesDrawer open={wDrawerOpen} onClose={() => setWDrawerOpen(false)} />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: { colorPrimary: "#1890ff", borderRadius: 8 },
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <App>
        <ProfileContent />
      </App>
    </ConfigProvider>
  )
}
