export const verificationEmailTemplate = ({ name, verificationUrl }) => ({
  subject: "Verify your PrintIt account",
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      
      <h1 style="color:#000;font-size:24px">Welcome to PrintIt!</h1>
      
      <p style="color:#333;font-size:16px">Hi ${name},</p>
      
      <p style="color:#333;font-size:16px">
        Thanks for registering. Please verify your email 
        address to activate your account.
      </p>

      <a href="${verificationUrl}"
         style="display:inline-block;background:#000;color:#fff;
                padding:12px 32px;text-decoration:none;
                border-radius:6px;font-size:16px;margin:20px 0">
        Verify Email
      </a>

      <p style="color:#666;font-size:14px">
        This link expires in 24 hours.
      </p>

      <p style="color:#666;font-size:14px">
        If you didn't create a PrintIt account, 
        you can safely ignore this email.
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
      
      <p style="color:#999;font-size:12px">
        PrintIt — Smart Print & Stationery Management
      </p>

    </div>
  `,
})

export const shopkeeperApprovalTemplate = ({ name, shopName }) => ({
  subject: "Your PrintIt shop has been approved!",
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      
      <h1 style="color:#000;font-size:24px">Shop Approved!</h1>
      
      <p style="color:#333;font-size:16px">Hi ${name},</p>
      
      <p style="color:#333;font-size:16px">
        Great news! Your shop <strong>${shopName}</strong> 
        has been approved and is now live on PrintIt.
      </p>

      <p style="color:#333;font-size:16px">
        Students at your college can now discover your shop 
        and place orders directly through the platform.
      </p>

      <a href="${process.env.CORS_ORIGIN}/login"
         style="display:inline-block;background:#000;color:#fff;
                padding:12px 32px;text-decoration:none;
                border-radius:6px;font-size:16px;margin:20px 0">
        Go to Dashboard
      </a>

      <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
      
      <p style="color:#999;font-size:12px">
        PrintIt — Smart Print & Stationery Management
      </p>

    </div>
  `,
})

export const shopkeeperRejectionTemplate = ({ name, shopName, reason }) => ({
  subject: "Update on your PrintIt shop application",
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      
      <h1 style="color:#000;font-size:24px">Shop Application Update</h1>
      
      <p style="color:#333;font-size:16px">Hi ${name},</p>
      
      <p style="color:#333;font-size:16px">
        Unfortunately we were unable to approve your shop 
        <strong>${shopName}</strong> at this time.
      </p>

      <p style="color:#333;font-size:16px">
        Reason: <strong>${reason}</strong>
      </p>

      <p style="color:#333;font-size:16px">
        If you think this is a mistake or have questions, 
        please reply to this email.
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
      
      <p style="color:#999;font-size:12px">
        PrintIt — Smart Print & Stationery Management
      </p>

    </div>
  `,
})

export const orderReadyTemplate = ({ studentName, orderNumber }) => ({
  subject: `Order #${orderNumber} is ready for pickup`,
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      
      <h1 style="color:#000;font-size:24px">Your order is ready!</h1>
      
      <p style="color:#333;font-size:16px">Hi ${studentName},</p>
      
      <p style="color:#333;font-size:16px">
        Your order <strong>#${orderNumber}</strong> has been 
        printed and is ready for pickup at the shop.
      </p>

      <p style="color:#333;font-size:16px">
        Please visit the shop to collect your order.
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
      
      <p style="color:#999;font-size:12px">
        PrintIt — Smart Print & Stationery Management
      </p>

    </div>
  `,
})

export const orderRejectedTemplate = ({ studentName, orderNumber, reason }) => ({
  subject: `Order #${orderNumber} was rejected`,
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      
      <h1 style="color:#000;font-size:24px">Order Rejected</h1>
      
      <p style="color:#333;font-size:16px">Hi ${studentName},</p>
      
      <p style="color:#333;font-size:16px">
        Unfortunately your order <strong>#${orderNumber}</strong> 
        was rejected by the shop.
      </p>

      <p style="color:#333;font-size:16px">
        Reason: <strong>${reason}</strong>
      </p>

      <p style="color:#333;font-size:16px">
        A full refund has been initiated and will reflect 
        in your account within 3-5 business days.
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
      
      <p style="color:#999;font-size:12px">
        PrintIt — Smart Print & Stationery Management
      </p>

    </div>
  `,
})