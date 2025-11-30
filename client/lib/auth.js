export const getUser = () => {
  if (typeof window === "undefined") return null
  const user = localStorage.getItem("user")
  return user ? JSON.parse(user) : null
}

export const getToken = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export const setAuth = (token, user) => {
  localStorage.setItem("token", token)
  localStorage.setItem("user", JSON.stringify(user))
}

export const clearAuth = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

export const isAuthenticated = () => {
  return !!getToken()
}
