"use client"

import { Table, Tag, Button, Empty, Tooltip, Progress } from "antd"
import { LinkOutlined, ShopOutlined, ClockCircleOutlined, BatteryOutlined, FilterOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import "dayjs/locale/en"

// Configure time language to English
dayjs.locale("en")

export default function ListingsTable({ listings, loading }) {
  
  // 1. Format VND currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  // 2. Map Condition Rank (S, A, B, C, J) to colors and display text
  const getConditionColor = (rank) => {
    const colorMap = {
      'S': 'green',
      'A': 'cyan',
      'B': 'blue',
      'C': 'orange',
      'D': 'red',
    }
    return colorMap[rank?.toUpperCase()] || 'default'
  }

  // 3. Platform color logic (Matches ETL data)
  const getPlatformColor = (platform) => {
    if (!platform) return "default"
    const p = platform.toLowerCase()

    // Japanese platforms (Data from ETL)
    if (p.includes("mercari")) return "#ea3929" // Mercari red
    if (p.includes("yahoo")) return "#ff0033"   // Yahoo red
    if (p.includes("rakuma") || p.includes("rakuten")) return "#bf0000" 

    return "geekblue"
  }

  // Battery health color
  const getBatteryStatus = (health) => {
    if (!health) return { color: 'default', status: 'normal' }
    if (health >= 90) return { color: 'success', status: 'success' }
    if (health >= 80) return { color: 'normal', status: 'normal' }
    if (health >= 70) return { color: 'warning', status: 'active' }
    return { color: 'exception', status: 'exception' }
  }

  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      width: "28%",
      render: (text, record) => (
        <div>
          <Tooltip title={text}>
            <div className="font-medium text-gray-800 truncate max-w-[250px]">
              {text}
            </div>
          </Tooltip>
          {record.color && (
            <Tag color="default" size="small" className="mt-1">
              {record.color}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      width: "14%",
      sorter: (a, b) => a.price - b.price,
      render: (price) => (
        <div className="font-bold text-red-600 text-base">
            {formatPrice(price)}
        </div>
      ),
    },
    {
      title: "Source",
      dataIndex: "platform",
      key: "platform",
      width: "14%",
      filters: [
        { text: "Mercari", value: "Mercari" },
        { text: "Yahoo Auction", value: "YahooAuction" },
        { text: "Rakuma", value: "Rakuma" },
      ],
      onFilter: (value, record) => record.platform?.includes(value),
      render: (platform) => (
        <Tag icon={<ShopOutlined />} color={getPlatformColor(platform)} style={{ fontWeight: 500 }}>
          {platform || "Other"}
        </Tag>
      ),
    },
    {
      title: "Condition",
      dataIndex: "condition",
      key: "condition",
      width: "12%",
      render: (rank) => (
        <Tag color={getConditionColor(rank)}>
          {rank || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Battery",
      dataIndex: "battery_health",
      key: "battery_health",
      width: "12%",
      sorter: (a, b) => (a.battery_health || 0) - (b.battery_health || 0),
      render: (health) => {
        if (!health) return <span className="text-gray-400">N/A</span>
        const { status } = getBatteryStatus(health)
        return (
          <div className="flex items-center gap-2">
            <Progress 
              type="circle" 
              percent={health} 
              size={32}
              status={status}
              format={(percent) => `${percent}%`}
            />
          </div>
        )
      },
    },
    {
      title: "Posted Date",
      dataIndex: "posted_at",
      key: "posted_at",
      width: "12%",
      sorter: (a, b) => new Date(a.posted_at) - new Date(b.posted_at),
      render: (date) => (
        <div className="flex items-center text-gray-500 text-sm">
           <ClockCircleOutlined className="mr-1" />
           {date ? dayjs(date).format("DD/MM/YYYY") : "-"}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "action",
      width: "10%",
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          size="small"
          icon={<LinkOutlined />}
          href={record.source_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          View
        </Button>
      ),
    },
  ]

  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filter section */}
        <div className="mb-6">          
          {/* Dropdown filters - căn đều */}
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Your filter dropdowns */}
          </div>
          
          {/* Toggle filters - căn đều */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Your toggle switches */}
          </div>
          
          {/* Battery slider - full width */}
          <div className="mt-4">
            {/* Your battery health slider */}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <Table
            columns={columns}
            dataSource={listings}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            }}
            locale={{
              emptyText: <Empty description="No matching data" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
            }}
            scroll={{ x: 1200 }}
          />
        </div>
      </div>
    </section>
  )
}