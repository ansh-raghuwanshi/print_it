import api from "./axios"

export const loginUser = async (email, password) => {
  const response = await api.post("/users/login", { email, password })
  return response.data
}

export const registerStudent = async (formData) => {
  const response = await api.post("/users/register/student", formData)
  return response.data
}

export const registerShopkeeper = async (formData) => {
  const response = await api.post("/users/register/shopkeeper", formData)
  return response.data
}

export const verifyEmail = async (token) => {
  const response = await api.get(`/users/verify-email/${token}`)
  return response.data
}

export const resendVerification = async (email) => {
  const response = await api.post("/users/resend-verification", { email })
  return response.data
}

export const getMe = async () => {
  const response = await api.get("/users/me")
  return response.data
}

export const logoutUser = async () => {
  const response = await api.post("/users/logout")
  return response.data
}