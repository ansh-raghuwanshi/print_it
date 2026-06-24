import api from "./axios"

export const searchColleges = async (query) => {
  const response = await api.get(`/colleges/search?q=${query}`)
  return response.data
}
export const getShopsByCollege = async (collegeId) => {
  const response = await api.get(`/colleges/${collegeId}/shops`)
  return response.data
}