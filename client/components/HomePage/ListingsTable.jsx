"use client"

import { Table, Tag, Button, Empty, Tooltip } from "antd"
import { LinkOutlined, ShopOutlined, ClockCircleOutlined, CheckCircleOutlined } from "@ant-design/icons"
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
  const getConditionConfig = (rank) => {
    const config = {
      S: { color: "green", text: "New/Unused", icon: <CheckCircleOutlined /> },
      A: { color: "cyan", text: "Like New" },
      B: { color: "blue", text: "Good" },
      C: { color: "orange", text: "Scratched" },
      J: { color: "red", text: "Junk" },
      default: { color: "default", text: "Unknown" }
    }
    return config[rank?.toUpperCase()] || config.default
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

  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      width: "35%",
      render: (text) => (
        // Tooltip helps view full name if too long
        <Tooltip title={text}>
          <div className="font-medium text-gray-800 truncate max-w-[300px]">
            {text}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      width: "15%",
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
      width: "15%",
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
      dataIndex: "condition", // Matches SQL alias
      key: "condition",
      width: "12%",
      // render: (rank) => {
      //   const { color, text, icon } = getConditionConfig(rank)
      //   return (
      //     <Tag color={color} icon={icon}>
      //       {rank ? `Rank ${rank} (${text})` : "N/A"}
      //     </Tag>
      //   )
      // },
    },
    {
      title: "Posted Date",
      dataIndex: "posted_at", // Matches SQL
      key: "posted_at",
      width: "13%",
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
          href={record.source_url} // Matches SQL
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
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
                Search Results ({listings?.length || 0})
            </h2>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <Table
            columns={columns}
            dataSource={listings}
            loading={loading}
            rowKey="id" // Important: Matches SQL alias (l.listing_id as id)
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            }}
            locale={{
              emptyText: <Empty description="No matching data" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
            }}
            scroll={{ x: 1000 }}
          />
        </div>
      </div>
    </section>
  )
}