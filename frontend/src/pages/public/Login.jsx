import { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { loginUser } from "../../api/auth.api"
import AuthLayout from "../../components/auth/AuthLayout"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Generic one-time message slot — any page can navigate here with
  // { state: { message: "..." } } and it'll surface once, e.g. after
  // a session expiry redirect. Registration now uses its own dedicated
  // /verify-pending page instead of relying on this.
  const incomingMessage = location.state?.message

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await loginUser(email, password)
      const { user, accessToken, shop } = response.data

      login(user, accessToken, shop)

      if (user.role === "student") navigate("/student/dashboard")
      else if (user.role === "shopkeeper") navigate("/shopkeeper/dashboard")
      else if (user.role === "admin") navigate("/admin/dashboard")
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Login to PrintIt"
      subtitle="Pick up your order, right where you left off."
      footer={
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register/student" className="text-primary font-medium underline">
            Register as Student
          </Link>{" "}
          or{" "}
          <Link to="/register/shopkeeper" className="text-primary font-medium underline">
            Register as Shop
          </Link>
        </p>
      }
    >
      {incomingMessage && (
        <div className="bg-success/10 text-success text-sm p-3 rounded-lg mb-4 border border-success/20">
          {incomingMessage}
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4 border border-destructive/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gmail.com"
            autoComplete="email"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="text-right mt-1">
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </AuthLayout>
  )
}

export default Login