/** Client-side storage/RAM formatting (keep in sync with server parseProductSpecs.js). */

export function parseStorageToGb(value) {
  if (value == null || value === "") return null
  const s = String(value).trim().toUpperCase().replace(/\s+/g, "")

  const tb = s.match(/^(\d+(?:\.\d+)?)TB$/)
  if (tb) return String(Math.round(parseFloat(tb[1]) * 1024))

  const gb = s.match(/^(\d+(?:\.\d+)?)GB?$/)
  if (gb) return String(Math.round(parseFloat(gb[1])))

  const num = s.match(/^(\d+(?:\.\d+)?)$/)
  if (num) return String(Math.round(parseFloat(num[1])))

  return null
}

export function parseRamToGb(value) {
  if (value == null || value === "") return null
  const s = String(value).trim().toUpperCase().replace(/\s+/g, "")
  const m = s.match(/^(\d+(?:\.\d+)?)/)
  return m ? String(Math.round(parseFloat(m[1]))) : null
}

/** "1024" | "1TB" | 1024 → "1TB"; "128" → "128GB" */
export function formatStorageLabel(gbOrRaw) {
  if (gbOrRaw == null || gbOrRaw === "") return null
  const raw = String(gbOrRaw).trim()
  if (/tb/i.test(raw)) {
    const m = raw.toUpperCase().replace(/\s+/g, "").match(/^(\d+(?:\.\d+)?)TB$/)
    if (m) return m[1] === "1" ? "1TB" : `${m[1]}TB`
  }
  const gb = Number(parseStorageToGb(raw) ?? raw)
  if (!Number.isFinite(gb) || gb <= 0) return raw
  if (gb >= 1024 && gb % 1024 === 0) {
    const tb = gb / 1024
    return tb === 1 ? "1TB" : `${tb}TB`
  }
  return `${gb}GB`
}

export function formatRamLabel(gbOrRaw) {
  if (gbOrRaw == null || gbOrRaw === "") return null
  const gb = parseRamToGb(gbOrRaw) ?? gbOrRaw
  return `${gb}GB RAM`
}
