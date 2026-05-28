"use client"

import { Card } from "antd"
import { LineChartOutlined, HistoryOutlined, RobotOutlined } from "@ant-design/icons"
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

export default function PriceHistoryChart({ priceHistory, priceForecasts }) {
  // Format currency for tooltip
  const formatPrice = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value)
  }

  // Merge historical and forecast data
  const mergeData = () => {
    const dataMap = new Map()

    // Add historical data (ALWAYS keep this)
    if (priceHistory && priceHistory.length > 0) {
      priceHistory.forEach(item => {
        const date = dayjs(item.date).format("DD/MM")
        const fullDate = dayjs(item.date).format("YYYY-MM-DD")
        dataMap.set(fullDate, {
          date,
          fullDate,
          averagePrice: item.averagePrice,
          minPrice: item.minPrice,
          maxPrice: item.maxPrice,
          count: item.count
        })
      })
    }

    // Add forecast data (OPTIONAL - overlay if available)
    if (priceForecasts && priceForecasts.history && priceForecasts.history.length > 0) {
      priceForecasts.history.forEach(item => {
        const date = dayjs(item.date).format("DD/MM")
        const fullDate = dayjs(item.date).format("YYYY-MM-DD")
        const existing = dataMap.get(fullDate)
        if (existing) {
          // Same date - add forecast to existing data
          existing.predictedPrice = item.price
          existing.confidence = item.confidence
        } else {
          // New date - create new entry
          dataMap.set(fullDate, {
            date,
            fullDate,
            predictedPrice: item.price,
            confidence: item.confidence
          })
        }
      })
    }

    return Array.from(dataMap.values()).sort((a, b) => 
      a.fullDate.localeCompare(b.fullDate)
    )
  }

  const chartData = mergeData()

  if (!chartData || chartData.length === 0) {
    return null
  }

  const hasHistorical = chartData.some(d => d.averagePrice !== undefined)
  const hasForecast = chartData.some(d => d.predictedPrice !== undefined)

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold mb-2">{data.date}</p>
          
          {/* Historical Data */}
          {data.averagePrice && (
            <>
              <p className="text-sm text-blue-600 font-medium">
                <HistoryOutlined /> Giá TB: {formatPrice(data.averagePrice)}
              </p>
              <p className="text-sm text-green-600">
                Min: {formatPrice(data.minPrice)}
              </p>
              <p className="text-sm text-red-600">
                Max: {formatPrice(data.maxPrice)}
              </p>
              {data.count && (
                <p className="text-sm text-gray-500">
                  Listings: {data.count}
                </p>
              )}
            </>
          )}
          
          {/* Forecast Data */}
          {data.predictedPrice && (
            <>
              {data.averagePrice && <div className="border-t my-2"></div>}
              <p className="text-sm text-purple-600 font-medium">
                <RobotOutlined /> AI Dự đoán: {formatPrice(data.predictedPrice)}
              </p>
              {data.confidence && (
                <p className="text-sm text-gray-500">
                  Confidence: {data.confidence}%
                </p>
              )}
            </>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <LineChartOutlined className="text-primary" />
          <span>Biểu Đồ Lịch Sử Giá {hasForecast && '& Dự Đoán AI'}</span>
        </div>
      }
      variant="borderless"
      className="shadow-sm"
    >
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            stroke="#8884d8"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#8884d8"
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            iconType="line"
            wrapperStyle={{ paddingTop: "20px" }}
          />
          
          {/* KEEP ORIGINAL: Historical Price Lines */}
          {hasHistorical && (
            <>
              <Line
                type="monotone"
                dataKey="averagePrice"
                stroke="#1890ff"
                strokeWidth={3}
                name="Giá Trung Bình (Thực tế)"
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
                name="Giá Thấp Nhất"
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="maxPrice"
                stroke="#ff4d4f"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Giá Cao Nhất"
                dot={false}
                connectNulls
              />
            </>
          )}
          
          {/* NEW: AI Predicted Price Line (optional overlay) */}
          {hasForecast && (
            <Line
              type="monotone"
              dataKey="predictedPrice"
              stroke="#722ed1"
              strokeWidth={3}
              name="AI Dự Đoán"
              dot={{ fill: "#722ed1", r: 4, strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6 }}
              strokeDasharray="8 4"
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
        <div className="flex flex-col gap-2">
          {hasHistorical && (
            <div className="flex items-center gap-2 text-gray-600">
              <HistoryOutlined className="text-blue-500" />
              <span><strong>Đường liền xanh dương:</strong> Giá trung bình thực tế từ listings</span>
            </div>
          )}
          {hasHistorical && (
            <div className="flex items-center gap-2 text-gray-600">
              <span className="ml-5">Đường đứt xanh lá/đỏ: Giá thấp nhất/cao nhất</span>
            </div>
          )}
          {hasForecast && (
            <div className="flex items-center gap-2 text-gray-600">
              <RobotOutlined className="text-purple-500" />
              <span><strong>Đường đứt tím:</strong> Giá dự đoán bởi AI model</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}