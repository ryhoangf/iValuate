# iValuate database contract

The application currently uses MySQL through `mysql2` repositories. The SQL files in
this folder are incremental helpers, not a full baseline schema.

Before deploying a fresh environment, make sure the baseline database already has
these tables and columns:

## Core tables

- `users`
  - `user_id`, `email`, `password_hash`, `full_name`, `role`, `created_at`
- `subscriptions`
  - `subscription_id`, `user_id`, `plan_type`, `start_date`, `end_date`, `status`
- `products`
  - `product_id`, `name`, `brand`, `model_series`, `category`, `base_specs`, `created_at`
- `active_listings`
  - `listing_id`, `product_id`, `price`, `original_price`, `currency`, `condition_rank`
  - `battery_health`, `battery_percentage`, `battery_status`, `battery_replaced`
  - `color`, `source_url`, `platform`, `posted_at`, `description`
  - `screen_condition`, `body_condition`, `has_box`, `has_charger`, `has_cable`
  - `has_earphones`, `is_sim_free`, `network_restriction`, `fully_functional`, `has_issues`
- `price_history`
  - `history_id`, `product_id`, `record_date`, `avg_price`, `min_price`, `max_price`
  - `listing_count`, `original_price`
- `price_forecasts`
  - `product_id`, `forecast_date`, `predicted_price`, `confidence_score`, `model_version`

## Incremental migrations

- `product_watches.sql` adds the price-watch feature tables.
- `users_password_reset.sql` is optional legacy support. The current backend uses
  stateless signed JWT reset links and does not require these columns.

## Recommended next step

Promote the production schema dump into a numbered baseline migration such as
`001_baseline.sql`, then keep future changes as ordered migrations.
