import { useState, useEffect } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { MailCheck } from "lucide-react"
import { resendVerification } from "../../api/auth.api"
import AuthLayout from "../../components/auth/AuthLayout"
import { Button } from "../../components/ui/button"

const RESEND_COOLDOWN_SECONDS = 60

const VerifyPending = () => {
  const [searchParams] = useSearchParams()
  const email = searchParams.get("email") || ""

  const [resendState, setResendState] = useState("idle") // idle | sending | sent | error
  const [cooldown, setCooldown] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")

  // Countdown ticker for the resend cooldown
  useEffect(() => {
    if (cooldown === 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleResend = async () => {
    if (!email) {
      setErrorMessage("We don't have your email for this page — please log in or register again.")
      setResendState("error")
      return
    }

    setResendState("sending")
    setErrorMessage("")

    try {
      await resendVerification(email)
      setResendState("sent")
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Couldn't resend the email. Try again shortly.")
      setResendState("error")
    }
  }

  const isResendDisabled = resendState === "sending" || cooldown > 0

  return (
    <AuthLayout
      title="Check your email"
      subtitle="One more step before you can log in."
      footer={
        <p className="text-sm text-muted-foreground">
          Already verified?{" "}
          <Link to="/login" className="text-primary font-medium underline">
            Go to Login
          </Link>
        </p>
      }
    >
      <div className="text-center">
        <MailCheck className="w-12 h-12 text-primary mx-auto" />

        <p className="text-foreground mt-4">
          We've sent a verification link to
        </p>
        {email ? (
          <p className="font-medium text-foreground mt-1">{email}</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">
            your email address
          </p>
        )}

        <p className="text-sm text-muted-foreground mt-4">
          Click the link in that email to activate your account. If you don't
          see it, check your spam folder.
        </p>

        {resendState === "sent" && (
          <div className="bg-success/10 text-success text-sm p-3 rounded-lg mt-4 border border-success/20">
            Verification email sent. Give it a minute to arrive.
          </div>
        )}

        {resendState === "error" && errorMessage && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mt-4 border border-destructive/20">
            {errorMessage}
          </div>
        )}

        <Button
          onClick={handleResend}
          disabled={isResendDisabled}
          variant="outline"
          className="mt-6 w-full"
        >
          {resendState === "sending"
            ? "Sending..."
            : cooldown > 0
            ? `Resend available in ${cooldown}s`
            : "Resend verification email"}
        </Button>
      </div>
    </AuthLayout>
  )
}

export default VerifyPending