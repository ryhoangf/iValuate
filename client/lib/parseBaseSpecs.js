/** Parse product/listing base_specs from JSON string or object. */
export function parseBaseSpecs(raw) {
  if (raw == null) return {}
  if (typeof raw === "object") return raw
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }
  return {}
}
