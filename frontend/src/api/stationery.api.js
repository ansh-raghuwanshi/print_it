import api from "./axios"

export const getShopItems = async (shopId) => {
  const response = await api.get(`/stationery/shop/${shopId}`)
  return response.data
}

export const getMyItems = async () => {
  const response = await api.get("/stationery")
  return response.data
}

export const addItem = async (itemData) => {
  const response = await api.post("/stationery", itemData)
  return response.data
}

export const updateItem = async (id, updates) => {
  const response = await api.patch(`/stationery/${id}`, updates)
  return response.data
}

export const restockItem = async (id, realStock) => {
  const response = await api.patch(`/stationery/${id}/restock`, { realStock })
  return response.data
}

export const toggleItemAvailability = async (id) => {
  const response = await api.patch(`/stationery/${id}/toggle`)
  return response.data
}

export const deleteItem = async (id) => {
  const response = await api.delete(`/stationery/${id}`)
  return response.data
}