"use client"

import { Button, InputNumber, Select, Slider } from "antd"
import { SettingOutlined, ThunderboltOutlined } from "@ant-design/icons"
import { formatStorageLabel, formatRamLabel } from "@/lib/formatSpecs"

const yesNoOptions = [
  { label: "No",  value: false },
  { label: "Yes", value: true  },
]

export default function FeatureImpactConfigPanel({
  config,
  availableFilters,
  onChange,
  onApply,
  onSuggest,
  loading,
  disabled,
}) {
  if (!config) return null

  const storageOptions = (availableFilters?.storages || []).map((s) => ({
    label: formatStorageLabel(s),
    value: String(s),
  }))
  const ramOptions = (availableFilters?.rams || []).map((r) => ({
    label: formatRamLabel(r),
    value: String(r),
  }))
  const conditionOptions = [
    { label: "Default (Good)", value: "all" },
    ...(availableFilters?.conditions || []).map((c) => ({ label: c, value: c })),
  ]
  const screenOptions = [
    { label: "Default", value: "all" },
    ...(availableFilters?.screenConditions || []).map((s) => ({ label: s, value: s })),
  ]
  const bodyOptions = [
    { label: "Default", value: "all" },
    ...(availableFilters?.bodyConditions || []).map((s) => ({ label: s, value: s })),
  ]

  const set = (key, value) => onChange?.({ ...config, [key]: value })
  const canRun = !disabled && config.storage && !(ramOptions.length > 0 && !config.ram)

  return (
    <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 px-4 pt-3 pb-4 dark:border-amber-900/40 dark:bg-amber-950/10">
      {/* row 1: title + suggest button */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <SettingOutlined className="text-amber-600" />
          Phone specs to analyse
        </div>
        <Button
          size="small"
          onClick={onSuggest}
          disabled={disabled || !onSuggest}
          className="text-xs"
        >
          Auto-fill from listings
        </Button>
      </div>

      {/* row 2: compact grid of controls */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
        {storageOptions.length > 0 && (
          <Field label="Storage">
            <Select
              size="small"
              className="w-full"
              placeholder="Pick storage"
              value={config.storage}
              onChange={(v) => set("storage", v)}
              options={storageOptions}
              disabled={disabled}
            />
          </Field>
        )}

        {ramOptions.length > 0 && (
          <Field label="RAM">
            <Select
              size="small"
              className="w-full"
              placeholder="Pick RAM"
              value={config.ram ?? undefined}
              onChange={(v) => set("ram", v)}
              options={ramOptions}
              disabled={disabled}
            />
          </Field>
        )}

        <Field label="Condition">
          <Select
            size="small"
            className="w-full"
            value={config.condition ?? "all"}
            onChange={(v) => set("condition", v)}
            options={conditionOptions}
            disabled={disabled}
          />
        </Field>

        <Field label={`Battery ${config.analysisBattery ?? 82}%`}>
          <Slider
            min={50}
            max={100}
            value={config.analysisBattery ?? 82}
            onChange={(v) => set("analysisBattery", v)}
            disabled={disabled}
            tooltip={{ formatter: (v) => `${v}%` }}
          />
        </Field>

        <Field label="Has box">
          <Select
            size="small"
            className="w-full"
            value={config.hasBox}
            onChange={(v) => set("hasBox", v)}
            options={yesNoOptions}
            disabled={disabled}
          />
        </Field>

        <Field label="Has charger">
          <Select
            size="small"
            className="w-full"
            value={config.hasCharger}
            onChange={(v) => set("hasCharger", v)}
            options={yesNoOptions}
            disabled={disabled}
          />
        </Field>

        {screenOptions.length > 1 && (
          <Field label="Screen">
            <Select
              size="small"
              className="w-full"
              value={config.screenCondition ?? "all"}
              onChange={(v) => set("screenCondition", v)}
              options={screenOptions}
              disabled={disabled}
            />
          </Field>
        )}

        {bodyOptions.length > 1 && (
          <Field label="Body">
            <Select
              size="small"
              className="w-full"
              value={config.bodyCondition ?? "all"}
              onChange={(v) => set("bodyCondition", v)}
              options={bodyOptions}
              disabled={disabled}
            />
          </Field>
        )}
      </div>

      {/* row 3: run button */}
      <div className="mt-3 flex items-center gap-2">
        <Button
          type="primary"
          size="small"
          icon={<ThunderboltOutlined />}
          onClick={onApply}
          loading={loading}
          disabled={!canRun}
        >
          Analyse price factors
        </Button>
        {!canRun && !loading && (
          <span className="text-xs text-muted-foreground">
            Select storage{ramOptions.length > 0 ? " and RAM" : ""} first
          </span>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  )
}
