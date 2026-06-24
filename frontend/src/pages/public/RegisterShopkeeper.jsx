import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { registerShopkeeper } from "../../api/auth.api"
import AuthLayout from "../../components/auth/AuthLayout"
import CollegeSearchAutocomplete from "../../components/auth/CollegeSearchAutocomplete"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"

const PHONE_REGEX = /^[6-9][0-9]{9}$/
const MIN_PASSWORD_LENGTH = 6
const PHONE_ERROR_MESSAGE = "Enter a valid 10-digit Indian mobile number"

const RequiredMark = () => <span className="text-destructive">*</span>

const SectionHeading = ({ children }) => (
  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">
    {children}
  </p>
)

const RegisterShopkeeper = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    shopName: "",
    shopPhone: "",
    address: "",
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [collegeMode, setCollegeMode] = useState("search") // search | create
  const [selectedCollege, setSelectedCollege] = useState(null)
  const [newCollege, setNewCollege] = useState({
    name: "",
    shortName: "",
    city: "",
    state: "",
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Derived validation
  const passwordTooShort =
    formData.password.length > 0 && formData.password.length < MIN_PASSWORD_LENGTH
  const passwordMismatch =
    confirmPassword.length > 0 && formData.password !== confirmPassword
  const phoneInvalid = formData.phone.length > 0 && !PHONE_REGEX.test(formData.phone)
  const shopPhoneInvalid =
    formData.shopPhone.length > 0 && !PHONE_REGEX.test(formData.shopPhone)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNewCollegeChange = (e) => {
    setNewCollege({ ...newCollege, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (collegeMode === "search" && !selectedCollege) {
      setError("Please select your college")
      return
    }

    if (collegeMode === "create") {
      const { name, shortName, city, state } = newCollege
      if (!name || !shortName || !city || !state) {
        setError("Please fill all college details")
        return
      }
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
      setError("Enter a valid phone number for yourself")
      return
    }
    if (!PHONE_REGEX.test(formData.shopPhone)) {
      setError("Enter a valid phone number for your shop")
      return
    }

    setLoading(true)

    try {
      const payload = {
        ...formData,
        ...(collegeMode === "search"
          ? { collegeId: selectedCollege._id }
          : { newCollege }),
      }

      await registerShopkeeper(payload)
      navigate(`/verify-pending?email=${encodeURIComponent(formData.email)}`)
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Shopkeeper Registration"
      subtitle="Bring your shop online and stop juggling WhatsApp orders."
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
        <SectionHeading>About You</SectionHeading>

        <div>
          <Label htmlFor="name">
            Your Name <RequiredMark />
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
            Your Phone <RequiredMark />
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
            <p className="text-xs text-destructive mt-1">{PHONE_ERROR_MESSAGE}</p>
          )}
        </div>

        <SectionHeading>About Your Shop</SectionHeading>

        <div>
          <Label htmlFor="shopName">
            Shop Name <RequiredMark />
          </Label>
          <Input
            id="shopName"
            name="shopName"
            value={formData.shopName}
            onChange={handleChange}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="shopPhone">
            Shop Phone <RequiredMark />
          </Label>
          <Input
            id="shopPhone"
            name="shopPhone"
            type="tel"
            value={formData.shopPhone}
            onChange={handleChange}
            placeholder="9876543210"
            required
            className="mt-1"
          />
          {shopPhoneInvalid && (
            <p className="text-xs text-destructive mt-1">{PHONE_ERROR_MESSAGE}</p>
          )}
        </div>

        <div>
          <Label htmlFor="address">
            Shop Address <RequiredMark />
          </Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            className="mt-1"
          />
        </div>

        <SectionHeading>College</SectionHeading>

        <div className="flex gap-2 bg-secondary rounded-lg p-1">
          <button
            type="button"
            onClick={() => setCollegeMode("search")}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${
              collegeMode === "search"
                ? "bg-card shadow text-foreground"
                : "text-muted-foreground"
            }`}
          >
            Select College
          </button>
          <button
            type="button"
            onClick={() => setCollegeMode("create")}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${
              collegeMode === "create"
                ? "bg-card shadow text-foreground"
                : "text-muted-foreground"
            }`}
          >
            Add New College
          </button>
        </div>

        {collegeMode === "search" ? (
          <CollegeSearchAutocomplete
            selected={selectedCollege}
            onSelect={setSelectedCollege}
            placeholder="Search your college"
            emptyStateMessage="Can't find it? Switch to 'Add New College' above."
          />
        ) : (
          <div className="space-y-3">
            <Input
              name="name"
              value={newCollege.name}
              onChange={handleNewCollegeChange}
              placeholder="College full name"
            />
            <Input
              name="shortName"
              value={newCollege.shortName}
              onChange={handleNewCollegeChange}
              placeholder="Short name (e.g. SATI)"
            />
            <div className="flex gap-3">
              <Input
                name="city"
                value={newCollege.city}
                onChange={handleNewCollegeChange}
                placeholder="City"
              />
              <Input
                name="state"
                value={newCollege.state}
                onChange={handleNewCollegeChange}
                placeholder="State"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your college will be reviewed before going live.
            </p>
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account..." : "Register Shop"}
        </Button>
      </form>
    </AuthLayout>
  )
}

export default RegisterShopkeeper