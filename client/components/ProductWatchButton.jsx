"use client"

import { useMemo, useState } from "react"
import { Button, Modal, Form, InputNumber, Switch, Typography, App, Input } from "antd"
import { HeartOutlined } from "@ant-design/icons"
import { isAuthenticated } from "@/lib/auth"
import { watchApi } from "@/lib/api"

const { Text } = Typography

function pickReferencePrice(marketData, searchSummary) {
  const r = marketData?.marketPriceRange
  if (r) {
    const m = r.median ?? r.average ?? r.min
    if (m != null && !Number.isNaN(Number(m))) return Number(m)
  }
  if (searchSummary) {
    const m = searchSummary.median ?? searchSummary.avg ?? searchSummary.min
    if (m != null && !Number.isNaN(Number(m))) return Number(m)
  }
  return null
}

/**
 * Nút "Quan tâm" — hoạt động khi đã có product từ phân tích giá HOẶC từ tin đăng đầu tiên (product_id).
 */
export default function ProductWatchButton({ marketPriceData, searchResults, filters, variant = "default" }) {
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const { productId, productName } = useMemo(() => {
    const fromMarket = marketPriceData?.product
    const first = searchResults?.listings?.[0]
    const id = fromMarket?.id ?? first?.product_id ?? null
    const name = fromMarket?.name ?? first?.name ?? null
    return { productId: id, productName: name }
  }, [marketPriceData?.product, searchResults?.listings])

  const hasSearch = Boolean(searchResults?.listings?.length)

  if (!productId) {
    if (!hasSearch) return null
    return (
      <Text type="secondary" className="text-xs sm:text-sm max-w-[220px]">
        Chưa gắn được sản phẩm — mở tab Phân tích giá hoặc thử từ khóa đúng tên model.
      </Text>
    )
  }

  if (!isAuthenticated()) {
    const guestBtn =
      variant === "compact" ? (
        <Button
          type="default"
          icon={<HeartOutlined />}
          size="small"
          className="shrink-0"
          onClick={() => message.info("Vui lòng đăng nhập để quan tâm và nhận gợi ý giá / tin tốt hơn.")}
        >
          Quan tâm
        </Button>
      ) : (
        <Button
          type="default"
          icon={<HeartOutlined />}
          className="shrink-0"
          onClick={() => message.info("Vui lòng đăng nhập để quan tâm và nhận gợi ý giá / tin tốt hơn.")}
        >
          Quan tâm sản phẩm
        </Button>
      )
    return guestBtn
  }

  const defaultPrice = pickReferencePrice(marketPriceData, searchResults?.summary)
  const defaultCondition = filters?.condition && filters.condition !== "all" ? filters.condition : undefined
  const defaultBattery =
    filters?.minBattery != null && !Number.isNaN(Number(filters.minBattery))
      ? Math.round(Number(filters.minBattery))
      : undefined

  const handleOpen = () => {
    form.setFieldsValue({
      price_improvement_pct: 3,
      only_new_listings: true,
      reference_price: defaultPrice ?? undefined,
      reference_condition: defaultCondition,
      reference_battery: defaultBattery,
    })
    setOpen(true)
  }

  const handleOk = async () => {
    try {
      const v = await form.validateFields()
      setLoading(true)
      const condRaw = v.reference_condition
      const cond =
        typeof condRaw === "string" && condRaw.trim() !== "" ? condRaw.trim() : null
      const body = {
        product_id: productId,
        product_name: productName,
        reference_price: v.reference_price,
        reference_condition: cond,
        reference_battery: v.reference_battery != null ? v.reference_battery : null,
        price_improvement_pct: v.price_improvement_pct,
        only_new_listings: v.only_new_listings,
      }
      await watchApi.create(body)
      message.success("Đã lưu quan tâm. Xem trong menu user → Theo dõi giá.")
      setOpen(false)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ivaluate-watches-changed"))
      }
    } catch (e) {
      if (e?.errorFields) return
      message.error(e.message || "Không tạo được")
    } finally {
      setLoading(false)
    }
  }

  const btn =
    variant === "compact" ? (
      <Button type="primary" icon={<HeartOutlined />} size="small" onClick={handleOpen} className="shrink-0">
        Quan tâm
      </Button>
    ) : (
      <Button type="primary" icon={<HeartOutlined />} onClick={handleOpen} className="shrink-0">
        Quan tâm sản phẩm
      </Button>
    )

  return (
    <>
      {btn}
      <Modal
        title="Quan tâm sản phẩm"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        confirmLoading={loading}
        okText="Lưu quan tâm"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Text type="secondary" className="text-sm block mb-3">
          Báo khi có tin đủ điều kiện: giá thấp hơn mốc ít nhất X%, hoặc hạng / % pin tốt hơn (nếu bạn nhập mốc).
        </Text>
        <Form form={form} layout="vertical" size="middle">
          <Form.Item
            name="reference_price"
            label="Mốc giá tham chiếu (VND)"
            rules={[{ required: true, message: "Nhập giá mốc" }]}
          >
            <InputNumber
              min={0}
              className="!w-full"
              formatter={(val) =>
                val != null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""
              }
              parser={(s) => (s ? s.replace(/\./g, "") : "")}
            />
          </Form.Item>
          <Form.Item
            name="price_improvement_pct"
            label="Cần rẻ hơn mốc ít nhất (%)"
            rules={[{ required: true, message: "Nhập %" }]}
          >
            <InputNumber min={0} max={90} className="!w-full" />
          </Form.Item>
          <Form.Item name="reference_condition" label="Hạng máy tham chiếu (tuỳ chọn)">
            <Input placeholder="Để trống hoặc A, B, S…" allowClear />
          </Form.Item>
          <Form.Item name="reference_battery" label="% pin tham chiếu (tuỳ chọn)">
            <InputNumber min={0} max={100} className="!w-full" placeholder="VD 85" />
          </Form.Item>
          <Form.Item
            name="only_new_listings"
            label="Chỉ tin đăng sau khi tạo quan tâm"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
