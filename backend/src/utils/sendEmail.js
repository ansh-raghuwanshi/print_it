import { BrevoClient } from "@getbrevo/brevo"

// Brevo sends over HTTPS (port 443), which bypasses the SMTP port
// blocking that Render's free tier enforces on ports 25/465/587.
// Same external signature as before, so every caller stays unchanged.
const sendEmail = async ({ to, subject, html }) => {
  try {
    const brevo = new BrevoClient({
      apiKey: process.env.BREVO_API_KEY,
    })

    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent: html,
      sender: {
        name: process.env.EMAIL_FROM,
        email: process.env.EMAIL_USER, // must match your Brevo-verified sender
      },
      to: [{ email: to }],
    })

    console.log("Email sent:", result?.messageId)
    return result
  } catch (error) {
    console.error("Email sending failed:", error.message)
    throw error
    // we throw here so the calling function knows email failed
    // and can handle it appropriately
  }
}

export default sendEmail