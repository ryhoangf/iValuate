/**
 * Gọi FastAPI depreciation-curve (SmartPricePredictor).
 * ENV: DEPRECIATION_API_URL — ví dụ http://127.0.0.1:8000
 */
const listingRepository = require('../repositories/listingRepository');
const { getRamGb } = require('../utils/parseProductSpecs');

function parseBaseSpecs(baseSpecs) {
  if (baseSpecs == null) return {};
  if (typeof baseSpecs === 'string') {
    try {
      return JSON.parse(baseSpecs);
    } catch {
      return {};
    }
  }
  if (typeof baseSpecs === 'object') return baseSpecs;
  return {};
}

function buildDepreciationQueryFromProduct(product) {
  const specs = parseBaseSpecs(product.base_specs);
  const modelLine =
    specs.model_line ||
    product.model_series ||
    (product.name && product.name.split(/[\s(/]/)[0]) ||
    'Unknown';

  const storage = String(
    specs.storage ??
      specs.storage_gb ??
      specs.capacity ??
      process.env.DEPRECIATION_DEFAULT_STORAGE ??
      '128'
  );

  const ramGb = getRamGb(specs);
  const ram = ramGb != null ? String(ramGb).trim() : '';

  return {
    model_line: String(modelLine).trim(),
    storage: storage.trim(),
    ram,
  };
}

async function resolveProduct(productId, keyword, specFilters = {}) {
  if (productId) {
    const p = await listingRepository.findProductById(productId);
    if (!p) throw new Error('Product not found');
    return p;
  }
  if (keyword) {
    const p = await listingRepository.resolveProductForKeyword(keyword, specFilters);
    if (!p) throw new Error('Product not found for keyword');
    return p;
  }
  throw new Error('product_id or keyword is required');
}

async function fetchDepreciationFromPython(q, productId) {
  const base = (process.env.DEPRECIATION_API_URL || 'http://127.0.0.1:8000').replace(
    /\/$/,
    ''
  );

  const yenEnv = process.env.DEPRECIATION_YEN_TO_VND;
  const yenToVnd =
    yenEnv != null && yenEnv !== '' ? Number.parseFloat(yenEnv) : 175;

  const params = new URLSearchParams();
  params.set('model_line', q.model_line);
  params.set('storage', q.storage);
  if (q.ram) params.set('ram', q.ram);
  if (productId) params.set('product_id', productId);
  if (Number.isFinite(yenToVnd)) {
    params.set('yen_to_vnd', String(yenToVnd));
  }

  const url = `${base}/depreciation-curve?${params.toString()}`;
  const res = await fetch(url, { method: 'GET' });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Price service returned non-JSON response: ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    const detail = data.detail || data.message || text || res.statusText;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return data;
}

const DEPRECIATION_DISCLAIMER_EN =
  'Simulation from the SmartPricePredictor model with fixed reference conditions; not actual daily market prices.';

class DepreciationCurveService {
  async getCurve(opts = {}) {
    const { productId, keyword } = opts;
    const product = await resolveProduct(productId, keyword);
    const pid = product.product_id;
    const q = buildDepreciationQueryFromProduct(product);

    if (!q.model_line || q.model_line === 'Unknown') {
      throw new Error(
        'Could not derive model_line from DB — check model_series / base_specs'
      );
    }

    const pythonPayload = await fetchDepreciationFromPython(q, pid);

    return {
      ...pythonPayload,
      disclaimer: DEPRECIATION_DISCLAIMER_EN,
      query: q,
      product: {
        id: pid,
        name: product.name,
        brand: product.brand,
        model_series: product.model_series,
      },
    };
  }
}

module.exports = new DepreciationCurveService();