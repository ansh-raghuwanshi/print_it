import { useEffect, useState, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import { verifyEmail } from "../../api/auth.api"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

const VerifyEmail = () => {
  const { token } = useParams()
  const [status, setStatus] = useState("loading")
  const [message, setMessage] = useState("")
  const hasVerified = useRef(false)

  useEffect(() => {
    if (hasVerified.current) return
    hasVerified.current = true

    const verify = async () => {
      try {
        const response = await verifyEmail(token)
        setStatus("success")
        setMessage(response.message)
      } catch (err) {
        setStatus("error")
        setMessage(err.response?.data?.message || "Verification failed")
      }
    }

    verify()
  }, [token])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl border border-gray-200 w-full max-w-md text-center">

        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-gray-400 mx-auto animate-spin" />
            <p className="text-gray-500 mt-4">Verifying your email...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-bold mt-4">Email Verified!</h1>
            <p className="text-gray-500 mt-2">{message}</p>
            <Link
              to="/login"
              className="inline-block mt-6 bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              Go to Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h1 className="text-xl font-bold mt-4">Verification Failed</h1>
            <p className="text-gray-500 mt-2">{message}</p>
            <Link
              to="/login"
              className="inline-block mt-6 bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              Back to Login
            </Link>
          </>
        )}

      </div>
    </div>
  )
}

export default VerifyEmail