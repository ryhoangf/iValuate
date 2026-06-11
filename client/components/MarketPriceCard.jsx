"use client"

import { Card, Statistic, Row, Col, Tag, Progress, Tooltip } from "antd"
import { DollarOutlined, LineChartOutlined, RobotOutlined, DatabaseOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import { useCurrency } from "@/context/CurrencyContext"
import { parseBaseSpecs } from "@/lib/parseBaseSpecs"
import { formatStorageLabel, formatRamLabel, parseStorageToGb } from "@/lib/formatSpecs"

export default function MarketPriceCard({ marketData }) {
  const { formatFromVnd } = useCurrency()

  if (!marketData) return null

  const { marketPriceRange, product, featureAnalysis, dataSource, priceForecasts } = marketData
  const specs = parseBaseSpecs(product?.baseSpecs)
  const storageGb = parseStorageToGb(specs.storage ?? specs.storage_gb ?? specs.capacity)
  const ramGb = specs.ram ?? specs.ram_gb

  const formatPrice = (price) => formatFromVnd(price)

  const getConfidenceClass = (confidence) => {
    const pct = confidence > 1 ? confidence / 100 : confidence
    if (pct >= 0.8) return "text-emerald-700 dark:text-emerald-400"
    if (pct >= 0.6) return "text-amber-700 dark:text-amber-400"
    return "text-red-700 dark:text-red-400"
  }

  const getConfidenceBarColor = (confidence) => {
    const pct = confidence > 1 ? confidence / 100 : confidence
    if (pct >= 0.8) return "#059669"
    if (pct >= 0.6) return "#d97706"
    return "#dc2626"
  }

  const formatConfidencePct = (confidence) => {
    const n = Number(confidence)
    if (Number.isNaN(n)) return "—"
    return n > 1 ? n.toFixed(2) : (n * 100).toFixed(2)
  }

  // Get data source badge
  const getDataSourceBadge = (source) => {
    const badges = {
      'price_history': { color: 'green', text: 'Actual price history' },
      'price_history + ml_forecast': { color: 'blue', text: 'History + AI prediction' },
      'active_listings': { color: 'orange', text: 'Current listings' },
      'ml_forecast_only': { color: 'purple', text: 'AI prediction' }
    }
    return badges[source] || { color: 'default', text: 'Real data' }
  }

  const sourceBadge = getDataSourceBadge(dataSource)

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <DollarOutlined className="text-primary" />
          <span>Fair Market Price Range</span>
        </div>
      }
      variant="borderless"
      className="shadow-sm border border-border bg-card"
    >
      {/* Product Info */}
      <div className="mb-4 pb-4 border-b">
        <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
        <div className="flex gap-2 mt-2 flex-wrap items-center">
          <Tag color="blue">{product.brand}</Tag>
          {product.modelSeries && <Tag>{product.modelSeries}</Tag>}
          {storageGb && <Tag color="geekblue">{formatStorageLabel(storageGb)}</Tag>}
          {ramGb && <Tag color="purple">{formatRamLabel(ramGb)}</Tag>}
          
          {/* Data Source Badge */}
          {dataSource && (
            <Tooltip title={`Data source: ${sourceBadge.text}`}>
              <Tag icon={<DatabaseOutlined />} color={sourceBadge.color}>
                {sourceBadge.text}
              </Tag>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Price Range */}
      <Row gutter={[16, 16]} justify="center">
        <Col xs={24} sm={8} className="text-center">
          <Statistic
            title={<span className="font-bold text-emerald-600 dark:text-emerald-400">Lowest Price</span>}
            value={marketPriceRange.min}
            formatter={(value) => (
              <span className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatPrice(value)}
              </span>
            )}
            styles={{
              header: { textAlign: "center" },
              content: { justifyContent: "center" },
            }}
          />
        </Col>
        <Col xs={24} sm={8} className="text-center">
          <Statistic
            title={<span className="font-bold text-blue-600 dark:text-blue-400">Average Price</span>}
            value={marketPriceRange.average}
            formatter={(value) => (
              <span className="text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                {formatPrice(value)}
              </span>
            )}
            prefix={<LineChartOutlined className="text-blue-600 dark:text-blue-400" />}
            styles={{
              header: { textAlign: "center" },
              content: { justifyContent: "center" },
            }}
          />
        </Col>
        <Col xs={24} sm={8} className="text-center">
          <Statistic
            title={<span className="font-bold text-red-600 dark:text-red-400">Highest Price</span>}
            value={marketPriceRange.max}
            formatter={(value) => (
              <span className="text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">
                {formatPrice(value)}
              </span>
            )}
            styles={{
              header: { textAlign: "center" },
              content: { justifyContent: "center" },
            }}
          />
        </Col>
      </Row>

      {/* Confidence Score */}
      {/* <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground/80">Độ tin cậy:</span>
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
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-1">
            <RobotOutlined className="text-primary" aria-hidden />
            <span className="text-sm font-medium text-foreground">AI price prediction</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Model price at ETL run date — not a 30-day forecast.
          </p>
          <div className="rounded-lg border border-border bg-muted/50 p-4 dark:bg-muted/30">
            <div className="flex flex-wrap justify-between gap-4 items-end">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                  Predicted price
                </p>
                <p className="text-xl font-bold tabular-nums text-foreground">
                  {formatPrice(priceForecasts.latest.price)}
                </p>
              </div>
              <div className="text-right min-w-[7rem]">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                  Confidence
                </p>
                <p
                  className={`text-xl font-bold tabular-nums ${getConfidenceClass(priceForecasts.latest.confidence)}`}
                >
                  {formatConfidencePct(priceForecasts.latest.confidence)}%
                </p>
              </div>
            </div>
            <Progress
              className="mt-3 [&_.ant-progress-bg]:!h-1.5"
              percent={Math.min(100, Math.max(0, Number(priceForecasts.latest.confidence) || 0))}
              strokeColor={getConfidenceBarColor(priceForecasts.latest.confidence)}
              railColor="var(--border)"
              size="small"
              showInfo={false}
            />
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              <span className="text-foreground/80">Model:</span>{" "}
              {priceForecasts.latest.modelVersion}
              <span className="mx-1.5 text-border">·</span>
              <span className="text-foreground/80">ETL updated:</span>{" "}
              {dayjs(priceForecasts.latest.date).format("DD/MM/YYYY")}
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
              <span className="text-xs font-medium text-foreground/80">Chi tiết impact:</span>
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
          <div className="text-sm text-foreground/85">
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
