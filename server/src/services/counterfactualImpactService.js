/**
 * Proxy POST → FastAPI /feature-impact/counterfactual (SmartPricePredictor).
 * ENV: DEPRECIATION_API_URL
 *
 * Contract (FastAPI FeatureImpactBody):
 * - Prefer product_id + overrides from ML panel (battery, box, charger, storage, ram…)
 * - Without product_id: requires model_line + storage + ram (manual path — rarely used here)
 */
const listingRepository = require('../repositories/listingRepository');
const { parseStorageToGb, getRamGb } = require('../utils/parseProductSpecs');

function toLc(s) {
  return s == null || s === '' ? '' : String(s).toLowerCase();
}

/** Map filter / DB labels → giá trị mô hình ML (screen: clean, body: good, …). */
function mapScreenCondition(value) {
  if (value == null || value === '' || value === 'all') return undefined;
  const v = toLc(value);
  const aliases = {
    perfect: 'clean',
    excellent: 'clean',
    good: 'good',
    clean: 'clean',
    fair: 'good',
    scratched: 'scratched',
    cracked: 'cracked',
  };
  return aliases[v] || v;
}

function mapBodyCondition(value) {
  if (value == null || value === '' || value === 'all') return undefined;
  const v = toLc(value);
  const aliases = {
    perfect: 'good',
    excellent: 'good',
    good: 'good',
    clean: 'good',
    fair: 'fair',
    scratched: 'scratched',
    dented: 'dented',
  };
  return aliases[v] || v;
}

function mapConditionRank(value) {
  if (value == null || value === '' || value === 'all') return 'Good';
  const rank = String(value).trim().toUpperCase();
  const map = { S: 'Like New', A: 'Excellent', B: 'Good', C: 'Fair', D: 'Poor' };
  return map[rank] || String(value);
}

const SCENARIO_LABELS_EN = {
  battery_to_100: 'Battery (vs 100%)',
  has_box_true: 'Includes box',
  has_charger_true: 'Includes charger',
  screen_clean: 'Screen (vs clean)',
  body_good: 'Body (vs good)',
  no_scratches: 'No scratches',
  no_damage: 'No damage',
};

const DISCLAIMER_EN =
  'Each row changes one factor vs the reference baseline; deficit_vnd is the estimated gap vs reference (not linearly additive when fixing multiple factors).';

function formatDeficitEn(deficitVnd) {
  return `estimated deficit ~${Math.round(deficitVnd).toLocaleString('en-US')} VND`;
}

function enrichImpactRow(row) {
  const labelEn = SCENARIO_LABELS_EN[row.id] || row.label_en || row.label_vi || row.field;
  const { value_before, value_reference, deficit_vnd, delta_vnd } = row;
  let messageEn = row.message_en;

  if (!messageEn) {
    if (deficit_vnd <= 0 && delta_vnd <= 0) {
      if (value_before === value_reference) {
        messageEn = `${labelEn}: already at reference level (${value_reference}).`;
      } else {
        messageEn = `${labelEn}: model does not estimate a significant gap vs reference.`;
      }
    } else if (row.id === 'battery_to_100' && value_before != null) {
      messageEn = `Battery at ${value_before}% (vs ${value_reference}%): ${formatDeficitEn(deficit_vnd)}.`;
    } else if (row.id === 'has_box_true' && !value_before) {
      messageEn = `Missing box: ${formatDeficitEn(deficit_vnd)}.`;
    } else if (row.id === 'has_charger_true' && !value_before) {
      messageEn = `Missing charger: ${formatDeficitEn(deficit_vnd)}.`;
    } else {
      messageEn = `${labelEn} (${value_before} → ${value_reference}): ${formatDeficitEn(deficit_vnd)}.`;
    }
  }

  return { ...row, label_en: labelEn, message_en: messageEn };
}

function enrichCounterfactualReport(payload, body = {}) {
  return {
    ...payload,
    method: payload.method || 'counterfactual',
    yen_to_vnd: payload.yen_to_vnd ?? body.yen_to_vnd,
    disclaimer: payload.disclaimer || DISCLAIMER_EN,
    impacts: (payload.impacts || []).map(enrichImpactRow),
  };
}

/**
 * Build POST body aligned with FastAPI Example 2: product_id + explicit scenario overrides.
 * Specs/model_line come from MySQL unless storage/ram overridden from ML panel.
 */
function buildFastApiBody(product, filters = {}) {
  const yenEnv = process.env.DEPRECIATION_YEN_TO_VND;
  const yenToVnd =
    yenEnv != null && yenEnv !== '' ? Number.parseFloat(yenEnv) : 175;

  const body = {
    product_id: product.product_id,
    condition: mapConditionRank(filters.condition),
    yen_to_vnd: Number.isFinite(yenToVnd) ? yenToVnd : 175,
    include_all_scenarios: filters.include_all_scenarios === true,
  };

  if (filters.storage && filters.storage !== 'all') {
    body.storage = String(parseStorageToGb(filters.storage) ?? filters.storage).trim();
  }

  if (filters.ram && filters.ram !== 'all') {
    const ramParsed = getRamGb({ ram: filters.ram });
    if (ramParsed != null) body.ram = String(ramParsed).trim();
  }

  if (
    filters.analysis_battery != null &&
    !Number.isNaN(Number(filters.analysis_battery))
  ) {
    body.battery_percentage = Number(filters.analysis_battery);
  }

  const screen = mapScreenCondition(filters.screenCondition);
  const bodyCond = mapBodyCondition(filters.bodyCondition);
  if (screen) body.screen_condition = screen;
  if (bodyCond) body.body_condition = bodyCond;

  if (filters.platform && filters.platform !== 'all') {
    body.platform = String(filters.platform);
  }

  if (filters.hasBox === true) body.has_box = true;
  else if (filters.hasBox === false) body.has_box = false;

  if (filters.hasCharger === true) body.has_charger = true;
  else if (filters.hasCharger === false) body.has_charger = false;

  if (filters.isSimFree === true) body.is_sim_free = 1;
  if (filters.fullyFunctional === false) body.fully_functional = 0;
  else if (filters.fullyFunctional === true) body.fully_functional = 1;

  return body;
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
    throw new Error(`ML API returned non-JSON response: ${text.slice(0, 200)}`);
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
    const specFilters = { storage: filters.storage, ram: filters.ram };
    const product = await resolveProduct(productId, keyword, specFilters);

    const listingFilters = {};
    if (filters.storage && filters.storage !== 'all') listingFilters.storage = filters.storage;
    if (filters.ram && filters.ram !== 'all') listingFilters.ram = filters.ram;

    const lookupKeyword = keyword || product.name || product.model_series;
    let enrichedFilters = { ...filters };
    if (lookupKeyword) {
      const listings = await listingRepository.findActiveListingsByName(
        lookupKeyword,
        listingFilters
      );
      const medianBattery = listingRepository.medianBatteryFromListings(
        listings,
        product.product_id
      );
      if (medianBattery != null && enrichedFilters.analysis_battery == null) {
        enrichedFilters = { ...enrichedFilters, analysis_battery: medianBattery };
      }
    }

    const body = buildFastApiBody(product, enrichedFilters);
    const payload = enrichCounterfactualReport(await postToPython(body), body);
    const summary = payload.input_summary || payload.request_summary;

    return {
      ...payload,
      product: {
        id: product.product_id,
        name: payload.product_name || product.name,
        brand: payload.brand || product.brand,
        model_series: product.model_series,
      },
      request_summary: summary || {
        model_line: body.model_line,
        storage: body.storage,
        ram: body.ram,
        battery_percentage: body.battery_percentage,
        condition: body.condition,
        has_box: body.has_box,
        has_charger: body.has_charger,
      },
    };
  }
}

module.exports = new CounterfactualImpactService();
