import { useAuth } from "../../context/AuthContext"

const ShopkeeperDashboard = () => {
  const { user, shop, logout } = useAuth()

  if (shop?.status === "PENDING") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-amber-600 text-2xl">⏳</span>
          </div>
          <h1 className="text-xl font-bold">Your shop is under review</h1>
          <p className="text-gray-500 mt-2">
            We're reviewing your shop details. You'll be notified by email once approved. This usually takes 24 hours.
          </p>
        </div>
      </div>
    )
  }

  if (shop?.status === "REJECTED") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-red-600">Application Rejected</h1>
          <p className="text-gray-500 mt-2">{shop.rejectionReason}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Shopkeeper Dashboard</h1>
      <p className="text-gray-500 mt-2">Welcome, {user?.name}</p>
    </div>
  )
}

export default ShopkeeperDashboard