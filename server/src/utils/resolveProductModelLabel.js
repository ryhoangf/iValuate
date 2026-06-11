/**
 * Suy ra tên dòng model hiển thị / tìm kiếm từ products (ưu tiên model_series, base_specs).
 */

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

/** Nhãn quá chung: chỉ hãng, hoặc hãng + dung lượng / "Pro" mơ hồ */
function isGenericModelLabel(label, brand) {
    const t = String(label || '').trim();
    const b = String(brand || '').trim();
    if (!t || !b) return true;

    const tl = t.toLowerCase();
    const bl = b.toLowerCase();

    if (tl === bl) return true;

    const rest = tl.startsWith(bl) ? tl.slice(bl.length).trim() : tl;
    if (!rest) return true;

    if (/^(\d+\s*gb|pro|plus|max|lite|ultra|mini|se)$/i.test(rest)) return true;
    if (/^pro\s+\d+\s*gb$/i.test(rest)) return true;
    if (/^\d+\s*gb$/i.test(rest)) return true;

    return false;
}

function stripBrandAndStorage(name, brand) {
    let s = String(name || '').trim();
    const b = String(brand || '').trim();
    if (!s) return '';

    if (b && s.toLowerCase().startsWith(b.toLowerCase())) {
        s = s.slice(b.length).trim();
    }

    s = s.replace(/\s+\d+\s*GB\b/gi, '').trim();
    s = s.replace(/\s*\([^)]*\)\s*$/g, '').trim();
    s = s.replace(/\s*-\s*\d+\s*GB\b/gi, '').trim();

    return s;
}

/**
 * @param {{ brand?: string, name?: string, model_series?: string, base_specs?: unknown }} row
 * @returns {string} Rỗng nếu không suy ra được dòng model có nghĩa
 */
function resolveProductModelLabel(row) {
    const brand = String(row.brand || '').trim();
    const name = String(row.name || '').trim();
    const modelSeries = String(row.model_series || '').trim();
    const specs = parseBaseSpecs(row.base_specs);

    const candidates = [
        specs.model_line,
        specs.modelLine,
        specs.model,
        modelSeries,
        stripBrandAndStorage(name, brand),
        name,
    ]
        .map((c) => String(c || '').trim())
        .filter(Boolean);

    for (const c of candidates) {
        if (!isGenericModelLabel(c, brand)) {
            return c;
        }
    }

    return '';
}

function normalizeBrandKey(brand) {
    return String(brand || '')
        .trim()
        .toLowerCase();
}

/** Ưu tiên nhãn dễ đọc (Samsung) hơn SAMSUNG / samsung */
function pickBrandDisplayLabel(current, next) {
    const score = (s) => {
        const t = String(s || '').trim();
        if (!t) return -1;
        if (t === t.toUpperCase() && /[A-Z]/.test(t) && t.length > 2) return 0;
        if (/^[A-Z][a-z]/.test(t)) return 2;
        return 1;
    };
    return score(next) > score(current) ? next : current;
}

module.exports = {
    resolveProductModelLabel,
    isGenericModelLabel,
    parseBaseSpecs,
    normalizeBrandKey,
    pickBrandDisplayLabel,
};
