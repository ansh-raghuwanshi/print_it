import { useAuth } from "../../context/AuthContext"
import { logoutUser } from "../../api/auth.api"
import { useNavigate } from "react-router-dom"

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (error) {
      console.error("Logout API failed:", error)
    }
    logout()
    navigate("/login")
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100"
        >
          Logout
        </button>
      </div>
      <p className="text-gray-500 mt-2">Welcome, {user?.name}</p>
    </div>
  )
}

export default AdminDashboard