"use client"

import { Alert, Card, Switch, Table, Typography } from "antd"
import { ThunderboltOutlined } from "@ant-design/icons"

const { Text } = Typography

function formatVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return "—"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(n))
}

export default function FeatureCounterfactualPanel({
  report,
  loading,
  error,
  includeAllScenarios,
  onReload,
}) {
  if (loading) {
    return (
      <Card className="shadow-sm" size="small">
        <Text type="secondary">Đang tính tác động yếu tố (mô hình)…</Text>
      </Card>
    )
  }

  if (error === 'PREMIUM_REQUIRED') {
    return (
      <Alert
        type="info"
        showIcon
        className="shadow-sm"
        title="Gói Premium"
        description="Phân tích counterfactual ML (tác động từng yếu tố: pin, hộp, màn hình, …) chỉ có trên gói Premium. Liên hệ quản trị hoặc nâng cấp tài khoản để bật."
      />
    )
  }

  if (error) {
    return (
      <Alert
        type="warning"
        showIcon
        className="shadow-sm"
        title="Không tải được phân tích counterfactual"
        description={error}
      />
    )
  }

  if (!report || report.method !== "counterfactual") return null

  const columns = [
    {
      title: "Yếu tố",
      dataIndex: "label_vi",
      key: "label_vi",
      ellipsis: true,
    },
    {
      title: "Trước → Tham chiếu",
      key: "range",
      width: 200,
      render: (_, row) => (
        <span className="text-sm tabular-nums">
          {String(row.value_before)} → {String(row.value_reference)}
        </span>
      ),
    },
    {
      title: "Δ giá (VND)",
      dataIndex: "delta_vnd",
      key: "delta_vnd",
      align: "right",
      width: 160,
      render: (v) => {
        const n = Number(v)
        const color = n > 0 ? "text-emerald-600" : n < 0 ? "text-red-600" : "text-gray-600"
        return <span className={`font-medium tabular-nums ${color}`}>{formatVnd(n)}</span>
      },
    },
  ]

  return (
    <Card
      size="small"
      variant="borderless"
      className="shadow-sm border border-amber-100/80 bg-amber-50/30"
      title={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ThunderboltOutlined className="text-amber-600" />
            <span>Tác động yếu tố (counterfactual ML)</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-normal">
            <Text type="secondary">Mọi kịch bản</Text>
            <Switch
              checked={includeAllScenarios}
              onChange={(checked) => onReload?.(checked)}
              size="small"
            />
          </div>
        </div>
      }
    >
      {report.disclaimer && (
        <Alert type="info" showIcon className="mb-3" title={report.disclaimer} />
      )}

      <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <Text>
          Giá baseline (dự báo): <Text strong>{formatVnd(report.baseline_prediction_vnd)}</Text>
        </Text>
        {report.model_version && (
          <Text type="secondary">Phiên bản: {report.model_version}</Text>
        )}
        {report.yen_to_vnd != null && (
          <Text type="secondary">Tỷ giá ¥: {report.yen_to_vnd}</Text>
        )}
      </div>

      {report.request_summary && (
        <Text type="secondary" className="mb-3 block text-xs">
          Cấu hình gửi mô hình: {report.request_summary.model_line} · {report.request_summary.storage}
          GB / RAM {report.request_summary.ram} · pin {report.request_summary.battery_percentage}% ·{" "}
          {report.request_summary.condition}
        </Text>
      )}

      <Table
        size="small"
        rowKey={(row) => row.id || `${row.field}-${row.label_vi}`}
        columns={columns}
        dataSource={report.impacts || []}
        pagination={false}
        locale={{ emptyText: "Không có kịch bản impact nào (thử bật “Mọi kịch bản”)" }}
      />
    </Card>
  )
}
