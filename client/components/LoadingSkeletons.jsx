"use client"

import { Card, Skeleton } from "antd"

export function TableSkeleton({ rows = 8 }) {
  return (
    <Card className="shadow-sm" aria-busy="true" aria-label="Loading table">
      <Skeleton active paragraph={{ rows }} title={{ width: "40%" }} />
    </Card>
  )
}

export function ChartSkeleton({ height = 320 }) {
  return (
    <Card className="shadow-sm" aria-busy="true" aria-label="Loading chart">
      <Skeleton.Node active style={{ width: "100%", height }} />
    </Card>
  )
}
