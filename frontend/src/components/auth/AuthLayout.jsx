import { Link } from "react-router-dom"

/*
 Shared shell for all pre-login auth pages (Login, Register, VerifyEmail, VerifyPending).
  Renders the PrintIt wordmark, a centered card with a perforated "tear line" detail
 at the top (the page's one signature element), and an optional title/subtitle.
 
 Usage:
    <AuthLayout title="Login to PrintIt" subtitle="Pick up where you left off">
      <form>...</form>
    </AuthLayout>
*/
const AuthLayout = ({ title, subtitle, children, footer }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Wordmark, sits above the card, not inside it */}
        <Link
          to="/"
          className="block text-center mb-6 font-heading text-2xl font-bold text-foreground tracking-tight"
        >
          Print<span className="text-primary">It</span>
        </Link>

        <div className="relative bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Perforation / tear-line signature detail */}
          <div
            aria-hidden="true"
            className="h-3 w-full bg-background"
            style={{
              maskImage:
                "radial-gradient(circle at 6px 0px, transparent 5px, black 5.5px)",
              maskSize: "12px 100%",
              maskRepeat: "repeat-x",
              WebkitMaskImage:
                "radial-gradient(circle at 6px 0px, transparent 5px, black 5.5px)",
              WebkitMaskSize: "12px 100%",
              WebkitMaskRepeat: "repeat-x",
            }}
          />

          <div className="p-8">
            {(title || subtitle) && (
              <div className="mb-6">
                {title && (
                  <h1 className="font-heading text-xl font-bold text-foreground">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                )}
              </div>
            )}

            {children}
          </div>
        </div>

        {footer && <div className="text-center mt-4">{footer}</div>}
      </div>
    </div>
  )
}

export default AuthLayout