/** Fixed brand strip on the home page (order matters). */
const MARKET_BRANDS = [
    { id: 'apple', label: 'Apple' },
    { id: 'samsung', label: 'Samsung' },
    { id: 'sony', label: 'Sony' },
    { id: 'sharp', label: 'SHARP' },
    { id: 'google', label: 'Google' },
    { id: 'xiaomi', label: 'Xiaomi' },
    { id: 'oppo', label: 'OPPO' },
    { id: 'huawei', label: 'Huawei' },
];

const MARKET_BRAND_ID_SET = new Set(MARKET_BRANDS.map((b) => b.id));

const slug = (s) =>
    String(s)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || '';

/** Map DB brand string to a fixed market brand id, or null if not allowed. */
function brandKeyToMarketId(brandKey) {
    const id = slug(brandKey);
    return MARKET_BRAND_ID_SET.has(id) ? id : null;
}

module.exports = {
    MARKET_BRANDS,
    MARKET_BRAND_ID_SET,
    brandKeyToMarketId,
};
