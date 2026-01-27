"use client"

import { Select, Space, Slider, Switch } from "antd"
import { FilterOutlined } from "@ant-design/icons"
import { useState } from "react"

export default function FilterBar({ filters, onFilterChange, availableFilters }) {
  // Local state for slider to prevent re-fetching on drag
  const [localBatteryValue, setLocalBatteryValue] = useState(null)

  // Build dynamic options from available filters
  const conditionOptions = [
    { label: "All Conditions", value: "all" },
    ...(availableFilters?.conditions || []).map(c => ({ label: c, value: c }))
  ];

  const colorOptions = [
    { label: "All Colors", value: "all" },
    ...(availableFilters?.colors || []).map(c => ({ 
      label: c.charAt(0).toUpperCase() + c.slice(1), 
      value: c 
    }))
  ];

  const platformOptions = [
    { label: "All Sources", value: "all" },
    ...(availableFilters?.platforms || []).map(p => ({ label: p, value: p }))
  ];

  const batteryStatusOptions = [
    { label: "All Battery Status", value: "all" },
    ...(availableFilters?.batteryStatuses || []).map(s => ({ label: s, value: s }))
  ];

  const screenConditionOptions = [
    { label: "All Screen Conditions", value: "all" },
    ...(availableFilters?.screenConditions || []).map(s => ({ label: s, value: s }))
  ];

  const bodyConditionOptions = [
    { label: "All Body Conditions", value: "all" },
    ...(availableFilters?.bodyConditions || []).map(s => ({ label: s, value: s }))
  ];

  // Calculate if any filters are active
  const hasActiveFilters = 
    filters.condition !== 'all' || 
    filters.color !== 'all' || 
    filters.platform !== 'all' ||
    filters.batteryStatus !== 'all' ||
    filters.screenCondition !== 'all' ||
    filters.bodyCondition !== 'all' ||
    filters.batteryReplaced !== null ||
    filters.hasBox !== null ||
    filters.hasCharger !== null ||
    filters.isSimFree !== null ||
    filters.fullyFunctional !== null ||
    (availableFilters?.batteryRange && filters.minBattery > availableFilters.batteryRange.min);

  const resetAllFilters = () => {
    onFilterChange('condition', 'all')
    onFilterChange('color', 'all')
    onFilterChange('platform', 'all')
    onFilterChange('batteryStatus', 'all')
    onFilterChange('screenCondition', 'all')
    onFilterChange('bodyCondition', 'all')
    onFilterChange('batteryReplaced', null)
    onFilterChange('hasBox', null)
    onFilterChange('hasCharger', null)
    onFilterChange('isSimFree', null)
    onFilterChange('fullyFunctional', null)
    if (availableFilters?.batteryRange) {
      onFilterChange('minBattery', availableFilters.batteryRange.min)
      setLocalBatteryValue(availableFilters.batteryRange.min)
    }
  }

  return (
    <div className="py-6 border-b border-border bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FilterOutlined className="text-primary" />
              <span>Filters</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="text-sm text-primary hover:underline"
              >
                Reset All Filters
              </button>
            )}
          </div>

          {/* Row 1: Condition, Color, Source, Battery Status, Screen, Body */}
          <div className="flex flex-wrap gap-3">
            <Select
              placeholder="Condition"
              value={filters.condition}
              onChange={(value) => onFilterChange("condition", value)}
              options={conditionOptions}
              style={{ width: 160 }}
            />

            <Select
              placeholder="Color"
              value={filters.color}
              onChange={(value) => onFilterChange("color", value)}
              options={colorOptions}
              style={{ width: 140 }}
            />

            <Select
              placeholder="Source"
              value={filters.platform}
              onChange={(value) => onFilterChange("platform", value)}
              options={platformOptions}
              style={{ width: 150 }}
            />

            <Select
              placeholder="Battery Status"
              value={filters.batteryStatus}
              onChange={(value) => onFilterChange("batteryStatus", value)}
              options={batteryStatusOptions}
              style={{ width: 160 }}
            />

            <Select
              placeholder="Screen Condition"
              value={filters.screenCondition}
              onChange={(value) => onFilterChange("screenCondition", value)}
              options={screenConditionOptions}
              style={{ width: 180 }}
            />

            <Select
              placeholder="Body Condition"
              value={filters.bodyCondition}
              onChange={(value) => onFilterChange("bodyCondition", value)}
              options={bodyConditionOptions}
              style={{ width: 180 }}
            />
          </div>

          {/* Row 2: Boolean Filters (Switches) */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm">Battery Replaced:</span>
              <Switch
                checked={filters.batteryReplaced === true}
                onChange={(checked) => onFilterChange("batteryReplaced", checked ? true : null)}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">Has Box:</span>
              <Switch
                checked={filters.hasBox === true}
                onChange={(checked) => onFilterChange("hasBox", checked ? true : null)}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">Has Charger:</span>
              <Switch
                checked={filters.hasCharger === true}
                onChange={(checked) => onFilterChange("hasCharger", checked ? true : null)}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">SIM Free:</span>
              <Switch
                checked={filters.isSimFree === true}
                onChange={(checked) => onFilterChange("isSimFree", checked ? true : null)}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">Fully Functional:</span>
              <Switch
                checked={filters.fullyFunctional === true}
                onChange={(checked) => onFilterChange("fullyFunctional", checked ? true : null)}
              />
            </div>
          </div>

          {/* Row 3: Battery Health Slider */}
          {availableFilters?.batteryRange && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Battery Health:
                </span>
                <span className="text-xs text-gray-500">
                  Showing batteries with ≥ {localBatteryValue ?? filters.minBattery ?? availableFilters.batteryRange.min}% health
                </span>
              </div>
              <div className="w-full">
                <Slider
                  min={availableFilters.batteryRange.min}
                  max={availableFilters.batteryRange.max}
                  value={localBatteryValue ?? filters.minBattery ?? availableFilters.batteryRange.min}
                  onChange={(value) => {
                    // Only update local state while dragging
                    setLocalBatteryValue(value)
                  }}
                  onChangeComplete={(value) => {
                    // Actually filter when user releases the slider
                    setLocalBatteryValue(value)
                    onFilterChange("minBattery", value)
                  }}
                  marks={{
                    [availableFilters.batteryRange.min]: `${availableFilters.batteryRange.min}%`,
                    [availableFilters.batteryRange.max]: `${availableFilters.batteryRange.max}%`,
                  }}
                  tooltip={{
                    formatter: (value) => `≥ ${value}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
