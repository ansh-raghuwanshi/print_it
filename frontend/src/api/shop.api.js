import api from "./axios"

export const getMyShop = async () => {
  const response = await api.get("/shop/me")
  return response.data
}

export const updateShop = async (updates) => {
  const response = await api.patch("/shop/me", updates)
  return response.data
}

export const toggleShopStatus = async () => {
  const response = await api.patch("/shop/me/status")
  return response.data
}

export const updatePricing = async (pricing) => {
  const response = await api.patch("/shop/me/pricing", pricing)
  return response.data
}