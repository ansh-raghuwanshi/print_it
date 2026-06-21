import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { registerStudent } from "../../api/auth.api"
import { searchColleges } from "../../api/college.api"

const RegisterStudent = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    collegeIdNumber: "",
  })

  const [collegeQuery, setCollegeQuery] = useState("")
  const [collegeResults, setCollegeResults] = useState([])
  const [selectedCollege, setSelectedCollege] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // debounced college search
  useEffect(() => {
    if (collegeQuery.trim() === "") {
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

    // cleanup — cancels the previous timer if user types again quickly
    return () => clearTimeout(timer)
  }, [collegeQuery])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectCollege = (college) => {
    setSelectedCollege(college)
    setCollegeQuery(college.name)
    setShowDropdown(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!selectedCollege) {
      setError("Please select your college")
      return
    }

    setLoading(true)

    try {
      await registerStudent({
        ...formData,
        collegeId: selectedCollege._id,
      })
      navigate("/login", { state: { message: "Registration successful. Please check your email." } })
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl border border-gray-200 w-full max-w-md">
        <h1 className="text-2xl font-bold text-black mb-6">Student Registration</h1>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Full Name</label>
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
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* college search */}
          <div className="relative">
            <label className="text-sm font-medium text-gray-700">College</label>
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

            {collegeQuery && collegeResults.length === 0 && !selectedCollege && (
              <p className="text-xs text-gray-500 mt-1">
                College not found? Ask your stationery shop to register on PrintIt.
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">College ID Number</label>
            <input
              name="collegeIdNumber"
              value={formData.collegeIdNumber}
              onChange={handleChange}
              placeholder="Your roll number / ID"
              required
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Register"}
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

export default RegisterStudent