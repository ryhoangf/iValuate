/**
 * Gọi FastAPI depreciation-curve (SmartPricePredictor).
 * ENV: DEPRECIATION_API_URL — ví dụ http://127.0.0.1:8000
 */
const listingRepository = require('../repositories/listingRepository');

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

  const ram = String(
    specs.ram ?? specs.ram_gb ?? process.env.DEPRECIATION_DEFAULT_RAM ?? '6'
  );

  return {
    model_line: String(modelLine).trim(),
    storage: storage.trim(),
    ram: ram.trim(),
  };
}

async function resolveProduct(productId, keyword) {
  if (productId) {
    const p = await listingRepository.findProductById(productId);
    if (!p) throw new Error('Không tìm thấy sản phẩm');
    return p;
  }
  if (keyword) {
    const p = await listingRepository.findProductIdByName(keyword);
    if (!p) throw new Error('Không tìm thấy sản phẩm theo từ khóa');
    return listingRepository.findProductById(p.product_id);
  }
  throw new Error('Cần product_id hoặc keyword');
}

async function fetchDepreciationFromPython(q, productId) {
  const base = (process.env.DEPRECIATION_API_URL || 'http://127.0.0.1:8000').replace(
    /\/$/,
    ''
  );

  const yenEnv = process.env.DEPRECIATION_YEN_TO_VND;
  const yenToVnd =
    yenEnv != null && yenEnv !== '' ? Number.parseFloat(yenEnv, 10) : undefined;

  const params = new URLSearchParams();
  params.set('model_line', q.model_line);
  params.set('storage', q.storage);
  params.set('ram', q.ram);
  if (productId) params.set('product_id', productId);
  if (yenToVnd != null && !Number.isNaN(yenToVnd)) {
    params.set('yen_to_vnd', String(yenToVnd));
  }

  const url = `${base}/depreciation-curve?${params.toString()}`;
  const res = await fetch(url, { method: 'GET' });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Phản hồi không phải JSON từ dịch vụ giá: ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    const detail = data.detail || data.message || text || res.statusText;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return data;
}

class DepreciationCurveService {
  async getCurve(opts = {}) {
    const { productId, keyword } = opts;
    const product = await resolveProduct(productId, keyword);
    const pid = product.product_id;
    const q = buildDepreciationQueryFromProduct(product);

    if (!q.model_line || q.model_line === 'Unknown') {
      throw new Error(
        'Không suy ra được model_line từ DB — kiểm tra model_series / base_specs'
      );
    }

    const pythonPayload = await fetchDepreciationFromPython(q, pid);

    return {
      ...pythonPayload,
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