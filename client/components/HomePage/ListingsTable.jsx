"use client"

import { Table, Tag, Button, Empty } from "antd"
import { LinkOutlined, ShopOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import "dayjs/locale/vi"

dayjs.locale("vi")

export default function ListingsTable({ listings, loading }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const getConditionColor = (condition) => {
    if (condition?.includes("99")) return "success"
    if (condition?.includes("98")) return "processing"
    return "default"
  }

  const getPlatformColor = (platform) => {
    const colors = {
      Shopee: "orange",
      Lazada: "blue",
      Tiki: "cyan",
      "Chợ Tốt": "green",
      default: "default",
    }
    return colors[platform] || colors.default
  }

  const columns = [
    {
      title: "Sản phẩm",
      dataIndex: "name",
      key: "name",
      width: "30%",
      render: (text) => <div className="font-medium text-foreground">{text}</div>,
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      width: "20%",
      sorter: (a, b) => a.price - b.price,
      render: (price) => <div className="font-bold text-primary">{formatPrice(price)}</div>,
    },
    {
      title: "Nguồn",
      dataIndex: "platform",
      key: "platform",
      width: "15%",
      filters: [
        { text: "Shopee", value: "Shopee" },
        { text: "Lazada", value: "Lazada" },
        { text: "Tiki", value: "Tiki" },
        { text: "Chợ Tốt", value: "Chợ Tốt" },
      ],
      onFilter: (value, record) => record.platform === value,
      render: (platform) => (
        <Tag icon={<ShopOutlined />} color={getPlatformColor(platform)}>
          {platform}
        </Tag>
      ),
    },
    {
      title: "Tình trạng",
      dataIndex: "condition",
      key: "condition",
      width: "15%",
      render: (condition) => <Tag color={getConditionColor(condition)}>{condition || "N/A"}</Tag>,
    },
    {
      title: "Ngày cập nhật",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: "15%",
      sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
      render: (date) => <span className="text-muted-foreground text-sm">{dayjs(date).format("DD/MM/YYYY")}</span>,
    },
    {
      title: "",
      key: "action",
      width: "5%",
      render: (_, record) => (
        <Button
          type="link"
          icon={<LinkOutlined />}
          href={record.source_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Xem
        </Button>
      ),
    },
  ]

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold mb-6">Active Listings</h2>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table
            columns={columns}
            dataSource={listings}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} listings`,
            }}
            locale={{
              emptyText: <Empty description="No data" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
            }}
            scroll={{ x: 800 }}
          />
        </div>
      </div>
    </section>
  )
}
