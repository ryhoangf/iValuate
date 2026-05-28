-- Không bắt buộc: backend dùng JWT ký (stateless) cho quên mật khẩu, không cần các cột dưới đây.
-- Chỉ chạy nếu bạn dùng phiên bản app lưu token reset trong DB (opaque token).

ALTER TABLE users
  ADD COLUMN password_reset_token VARCHAR(64) NULL DEFAULT NULL,
  ADD COLUMN password_reset_expires_at DATETIME NULL DEFAULT NULL;

CREATE INDEX idx_users_password_reset_token ON users (password_reset_token);
