-- Chạy thủ công trên DB ivaluate (MySQL).
-- Theo dõi sản phẩm: lưu mốc giá/tình trạng, quét listing tốt hơn.

CREATE TABLE IF NOT EXISTS product_watches (
  watch_id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  product_name_snapshot VARCHAR(255),
  reference_price DECIMAL(15,2) NOT NULL,
  reference_condition VARCHAR(50) NULL,
  reference_battery INT NULL,
  price_improvement_pct DECIMAL(5,2) NOT NULL DEFAULT 3.00,
  only_new_listings TINYINT(1) NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_watches_user (user_id),
  INDEX idx_watches_product (product_id),
  CONSTRAINT fk_watch_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS watch_dismissed_listings (
  watch_id CHAR(36) NOT NULL,
  listing_id CHAR(36) NOT NULL,
  dismissed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (watch_id, listing_id),
  CONSTRAINT fk_dismiss_watch FOREIGN KEY (watch_id) REFERENCES product_watches(watch_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
