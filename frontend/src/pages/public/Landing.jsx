import { Link } from "react-router-dom"
const Landing = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-black">PrintIt</h1>
        <p className="text-gray-500">Smart Print & Stationery Management</p>
        <div className="flex flex-col gap-3 items-center mt-6">
          <div className="flex gap-3">
            <Link
              to="/login"
              className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              Login
            </Link>
            <Link
              to="/register/student"
              className="border border-black text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Register as Student
            </Link>
          </div>
          <Link
            to="/register/shopkeeper"
            className="text-sm text-gray-500 underline hover:text-black"
          >
            Own a stationery shop? Register here
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Landing