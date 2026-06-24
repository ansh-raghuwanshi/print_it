import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { registerStudent } from "../../api/auth.api"
import AuthLayout from "../../components/auth/AuthLayout"
import CollegeSearchAutocomplete from "../../components/auth/CollegeSearchAutocomplete"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"

// Mirrors the backend's exact validation rules so the frontend never
// approves something the backend will reject (and vice versa).
const PHONE_REGEX = /^[6-9][0-9]{9}$/
const MIN_PASSWORD_LENGTH = 6

const RequiredMark = () => <span className="text-destructive">*</span>

const RegisterStudent = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    collegeIdNumber: "",
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [selectedCollege, setSelectedCollege] = useState(null)

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Derived validation — recalculated every render, never goes stale.
  const passwordTooShort =
    formData.password.length > 0 && formData.password.length < MIN_PASSWORD_LENGTH
  const passwordMismatch =
    confirmPassword.length > 0 && formData.password !== confirmPassword
  const phoneInvalid =
    formData.phone.length > 0 && !PHONE_REGEX.test(formData.phone)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!selectedCollege) {
      setError("Please select your college")
      return
    }
    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
      return
    }
    if (formData.password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (!PHONE_REGEX.test(formData.phone)) {
      setError("Enter a valid 10-digit Indian mobile number")
      return
    }

    setLoading(true)

    try {
      await registerStudent({
        ...formData,
        collegeId: selectedCollege._id,
      })
      navigate(`/verify-pending?email=${encodeURIComponent(formData.email)}`)
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Student Registration"
      subtitle="Skip the queue. Order ahead from your campus print shop."
      footer={
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium underline">
            Login
          </Link>
        </p>
      }
    >
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4 border border-destructive/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">
            Full Name <RequiredMark />
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            autoComplete="name"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="email">
            Email <RequiredMark />
          </Label>
          <Input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="password">
            Password <RequiredMark />
          </Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
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
          <p className="text-xs text-muted-foreground mt-1">
            At least {MIN_PASSWORD_LENGTH} characters
          </p>
          {passwordTooShort && (
            <p className="text-xs text-destructive mt-1">
              Password must be at least {MIN_PASSWORD_LENGTH} characters
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword">
            Confirm Password <RequiredMark />
          </Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            className="mt-1"
          />
          {passwordMismatch && (
            <p className="text-xs text-destructive mt-1">Passwords do not match</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">
            Phone <RequiredMark />
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="9876543210"
            autoComplete="tel"
            required
            className="mt-1"
          />
          {phoneInvalid && (
            <p className="text-xs text-destructive mt-1">
              Enter a valid 10-digit Indian mobile number
            </p>
          )}
        </div>

        <CollegeSearchAutocomplete
          label={
            <>
              College <RequiredMark />
            </>
          }
          selected={selectedCollege}
          onSelect={setSelectedCollege}
          placeholder="Search your college"
          emptyStateMessage="College not found? Ask your stationery shop to register on PrintIt."
        />

        <div>
          <Label htmlFor="collegeIdNumber">
            College ID Number <RequiredMark />
          </Label>
          <Input
            id="collegeIdNumber"
            name="collegeIdNumber"
            value={formData.collegeIdNumber}
            onChange={handleChange}
            placeholder="Your roll number / ID"
            required
            className="mt-1"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account..." : "Register"}
        </Button>
      </form>
    </AuthLayout>
  )
}

export default RegisterStudent