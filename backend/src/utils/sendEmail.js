import nodemailer from "nodemailer"

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent:", info.messageId)

    return info
  } catch (error) {
    console.error("Email sending failed:", error.message)
    throw error
    // we throw here so the calling function knows email failed
    // and can handle it appropriately
  }
}

export default sendEmail