"use client"

import { useCallback, useEffect, useState } from "react"
import { Drawer, Collapse, Tag, Button, Typography, Empty, Spin, Space, Popconfirm, App } from "antd"
import { ReloadOutlined, DeleteOutlined, LinkOutlined, EyeInvisibleOutlined } from "@ant-design/icons"
import { watchApi } from "@/lib/api"

const { Text } = Typography

const REASON_VI = {
  better_price: "Giá tốt hơn",
  better_condition: "Hạng tốt hơn",
  better_battery: "Pin tốt hơn",
}

function formatVnd(n) {
  if (n == null || Number.isNaN(n)) return "—"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
}

export default function WatchesDrawer({ open, onClose }) {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await watchApi.list(true)
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      message.error(e.message || "Không tải được")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  useEffect(() => {
    const fn = () => {
      if (open) void load()
    }
    if (typeof window === "undefined") return undefined
    window.addEventListener("ivaluate-watches-changed", fn)
    return () => window.removeEventListener("ivaluate-watches-changed", fn)
  }, [open, load])

  const removeWatch = async (id) => {
    try {
      await watchApi.remove(id)
      message.success("Đã ngừng theo dõi")
      void load()
    } catch (e) {
      message.error(e.message || "Lỗi")
    }
  }

  const dismiss = async (watchId, listingId) => {
    try {
      await watchApi.dismiss(watchId, listingId)
      void load()
    } catch (e) {
      message.error(e.message || "Lỗi")
    }
  }

  return (
    <Drawer
      title="Theo dõi giá & cơ hội"
      placement="right"
      size={420}
      onClose={onClose}
      open={open}
    >
      <div className="flex justify-end mb-3">
        <Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading} size="small">
          Làm mới
        </Button>
      </div>
      <Spin spinning={loading && items.length === 0}>
        {!loading && items.length === 0 ? (
          <Empty description="Chưa có mục theo dõi" />
        ) : (
          <Collapse
            accordion
            bordered={false}
            className="bg-transparent [&_.ant-collapse-item]:!border-border [&_.ant-collapse-header]:!px-2 [&_.ant-collapse-header]:!py-3"
            defaultActiveKey={[]}
            expandIconPosition="end"
            items={items.map((w) => ({
              key: w.watch_id,
              label: (
                <div className="flex w-full items-start justify-between gap-2 pr-1">
                  <div className="min-w-0 flex-1 text-left">
                    <Text strong className="block truncate">
                      {w.product_name_snapshot || w.product_id}
                    </Text>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Mốc {formatVnd(w.reference_price)}
                      {w.reference_condition ? ` · hạng ${w.reference_condition}` : ""}
                      {w.reference_battery != null ? ` · pin ${w.reference_battery}%` : ""}
                    </div>
                  </div>
                  <Space size={4} wrap className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    {w.opportunity_count > 0 ? (
                      <Tag color="red">{w.opportunity_count} cơ hội</Tag>
                    ) : (
                      <Tag>Chưa có cơ hội</Tag>
                    )}
                    <Popconfirm title="Ngừng theo dõi?" onConfirm={() => removeWatch(w.watch_id)}>
                      <Button type="text" danger size="small" icon={<DeleteOutlined />} aria-label="Ngừng theo dõi" />
                    </Popconfirm>
                  </Space>
                </div>
              ),
              children: (
                <div className="pt-1 pb-2">
                  {w.opportunities?.length > 0 ? (
                    <ul className="m-0 list-none space-y-2 p-0">
                      {w.opportunities.map((o) => (
                        <li
                          key={o.listing_id}
                          className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
                        >
                          <div className="mb-1 flex flex-wrap gap-1">
                            {(o.reasons || []).map((r) => (
                              <Tag key={r} color="orange">
                                {REASON_VI[r] || r}
                              </Tag>
                            ))}
                          </div>
                          <div className="font-medium">{formatVnd(o.price)}</div>
                          <div className="text-xs text-muted-foreground">
                            {o.condition ? `Hạng ${o.condition}` : ""}
                            {o.battery_health != null ? ` · pin ${o.battery_health}%` : ""}
                            {o.platform ? ` · ${o.platform}` : ""}
                          </div>
                          <div className="mt-2 flex gap-2">
                            {o.source_url ? (
                              <Button
                                type="link"
                                size="small"
                                className="!h-auto !p-0"
                                href={o.source_url}
                                target="_blank"
                                rel="noreferrer"
                                icon={<LinkOutlined />}
                              >
                                Mở tin
                              </Button>
                            ) : null}
                            <Button
                              type="link"
                              size="small"
                              className="!h-auto !p-0 text-muted-foreground"
                              icon={<EyeInvisibleOutlined />}
                              onClick={() => dismiss(w.watch_id, o.listing_id)}
                            >
                              Ẩn tin này
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Empty
                      className="my-2"
                      description="Chưa có tin phù hợp"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )}
                </div>
              ),
            }))}
          />
        )}
      </Spin>
    </Drawer>
  )
}
