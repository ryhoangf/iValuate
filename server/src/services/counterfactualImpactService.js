/**
 * Proxy POST → FastAPI /feature-impact/counterfactual (SmartPricePredictor).
 * ENV: DEPRECIATION_API_URL
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

function buildModelIdentityFromProduct(product) {
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
    model_number: String(specs.model_number ?? specs.modelNumber ?? '').trim(),
    variant: String(specs.variant ?? '').trim(),
  };
}

function toLc(s) {
  return s == null || s === '' ? '' : String(s).toLowerCase();
}

/**
 * filters: cùng shape với FE FilterBar (condition, minBattery, screenCondition, …)
 */
function buildFastApiBody(product, filters = {}) {
  const id = buildModelIdentityFromProduct(product);
  if (!id.model_line || id.model_line === 'Unknown') {
    throw new Error('Không suy ra được model_line từ DB — kiểm tra model_series / base_specs');
  }

  const batt =
    filters.minBattery != null && !Number.isNaN(Number(filters.minBattery))
      ? Number(filters.minBattery)
      : 85;

  const condition =
    filters.condition && filters.condition !== 'all'
      ? String(filters.condition)
      : 'Good';

  const screen =
    filters.screenCondition && filters.screenCondition !== 'all'
      ? toLc(filters.screenCondition)
      : 'good';

  const bodyCond =
    filters.bodyCondition && filters.bodyCondition !== 'all'
      ? toLc(filters.bodyCondition)
      : 'good';

  const platform =
    filters.platform && filters.platform !== 'all'
      ? String(filters.platform)
      : 'Mercari';

  const yenEnv = process.env.DEPRECIATION_YEN_TO_VND;
  const yenToVnd =
    yenEnv != null && yenEnv !== '' ? Number.parseFloat(yenEnv, 10) : 175;

  return {
    model_line: id.model_line,
    storage: id.storage,
    ram: id.ram,
    model_number: id.model_number || '',
    variant: id.variant || '',
    condition,
    battery_percentage: batt,
    screen_condition: screen || 'good',
    body_condition: bodyCond || 'good',
    platform,
    has_box: filters.hasBox === true,
    has_charger: filters.hasCharger === true,
    is_sim_free: filters.isSimFree === true ? 1 : 0,
    fully_functional: filters.fullyFunctional === false ? 0 : 1,
    has_scratches: 0,
    has_damage: 0,
    has_issues: 0,
    yen_to_vnd: Number.isFinite(yenToVnd) ? yenToVnd : 175,
    include_all_scenarios: filters.include_all_scenarios === true,
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

async function postToPython(body) {
  const base = (process.env.DEPRECIATION_API_URL || 'http://127.0.0.1:8000').replace(
    /\/$/,
    ''
  );
  const url = `${base}/feature-impact/counterfactual`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Phản hồi không phải JSON từ ML API: ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    const detail = data.detail ?? data.message ?? text ?? res.statusText;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return data;
}

class CounterfactualImpactService {
  /**
   * @param {{ productId?: string, keyword?: string, filters?: object }} opts
   */
  async getReport(opts = {}) {
    const { productId, keyword, filters = {} } = opts;
    const product = await resolveProduct(productId, keyword);
    const body = buildFastApiBody(product, filters);
    const payload = await postToPython(body);
    return {
      ...payload,
      product: {
        id: product.product_id,
        name: product.name,
        brand: product.brand,
        model_series: product.model_series,
      },
      request_summary: {
        model_line: body.model_line,
        storage: body.storage,
        ram: body.ram,
        battery_percentage: body.battery_percentage,
        condition: body.condition,
      },
    };
  }
}

module.exports = new CounterfactualImpactService();
