import api from "./axios"

export const getMyOrders = async () => {
  const response = await api.get("/orders/mine")
  return response.data
}

export const calculateOrder = async ({ shopId, printJobs, quantities }) => {
  const formData = new FormData()

  printJobs.forEach((job) => formData.append("files", job.file))

  formData.append("shopId", shopId)

  formData.append(
    "printJobs",
    JSON.stringify(
      printJobs.map(({ color, doubleSided, copies, notes }) => ({
        color,
        doubleSided,
        copies,
        notes,
      }))
    )
  )

  const stationeryItems = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([itemId, quantity]) => ({ itemId, quantity }))

  formData.append("stationeryItems", JSON.stringify(stationeryItems))

  const response = await api.post("/orders/calculate", formData)
  return response.data
}

export const initiatePayment = async (totalAmount) => {
  const response = await api.post("/orders/initiate-payment", { totalAmount })
  return response.data
}

export const confirmOrder = async ({ tempOrderData, razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const response = await api.post("/orders/confirm", {
    tempOrderData,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  })
  return response.data
}

export const getOrderById = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`)
  return response.data
}

export const getShopOrders = async (status) => {
  const response = await api.get("/orders/shop", { params: status ? { status } : {} })
  return response.data
}

export const acceptOrder = async (orderId) => {
  const response = await api.patch(`/orders/${orderId}/accept`)
  return response.data
}

export const rejectOrder = async (orderId, { rejectionReason, rejectionNote }) => {
  const response = await api.patch(`/orders/${orderId}/reject`, {
    rejectionReason,
    rejectionNote,
  })
  return response.data
}

export const markReady = async (orderId) => {
  const response = await api.patch(`/orders/${orderId}/ready`)
  return response.data
}

export const markCompleted = async (orderId) => {
  const response = await api.patch(`/orders/${orderId}/complete`)
  return response.data
}

export const cancelOrder = async (orderId) => {
  const response = await api.delete(`/orders/${orderId}`)
  return response.data
}