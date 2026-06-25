import api from "./axios"

export const getPendingColleges = async () => {
  const response = await api.get("/admin/colleges")
  return response.data
}

export const approveCollege = async (collegeId) => {
  const response = await api.patch(`/admin/colleges/${collegeId}/approve`)
  return response.data
}

export const getShops = async (status) => {
  const response = await api.get("/admin/shops", { params: status ? { status } : {} })
  return response.data
}

export const approveShop = async (shopId) => {
  const response = await api.patch(`/admin/shops/${shopId}/approve`)
  return response.data
}

export const rejectShop = async (shopId, reason) => {
  const response = await api.patch(`/admin/shops/${shopId}/reject`, { reason })
  return response.data
}

export const updateSubscription = async (shopId, { status, endDate }) => {
  const response = await api.patch(`/admin/shops/${shopId}/subscription`, {
    status,
    ...(endDate && { endDate }),
  })
  return response.data
}