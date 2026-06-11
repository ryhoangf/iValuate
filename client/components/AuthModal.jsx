"use client"

import { useState, useEffect } from "react"
import { Modal, Form, Input, Button, Tabs, App, Segmented, Alert, Typography } from "antd"
import { UserOutlined, LockOutlined, MailOutlined, CrownOutlined } from "@ant-design/icons"
import { authApi } from "@/lib/api"
import { setAuth, normalizeUserFromApi } from "@/lib/auth"

const { Text } = Typography

function ForgotPasswordModal({ onClose, initialEmail }) {
  const { message } = App.useApp()
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotForm] = Form.useForm()

  useEffect(() => {
    forgotForm.setFieldsValue({ email: initialEmail || "" })
  }, [initialEmail, forgotForm])

  const handleForgotPassword = async (values) => {
    setForgotLoading(true)
    try {
      const data = await authApi.forgotPassword(values.email)
      message.success(data.message)
      if (data.resetUrl) {
        Modal.info({
          title: "Reset link (dev mode)",
          width: 480,
          content: (
            <div className="break-all text-sm mt-2">
              <a href={data.resetUrl}>{data.resetUrl}</a>
            </div>
          ),
        })
      }
      forgotForm.resetFields()
      onClose()
    } catch (error) {
      message.error(error.message || "Could not send request")
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <Modal
      title="Forgot password"
      open
      onCancel={() => {
        forgotForm.resetFields()
        onClose()
      }}
      footer={null}
      width={420}
      centered
      destroyOnHidden
    >
      <Form form={forgotForm} layout="vertical" onFinish={handleForgotPassword} className="pt-2">
        <Form.Item
          name="email"
          label="Registered email"
          rules={[
            { required: true, message: "Enter email" },
            { type: "email", message: "Invalid email" },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="Email" autoComplete="email" />
        </Form.Item>
        <Form.Item className="!mb-0">
          <Button type="primary" htmlType="submit" loading={forgotLoading} block>
            Send reset instructions
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}

function AuthModalForms({ mode, onSuccess, onModeChange }) {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      const data = await authApi.login(values.email, values.password)
      const token = data.accessToken || data.token
      const user = data.user

      if (token && user) {
        const normalized = normalizeUserFromApi(user) ?? user
        setAuth(token, normalized)

        const isPremium = normalized.subscriptionTier === "premium"
        message.success(
          isPremium
            ? "Signed in — Premium plan (full charts & ML analysis)."
            : "Signed in — Lite plan (quick price lookup & similar listings)."
        )
        loginForm.resetFields()
        onSuccess(normalized)
      } else {
        throw new Error("Did not receive auth data from server")
      }
    } catch (error) {
      message.error(error.message || "Sign in failed")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values) => {
    setLoading(true)
    try {
      const plan = values.registerPlan === "premium" ? "premium" : "lite"
      await authApi.register(values.email, values.password, values.fullName, plan)

      message.success(
        plan === "premium"
          ? "Premium registration successful (trial — no payment yet). Sign in to use charts & ML analysis."
          : "Lite registration successful — sign in for price lookup & similar listings."
      )
      registerForm.resetFields()
      registerForm.setFieldsValue({ registerPlan: "lite" })

      onModeChange("login")
      loginForm.setFieldsValue({ email: values.email })
    } catch (error) {
      message.error(error.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const tabItems = [
    {
      key: "login",
      label: "Sign in",
      forceRender: true,
      children: (
        <Form form={loginForm} onFinish={handleLogin} layout="vertical" size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Invalid email" },
            ]}
          >
            <Input prefix={<MailOutlined className="text-muted-foreground" />} placeholder="Email" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please enter password" }]}
          >
            <Input.Password prefix={<LockOutlined className="text-muted-foreground" />} placeholder="Password" />
          </Form.Item>
          <div className="flex justify-end -mt-1 mb-1">
            <Button
              type="link"
              size="small"
              className="!px-0 !h-auto text-xs"
              onClick={() => {
                setForgotEmail(loginForm.getFieldValue("email") || "")
                setForgotOpen(true)
              }}
            >
              Forgot password?
            </Button>
          </div>
          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" loading={loading} block>
              Sign in
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: "register",
      label: "Sign up",
      forceRender: true,
      children: (
        <Form
          form={registerForm}
          onFinish={handleRegister}
          layout="vertical"
          size="large"
          initialValues={{ registerPlan: "lite" }}
        >
          <Alert
            type="info"
            showIcon
            className="mb-4"
            title="Choose a plan when signing up"
            description="Premium is enabled immediately for trial (payment not integrated). Lite is best for quick lookups."
          />
          <Form.Item name="registerPlan" label="Plan" className="!mb-4">
            <Segmented
              block
              options={[
                { label: "Lite", value: "lite" },
                {
                  label: (
                    <span className="inline-flex items-center gap-1">
                      <CrownOutlined className="text-amber-500" />
                      Premium
                    </span>
                  ),
                  value: "premium",
                },
              ]}
            />
          </Form.Item>
          <Form.Item name="fullName" rules={[{ required: true, message: "Please enter full name" }]}>
            <Input prefix={<UserOutlined className="text-muted-foreground" />} placeholder="Full name" />
          </Form.Item>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Invalid email" },
            ]}
          >
            <Input prefix={<MailOutlined className="text-muted-foreground" />} placeholder="Email" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Please enter password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password prefix={<LockOutlined className="text-muted-foreground" />} placeholder="Password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error("Passwords do not match"))
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined className="text-muted-foreground" />} placeholder="Confirm password" />
          </Form.Item>
          <Form.Item shouldUpdate={(prev, cur) => prev.registerPlan !== cur.registerPlan} className="!mb-3">
            {({ getFieldValue }) =>
              getFieldValue("registerPlan") === "premium" ? (
                <Text type="secondary" className="text-xs block text-center">
                  After creating your account, sign in — the system will assign Premium.
                </Text>
              ) : null
            }
          </Form.Item>
          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" loading={loading} block>
              Complete registration
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ]

  return (
    <>
      <div className="pt-4">
        <Tabs
          activeKey={mode}
          onChange={onModeChange}
          items={tabItems}
          centered
          destroyOnHidden={false}
        />
      </div>
      {forgotOpen ? (
        <ForgotPasswordModal initialEmail={forgotEmail} onClose={() => setForgotOpen(false)} />
      ) : null}
    </>
  )
}

export default function AuthModal({ open, mode, onCancel, onSuccess, onModeChange }) {
  return (
    <Modal open={open} onCancel={onCancel} footer={null} width={460} centered destroyOnHidden>
      {open ? (
        <AuthModalForms mode={mode} onSuccess={onSuccess} onModeChange={onModeChange} />
      ) : null}
    </Modal>
  )
}
