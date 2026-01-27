"use client"

import { Card, Statistic, Row, Col, Tag, Progress } from "antd"
import { DollarOutlined, LineChartOutlined, CheckCircleOutlined } from "@ant-design/icons"

export default function MarketPriceCard({ marketData }) {
  if (!marketData) return null

  const { marketPriceRange, product } = marketData

  // Format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  // Calculate confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return "#52c41a" // Green
    if (confidence >= 0.6) return "#faad14" // Orange
    return "#ff4d4f" // Red
  }

  const confidencePercent = Math.round(marketPriceRange.confidence * 100)

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <DollarOutlined className="text-primary" />
          <span>Khoảng Giá Thị Trường Hợp Lý</span>
        </div>
      }
      bordered={false}
      className="shadow-sm"
    >
      {/* Product Info */}
      <div className="mb-4 pb-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
        <div className="flex gap-2 mt-2">
          <Tag color="blue">{product.brand}</Tag>
          {product.modelSeries && <Tag>{product.modelSeries}</Tag>}
        </div>
      </div>

      {/* Price Range */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Statistic
            title="Giá Thấp Nhất"
            value={marketPriceRange.min}
            formatter={(value) => formatPrice(value)}
            valueStyle={{ color: "#52c41a", fontSize: "1.25rem" }}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="Giá Trung Bình"
            value={marketPriceRange.average}
            formatter={(value) => formatPrice(value)}
            valueStyle={{ color: "#1890ff", fontSize: "1.25rem" }}
            prefix={<LineChartOutlined />}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="Giá Cao Nhất"
            value={marketPriceRange.max}
            formatter={(value) => formatPrice(value)}
            valueStyle={{ color: "#ff4d4f", fontSize: "1.25rem" }}
          />
        </Col>
      </Row>

      {/* Median Price */}
      {/* <div className="mt-4 pt-4 border-t">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Statistic
              title="Giá Trung Vị (Median)"
              value={marketPriceRange.median}
              formatter={(value) => formatPrice(value)}
              valueStyle={{ fontSize: "1.1rem" }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-gray-500">Độ Tin Cậy:</span>
              <div className="flex items-center gap-3">
                <Progress
                  percent={confidencePercent}
                  strokeColor={getConfidenceColor(marketPriceRange.confidence)}
                  size="small"
                  style={{ flex: 1 }}
                />
                <span className="text-base font-semibold" style={{ color: getConfidenceColor(marketPriceRange.confidence) }}>
                  {confidencePercent}%
                </span>
              </div>
            </div>
          </Col>
        </Row>
      </div> */}

      {/* Info Note */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <CheckCircleOutlined className="text-blue-500 mt-1" />
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">Khoảng giá này được tính toán dựa trên:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Lịch sử giá 30 ngày gần nhất</li>
              <li>Phân tích {marketData.dataPoints} sản phẩm đang bán</li>
              <li>Điều chỉnh theo tình trạng và thông số kỹ thuật</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-3 text-xs text-gray-400 text-right">
        Cập nhật: {new Date(marketData.lastUpdated).toLocaleString('vi-VN')}
      </div>
    </Card>
  )
}