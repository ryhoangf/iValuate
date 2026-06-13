"use client"

import { Alert, Card } from "antd";
import { ExperimentOutlined } from "@ant-design/icons";
import { useCurrency } from "@/context/CurrencyContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { ChartSkeleton } from "@/components/LoadingSkeletons";

export default function ModelDepreciationChart({ curve, loading, error }) {
  const { formatFromVnd, formatCompactFromVnd } = useCurrency();

  if (loading) {
    return <ChartSkeleton height={280} />;
  }

  if (error === "PREMIUM_REQUIRED") {
    return (
      <Alert
        type="info"
        showIcon
        title="Premium plan"
        description="Model depreciation curves are available on Premium only. Lite still includes market price range and similar listings."
        className="shadow-sm"
      />
    );
  }

  if (error) {
    return (
      <Alert
        type="warning"
        showIcon
        title="Could not load model depreciation curve"
        description={error}
        className="shadow-sm"
      />
    );
  }

  if (!curve?.ages_years?.length || !curve?.prices_vnd?.length) return null;

  const chartData = curve.ages_years.map((age, i) => ({
    ageYears: age,
    priceVnd: curve.prices_vnd[i],
  }));

  const formatPrice = (v) => formatFromVnd(v);

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <ExperimentOutlined className="text-slate-500" />
          <span>Model depreciation curve</span>
        </div>
      }
      variant="borderless"
      className="shadow-sm"
    >
      <Alert
        type="info"
        showIcon
        className="mb-0"
        title="Model simulation with fixed reference conditions"
        description={
          <div className="text-sm space-y-1">
            {curve.disclaimer && <p>{curve.disclaimer}</p>}
            {curve.model_version && (
              <p>
                Model version: <strong>{curve.model_version}</strong>
                {curve.reference_year != null && (
                  <> · Reference year: {curve.reference_year}</>
                )}
              </p>
            )}
            {curve.curve_method && (
              <p>
                Curve method: <strong>{curve.curve_method}</strong>
              </p>
            )}
            {curve.depreciation_diagnostics?.annual_depreciation_pct != null && (
              <p>
                Learned annual depreciation:{" "}
                <strong>
                  {Number(
                    curve.depreciation_diagnostics.annual_depreciation_pct
                  ).toFixed(1)}
                  %
                </strong>
                {" "}(data-derived, not a fixed rule)
              </p>
            )}
            {curve.query && (
              <p>
                Baseline: {curve.query.model_line} · {curve.query.storage}GB · RAM{" "}
                {curve.query.ram}GB
                {curve.baseline_fingerprint && (
                  <> · fingerprint: {curve.baseline_fingerprint.slice(0, 12)}…</>
                )}
              </p>
            )}
          </div>
        }
      />

      <div className="mt-6">
        <ResponsiveContainer width="100%" height={340}>
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 24, left: 8, bottom: 36 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="ageYears"
              name="Device age (years)"
              tick={{ fontSize: 12 }}
              label={{
                value: "device_age_years",
                position: "insideBottom",
                offset: 0,
                style: { fill: "#808080", fontSize: 12 },
              }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => formatCompactFromVnd(v)}
            />
            <Tooltip
              formatter={(value) => [formatPrice(value), "Price (VND)"]}
              labelFormatter={(label) => `Age: ${label} years`}
            />
            <Legend wrapperStyle={{ paddingTop: 16 }} iconSize={10} />
            <Line
              type="monotone"
              dataKey="priceVnd"
              name="Predicted price (VND)"
              stroke="#1890ff"
              strokeWidth={2}
              dot={{ r: 3, fill: "#fff", stroke: "#1890ff", strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
