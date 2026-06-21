import { Navigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()

  // still checking if user is logged in — show nothing yet
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  // not logged in at all
  if (!user) {
    return <Navigate to="/login" />
  }

  // logged in but wrong role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" />
  }

  // all checks passed — show the actual page
  return children
}

export default ProtectedRoute