"use client"

import { useState } from "react"
import { Input, Button } from "antd"
import { SearchOutlined } from "@ant-design/icons"

export default function SearchSection({ onSearch, loading }) {
  const [keyword, setKeyword] = useState("")

  const handleSearch = () => {
    if (keyword.trim()) {
      onSearch(keyword.trim())
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <section className="py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-3">
          <Input
            size="large"
            placeholder="Please enter a phone model, e.g., iPhone 15 Pro Max"
            prefix={<SearchOutlined className="text-muted-foreground" />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-base"
          />
          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            loading={loading}
            className="px-8"
          >
            Tìm kiếm
          </Button>
        </div>

        {/* Quick search suggestions */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <span className="text-sm text-muted-foreground">Suggestions:</span>
          {["iPhone 15 Pro Max", "Samsung S24 Ultra", "Xiaomi 14"].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setKeyword(suggestion)
                onSearch(suggestion)
              }}
              className="text-sm px-3 py-1 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
