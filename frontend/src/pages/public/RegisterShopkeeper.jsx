import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { registerShopkeeper } from "../../api/auth.api"
import { searchColleges } from "../../api/college.api"

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

  const [collegeMode, setCollegeMode] = useState("search") // search | create

  const [collegeQuery, setCollegeQuery] = useState("")
  const [collegeResults, setCollegeResults] = useState([])
  const [selectedCollege, setSelectedCollege] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const [newCollege, setNewCollege] = useState({
    name: "",
    shortName: "",
    city: "",
    state: "",
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (collegeQuery.trim() === "" || collegeMode !== "search") {
      setCollegeResults([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const response = await searchColleges(collegeQuery)
        setCollegeResults(response.data.colleges)
        setShowDropdown(true)
      } catch (err) {
        setCollegeResults([])
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [collegeQuery, collegeMode])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNewCollegeChange = (e) => {
    setNewCollege({ ...newCollege, [e.target.name]: e.target.value })
  }

  const handleSelectCollege = (college) => {
    setSelectedCollege(college)
    setCollegeQuery(college.name)
    setShowDropdown(false)
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

    setLoading(true)

    try {
      const payload = {
        ...formData,
        ...(collegeMode === "search"
          ? { collegeId: selectedCollege._id }
          : { newCollege }),
      }

      await registerShopkeeper(payload)
      navigate("/login", {
        state: { message: "Registration successful. Please check your email." },
      })
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl border border-gray-200 w-full max-w-md">
        <h1 className="text-2xl font-bold text-black mb-6">Shopkeeper Registration</h1>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* personal info */}
          <div>
            <label className="text-sm font-medium text-gray-700">Your Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Your Phone</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <hr className="border-gray-200" />

          {/* shop info */}
          <div>
            <label className="text-sm font-medium text-gray-700">Shop Name</label>
            <input
              name="shopName"
              value={formData.shopName}
              onChange={handleChange}
              required
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Shop Phone</label>
            <input
              name="shopPhone"
              value={formData.shopPhone}
              onChange={handleChange}
              required
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Shop Address</label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <hr className="border-gray-200" />

          {/* college toggle */}
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setCollegeMode("search")}
              className={`flex-1 text-sm py-1.5 rounded-md font-medium ${
                collegeMode === "search" ? "bg-white shadow text-black" : "text-gray-500"
              }`}
            >
              Select College
            </button>
            <button
              type="button"
              onClick={() => setCollegeMode("create")}
              className={`flex-1 text-sm py-1.5 rounded-md font-medium ${
                collegeMode === "create" ? "bg-white shadow text-black" : "text-gray-500"
              }`}
            >
              Add New College
            </button>
          </div>

          {collegeMode === "search" ? (
            <div className="relative">
              <input
                value={collegeQuery}
                onChange={(e) => {
                  setCollegeQuery(e.target.value)
                  setSelectedCollege(null)
                }}
                placeholder="Search your college"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />

              {showDropdown && collegeResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                  {collegeResults.map((college) => (
                    <div
                      key={college._id}
                      onClick={() => handleSelectCollege(college)}
                      className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                    >
                      <p className="font-medium">{college.name}</p>
                      <p className="text-gray-500 text-xs">{college.city}, {college.state}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <input
                name="name"
                value={newCollege.name}
                onChange={handleNewCollegeChange}
                placeholder="College full name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <input
                name="shortName"
                value={newCollege.shortName}
                onChange={handleNewCollegeChange}
                placeholder="Short name (e.g. SATI)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <div className="flex gap-3">
                <input
                  name="city"
                  value={newCollege.city}
                  onChange={handleNewCollegeChange}
                  placeholder="City"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  name="state"
                  value={newCollege.state}
                  onChange={handleNewCollegeChange}
                  placeholder="State"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <p className="text-xs text-gray-500">
                Your college will be reviewed before going live.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Register Shop"}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-black font-medium underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterShopkeeper