import api from "./axios"

export const searchColleges = async (query) => {
  const response = await api.get(`/colleges/search?q=${query}`)
  return response.data
}