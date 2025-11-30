"use client"

import { Select, Space } from "antd"
import { FilterOutlined } from "@ant-design/icons"

export default function FilterBar({ filters, onFilterChange }) {
  const conditionOptions = [
    { label: "All", value: "all" },
    { label: "99%", value: "99%" },
    { label: "98%", value: "98%" },
    { label: "Old", value: "old" },
  ]

  const storageOptions = [
    { label: "All", value: "all" },
    { label: "64GB", value: "64GB" },
    { label: "128GB", value: "128GB" },
    { label: "256GB", value: "256GB" },
    { label: "512GB", value: "512GB" },
    { label: "1TB", value: "1TB" },
  ]

  const colorOptions = [
    { label: "All", value: "all" },
    { label: "Black", value: "black" },
    { label: "White", value: "white" },
    { label: "Blue", value: "blue" },
    { label: "Gold", value: "gold" },
  ]

  return (
    <div className="py-6 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FilterOutlined className="text-primary" />
            <span>Filters:</span>
          </div>

          <Space wrap size="middle" className="flex-1">
            <Select
              placeholder="Condition"
              value={filters.condition}
              onChange={(value) => onFilterChange("condition", value)}
              options={conditionOptions}
              style={{ width: 140 }}
            />

            <Select
              placeholder="Storage"
              value={filters.storage}
              onChange={(value) => onFilterChange("storage", value)}
              options={storageOptions}
              style={{ width: 140 }}
            />

            <Select
              placeholder="Color"
              value={filters.color}
              onChange={(value) => onFilterChange("color", value)}
              options={colorOptions}
              style={{ width: 140 }}
            />
          </Space>
        </div>
      </div>
    </div>
  )
}
