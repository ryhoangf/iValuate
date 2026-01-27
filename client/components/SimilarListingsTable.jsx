"use client"

import { Table, Tag, Button, Empty, Tooltip, Progress, Badge } from "antd"
import { LinkOutlined, ShopOutlined, DollarOutlined } from "@ant-design/icons"
import dayjs from "dayjs"

export default function SimilarListingsTable({ listings, loading }) {
  // Format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  // Get condition color
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

  // Platform color
  const getPlatformColor = (platform) => {
    if (!platform) return "default"
    const p = platform.toLowerCase()
    if (p.includes("mercari")) return "#ea3929"
    if (p.includes("yahoo")) return "#ff0033"
    if (p.includes("rakuma")) return "#bf0000"
    return "geekblue"
  }

  // Battery status
  const getBatteryStatus = (health) => {
    if (!health) return { color: 'default', status: 'normal' }
    if (health >= 90) return { color: 'success', status: 'success' }
    if (health >= 80) return { color: 'normal', status: 'normal' }
    if (health >= 70) return { color: 'warning', status: 'active' }
    return { color: 'exception', status: 'exception' }
  }

  const columns = [
    {
      title: "Sản Phẩm",
      dataIndex: "name",
      key: "name",
      width: "25%",
      render: (text, record) => (
        <div>
          <Tooltip title={text}>
            <div className="font-medium text-gray-800 truncate max-w-[200px]">
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
      title: "Giá",
      dataIndex: "price",
      key: "price",
      width: "15%",
      sorter: (a, b) => a.price - b.price,
      render: (price, record) => (
        <div>
          <div className="font-bold text-red-600 text-base">
            {formatPrice(price)}
          </div>
          {record.priceDifference !== undefined && (
            <Tag color="blue" size="small" className="mt-1">
              ±{formatPrice(record.priceDifference)}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Nguồn",
      dataIndex: "platform",
      key: "platform",
      width: "12%",
      render: (platform) => (
        <Tag icon={<ShopOutlined />} color={getPlatformColor(platform)} style={{ fontWeight: 500 }}>
          {platform || "Other"}
        </Tag>
      ),
    },
    {
      title: "Tình Trạng",
      dataIndex: "condition",
      key: "condition",
      width: "10%",
      render: (rank) => (
        <Tag color={getConditionColor(rank)}>
          {rank || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Pin",
      dataIndex: "batteryHealth",
      key: "batteryHealth",
      width: "10%",
      sorter: (a, b) => (a.batteryHealth || 0) - (b.batteryHealth || 0),
      render: (health) => {
        if (!health) return <span className="text-gray-400">N/A</span>
        const { status } = getBatteryStatus(health)
        return (
          <Progress 
            type="circle" 
            percent={health} 
            size={32}
            status={status}
            format={(percent) => `${percent}%`}
          />
        )
      },
    },
    {
      title: "Ngày Đăng",
      dataIndex: "postedAt",
      key: "postedAt",
      width: "12%",
      sorter: (a, b) => new Date(a.postedAt) - new Date(b.postedAt),
      render: (date) => (
        <div className="text-gray-500 text-sm">
          {date ? dayjs(date).format("DD/MM/YYYY") : "-"}
        </div>
      ),
    },
    {
      title: "Thao Tác",
      key: "action",
      width: "10%",
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          size="small"
          icon={<LinkOutlined />}
          href={record.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Xem
        </Button>
      ),
    },
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <DollarOutlined className="text-primary" />
          Sản Phẩm Có Giá Tương Tự
          <Badge count={listings?.length || 0} showZero style={{ backgroundColor: '#52c41a' }} />
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Các sản phẩm đang được chào bán trong khoảng giá thị trường hợp lý
        </p>
      </div>
      
      <Table
        columns={columns}
        dataSource={listings}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} trong ${total} sản phẩm`,
        }}
        locale={{
          emptyText: <Empty description="Không tìm thấy sản phẩm tương tự" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
        }}
        scroll={{ x: 1000 }}
      />
    </div>
  )
}