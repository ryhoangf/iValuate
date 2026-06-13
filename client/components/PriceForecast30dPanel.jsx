"use client"

import { Alert, Card, Col, Row, Spin, Statistic, Tag } from "antd"
import { LineChartOutlined, RobotOutlined, TrophyOutlined } from "@ant-design/icons"
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from "recharts"
import dayjs from "dayjs"
import { useCurrency } from "@/context/CurrencyContext"

function pick(obj, ...keys) {
  if (!obj) return undefined
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== "") return obj[k]
  }
  return undefined
}

function formatVnd(v) {
  if (v == null || Number.isNaN(v)) return "—"
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "VND" }).format(v)
}

/** Chuẩn hóa response FastAPI `compute_price_forecast_30d`. */
export function normalizeForecast30d(raw) {
  if (!raw) return null

  const summary = raw.summary || {}
  const trendPct = summary.trend_pct_over_horizon
  const horizonDays = raw.horizon_days || 30
  const confidencePct =
    raw.confidence != null ? Math.round(Number(raw.confidence) * 100) : undefined

  const pointsRaw = raw.forecasts || raw.forecast_points || raw.points || []
  const points = (Array.isArray(pointsRaw) ? pointsRaw : [])
    .map((p) => ({
      date: pick(p, "forecast_date", "date"),
      offsetDays: pick(p, "day_offset", "offset_days", "day"),
      price: pick(p, "predicted_price_vnd", "price_vnd", "price"),
      confidence: confidencePct,
      isForecast: true,
    }))
    .filter((p) => p.date && p.price != null)

  const minForecast = summary.min_forecast_vnd
  let golden = raw.golden_signal || raw.golden_window || null
  if (!golden && trendPct != null) {
    if (Number(trendPct) <= -3 && minForecast != null) {
      golden = {
        active: true,
        message: `Downward trend ~${Math.abs(Number(trendPct))}% over ${horizonDays} days — consider buying near the forecast low (${formatVnd(minForecast)}).`,
      }
    } else if (Number(trendPct) >= 3) {
      golden = {
        active: false,
        message: `Price may rise ~${trendPct}% over ${horizonDays} days — buying sooner may avoid paying more.`,
      }
    }
  }

  const historyFromApi = (raw.history || []).map((h) => ({
    date: h.record_date,
    averagePrice: h.avg_price_vnd ?? h.avg_price,
  }))

  return {
    asOfDate: raw.anchor_date,
    horizonDays,
    baselinePrice: raw.anchor_price_vnd,
    points,
    historyFromApi,
    trend: {
      pct: trendPct,
      method: raw.method,
      minForecastVnd: minForecast,
      maxForecastVnd: summary.max_forecast_vnd,
      lastDayVnd: summary.forecast_at_last_day_vnd,
    },
    golden,
    disclaimer: raw.disclaimer,
    modelVersion: raw.model_version,
    dataQuality: raw.diagnostics,
    method: raw.method,
    confidencePct,
  }
}

function buildForecastChartData(forecast, priceHistory) {
  const today = dayjs().startOf("day")
  const anchorPrice =
    forecast.baselinePrice != null ? Number(forecast.baselinePrice) : null
  const historyCutoff = today.subtract(14, "day")

  const history = [...(forecast.historyFromApi || priceHistory || [])]
    .map((h) => ({
      d: dayjs(h.date || h.record_date),
      price: Number(h.averagePrice ?? h.avg_price_vnd ?? h.avg_price),
      originalJpy:
        h.originalAveragePrice != null
          ? Number(h.originalAveragePrice)
          : h.original_price != null
            ? Number(h.original_price)
            : null,
    }))
    .filter((h) => h.d.isValid() && h.price > 0)
    .sort((a, b) => a.d.valueOf() - b.d.valueOf())

  const recentHistory = history.filter(
    (h) => h.d.isSame(historyCutoff, "day") || h.d.isAfter(historyCutoff)
  )

  const rows = []

  recentHistory.forEach((h) => {
    rows.push({
      ts: h.d.valueOf(),
      fullDate: h.d.format("YYYY-MM-DD"),
      dateLabel: h.d.format("DD/MM"),
      actualPrice: h.price,
      originalAveragePrice: h.originalJpy,
    })
  })

  const hasTodayHistory = recentHistory.some((h) => h.d.isSame(today, "day"))
  if (!hasTodayHistory && anchorPrice != null && anchorPrice > 0) {
    rows.push({
      ts: today.valueOf(),
      fullDate: today.format("YYYY-MM-DD"),
      dateLabel: today.format("DD/MM"),
      actualPrice: anchorPrice,
      forecastPrice: anchorPrice,
      isAnchor: true,
    })
  }

  forecast.points.forEach((p) => {
    const d = dayjs(p.date).startOf("day")
    if (!d.isValid()) return
    rows.push({
      ts: d.valueOf(),
      fullDate: d.format("YYYY-MM-DD"),
      dateLabel: d.format("DD/MM"),
      forecastPrice: Number(p.price),
    })
  })

  const byDate = new Map()
  rows.forEach((r) => {
    const prev = byDate.get(r.fullDate)
    byDate.set(r.fullDate, prev ? { ...prev, ...r } : r)
  })

  return Array.from(byDate.values()).sort((a, b) => a.ts - b.ts)
}

/** ~6 nhãn trục X cách đều theo thời gian thực. */
function buildEvenTimeTicks(rows, tickCount = 6) {
  if (!rows.length) return []
  if (rows.length <= tickCount) return rows.map((r) => r.ts)

  const min = rows[0].ts
  const max = rows[rows.length - 1].ts
  if (min === max) return [min]

  const step = (max - min) / (tickCount - 1)
  return Array.from({ length: tickCount }, (_, i) => Math.round(min + step * i))
}

function buildPriceDomain(rows) {
  const prices = rows.flatMap((r) =>
    [r.actualPrice, r.forecastPrice].filter((v) => v != null && v > 0)
  )
  if (!prices.length) return ["auto", "auto"]

  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const pad = Math.max((max - min) * 0.08, max * 0.02)
  return [Math.floor(min - pad), Math.ceil(max + pad)]
}

function ForecastTooltip({ active, payload, formatPrice }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded border border-gray-200 bg-white p-3 shadow-lg text-sm">
      <p className="mb-2 font-semibold">{d.dateLabel}</p>
      {d.actualPrice != null && (
        <p className="text-blue-600">
          Actual avg: {formatPrice(d.actualPrice, d.originalAveragePrice)}
        </p>
      )}
      {d.forecastPrice != null && (
        <p className="text-purple-600">Forecast: {formatPrice(d.forecastPrice)}</p>
      )}
    </div>
  )
}

export default function PriceForecast30dPanel({
  forecastRaw,
  priceHistory,
  loading,
  error,
}) {
  const { formatFromVnd, formatCompactFromVnd } = useCurrency()
  const formatVnd = (v) => formatFromVnd(v)

  if (loading) {
    return (
      <Card className="shadow-sm">
        <Spin spinning tip="Computing 30-day forecast...">
          <div className="min-h-[120px]" />
        </Spin>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert
        type="warning"
        showIcon
        title="Could not load 30-day price forecast"
        description={error}
        className="shadow-sm rounded-xl"
      />
    )
  }

  const forecast = normalizeForecast30d(forecastRaw)
  if (!forecast?.points?.length) {
    return (
      <Alert
        type="info"
        showIcon
        title="No 30-day forecast available yet"
        description="The forecast service did not return enough future price points for this product. You can still use the market range, similar listings, and price history as the current reference."
        className="shadow-sm rounded-xl"
      />
    )
  }

  const chartData = buildForecastChartData(forecast, priceHistory)
  const xTicks = buildEvenTimeTicks(chartData)
  const yDomain = buildPriceDomain(chartData)
  const todayTs = dayjs().startOf("day").valueOf()
  const baseline =
    forecast.baselinePrice != null
      ? Number(forecast.baselinePrice)
      : chartData.find((r) => r.actualPrice > 0)?.actualPrice ?? null
  const lastPoint = forecast.points[forecast.points.length - 1]
  const endPrice =
    forecast.trend?.lastDayVnd != null
      ? Number(forecast.trend.lastDayVnd)
      : lastPoint?.price != null
        ? Number(lastPoint.price)
        : null
  const pctChange =
    forecast.trend?.pct != null
      ? Number(forecast.trend.pct).toFixed(1)
      : baseline && endPrice
        ? (((endPrice - baseline) / baseline) * 100).toFixed(1)
        : null

  const golden = forecast.golden
  const goldenActive =
    golden?.active === true ||
    golden?.is_golden === true ||
    golden?.signal === "golden" ||
    golden?.level === "golden"

  const goldenMessage =
    pick(golden, "message", "label", "title", "recommendation") ||
    (goldenActive ? "Favorable buy timing signal within the next 30 days." : null)

  return (
    <Card
      title={
        <div className="flex flex-wrap items-center gap-2">
          <LineChartOutlined className="text-violet-500" />
          <span>30-day price forecast (ML + history)</span>
          {goldenActive && (
            <Tag icon={<TrophyOutlined />} color="gold">
              Golden signal
            </Tag>
          )}
        </div>
      }
      variant="borderless"
      className="shadow-sm"
    >
      {forecast.disclaimer && (
        <Alert type="info" showIcon className="mb-4" description={forecast.disclaimer} />
      )}

      {goldenMessage && (
        <Alert
          type={goldenActive ? "success" : "info"}
          showIcon
          icon={goldenActive ? <TrophyOutlined /> : undefined}
          title={goldenActive ? "Timing suggestion" : "Trend"}
          description={goldenMessage}
          className="mb-4"
        />
      )}

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={8}>
          <Statistic
            title="Current anchor"
            value={baseline ?? "—"}
            formatter={(v) => (v === "—" ? v : formatVnd(v))}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title={`D+${forecast.horizonDays || forecast.points.length}`}
            value={endPrice ?? "—"}
            formatter={(v) => (v === "—" ? v : formatVnd(v))}
            styles={{
              content: {
                color:
                  endPrice != null && baseline != null && endPrice < baseline
                    ? "#cf1322"
                    : "#3f8600",
              },
            }}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="Expected change"
            value={pctChange != null ? `${pctChange}%` : "—"}
            prefix={pctChange != null && Number(pctChange) < 0 ? "↓" : pctChange != null ? "↑" : undefined}
          />
        </Col>
      </Row>

      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={chartData} margin={{ top: 36, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            ticks={xTicks}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => dayjs(v).format("DD/MM")}
            minTickGap={48}
          />
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => formatCompactFromVnd(v)}
          />
          <Tooltip
            content={(props) => (
              <ForecastTooltip {...props} formatPrice={(v, jpy) => formatFromVnd(v, jpy != null ? { originalJpy: jpy } : undefined)} />
            )}
          />
          <Legend wrapperStyle={{ paddingTop: 12 }} iconSize={10} />
          <ReferenceLine
            x={todayTs}
            stroke="#faad14"
            strokeDasharray="4 4"
            label={{
              value: "Today",
              position: "top",
              fill: "#d48806",
              fontSize: 11,
              offset: 10,
            }}
          />
          <Line
            type="monotone"
            dataKey="actualPrice"
            name="Actual average"
            stroke="#1890ff"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="forecastPrice"
            name="30-day forecast"
            stroke="#722ed1"
            strokeWidth={2.5}
            strokeDasharray="8 4"
            dot={{ r: 3, fill: "#722ed1" }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
        <span>X-axis: calendar span (last 14 days + 30-day forecast).</span>
        <span className="inline-flex items-center gap-1">
          <RobotOutlined className="text-purple-500" />
          {forecast.modelVersion ? `Model: ${forecast.modelVersion}` : "Historical price estimate"}
        </span>
        {forecast.asOfDate && (
          <span>Updated: {dayjs(forecast.asOfDate).format("DD/MM/YYYY")}</span>
        )}
        {forecast.method && (
          <span>
            Method:{" "}
            {forecast.method === "hybrid"
              ? "history + ML"
              : forecast.method === "history_trend"
                ? "history trend"
                : forecast.method === "rolling_median"
                  ? "7-day rolling median"
                  : forecast.method === "damped_median_trend"
                    ? "damped median trend"
                    : forecast.method === "converging_median"
                      ? "converging 7-day median"
                : "ML model"}
          </span>
        )}
        {forecast.confidencePct != null && (
          <span>Confidence: {forecast.confidencePct}%</span>
        )}
      </div>
    </Card>
  )
}
