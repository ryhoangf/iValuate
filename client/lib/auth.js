// client/lib/auth.js

function normalizeStoredToken(raw) {
  if (raw == null) return null
  let t = String(raw).trim()
  if (t.toLowerCase().startsWith("bearer ")) {
    t = t.slice(7).trim()
  }
  return t || null
}

/** Chuẩn hóa user từ API (đăng nhập) — luôn có subscriptionTier: lite | premium. */
export function normalizeUserFromApi(raw) {
  if (!raw || typeof raw !== "object") return null
  const tierRaw = raw.subscriptionTier ?? raw.subscription_tier ?? raw.planType
  const subscriptionTier =
    String(tierRaw || "lite").toLowerCase() === "premium" ? "premium" : "lite"
  const fullName = raw.fullName ?? raw.full_name ?? ""
  return {
    id: raw.id ?? raw.user_id,
    email: raw.email,
    fullName,
    full_name: raw.full_name ?? fullName,
    role: raw.role,
    subscriptionTier,
  }
}

export const getUser = () => {
  if (typeof window === "undefined") return null
  const user = localStorage.getItem("user")
  if (!user) return null
  try {
    return normalizeUserFromApi(JSON.parse(user)) ?? JSON.parse(user)
  } catch {
    return null
  }
}

export const getToken = () => {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("token") ?? localStorage.getItem("accessToken")
  return normalizeStoredToken(raw)
}

export const setAuth = (token, user) => {
  const t = normalizeStoredToken(token)
  if (t) {
    localStorage.setItem("token", t)
    localStorage.setItem("accessToken", t)
  } else {
    localStorage.removeItem("token")
    localStorage.removeItem("accessToken")
  }
  const normalized = normalizeUserFromApi(user) ?? user
  localStorage.setItem("user", JSON.stringify(normalized))
}

export const clearAuth = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("accessToken")
  localStorage.removeItem("user")
}

export const isAuthenticated = () => {
  return !!getToken()
}

/** 'lite' | 'premium' — đọc từ user sau đăng nhập. */
export function getSubscriptionTier() {
  const u = getUser()
  if (!u) return "lite"
  const t = u.subscriptionTier ?? u.subscription_tier
  return t === "premium" ? "premium" : "lite"
}
