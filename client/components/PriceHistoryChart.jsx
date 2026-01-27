"use client"

import { Card } from "antd"
import { LineChartOutlined } from "@ant-design/icons"
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function PriceHistoryChart({ priceHistory }) {
  if (!priceHistory || priceHistory.length === 0) return null

  // Format data for chart
  const chartData = {
    labels: priceHistory.map(item => {
      const date = new Date(item.date)
      return `${date.getDate()}/${date.getMonth() + 1}`
    }),
    datasets: [
      {
        label: 'Giá Trung Bình',
        data: priceHistory.map(item => item.averagePrice),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Giá Cao Nhất',
        data: priceHistory.map(item => item.maxPrice),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
      },
      {
        label: 'Giá Thấp Nhất',
        data: priceHistory.map(item => item.minPrice),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('vi-VN', {
              notation: 'compact',
              compactDisplay: 'short'
            }).format(value) + ' đ';
          }
        }
      }
    }
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <LineChartOutlined className="text-primary" />
          <span>Lịch Sử Giá 30 Ngày</span>
        </div>
      }
      bordered={false}
      className="shadow-sm"
    >
      <div style={{ height: '300px' }}>
        <Line data={chartData} options={options} />
      </div>
    </Card>
  )
}