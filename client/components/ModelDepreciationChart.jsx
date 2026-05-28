"use client";

import { Alert, Card, Spin } from "antd";
import { ExperimentOutlined } from "@ant-design/icons";
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

export default function ModelDepreciationChart({ curve, loading, error }) {
  if (loading) {
    return (
      <Card className="shadow-sm">
        <Spin spinning tip="Đang tính đường cong mô hình...">
          <div className="min-h-[120px]" />
        </Spin>
      </Card>
    );
  }

  if (error === "PREMIUM_REQUIRED") {
    return (
      <Alert
        type="info"
        showIcon
        title="Gói Premium"
        description="Đường cong trượt giá theo mô hình chỉ dành cho gói Premium. Gói Lite vẫn có khoảng giá thị trường và tin tương tự."
        className="shadow-sm"
      />
    );
  }

  if (error) {
    return (
      <Alert
        type="warning"
        showIcon
        title="Không tải được đường cong mô hình"
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

  const formatPrice = (v) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <ExperimentOutlined className="text-slate-500" />
          <span>Đường cong trượt giá (mô hình)</span>
        </div>
      }
      variant="borderless"
      className="shadow-sm"
    >
      <Alert
        type="info"
        showIcon
        className="mb-0"
        title="Mô phỏng theo mô hình, cùng điều kiện tham chiếu"
        description={
          <div className="text-sm space-y-1">
            {curve.disclaimer && <p>{curve.disclaimer}</p>}
            {curve.model_version && (
              <p>
                Phiên bản mô hình: <strong>{curve.model_version}</strong>
                {curve.reference_year != null && (
                  <> · Năm tham chiếu: {curve.reference_year}</>
                )}
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
              name="Tuổi máy (năm)"
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
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
            />
            <Tooltip
              formatter={(value) => [formatPrice(value), "Giá (VND)"]}
              labelFormatter={(label) => `Tuổi: ${label} năm`}
            />
            <Legend wrapperStyle={{ paddingTop: 16 }} iconSize={10} />
            <Line
              type="monotone"
              dataKey="priceVnd"
              name="Dự đoán giá (VND)"
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