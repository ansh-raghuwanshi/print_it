import { useNavigate, Link } from "react-router-dom"
import { LogOut } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { logoutUser } from "../../api/auth.api"
import { Button } from "../ui/button"

/**
 * Shared top nav for all logged-in areas (student/shopkeeper/admin).
 * Logout behavior matches the proven AdminDashboard pattern: always
 * clear local session + redirect, even if the API call fails.
 *
 * Props:
 *   - links: optional array of { label, to } rendered between the
 *            wordmark and the user's name/logout button
 */
const TopNav = ({ links = [] }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const dashboardPath =
    user?.role === "student"
      ? "/student/dashboard"
      : user?.role === "shopkeeper"
      ? "/shopkeeper/dashboard"
      : user?.role === "admin"
      ? "/admin/dashboard"
      : "/"

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
    <header className="border-b border-border bg-card">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to={dashboardPath} className="font-heading font-bold text-foreground">
          Print<span className="text-primary">It</span>
        </Link>

        {links.length > 0 && (
          <nav className="hidden sm:flex items-center gap-4">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {user?.name}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

export default TopNav