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
import "dayjs/locale/en"
import { useMemo, useState } from "react"
import { useCurrency } from "@/context/CurrencyContext"
import { parseBaseSpecs } from "@/lib/parseBaseSpecs"
import { formatStorageLabel } from "@/lib/formatSpecs"
import { TableSkeleton } from "@/components/LoadingSkeletons"

dayjs.locale("en")

// ─── helpers ──────────────────────────────────────────────────────────────────

function listingModelLabel(record) {
  return record.name || record.model_series || "-"
}

function listingStorageLabel(record) {
  const specs = parseBaseSpecs(record.base_specs)
  const raw = specs.storage ?? specs.storage_gb ?? specs.capacity
  if (raw == null || raw === "") return null
  return formatStorageLabel(raw)
}

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
  if (!health) return { status: "normal" }
  if (health >= 90) return { status: "success" }
  if (health >= 80) return { status: "normal" }
  if (health >= 70) return { status: "active" }
  return { status: "exception" }
}

function getPriceStats(listings) {
  const prices = (listings || [])
    .map((item) => Number(item.price))
    .filter((p) => Number.isFinite(p) && p > 0)
    .sort((a, b) => a - b)
  if (!prices.length) return null
  const mid = Math.floor(prices.length / 2)
  const median = prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2
  return { median, min: prices[0], max: prices[prices.length - 1] }
}

function pricePosition(record, stats) {
  if (!stats || !Number.isFinite(Number(record.price))) return null
  const diff = Number(record.price) - stats.median
  const pct = stats.median > 0 ? (diff / stats.median) * 100 : 0
  if (Math.abs(pct) < 3) return { pct, tone: "neutral", label: "Near median" }
  if (pct < 0)
    return { pct, tone: pct <= -12 ? "deal" : "below", label: `${Math.abs(pct).toFixed(0)}% below median` }
  return { pct, tone: pct >= 12 ? "high" : "above", label: `${pct.toFixed(0)}% above median` }
}

// ─── condition color helpers ──────────────────────────────────────────────────

function getPhysicalConditionColor(value) {
  if (!value) return null
  const v = value.toLowerCase()
  if (v.includes("cracked") || v.includes("broken") || v.includes("damaged"))
    return "red"
  if (v.includes("scratch") || v.includes("worn") || v.includes("poor") || v.includes("fair"))
    return "orange"
  if (v.includes("minor") || v.includes("light") || v.includes("small"))
    return "gold"
  if (v.includes("clean") || v.includes("good") || v.includes("excellent") || v.includes("like new"))
    return "green"
  return "default"
}

// ─── platform badge ────────────────────────────────────────────────────────────

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

// ─── listing column ────────────────────────────────────────────────────────────

function ProductCell({ record }) {
  const label   = listingModelLabel(record)
  const storage = listingStorageLabel(record)
  const specs   = parseBaseSpecs(record.base_specs)
  const ram     = specs?.ram != null ? `${specs.ram}GB RAM` : null

  return (
    <div className="min-w-0 space-y-1.5">
      <Tooltip title={label}>
        <div className="truncate text-sm font-semibold text-foreground leading-tight">{label}</div>
      </Tooltip>

      {/* storage + RAM tags only */}
      <div className="flex flex-wrap gap-1">
        {storage && <Tag color="geekblue" className="!m-0 text-xs">{storage}</Tag>}
        {ram     && <Tag color="geekblue" className="!m-0 text-xs">{ram}</Tag>}
        {record.color && <Tag color="purple" className="!m-0 text-xs">{record.color}</Tag>}
      </div>

      {/* issue warning — single line */}
      {!!record.has_issues && (
        <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <WarningOutlined className="shrink-0 text-[11px]" />
          <span>Issues reported</span>
        </div>
      )}
    </div>
  )
}

// ─── price column ──────────────────────────────────────────────────────────────

function PriceCell({ record, stats }) {
  const { formatListingPrice } = useCurrency()
  const pos = pricePosition(record, stats)
  const toneClass =
    pos?.tone === "deal"  ? "text-emerald-700 dark:text-emerald-400" :
    pos?.tone === "below" ? "text-green-700 dark:text-green-400"     :
    pos?.tone === "high"  ? "text-red-700 dark:text-red-400"         :
    pos?.tone === "above" ? "text-amber-700 dark:text-amber-400"     :
                            "text-foreground/70"
  const icon =
    pos?.tone === "deal"                       ? <FireOutlined />        :
    pos?.tone === "above" || pos?.tone === "high" ? <WarningOutlined />  :
                                                 <CheckCircleOutlined />

  return (
    <div className="space-y-0.5">
      <div className="whitespace-nowrap text-sm font-bold tabular-nums text-foreground">
        {formatListingPrice(record)}
      </div>
      {pos && (
        <div className={`inline-flex items-center gap-1 text-xs font-medium ${toneClass}`}>
          {icon}
          <span>{pos.label}</span>
        </div>
      )}
    </div>
  )
}

// ─── platform quick-filter ─────────────────────────────────────────────────────

function PlatformFilter({ platforms, value, onChange }) {
  if (!platforms?.length) return null
  const all = ["all", ...platforms]
  return (
    <div className="flex flex-wrap items-center gap-1.5 pb-2">
      <span className="text-xs text-muted-foreground">Source:</span>
      {all.map((p) => {
        const active = (value || "all") === p
        const { color } = getPlatformMeta(p)
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={[
              "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
              active
                ? "border-transparent bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
            ].join(" ")}
          >
            {p === "all" ? "All sources" : p}
          </button>
        )
      })}
    </div>
  )
}

// ─── main table ────────────────────────────────────────────────────────────────

export default function ListingsTable({ listings, loading }) {
  const [pageSize,    setPageSize]    = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const stats = useMemo(() => getPriceStats(listings), [listings])

  const platformFilters = useMemo(
    () => [...new Set((listings || []).map((l) => l.platform).filter(Boolean))].sort()
          .map((p) => ({ text: p, value: p })),
    [listings]
  )

  const conditionFilters = useMemo(
    () => [...new Set((listings || []).map((l) => l.condition).filter(Boolean))].sort()
          .map((c) => ({ text: `${c} — ${conditionPhrase(c)}`, value: c })),
    [listings]
  )

  const columns = [
    {
      title: "Listing",
      key: "listing",
      width: 240,
      render: (_, record) => <ProductCell record={record} />,
    },
    {
      title: "Source",
      key: "source",
      width: 120,
      responsive: ["sm"],
      align: "center",
      filters: platformFilters,
      onFilter: (value, record) => record.platform === value,
      render: (_, record) => <PlatformBadge platform={record.platform} />,
    },
    {
      title: "Condition",
      key: "condition",
      width: 110,
      responsive: ["md"],
      align: "center",
      filters: conditionFilters,
      onFilter: (value, record) => record.condition === value,
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
      responsive: ["lg"],
      align: "center",
      render: (_, record) => {
        const health = Number(record.battery_health)
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
      title: "Includes & build",
      key: "includes",
      width: 160,
      responsive: ["md"],
      align: "center",
      render: (_, record) => {
        const accessories = []
        if (!!record.has_box)       accessories.push("Box")
        if (!!record.has_charger)   accessories.push("Charger")
        if (!!record.has_cable)     accessories.push("Cable")
        if (!!record.has_earphones) accessories.push("Earphones")
        if (!!record.is_sim_free)   accessories.push("SIM free")

        const hasAnything = accessories.length > 0 || record.screen_condition || record.body_condition
        if (!hasAnything) return <span className="text-xs text-muted-foreground">—</span>

        return (
          <div className="flex flex-col items-center gap-1.5">
            {accessories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1">
                {accessories.map((label, i) => (
                  <Tag key={i} color="cyan" className="!m-0 text-[11px]">
                    {label}
                  </Tag>
                ))}
              </div>
            )}

            {(record.screen_condition || record.body_condition) && (
              <div className="flex flex-wrap justify-center gap-1">
                {record.screen_condition && (
                  <Tag
                    color={getPhysicalConditionColor(record.screen_condition)}
                    className="!m-0 text-[11px]"
                  >
                    Screen: {record.screen_condition}
                  </Tag>
                )}
                {record.body_condition && (
                  <Tag
                    color={getPhysicalConditionColor(record.body_condition)}
                    className="!m-0 text-[11px]"
                  >
                    Body: {record.body_condition}
                  </Tag>
                )}
              </div>
            )}
          </div>
        )
      },
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      width: 150,
      sorter: (a, b) => a.price - b.price,
      render: (_, record) => <PriceCell record={record} stats={stats} />,
    },
    {
      title: "Posted",
      dataIndex: "posted_at",
      key: "posted_at",
      width: 88,
      responsive: ["lg"],
      sorter: (a, b) => new Date(a.posted_at) - new Date(b.posted_at),
      render: (date) => (
        <Tooltip title={date ? dayjs(date).format("DD/MM/YYYY") : undefined}>
          <div className="flex items-center whitespace-nowrap text-xs text-muted-foreground">
            <ClockCircleOutlined className="mr-1 shrink-0" />
            {date ? dayjs(date).format("DD/MM/YY") : "—"}
          </div>
        </Tooltip>
      ),
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
            href={record.source_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open listing"
          />
        </Tooltip>
      ),
    },
  ]

  if (loading && (!listings || listings.length === 0)) {
    return <TableSkeleton rows={10} />
  }

  return (
    <div
      className="w-full min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-sm"
      role="region"
      aria-label="Listings comparison table"
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
        onChange={(_pagination, _filters, _sorter) => setCurrentPage(1)}
        pagination={{
          placement: ["bottomCenter"],
          current: currentPage,
          pageSize,
          showSizeChanger: { showSearch: false },
          pageSizeOptions: ["10", "20", "50"],
          showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}`,
          onChange: (page, size) => { setCurrentPage(page); setPageSize(size) },
          onShowSizeChange: (_c, size) => { setCurrentPage(1); setPageSize(size) },
        }}
        locale={{
          emptyText: <Empty description="No matching listings" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
        }}
      />
    </div>
  )
}
