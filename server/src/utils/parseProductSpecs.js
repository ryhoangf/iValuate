/**
 * Parse storage / RAM from products.base_specs (JSON).
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

/** Normalize RAM: "6", "6GB", 6 → "6" */
function normalizeSpecGb(value) {
    if (value == null || value === '') return null;
    const s = String(value).trim().toUpperCase().replace(/\s+/g, '');
    const tb = s.match(/^(\d+(?:\.\d+)?)TB$/);
    if (tb) return String(Math.round(parseFloat(tb[1]) * 1024));

    const gb = s.match(/^(\d+(?:\.\d+)?)GB?$/);
    if (gb) return String(Math.round(parseFloat(gb[1])));

    const num = s.match(/^(\d+(?:\.\d+)?)$/);
    if (num) return String(Math.round(parseFloat(num[1])));

    return null;
}

/** Storage only — converts TB to GB for comparison (1TB → "1024"). */
function parseStorageToGb(value) {
    return normalizeSpecGb(value);
}

function getStorageGb(baseSpecs) {
    const specs = parseBaseSpecs(baseSpecs);
    return parseStorageToGb(specs.storage ?? specs.storage_gb ?? specs.capacity);
}

function getRamGb(baseSpecs) {
    const specs = parseBaseSpecs(baseSpecs);
    const raw = specs.ram ?? specs.ram_gb;
    if (raw == null || raw === '') return null;
    const s = String(raw).trim().toUpperCase().replace(/\s+/g, '');
    const m = s.match(/^(\d+(?:\.\d+)?)/);
    return m ? String(Math.round(parseFloat(m[1]))) : null;
}

function parseProductSpecs(baseSpecs) {
    return {
        storage: getStorageGb(baseSpecs),
        ram: getRamGb(baseSpecs),
    };
}

/** @param {{ storage?: string, ram?: string }} specFilters values like "64", "1024", or "all" */
function productMatchesSpec(baseSpecs, specFilters = {}) {
    const { storage, ram } = parseProductSpecs(baseSpecs);
    if (specFilters.storage && specFilters.storage !== 'all') {
        if (parseStorageToGb(specFilters.storage) !== storage) return false;
    }
    if (specFilters.ram && specFilters.ram !== 'all') {
        if (getRamGb({ ram: specFilters.ram }) !== ram) return false;
    }
    return true;
}

/** Display label from normalized GB or raw string ("1024" → "1TB"). */
function formatStorageLabel(gbOrRaw) {
    if (gbOrRaw == null || gbOrRaw === '') return null;
    const raw = String(gbOrRaw).trim();
    if (/tb/i.test(raw)) {
        const m = raw.toUpperCase().replace(/\s+/g, '').match(/^(\d+(?:\.\d+)?)TB$/);
        if (m) return m[1] === '1' ? '1TB' : `${m[1]}TB`;
    }
    const gb = Number(parseStorageToGb(raw) ?? raw);
    if (!Number.isFinite(gb) || gb <= 0) return raw;
    if (gb >= 1024 && gb % 1024 === 0) {
        const tb = gb / 1024;
        return tb === 1 ? '1TB' : `${tb}TB`;
    }
    return `${gb}GB`;
}

function formatRamLabel(gb) {
    if (gb == null || gb === '') return null;
    return `${gb}GB RAM`;
}

module.exports = {
    parseBaseSpecs,
    parseProductSpecs,
    parseStorageToGb,
    normalizeSpecGb,
    getStorageGb,
    getRamGb,
    productMatchesSpec,
    formatStorageLabel,
    formatRamLabel,
};
