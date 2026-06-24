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