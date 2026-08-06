const nodemailer = require("nodemailer");

// Generic SMTP setup — works with Gmail (App Password), SendGrid, Mailtrap,
// or any other SMTP provider. Set these in your .env / Render environment:
//
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=587
//   SMTP_USER=youraddress@gmail.com
//   SMTP_PASS=your_16_char_app_password   (NOT your normal Gmail password —
//                                           Gmail requires an "App Password"
//                                           for SMTP; generate one at
//                                           myaccount.google.com/apppasswords,
//                                           which requires 2FA to be enabled)
//   EMAIL_FROM="DebateAI <no-reply@yourapp.com>"
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // true for port 465, false for 587/others
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendPasswordResetEmail(toEmail, resetUrl) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: "Reset your DebateAI password",
    text: `You requested a password reset. Click this link to set a new password (valid for 30 minutes):\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#4f46e5;">Reset your DebateAI password</h2>
        <p>You requested a password reset. Click the button below to set a new password. This link is valid for <strong>30 minutes</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0;">
          Reset Password
        </a>
        <p style="color:#666;font-size:13px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
        <p style="color:#999;font-size:12px;word-break:break-all;">Or copy this link: ${resetUrl}</p>
      </div>
    `,
  });
}

module.exports = { sendPasswordResetEmail };