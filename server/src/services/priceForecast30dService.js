/**
 * Proxy GET → FastAPI /price-forecast/30d (price_history + ML slope).
 * ENV: DEPRECIATION_API_URL
 */
const listingRepository = require('../repositories/listingRepository');

async function resolveProductId(productId, keyword, specFilters = {}) {
  if (productId) return productId;
  if (keyword) {
    const p = await listingRepository.resolveProductForKeyword(keyword, specFilters);
    if (!p) throw new Error('Product not found for keyword');
    return p.product_id;
  }
  throw new Error('product_id or keyword is required');
}

async function fetchForecastFromPython(productId, horizonDays) {
  const base = (process.env.DEPRECIATION_API_URL || 'http://127.0.0.1:8000').replace(
    /\/$/,
    ''
  );

  const params = new URLSearchParams();
  params.set('product_id', productId);
  if (horizonDays != null && horizonDays > 0) {
    params.set('horizon_days', String(horizonDays));
  }

  const url = `${base}/price-forecast/30d?${params.toString()}`;
  const res = await fetch(url, { method: 'GET' });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Forecast service returned non-JSON response: ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    const detail = data.detail || data.message || text || res.statusText;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return data;
}

const FORECAST_DISCLAIMER_EN =
  '30-day forecast combines market price history and the SmartPricePredictor model; it does not guarantee actual daily prices.';

class PriceForecast30dService {
  async getForecast(opts = {}) {
    const { productId, keyword, horizonDays } = opts;
    const pid = await resolveProductId(productId, keyword);
    const product = await listingRepository.findProductById(pid);
    if (!product) throw new Error('Product not found');

    const pythonPayload = await fetchForecastFromPython(pid, horizonDays);

    return {
      ...pythonPayload,
      disclaimer: FORECAST_DISCLAIMER_EN,
      product: {
        id: pid,
        name: product.name,
        brand: product.brand,
        model_series: product.model_series,
      },
    };
  }
}

module.exports = new PriceForecast30dService();
