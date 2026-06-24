import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { verifyEmail } from "../../api/auth.api"
import AuthLayout from "../../components/auth/AuthLayout"
import { Button } from "../../components/ui/button"

const REDIRECT_DELAY_SECONDS = 4

const VerifyEmail = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState("loading")
  const [message, setMessage] = useState("")
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_DELAY_SECONDS)
  const hasVerified = useRef(false)

  // Run verification exactly once, even under StrictMode's double-invoke in dev
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
        setMessage(err.response?.data?.message || "We couldn't verify this link.")
      }
    }

    verify()
  }, [token])

  // Countdown + auto-redirect, only once verification succeeds
  useEffect(() => {
    if (status !== "success") return

    if (secondsLeft === 0) {
      navigate("/login", {
        state: { message: "Email verified. You can log in now." },
      })
      return
    }

    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [status, secondsLeft, navigate])

  return (
    <AuthLayout>
      <div className="text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-muted-foreground mx-auto animate-spin" />
            <p className="text-muted-foreground mt-4">Verifying your email...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-success mx-auto" />
            <h1 className="font-heading text-xl font-bold mt-4 text-foreground">
              Email Verified!
            </h1>
            <p className="text-muted-foreground mt-2">{message}</p>
            <p className="text-xs text-muted-foreground mt-4">
              Redirecting to login in {secondsLeft}s...
            </p>
            <Button onClick={() => navigate("/login")} className="mt-4 w-full">
              Go to Login Now
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="font-heading text-xl font-bold mt-4 text-foreground">
              Verification Link Didn't Work
            </h1>
            <p className="text-muted-foreground mt-2">{message}</p>
            <p className="text-xs text-muted-foreground mt-2">
              This can happen if the link was already used, or has expired. If
              you've already verified, you can simply log in.
            </p>
            <Link to="/login">
              <Button className="mt-4 w-full">Back to Login</Button>
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  )
}

export default VerifyEmail