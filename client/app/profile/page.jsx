"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  App,
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
import { useCurrency } from "@/context/CurrencyContext"
import { isAuthenticated, getToken, setAuth, normalizeUserFromApi } from "@/lib/auth"
import { authApi, watchApi } from "@/lib/api"

const { Title } = Typography

function ProfileSettings({ profile, setProfile, watches, wLoading, wDrawerOpen, setWDrawerOpen, loadWatches }) {
  const { message } = App.useApp()
  const { formatFromVnd } = useCurrency()
  const [infoForm] = Form.useForm()
  const [pwForm] = Form.useForm()

  useEffect(() => {
    if (profile) {
      infoForm.setFieldsValue({
        full_name: profile.full_name,
        email: profile.email,
      })
    }
  }, [profile, infoForm])

  const onSaveInfo = async (values) => {
    const payload = {}
    if (values.full_name !== profile.full_name) payload.full_name = values.full_name
    if (values.email !== profile.email) payload.email = values.email
    if (Object.keys(payload).length === 0) {
      message.info("No changes to save.")
      return
    }
    try {
      const data = await authApi.updateProfile(payload)
      const u = normalizeUserFromApi(data.user) ?? data.user
      setAuth(getToken(), u)
      setProfile(u)
      message.success(data.message || "Profile updated.")
      window.dispatchEvent(new CustomEvent("ivaluate-auth-changed"))
    } catch (e) {
      message.error(e.message || "Error")
    }
  }

  const onChangePassword = async (values) => {
    try {
      await authApi.updateProfile({
        current_password: values.current_password,
        new_password: values.new_password,
      })
      message.success("Password changed.")
      pwForm.resetFields()
    } catch (e) {
      message.error(e.message || "Error")
    }
  }

  const handleUpgrade = () => {
    Modal.confirm({
      title: "Upgrade to Premium (trial)?",
      content:
        "Payment is not integrated yet. After confirming you can use price history, forecasts, and ML analysis. Your session will be refreshed.",
      okText: "Activate Premium",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const data = await authApi.upgradePremiumTrial()
          const normalized = normalizeUserFromApi(data.user) ?? data.user
          setAuth(data.token, normalized)
          setProfile((p) => (p ? { ...p, ...normalized } : normalized))
          message.success(data.message || "Upgraded to Premium.")
          window.dispatchEvent(new CustomEvent("ivaluate-auth-changed"))
        } catch (e) {
          message.error(e.message || "Upgrade failed")
          return Promise.reject(e)
        }
      },
    })
  }

  const handleDowngradePremium = () => {
    Modal.confirm({
      title: "Cancel Premium plan?",
      content: "Your account will switch to Lite. Your session will be refreshed.",
      okText: "Cancel Premium",
      okType: "danger",
      cancelText: "Keep Premium",
      onOk: async () => {
        try {
          const data = await authApi.downgradePremiumToLite()
          const normalized = normalizeUserFromApi(data.user) ?? data.user
          setAuth(data.token, normalized)
          setProfile((p) => (p ? { ...p, ...normalized } : normalized))
          message.success(data.message || "Switched to Lite.")
          window.dispatchEvent(new CustomEvent("ivaluate-auth-changed"))
        } catch (e) {
          message.error(e.message || "Could not cancel plan")
          return Promise.reject(e)
        }
      },
    })
  }

  const removeWatch = async (id) => {
    try {
      await watchApi.remove(id)
      message.success("Watch removed.")
      await loadWatches()
      window.dispatchEvent(new CustomEvent("ivaluate-watches-changed"))
    } catch (e) {
      message.error(e.message || "Error")
    }
  }

  const tier = profile.subscriptionTier === "premium" ? "premium" : "lite"

  const tabItems = [
    {
      key: "info",
      forceRender: true,
      label: (
        <span className="inline-flex items-center gap-2">
          <UserOutlined className="shrink-0" />
          <span className="text-left leading-tight">Display info</span>
        </span>
      ),
      children: (
        <Card variant="borderless" className="shadow-sm bg-card">
          <Title level={5} className="!mt-0 !mb-4">
            Display info
          </Title>
          <Form form={infoForm} layout="vertical" onFinish={onSaveInfo} className="max-w-lg">
            <Form.Item
              name="full_name"
              label="Display name"
              rules={[{ required: true, message: "Enter full name" }]}
            >
              <Input autoComplete="name" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Sign-in email"
              rules={[
                { required: true, message: "Enter email" },
                { type: "email", message: "Invalid email" },
              ]}
            >
              <Input type="email" autoComplete="email" />
            </Form.Item>
            <Form.Item className="!mb-0">
              <Button type="primary" htmlType="submit">
                Save changes
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: "security",
      forceRender: true,
      label: (
        <span className="inline-flex items-center gap-2">
          <LockOutlined className="shrink-0" />
          <span className="text-left leading-tight">Security</span>
        </span>
      ),
      children: (
        <Card variant="borderless" className="shadow-sm bg-card">
          <Title level={5} className="!mt-0 !mb-4">
            Change password
          </Title>
          <Form form={pwForm} layout="vertical" onFinish={onChangePassword} className="max-w-lg">
            <Form.Item
              name="current_password"
              label="Current password"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <Form.Item
              name="new_password"
              label="New password"
              rules={[
                { required: true, message: "Enter new password" },
                { min: 6, message: "At least 6 characters" },
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              name="confirm_password"
              label="Confirm new password"
              dependencies={["new_password"]}
              rules={[
                { required: true, message: "Confirm password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("new_password") === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error("New passwords do not match"))
                  },
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item className="!mb-0">
              <Button type="primary" htmlType="submit">
                Change password
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
          <span className="text-left leading-tight">Plan</span>
        </span>
      ),
      children: (
        <div
          className={
            tier === "premium"
              ? "rounded-2xl bg-gradient-to-b from-amber-50 via-white to-white px-5 py-8 sm:px-8 sm:py-10 shadow-sm ring-1 ring-amber-200/70 dark:from-amber-950/30 dark:ring-amber-900/40"
              : "rounded-2xl bg-card px-5 py-8 sm:px-8 sm:py-10 shadow-sm ring-1 ring-border"
          }
        >
          <Title level={5} type="secondary" className="!mt-0 !mb-4 !text-xs !font-normal uppercase tracking-wider">
            Plan
          </Title>
          {tier === "premium" ? (
            <>
              <div className="text-4xl sm:text-5xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
                Premium
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button danger size="large" onClick={handleDowngradePremium}>
                  Cancel plan — switch to Lite
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
                  Upgrade Premium (trial)
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
            Price watches
            <span className="block text-xs font-normal text-muted-foreground">(interests)</span>
          </span>
        </span>
      ),
      children: (
        <Card
          variant="borderless"
          className="shadow-sm bg-card"
          extra={
            <Button type="link" icon={<BellOutlined />} onClick={() => setWDrawerOpen(true)}>
              Opportunities & new listings
            </Button>
          }
        >
          <Title level={5} className="!mt-0 !mb-4">
            Price watches
          </Title>
          <Table
            size="small"
            loading={wLoading}
            rowKey="watch_id"
            dataSource={watches}
            pagination={false}
            scroll={{ x: "max-content" }}
            locale={{ emptyText: "No watched products yet" }}
            columns={[
              {
                title: "Product",
                dataIndex: "product_name_snapshot",
                ellipsis: true,
              },
              {
                title: "Reference price",
                dataIndex: "reference_price",
                width: 140,
                render: (v) => formatFromVnd(Number(v)),
              },
              {
                title: "Created",
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
                  <Popconfirm title="Stop watching?" onConfirm={() => removeWatch(row.watch_id)}>
                    <Button type="link" danger size="small">
                      Remove
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
            Back to home
          </Link>
        </div>

        <Title level={3} className="!mb-6">
          Account profile
        </Title>

        <div className="mt-6 rounded-xl bg-card p-2 sm:p-4 border border-border">
          <Tabs
            tabPlacement="left"
            size="large"
            items={tabItems}
            destroyOnHidden={false}
            className="profile-settings-tabs min-h-[420px] [&_.ant-tabs-nav]:min-w-[200px] [&_.ant-tabs-nav]:sm:min-w-[220px] [&_.ant-tabs-content]:min-h-[360px]"
          />
        </div>
      </div>

      <WatchesDrawer open={wDrawerOpen} onClose={() => setWDrawerOpen(false)} />
    </div>
  )
}

function ProfileContent() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState(null)
  const [watches, setWatches] = useState([])
  const [wLoading, setWLoading] = useState(false)
  const [wDrawerOpen, setWDrawerOpen] = useState(false)

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
        setProfile(data.user)
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
  }, [router, loadWatches])

  if (!ready || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto max-w-3xl px-4 py-12 text-center text-muted-foreground">
          Loading profile…
        </div>
      </div>
    )
  }

  return (
    <ProfileSettings
      profile={profile}
      setProfile={setProfile}
      watches={watches}
      wLoading={wLoading}
      wDrawerOpen={wDrawerOpen}
      setWDrawerOpen={setWDrawerOpen}
      loadWatches={loadWatches}
    />
  )
}

export default function ProfilePage() {
  return <ProfileContent />
}
