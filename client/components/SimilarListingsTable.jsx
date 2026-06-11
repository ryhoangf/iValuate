"use client"

import { Button, Empty, Progress, Table, Tag, Tooltip } from "antd"
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  LinkOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
import { useCurrency } from "@/context/CurrencyContext"
import { parseBaseSpecs } from "@/lib/parseBaseSpecs"
import { formatStorageLabel } from "@/lib/formatSpecs"

// ─── helpers (mirrors ListingsTable) ──────────────────────────────────────────

function conditionPhrase(rank) {
  const r = String(rank || "").toUpperCase()
  if (r === "S") return "Like new"
  if (r === "A") return "Very good"
  if (r === "B") return "Good"
  if (r === "C") return "Worn"
  if (r === "D") return "Needs care"
  return rank || "Unknown"
}

function getConditionColor(rank) {
  return { S: "green", A: "cyan", B: "blue", C: "orange", D: "red" }[
    String(rank || "").toUpperCase()
  ] || "default"
}

function getBatteryStatus(health) {
  if (health >= 90) return { status: "success" }
  if (health >= 80) return { status: "normal" }
  if (health >= 70) return { status: "active" }
  return { status: "exception" }
}

const PLATFORM_META = {
  mercari: { color: "volcano",  abbr: "M" },
  yahoo:   { color: "geekblue", abbr: "Y" },
  rakuma:  { color: "magenta",  abbr: "R" },
  rakuten: { color: "magenta",  abbr: "R" },
}

function getPlatformMeta(platform) {
  if (!platform) return { color: "default", abbr: "?" }
  const p = platform.toLowerCase()
  for (const [key, meta] of Object.entries(PLATFORM_META)) {
    if (p.includes(key)) return meta
  }
  return { color: "purple", abbr: platform[0]?.toUpperCase() ?? "?" }
}

function PlatformBadge({ platform }) {
  const { color, abbr } = getPlatformMeta(platform)
  return (
    <Tag color={color} className="!m-0 shrink-0 font-medium">
      <span className="mr-0.5 text-[10px] font-bold opacity-70">{abbr}</span>
      {platform || "Other"}
    </Tag>
  )
}

function getStorageLabel(record) {
  try {
    const specs = parseBaseSpecs(record.base_specs || record.baseSpecs)
    const raw = specs?.storage ?? specs?.storage_gb ?? specs?.capacity
    if (raw == null || raw === "") return null
    return formatStorageLabel(raw)
  } catch {
    return null
  }
}

// ─── price cell with diff signal ──────────────────────────────────────────────

function PriceCell({ record }) {
  const { formatListingPrice, formatFromVnd } = useCurrency()
  const diff = record.priceDifference ?? record.price_difference

  const tone =
    diff == null       ? "neutral" :
    diff <= -0.12      ? "deal"    :
    diff < 0           ? "below"   :
    diff >= 0.12       ? "high"    :
    diff > 0           ? "above"   : "neutral"

  const toneClass =
    tone === "deal"  ? "text-emerald-700 dark:text-emerald-400" :
    tone === "below" ? "text-green-700 dark:text-green-400"     :
    tone === "high"  ? "text-red-700 dark:text-red-400"         :
    tone === "above" ? "text-amber-700 dark:text-amber-400"     :
                       "text-foreground/70"

  const icon =
    tone === "deal"                      ? <FireOutlined />       :
    tone === "above" || tone === "high"  ? <WarningOutlined />    :
                                           <CheckCircleOutlined />

  const pctLabel = diff != null
    ? `${Math.abs(Math.round(diff * 100))}% ${diff < 0 ? "below" : "above"} market`
    : null

  return (
    <div className="space-y-0.5">
      <div className="whitespace-nowrap text-sm font-bold tabular-nums text-foreground">
        {formatListingPrice(record)}
      </div>
      {pctLabel && (
        <div className={`inline-flex items-center gap-1 text-xs font-medium ${toneClass}`}>
          {icon}
          <span>{pctLabel}</span>
        </div>
      )}
    </div>
  )
}

// ─── main ──────────────────────────────────────────────────────────────────────

export default function SimilarListingsTable({ listings, loading }) {
  const columns = [
    {
      title: "Listing",
      key: "listing",
      width: 240,
      render: (_, record) => {
        const label   = record.name || record.model_series || "—"
        const storage = getStorageLabel(record)
        const specs   = parseBaseSpecs(record.base_specs || record.baseSpecs)
        const ram     = specs?.ram != null ? `${specs.ram}GB RAM` : null

        return (
          <div className="min-w-0 space-y-1.5">
            <Tooltip title={label}>
              <div className="truncate text-sm font-semibold text-foreground leading-tight">{label}</div>
            </Tooltip>
            <div className="flex flex-wrap gap-1">
              {storage && <Tag color="geekblue" className="!m-0 text-xs">{storage}</Tag>}
              {ram     && <Tag color="geekblue" className="!m-0 text-xs">{ram}</Tag>}
              {record.color && <Tag color="purple" className="!m-0 text-xs">{record.color}</Tag>}
            </div>
          </div>
        )
      },
    },
    {
      title: "Source",
      key: "source",
      width: 120,
      align: "center",
      render: (_, record) => <PlatformBadge platform={record.platform} />,
    },
    {
      title: "Condition",
      key: "condition",
      width: 110,
      align: "center",
      render: (_, record) => {
        const showLetter = /^[SABCD]$/i.test(String(record.condition || ""))
        return (
          <div className="flex flex-col items-center gap-0.5">
            <Tag color={getConditionColor(record.condition)} className="!m-0 !text-xs">
              {showLetter ? record.condition : (record.condition || "N/A")}
            </Tag>
            {showLetter && (
              <span className="text-[10px] text-muted-foreground leading-tight">
                {conditionPhrase(record.condition)}
              </span>
            )}
          </div>
        )
      },
    },
    {
      title: "Battery",
      key: "battery",
      width: 76,
      align: "center",
      render: (_, record) => {
        const health = Number(record.battery_health ?? record.batteryHealth)
        if (!health || health <= 0) return <span className="text-xs text-muted-foreground">—</span>
        return (
          <Progress
            type="circle"
            percent={health}
            size={36}
            status={getBatteryStatus(health).status}
            format={(p) => `${p}%`}
          />
        )
      },
    },
    {
      title: "Price",
      key: "price",
      width: 160,
      sorter: (a, b) => a.price - b.price,
      render: (_, record) => <PriceCell record={record} />,
    },
    {
      title: "Posted",
      key: "posted",
      width: 88,
      align: "center",
      sorter: (a, b) =>
        new Date(a.posted_at || a.postedAt) - new Date(b.posted_at || b.postedAt),
      render: (_, record) => {
        const date = record.posted_at || record.postedAt
        return (
          <Tooltip title={date ? dayjs(date).format("DD/MM/YYYY") : undefined}>
            <div className="flex items-center justify-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
              <ClockCircleOutlined className="shrink-0" />
              {date ? dayjs(date).format("DD/MM/YY") : "—"}
            </div>
          </Tooltip>
        )
      },
    },
    {
      title: "",
      key: "action",
      width: 44,
      align: "center",
      render: (_, record) => (
        <Tooltip title="Open listing">
          <Button
            type="primary"
            ghost
            size="small"
            icon={<LinkOutlined />}
            href={record.source_url || record.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open listing"
          />
        </Tooltip>
      ),
    },
  ]

  return (
    <div
      className="w-full min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-sm"
      role="region"
      aria-label="Similar listings table"
    >
      <Table
        columns={columns}
        dataSource={listings || []}
        loading={loading}
        rowKey="id"
        size="middle"
        tableLayout="fixed"
        rowClassName={(_, index) =>
          index % 2 === 0 ? "bg-card" : "bg-slate-50/60 dark:bg-white/[0.03]"
        }
        className="listings-table w-full [&_.ant-table-thead_th]:bg-muted/60 [&_.ant-table-thead_th]:dark:bg-muted/40 [&_.ant-table-thead_th]:text-center [&_.ant-table-pagination]:mb-0 [&_.ant-table-pagination]:flex-wrap [&_.ant-table-pagination]:px-4 [&_.ant-table-pagination]:py-3 [&_.ant-pagination]:!justify-center"
        pagination={{
          placement: ["bottomCenter"],
          pageSize: 10,
          showSizeChanger: false,
          showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}`,
        }}
        locale={{
          emptyText: (
            <Empty description="No similar listings found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ),
        }}
      />
    </div>
  )
}
