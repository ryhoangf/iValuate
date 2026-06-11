"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { App, Typography, Form, Input, Button, Alert } from "antd"
import { LockOutlined, ArrowLeftOutlined } from "@ant-design/icons"
import Navbar from "@/components/Navbar"
import { authApi } from "@/lib/api"

const { Title } = Typography

function ResetPasswordFields({ token }) {
  const { message, modal } = App.useApp()
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const data = await authApi.resetPassword(token, values.password)
      const detail =
        data.message ||
        "Password updated. You can sign in with your new password."
      modal.success({
        title: "Password changed",
        content: detail,
        okText: "Go to home",
        centered: true,
        afterClose: () => router.replace("/"),
      })
    } catch (e) {
      message.error(e.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} size="large" className="mt-2">
      <Form.Item
        name="password"
        label="New password"
        rules={[
          { required: true, message: "Enter password" },
          { min: 6, message: "At least 6 characters" },
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="New password" autoComplete="new-password" />
      </Form.Item>
      <Form.Item
        name="confirm"
        label="Confirm"
        dependencies={["password"]}
        rules={[
          { required: true, message: "Confirm password" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) return Promise.resolve()
              return Promise.reject(new Error("Passwords do not match"))
            },
          }),
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Confirm" autoComplete="new-password" />
      </Form.Item>
      <Form.Item className="!mb-0">
        <Button type="primary" htmlType="submit" loading={loading} block>
          Confirm
        </Button>
      </Form.Item>
    </Form>
  )
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto max-w-md px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeftOutlined />
          Back to home
        </Link>
        <Title level={3} className="!mb-2">
          Reset password
        </Title>
        {!token ? (
          <Alert type="error" showIcon title="Invalid link" className="mb-4 rounded-xl" />
        ) : (
          <ResetPasswordFields token={token} />
        )}
      </div>
    </div>
  )
}

function ResetPasswordContent() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}

export default function ResetPasswordPage() {
  return <ResetPasswordContent />
}
