"use client"

import { Suspense, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ConfigProvider, App, theme, Typography, Form, Input, Button, Alert } from "antd"
import viVN from "antd/locale/vi_VN"
import { LockOutlined, ArrowLeftOutlined } from "@ant-design/icons"
import Navbar from "@/components/Navbar"
import { authApi } from "@/lib/api"

const { Title } = Typography

function ResetPasswordForm() {
  const { message, modal } = App.useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState("")

  useEffect(() => {
    const t = searchParams.get("token")
    setToken(t || "")
  }, [searchParams])

  const onFinish = async (values) => {
    if (!token) {
      message.error("Thiếu liên kết đặt lại mật khẩu.")
      return
    }
    setLoading(true)
    try {
      const data = await authApi.resetPassword(token, values.password)
      const detail =
        data.message ||
        "Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới."
      modal.success({
        title: "Đổi mật khẩu thành công",
        content: detail,
        okText: "Về trang chủ",
        centered: true,
        afterClose: () => router.replace("/"),
      })
    } catch (e) {
      message.error(e.message || "Thất bại")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto max-w-md px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeftOutlined />
          Về trang chủ
        </Link>
        <Title level={3} className="!mb-2">
          Đặt lại mật khẩu
        </Title>
        {!token ? (
          <Alert type="error" showIcon title="Liên kết không hợp lệ" className="mb-4 rounded-xl" />
        ) : null}
        {token ? (
          <Form form={form} layout="vertical" onFinish={onFinish} size="large" className="mt-2">
            <Form.Item
              name="password"
              label="Mật khẩu mới"
              rules={[
                { required: true, message: "Nhập mật khẩu" },
                { min: 6, message: "Tối thiểu 6 ký tự" },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu mới" autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              name="confirm"
              label="Nhập lại"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Xác nhận mật khẩu" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) return Promise.resolve()
                    return Promise.reject(new Error("Không khớp"))
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại" autoComplete="new-password" />
            </Form.Item>
            <Form.Item className="!mb-0">
              <Button type="primary" htmlType="submit" loading={loading} block>
                Xác nhận
              </Button>
            </Form.Item>
          </Form>
        ) : null}
      </div>
    </div>
  )
}

function ResetPasswordContent() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-muted-foreground">
          Đang tải…
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}

export default function ResetPasswordPage() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: { colorPrimary: "#1890ff", borderRadius: 8 },
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <App>
        <ResetPasswordContent />
      </App>
    </ConfigProvider>
  )
}
