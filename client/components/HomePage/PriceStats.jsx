"use client"

import { Card } from "antd"
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined } from "@ant-design/icons"

export default function PriceStats({ summary }) {
  if (!summary) return null

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const stats = [
    {
      title: "Giá thấp nhất",
      value: summary.min,
      icon: <ArrowDownOutlined />,
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/20",
    },
    {
      title: "Giá trung bình",
      value: summary.avg,
      icon: <DollarOutlined />,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      featured: true,
    },
    {
      title: "Giá cao nhất",
      value: summary.max,
      icon: <ArrowUpOutlined />,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/20",
    },
  ]

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold mb-6">Price Statistics</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className={`${stat.bgColor} border-2 ${stat.borderColor} transition-all hover:shadow-lg ${
                stat.featured ? "md:scale-105" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{formatPrice(stat.value)}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <span className={`text-2xl ${stat.color}`}>{stat.icon}</span>
                </div>
              </div>
              {/* {stat.featured && (
                <div className="mt-3 pt-3 border-t border-primary/20">
                  <p className="text-xs text-primary font-medium">⭐ Recommended Price</p>
                </div>
              )} */}
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
