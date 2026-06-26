import { TransactionalEmailsApi, SendSmtpEmail } from "@getbrevo/brevo"

// Brevo sends over HTTPS (port 443), which bypasses the SMTP port
// blocking that Render's free tier enforces on ports 25/465/587.
// Same external signature as before, so every caller stays unchanged.
const sendEmail = async ({ to, subject, html }) => {
  try {
    const apiInstance = new TransactionalEmailsApi()
    apiInstance.authentications.apiKey.apiKey = process.env.BREVO_API_KEY

    const message = new SendSmtpEmail()
    message.subject = subject
    message.htmlContent = html
    message.sender = {
      name: process.env.EMAIL_FROM,
      email: process.env.EMAIL_USER, // must match your Brevo-verified sender
    }
    message.to = [{ email: to }]

    const response = await apiInstance.sendTransacEmail(message)
    console.log("Email sent:", response.body?.messageId)

    return response.body
  } catch (error) {
    console.error("Email sending failed:", error.message)
    throw error
    // we throw here so the calling function knows email failed
    // and can handle it appropriately
  }
}

export default sendEmail