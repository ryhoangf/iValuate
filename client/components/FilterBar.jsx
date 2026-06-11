"use client"

import { useState } from "react"
import { Select, Slider } from "antd"
import { FilterOutlined, CloseOutlined, UpOutlined, DownOutlined } from "@ant-design/icons"
import { formatStorageLabel, formatRamLabel } from "@/lib/formatSpecs"
import { hasActiveFilters } from "@/lib/filters"

// ─── pill toggle ───────────────────────────────────────────────────────────────

function Pill({ label, active, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className={[
        "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors select-none",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground",
      ].join(" ")}
    >
      {label}
    </button>
  )
}

// ─── compact select ────────────────────────────────────────────────────────────

function FilterSelect({ value, onChange, options, placeholder, width = 140 }) {
  const isActive = value && value !== "all"
  return (
    <Select
      value={value ?? "all"}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      size="small"
      style={{ width }}
      className={isActive ? "[&_.ant-select-selector]:!border-primary [&_.ant-select-selector]:!bg-primary/5" : ""}
    />
  )
}

// ─── main component ────────────────────────────────────────────────────────────

export default function FilterBar({ filters, onFilterChange, availableFilters, onResetFilters }) {
  const [localBattery, setLocalBattery] = useState(null)
  const [open, setOpen]                 = useState(true)

  // ── options ──
  const storageOpts = [
    { label: "All Storage", value: "all" },
    ...(availableFilters?.storages || []).map((s) => ({ label: formatStorageLabel(s), value: String(s) })),
  ]
  const ramOpts = [
    { label: "All RAM", value: "all" },
    ...(availableFilters?.rams || []).map((r) => ({ label: formatRamLabel(r), value: String(r) })),
  ]
  const conditionOpts = [
    { label: "All Grades", value: "all" },
    ...(availableFilters?.conditions || []).map((c) => ({ label: c, value: c })),
  ]
  const colorOpts = [
    { label: "All Colors", value: "all" },
    ...(availableFilters?.colors || []).map((c) => ({
      label: c.charAt(0).toUpperCase() + c.slice(1),
      value: c,
    })),
  ]
  const platformOpts = [
    { label: "All Sources", value: "all" },
    ...(availableFilters?.platforms || []).map((p) => ({ label: p, value: p })),
  ]
  const screenOpts = [
    { label: "All Screen", value: "all" },
    ...(availableFilters?.screenConditions || []).map((s) => ({ label: s, value: s })),
  ]
  const bodyOpts = [
    { label: "All Body", value: "all" },
    ...(availableFilters?.bodyConditions || []).map((s) => ({ label: s, value: s })),
  ]

  // ── active count ──
  const isActive = (v) => v && v !== "all"
  const activeCount = [
    isActive(filters.storage),
    isActive(filters.ram),
    isActive(filters.condition),
    isActive(filters.color),
    isActive(filters.platform),
    isActive(filters.screenCondition),
    isActive(filters.bodyCondition),
    filters.hasBox === true,
    filters.hasCharger === true,
    filters.hasCable === true,
    filters.hasEarphones === true,
    filters.isSimFree === true,
    filters.batteryReplaced === true,
    filters.fullyFunctional === true,
    filters.minBattery && filters.minBattery > (availableFilters?.batteryRange?.min ?? 0),
  ].filter(Boolean).length

  const resetAll = () => {
    setLocalBattery(availableFilters?.batteryRange?.min ?? null)
    onResetFilters()
  }

  const batteryMin = availableFilters?.batteryRange?.min ?? 0
  const batteryMax = availableFilters?.batteryRange?.max ?? 100
  const batteryVal = localBattery ?? filters.minBattery ?? batteryMin

  const showStorage = (availableFilters?.storages?.length ?? 0) > 0
  const showRam     = (availableFilters?.rams?.length ?? 0) > 0

  return (
    <div className="pb-4" role="region" aria-label="Listing filters">
      <div className="rounded-xl border border-border bg-card shadow-sm px-5">

        {/* ── header bar ── */}
        <div className="flex items-center justify-between py-2.5">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <FilterOutlined className="text-primary text-xs" />
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold leading-5 text-primary-foreground">
                {activeCount}
              </span>
            )}
            {open
              ? <UpOutlined className="text-[10px] text-muted-foreground" />
              : <DownOutlined className="text-[10px] text-muted-foreground" />}
          </button>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={resetAll}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <CloseOutlined className="text-[10px]" />
              Clear all
            </button>
          )}
        </div>

        {/* ── collapsible body ── */}
        {open && (
          <div className="pb-4 space-y-3">

            {/* row 1: spec + condition selects */}
            <div className="flex flex-wrap justify-center gap-2">
              {showStorage && (
                <FilterSelect
                  value={filters.storage}
                  onChange={(v) => onFilterChange("storage", v)}
                  options={storageOpts}
                  width={130}
                />
              )}
              {showRam && (
                <FilterSelect
                  value={filters.ram}
                  onChange={(v) => onFilterChange("ram", v)}
                  options={ramOpts}
                  width={120}
                />
              )}
              <FilterSelect
                value={filters.condition}
                onChange={(v) => onFilterChange("condition", v)}
                options={conditionOpts}
                width={130}
              />
              <FilterSelect
                value={filters.color}
                onChange={(v) => onFilterChange("color", v)}
                options={colorOpts}
                width={130}
              />
              <FilterSelect
                value={filters.platform}
                onChange={(v) => onFilterChange("platform", v)}
                options={platformOpts}
                width={130}
              />
              <FilterSelect
                value={filters.screenCondition}
                onChange={(v) => onFilterChange("screenCondition", v)}
                options={screenOpts}
                width={140}
              />
              <FilterSelect
                value={filters.bodyCondition}
                onChange={(v) => onFilterChange("bodyCondition", v)}
                options={bodyOpts}
                width={130}
              />
            </div>

            {/* row 2: boolean pill toggles */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground mr-0.5">Includes:</span>
              <Pill label="Box"            active={filters.hasBox         === true} onChange={(v) => onFilterChange("hasBox",          v || null)} />
              <Pill label="Charger"        active={filters.hasCharger     === true} onChange={(v) => onFilterChange("hasCharger",      v || null)} />
              <Pill label="Cable"          active={filters.hasCable       === true} onChange={(v) => onFilterChange("hasCable",        v || null)} />
              <Pill label="Earphones"      active={filters.hasEarphones   === true} onChange={(v) => onFilterChange("hasEarphones",    v || null)} />
              <Pill label="SIM Free"       active={filters.isSimFree      === true} onChange={(v) => onFilterChange("isSimFree",       v || null)} />
              <span className="text-[11px] font-medium text-muted-foreground ml-2 mr-0.5">Status:</span>
              <Pill label="Battery replaced" active={filters.batteryReplaced === true} onChange={(v) => onFilterChange("batteryReplaced", v || null)} />
              <Pill label="Fully functional" active={filters.fullyFunctional === true} onChange={(v) => onFilterChange("fullyFunctional", v || null)} />
            </div>

            {/* row 3: battery slider */}
            {availableFilters?.batteryRange && (
              <div className="flex items-center justify-center gap-4">
                <span className="shrink-0 text-xs font-medium text-muted-foreground">Battery ≥</span>
                <div className="flex-1 max-w-xs">
                  <Slider
                    min={batteryMin}
                    max={batteryMax}
                    value={batteryVal}
                    onChange={(v) => setLocalBattery(v)}
                    onChangeComplete={(v) => { setLocalBattery(v); onFilterChange("minBattery", v) }}
                    tooltip={{ formatter: (v) => `≥ ${v}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                  {batteryVal}%
                </span>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
