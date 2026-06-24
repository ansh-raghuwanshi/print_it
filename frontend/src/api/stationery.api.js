import api from "./axios"

export const getShopItems = async (shopId) => {
  const response = await api.get(`/stationery/shop/${shopId}`)
  return response.data
}