"use client"

import { Card, Statistic, Row, Col, Tag, Progress, Tooltip } from "antd"
import { DollarOutlined, LineChartOutlined, CheckCircleOutlined, InfoCircleOutlined, RobotOutlined, DatabaseOutlined } from "@ant-design/icons"
import dayjs from "dayjs"

export default function MarketPriceCard({ marketData }) {
  if (!marketData) return null

  const { marketPriceRange, product, featureAnalysis, dataSource, priceForecasts } = marketData

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

  // Get impact color
  const getImpactColor = (multiplier) => {
    if (multiplier > 1.05) return "green"
    if (multiplier > 1.0) return "cyan"
    if (multiplier < 0.95) return "red"
    if (multiplier < 1.0) return "orange"
    return "default"
  }

  // Get data source badge
  const getDataSourceBadge = (source) => {
    const badges = {
      'price_history': { color: 'green', text: 'Lịch sử giá thực tế' },
      'price_history + ml_forecast': { color: 'blue', text: 'Lịch sử + AI Prediction' },
      'active_listings': { color: 'orange', text: 'Listings hiện tại' },
      'ml_forecast_only': { color: 'purple', text: 'AI Prediction' }
    }
    return badges[source] || { color: 'default', text: 'Dữ liệu thực tế' }
  }

  const confidencePercent = Math.round(marketPriceRange.confidence * 100)
  const sourceBadge = getDataSourceBadge(dataSource)

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <DollarOutlined className="text-primary" />
          <span>Khoảng Giá Thị Trường Hợp Lý</span>
        </div>
      }
      variant="borderless"
      className="shadow-sm"
    >
      {/* Product Info */}
      <div className="mb-4 pb-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
        <div className="flex gap-2 mt-2 flex-wrap items-center">
          <Tag color="blue">{product.brand}</Tag>
          {product.modelSeries && <Tag>{product.modelSeries}</Tag>}
          
          {/* Data Source Badge */}
          {dataSource && (
            <Tooltip title={`Nguồn dữ liệu: ${sourceBadge.text}`}>
              <Tag icon={<DatabaseOutlined />} color={sourceBadge.color}>
                {sourceBadge.text}
              </Tag>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Price Range */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Statistic
            title="Giá Thấp Nhất"
            value={marketPriceRange.min}
            formatter={(value) => formatPrice(value)}
            styles={{ value: { color: "#52c41a", fontSize: "1.25rem" } }}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="Giá Trung Bình"
            value={marketPriceRange.average}
            formatter={(value) => formatPrice(value)}
            styles={{ value: { color: "#1890ff", fontSize: "1.25rem" } }}
            prefix={<LineChartOutlined />}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="Giá Cao Nhất"
            value={marketPriceRange.max}
            formatter={(value) => formatPrice(value)}
            styles={{ value: { color: "#ff4d4f", fontSize: "1.25rem" } }}
          />
        </Col>
      </Row>

      {/* Confidence Score */}
      {/* <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Độ tin cậy:</span>
          <span className="text-base font-semibold" style={{ color: getConfidenceColor(marketPriceRange.confidence) }}>
            {confidencePercent}%
          </span>
        </div>
        <Progress
          percent={confidencePercent}
          strokeColor={getConfidenceColor(marketPriceRange.confidence)}
          size="small"
          showInfo={false}
        />
      </div> */}

      {/* AI Forecast Section */}
      {priceForecasts?.latest && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 mb-3">
            <RobotOutlined className="text-purple-500" />
            <span className="text-sm font-medium">AI Dự Đoán Giá:</span>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-600 mb-1">Giá dự đoán</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatPrice(priceForecasts.latest.price)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600 mb-1">Độ tin cậy</p>
                <p className="text-lg font-bold text-purple-600">
                  {priceForecasts.latest.confidence}%
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Model: {priceForecasts.latest.modelVersion} • {dayjs(priceForecasts.latest.date).format('DD/MM/YYYY')}
            </p>
          </div>
        </div>
      )}

      {/* Feature Analysis Section */}
      {featureAnalysis && featureAnalysis.featuresUsed?.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          {/* <div className="flex items-center gap-2 mb-3">
            <InfoCircleOutlined className="text-blue-500" />
            <span className="text-sm font-medium">Features ảnh hưởng đến giá ({featureAnalysis.totalFeatureCount}):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {featureAnalysis.featuresUsed.map((feature, index) => (
              <Tag key={index} color="blue">{feature}</Tag>
            ))}
          </div> */}

          {/* Impact Breakdown */}
          {/* {featureAnalysis.impacts && featureAnalysis.impacts.length > 0 && (
            <div className="mt-3 space-y-2">
              <span className="text-xs font-medium text-gray-600">Chi tiết impact:</span>
              <div className="flex flex-wrap gap-2">
                {featureAnalysis.impacts.map((impact, index) => {
                  const impactPercent = ((impact.multiplier - 1) * 100).toFixed(1)
                  const sign = impact.multiplier >= 1 ? '+' : ''
                  return (
                    <Tooltip 
                      key={index} 
                      title={`${impact.feature}: ${impact.value} → ${sign}${impactPercent}%`}
                    >
                      <Tag color={getImpactColor(impact.multiplier)}>
                        {impact.feature}: {sign}{impactPercent}%
                      </Tag>
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          )} */}
        </div>
      )}

      {/* Info Note
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <CheckCircleOutlined className="text-blue-500 mt-1" />
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">Khoảng giá này được tính toán dựa trên:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>{sourceBadge.text}</li>
              <li>Phân tích {marketData.dataPoints} sản phẩm đang bán</li>
              <li>Điều chỉnh theo {featureAnalysis?.totalFeatureCount || 0} features cụ thể</li>
            </ul>
          </div>
        </div>
      </div> */}

      {/* Last Updated */}
      {/* <div className="mt-3 text-xs text-gray-400 text-right">
        Cập nhật: {new Date(marketData.lastUpdated).toLocaleString('vi-VN')}
      </div> */}
    </Card>
  )
}