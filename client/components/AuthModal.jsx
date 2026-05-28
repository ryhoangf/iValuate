"use client"

import { useState } from "react"
import { Modal, Form, Input, Button, Tabs, App, Segmented, Alert, Typography } from "antd"  // ← Thêm App
import { UserOutlined, LockOutlined, MailOutlined, CrownOutlined } from "@ant-design/icons"
import { authApi } from "@/lib/api" 
import { setAuth, normalizeUserFromApi } from "@/lib/auth" 

const { Text } = Typography

export default function AuthModal({ open, mode, onCancel, onSuccess, onModeChange }) {
  const { message } = App.useApp()  // ← Dùng hook thay vì import message
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()
  const [forgotForm] = Form.useForm()

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      const data = await authApi.login(values.email, values.password)
      const token = data.accessToken || data.token; 
      const user = data.user;

      if (token && user) {
        const normalized = normalizeUserFromApi(user) ?? user
        setAuth(token, normalized)

        const isPremium = normalized.subscriptionTier === "premium"
        message.success(
          isPremium
            ? "Đăng nhập thành công — Gói Premium (đầy đủ biểu đồ & phân tích ML)."
            : "Đăng nhập thành công — Gói Lite (tra cứu giá nhanh & tin tương tự)."
        )
        loginForm.resetFields()
        onSuccess(normalized)
      } else {
        throw new Error("Không nhận được thông tin xác thực từ server")
      }
    } catch (error) {
      message.error(error.message || "Đăng nhập thất bại")
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
          ? "Đăng ký Premium thành công (dùng thử — chưa thu phí). Đăng nhập để dùng biểu đồ & phân tích ML."
          : "Đăng ký Lite thành công — đăng nhập để tra cứu giá & tin tương tự."
      )
      registerForm.resetFields()
      registerForm.setFieldsValue({ registerPlan: "lite" })

      onModeChange("login")
      loginForm.setFieldsValue({ email: values.email })

    } catch (error) {
      message.error(error.message || "Đăng ký thất bại")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (values) => {
    setForgotLoading(true)
    try {
      const data = await authApi.forgotPassword(values.email)
      message.success(data.message)
      if (data.resetUrl) {
        Modal.info({
          title: "Liên kết đặt lại (chế độ dev)",
          width: 480,
          content: (
            <div className="break-all text-sm mt-2">
              <a href={data.resetUrl}>{data.resetUrl}</a>
            </div>
          ),
        })
      }
      forgotForm.resetFields()
      setForgotOpen(false)
    } catch (error) {
      message.error(error.message || "Không gửi được yêu cầu")
    } finally {
      setForgotLoading(false)
    }
  }

  const tabItems = [
    {
      key: "login",
      label: "Đăng nhập",
      children: (
        <Form form={loginForm} onFinish={handleLogin} layout="vertical" size="large">
             {/* Giữ nguyên các Field Input */}
             <Form.Item name="email" rules={[{ required: true, message: "Vui lòng nhập email!" }, { type: "email", message: "Email không hợp lệ!" }]}>
                <Input prefix={<MailOutlined className="text-muted-foreground" />} placeholder="Email" />
             </Form.Item>
             <Form.Item name="password" rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}>
                <Input.Password prefix={<LockOutlined className="text-muted-foreground" />} placeholder="Mật khẩu" />
             </Form.Item>
             <div className="flex justify-end -mt-1 mb-1">
               <Button
                 type="link"
                 size="small"
                 className="!px-0 !h-auto text-xs"
                 onClick={() => {
                   forgotForm.setFieldsValue({ email: loginForm.getFieldValue("email") })
                   setForgotOpen(true)
                 }}
               >
                 Quên mật khẩu?
               </Button>
             </div>
             <Form.Item className="mb-0">
                <Button type="primary" htmlType="submit" loading={loading} block>Đăng nhập</Button>
             </Form.Item>
        </Form>
      )
    },
    {
      key: "register",
      label: "Đăng ký",
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
               title="Chọn gói khi đăng ký"
               description="Premium hiện bật ngay để dùng thử (chưa tích hợp thanh toán). Lite phù hợp tra cứu nhanh."
             />
             <Form.Item name="registerPlan" label="Gói dịch vụ" className="!mb-4">
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
             <Form.Item name="fullName" rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}>
                <Input prefix={<UserOutlined className="text-muted-foreground" />} placeholder="Họ và tên" />
             </Form.Item>
             <Form.Item name="email" rules={[{ required: true, message: "Vui lòng nhập email!" }, { type: "email", message: "Email không hợp lệ!" }]}>
                <Input prefix={<MailOutlined className="text-muted-foreground" />} placeholder="Email" />
             </Form.Item>
             <Form.Item name="password" rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }, { min: 6, message: "Mật khẩu tối thiểu 6 ký tự!" }]}>
                <Input.Password prefix={<LockOutlined className="text-muted-foreground" />} placeholder="Mật khẩu" />
             </Form.Item>
             <Form.Item name="confirmPassword" dependencies={["password"]} rules={[{ required: true, message: "Vui lòng xác nhận mật khẩu!" }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue("password") === value) { return Promise.resolve() } return Promise.reject(new Error("Mật khẩu không khớp!")) }, })]}>
                <Input.Password prefix={<LockOutlined className="text-muted-foreground" />} placeholder="Xác nhận mật khẩu" />
             </Form.Item>
             <Form.Item shouldUpdate={(prev, cur) => prev.registerPlan !== cur.registerPlan} className="!mb-3">
               {({ getFieldValue }) =>
                 getFieldValue("registerPlan") === "premium" ? (
                   <Text type="secondary" className="text-xs block text-center">
                     Sau khi tạo tài khoản, hãy đăng nhập — hệ thống sẽ nhận gói Premium.
                   </Text>
                 ) : null
               }
             </Form.Item>
             <Form.Item className="mb-0">
                <Button type="primary" htmlType="submit" loading={loading} block>
                  Hoàn tất đăng ký
                </Button>
             </Form.Item>
        </Form>
      )
    }
  ]

  return (
    <>
      <Modal open={open} onCancel={onCancel} footer={null} width={460} centered destroyOnHidden>
        <div className="pt-4">
          <Tabs activeKey={mode} onChange={onModeChange} items={tabItems} centered />
        </div>
      </Modal>

      <Modal
        title="Quên mật khẩu"
        open={forgotOpen}
        onCancel={() => {
          setForgotOpen(false)
          forgotForm.resetFields()
        }}
        footer={null}
        width={420}
        centered
        destroyOnHidden
      >
        <Form form={forgotForm} layout="vertical" onFinish={handleForgotPassword} className="pt-2">
          <Form.Item
            name="email"
            label="Email đăng ký"
            rules={[
              { required: true, message: "Nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" autoComplete="email" />
          </Form.Item>
          <Form.Item className="!mb-0">
            <Button type="primary" htmlType="submit" loading={forgotLoading} block>
              Gửi hướng dẫn đặt lại mật khẩu
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
