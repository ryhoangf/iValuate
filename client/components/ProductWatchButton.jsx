"use client"

import { useEffect, useMemo, useState } from "react"
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

function WatchInterestModal({
  onClose,
  productId,
  productName,
  defaultPrice,
  defaultCondition,
  defaultBattery,
}) {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    form.setFieldsValue({
      price_improvement_pct: 3,
      only_new_listings: true,
      reference_price: defaultPrice ?? undefined,
      reference_condition: defaultCondition,
      reference_battery: defaultBattery,
    })
  }, [defaultPrice, defaultCondition, defaultBattery, form])

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
      message.success("Watch saved. View it in user menu → Price watches.")
      onClose()
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ivaluate-watches-changed"))
      }
    } catch (e) {
      if (e?.errorFields) return
      message.error(e.message || "Could not create watch")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="Watch product"
      open
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Save watch"
      cancelText="Cancel"
      destroyOnHidden
    >
      <Text type="secondary" className="text-sm block mb-3">
        Notify when a listing meets your criteria: at least X% below reference price, or better grade / battery (if you set references).
      </Text>
      <Form form={form} layout="vertical" size="middle">
        <Form.Item
          name="reference_price"
          label="Reference price (VND)"
          rules={[{ required: true, message: "Enter reference price" }]}
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
          label="Must be at least this much cheaper (%)"
          rules={[{ required: true, message: "Enter %" }]}
        >
          <InputNumber min={0} max={90} className="!w-full" />
        </Form.Item>
        <Form.Item name="reference_condition" label="Reference grade (optional)">
          <Input placeholder="Leave blank or A, B, S…" allowClear />
        </Form.Item>
        <Form.Item name="reference_battery" label="Reference battery % (optional)">
          <InputNumber min={0} max={100} className="!w-full" placeholder="e.g. 85" />
        </Form.Item>
        <Form.Item
          name="only_new_listings"
          label="Only listings posted after creating this watch"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default function ProductWatchButton({ marketPriceData, searchResults, filters, variant = "default" }) {
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)

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
        Could not link a product — open Price analysis tab or try the exact model keyword.
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
          onClick={() => message.info("Please sign in to watch products and get better price / listing alerts.")}
        >
          Watch
        </Button>
      ) : (
        <Button
          type="default"
          icon={<HeartOutlined />}
          className="shrink-0"
          onClick={() => message.info("Please sign in to watch products and get better price / listing alerts.")}
        >
          Watch product
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

  const btn =
    variant === "compact" ? (
      <Button type="primary" icon={<HeartOutlined />} size="small" onClick={() => setOpen(true)} className="shrink-0">
        Watch
      </Button>
    ) : (
      <Button type="primary" icon={<HeartOutlined />} onClick={() => setOpen(true)} className="shrink-0">
        Watch product
      </Button>
    )

  return (
    <>
      {btn}
      {open ? (
        <WatchInterestModal
          onClose={() => setOpen(false)}
          productId={productId}
          productName={productName}
          defaultPrice={defaultPrice}
          defaultCondition={defaultCondition}
          defaultBattery={defaultBattery}
        />
      ) : null}
    </>
  )
}
