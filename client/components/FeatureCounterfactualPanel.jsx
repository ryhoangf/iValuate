"use client"

import { Alert, Empty, Switch, Tooltip, Typography } from "antd"
import {
  ArrowDownOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import { useCurrency } from "@/context/CurrencyContext"
import { formatStorageLabel, formatRamLabel } from "@/lib/formatSpecs"

const { Text } = Typography

function formatSummaryLine(summary) {
  if (!summary) return null
  const parts = [
    summary.model_line,
    summary.storage != null ? formatStorageLabel(summary.storage) : null,
    summary.ram ? formatRamLabel(summary.ram) : null,
    summary.battery_percentage != null ? `${summary.battery_percentage}% battery` : null,
    summary.condition,
    summary.has_box === false ? "no box" : summary.has_box === true ? "with box" : null,
    summary.has_charger === false ? "no charger" : summary.has_charger === true ? "with charger" : null,
  ].filter(Boolean)
  return parts.join(" · ")
}

function plainFeatureName(row) {
  const label = row.label_en || row.label_vi || row.label || row.field || "This difference"
  return String(label)
    .replace(/^if\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
}

function actionTip(row) {
  const field = String(row.field || row.label_en || row.label || "").toLowerCase()
  if (field.includes("battery")) return "Ask for a battery screenshot. Weak battery is a clear reason to negotiate."
  if (field.includes("box")) return "Compare with complete listings — missing box weakens resale value."
  if (field.includes("charger")) return "Check if charger and cable are included before judging the deal."
  if (field.includes("screen")) return "Inspect close-up photos. Ask about scratches, burn-in, or cracks."
  if (field.includes("body")) return "Look for dents, frame scratches, and back glass in seller photos."
  if (field.includes("condition")) return "Compare only with phones in the same condition grade."
  if (field.includes("storage")) return "Do not compare low-storage and high-storage variants as the same."
  return "Use this as a negotiation clue, not an exact deduction."
}

function severity(deficit, maxDeficit) {
  if (!deficit || deficit <= 0) return { label: "No impact", percent: 8, tone: "neutral" }
  const percent = maxDeficit > 0 ? Math.max(12, Math.round((deficit / maxDeficit) * 100)) : 30
  if (percent >= 70) return { label: "High", percent, tone: "high" }
  if (percent >= 35) return { label: "Medium", percent, tone: "medium" }
  return { label: "Low", percent, tone: "low" }
}

// Left-border accent colours per tone
const borderAccent = {
  high:    "border-l-4 border-l-red-500",
  medium:  "border-l-4 border-l-amber-400",
  low:     "border-l-4 border-l-emerald-400",
  neutral: "border-l-4 border-l-border",
}

const iconEl = {
  high:    <WarningOutlined   className="text-red-500"     />,
  medium:  <ArrowDownOutlined className="text-amber-500"   />,
  low:     <CheckCircleOutlined className="text-emerald-500" />,
  neutral: <CheckCircleOutlined className="text-muted-foreground" />,
}

const severityPillClass = {
  high:    "bg-red-100   text-red-700   dark:bg-red-950/50   dark:text-red-400",
  medium:  "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  low:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  neutral: "bg-muted text-muted-foreground",
}

function ImpactInsight({ row, maxDeficit, formatVnd }) {
  const deficit = Number(row.deficit_vnd ?? 0)
  const delta   = Number(row.delta_vnd   ?? 0)
  const sev     = severity(deficit, maxDeficit)

  const priceLabel =
    deficit > 0 ? `-${formatVnd(deficit)}`
    : delta  > 0 ? `+${formatVnd(delta)}`
    : "–"

  // "82% → 100%" comparison chip
  const compareChip =
    row.value_before != null && row.value_reference != null ? (
      <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-1.5 py-0.5 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">{String(row.value_before)}</span>
        <span className="opacity-50">→</span>
        <span className="font-medium text-foreground/50">{String(row.value_reference)}</span>
      </span>
    ) : null

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-border bg-card py-2.5 pl-3 pr-3 ${borderAccent[sev.tone]}`}
    >
      {/* icon */}
      <span className="shrink-0 text-base">{iconEl[sev.tone]}</span>

      {/* middle */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-semibold text-foreground leading-tight">
            {plainFeatureName(row)}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${severityPillClass[sev.tone]}`}
          >
            {sev.label}
          </span>
          {compareChip}
        </div>
      </div>

      {/* right: price delta + tip */}
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`text-sm font-bold tabular-nums ${
            deficit > 0 ? "text-red-600 dark:text-red-400" : "text-foreground/70"
          }`}
        >
          {priceLabel}
        </span>
        <Tooltip
          title={actionTip(row)}
          styles={{ root: { maxWidth: 260 } }}
          placement="left"
        >
          <InfoCircleOutlined className="cursor-help text-sm text-muted-foreground hover:text-foreground" />
        </Tooltip>
      </div>
    </div>
  )
}

export default function FeatureCounterfactualPanel({
  report,
  loading,
  error,
  includeAllScenarios,
  onReload,
}) {
  const { formatFromVnd } = useCurrency()
  const formatVnd = (n) => formatFromVnd(n)

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground" aria-busy="true">
        Analysing price factors…
      </div>
    )
  }

  if (error === "PREMIUM_REQUIRED") {
    return (
      <Alert
        type="info"
        showIcon
        className="shadow-sm"
        description="Price impact breakdown is available on Premium. Upgrade from the account menu."
      />
    )
  }

  if (error) {
    return (
      <Alert type="warning" showIcon className="shadow-sm" description={error} />
    )
  }

  if (!report || (report.method && report.method !== "counterfactual")) return null
  if (!Array.isArray(report.impacts)) return null

  const impacts       = [...report.impacts].sort((a, b) => Number(b.deficit_vnd ?? 0) - Number(a.deficit_vnd ?? 0))
  const visibleImpacts = impacts.filter((row) => includeAllScenarios || Number(row.deficit_vnd ?? 0) > 0)
  const maxDeficit    = Math.max(...impacts.map((row) => Number(row.deficit_vnd ?? 0)), 0)
  const topLoss       = visibleImpacts.find((row) => Number(row.deficit_vnd ?? 0) > 0)
  const summaryLine   = formatSummaryLine(report.input_summary || report.request_summary)

  // Total drag across all visible impacts
  const totalDrag = visibleImpacts.reduce((sum, r) => sum + Number(r.deficit_vnd ?? 0), 0)

  return (
    <div className="space-y-2">
      {/* compact summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-border bg-card px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {/* baseline price chip */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Baseline</span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatVnd(report.baseline_prediction_vnd)}
            </span>
          </div>

          {/* total drag pill — only if there is any drag */}
          {totalDrag > 0 && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <ArrowDownOutlined className="text-[10px]" />
                {formatVnd(totalDrag)} total drag
              </span>
            </>
          )}

          {summaryLine ? (
            <span className="hidden text-xs text-muted-foreground sm:inline">· {summaryLine}</span>
          ) : null}
        </div>

        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground select-none">
          <Switch
            checked={includeAllScenarios}
            onChange={(checked) => onReload?.(checked)}
            size="small"
          />
          Show minor
        </label>
      </div>

      {/* no drag found */}
      {!topLoss ? (
        <Alert
          type="success"
          showIcon
          description="No major price drag found. Toggle 'Show minor' to see smaller effects."
        />
      ) : null}

      {/* impact rows */}
      {visibleImpacts.length ? (
        <div className="grid gap-1.5">
          {visibleImpacts.map((row) => (
            <ImpactInsight
              key={row.id || `${row.field}-${row.label_en || row.label_vi || row.label}`}
              row={row}
              maxDeficit={maxDeficit}
              formatVnd={formatVnd}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-6">
          <Empty description="No visible price-lowering factors. Enable 'Show minor' for more." />
        </div>
      )}

      {report.disclaimer && !/[àáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỷỹ]/i.test(report.disclaimer) ? (
        <p className="text-xs text-muted-foreground/70 px-1">{report.disclaimer}</p>
      ) : null}
    </div>
  )
}
