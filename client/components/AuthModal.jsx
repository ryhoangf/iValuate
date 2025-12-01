"use client"

import { useState } from "react"
import { Modal, Form, Input, Button, Tabs, message } from "antd"
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons"
import { authApi } from "@/lib/api" 
import { setAuth } from "@/lib/auth" 

export default function AuthModal({ open, mode, onCancel, onSuccess, onModeChange }) {
  const [loading, setLoading] = useState(false)
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      const data = await authApi.login(values.email, values.password)
      const token = data.accessToken || data.token; 
      const user = data.user;

      if (token && user) {
        setAuth(token, user)
        
        message.success("Đăng nhập thành công!")
        loginForm.resetFields()
        onSuccess(user)
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
      await authApi.register(values.email, values.password, values.fullName)

      message.success("Đăng ký thành công! Vui lòng đăng nhập.")
      registerForm.resetFields()

      onModeChange("login")
      loginForm.setFieldsValue({ email: values.email })

    } catch (error) {
      message.error(error.message || "Đăng ký thất bại")
    } finally {
      setLoading(false)
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
        <Form form={registerForm} onFinish={handleRegister} layout="vertical" size="large">
             {/* Giữ nguyên các Field Input */}
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
             <Form.Item className="mb-0">
                <Button type="primary" htmlType="submit" loading={loading} block>Đăng ký</Button>
             </Form.Item>
        </Form>
      )
    }
  ]

  return (
    <Modal open={open} onCancel={onCancel} footer={null} width={420} centered destroyOnHidden>
      <div className="pt-4">
        <Tabs activeKey={mode} onChange={onModeChange} items={tabItems} centered />
      </div>
    </Modal>
  )
}
