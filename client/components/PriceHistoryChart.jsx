"use client"

import { Card } from "antd"
import { LineChartOutlined, HistoryOutlined } from "@ant-design/icons"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import dayjs from "dayjs"
import { useCurrency } from "@/context/CurrencyContext"
import { ChartSkeleton } from "@/components/LoadingSkeletons"

function PriceHistoryTooltip({ active, payload, formatPrice }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm text-popover-foreground">
        <p className="font-semibold mb-2">{data.date}</p>
        {data.averagePrice && (
          <>
            <p className="text-sm text-blue-600 font-medium">
              <HistoryOutlined /> Avg: {formatPrice(data.averagePrice, data.originalAveragePrice)}
            </p>
            <p className="text-sm text-green-600">Min: {formatPrice(data.minPrice)}</p>
            <p className="text-sm text-red-600">Max: {formatPrice(data.maxPrice)}</p>
            {data.count && (
              <p className="text-sm text-muted-foreground">Listings: {data.count}</p>
            )}
          </>
        )}
      </div>
    )
  }
  return null
}

export default function PriceHistoryChart({ priceHistory, loading }) {
  const { formatFromVnd, formatCompactFromVnd } = useCurrency()

  if (loading && (!priceHistory || priceHistory.length === 0)) {
    return <ChartSkeleton height={360} />
  }

  const formatPrice = (value, originalJpy) =>
    formatFromVnd(value, originalJpy != null ? { originalJpy } : undefined)

  const chartData =
    priceHistory?.map((item) => ({
      date: dayjs(item.date).format("DD/MM"),
      fullDate: dayjs(item.date).format("YYYY-MM-DD"),
      averagePrice: item.averagePrice,
      originalAveragePrice: item.originalAveragePrice,
      minPrice: item.minPrice,
      maxPrice: item.maxPrice,
      count: item.count,
    })) ?? []

  if (chartData.length === 0) {
    return null
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <LineChartOutlined className="text-primary" />
          <span>Price History Chart</span>
        </div>
      }
      variant="borderless"
      className="shadow-sm"
    >
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#8884d8" />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#8884d8"
            tickFormatter={(value) => formatCompactFromVnd(value)}
          />
          <Tooltip content={<PriceHistoryTooltip formatPrice={formatPrice} />} />
          <Legend iconType="line" wrapperStyle={{ paddingTop: "20px" }} />
          <Line
            type="monotone"
            dataKey="averagePrice"
            stroke="#1890ff"
            strokeWidth={3}
            name="Average Price (Actual)"
            dot={{ fill: "#1890ff", r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="minPrice"
            stroke="#52c41a"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Lowest Price"
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="maxPrice"
            stroke="#ff4d4f"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Highest Price"
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 p-3 bg-muted rounded text-xs text-foreground/80">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-foreground/80">
            <HistoryOutlined className="text-blue-500" />
            <span><strong>Solid blue line:</strong> Actual average price from listings</span>
          </div>
          <div className="flex items-center gap-2 text-foreground/80">
            <span className="ml-5">Dashed green/red: lowest/highest price</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
