
export const wellcomeMail = (name, email) => ({
  from: process.env.SENDER_EMAIL,
  to: email,
  subject: "🎉 Welcome to the Admin Panel - Your Account is Ready!",
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #4CAF50; text-align: center;">Welcome, ${name}! 🎉</h2>
      <p style="font-size: 16px; color: #333;">
        We are excited to inform you that your admin account has been successfully created! 🎊
      </p>
      <p style="font-size: 16px; color: #333;">
        <strong>Here are your account details:</strong><br />
        <strong>Name:</strong> ${name} <br />
        <strong>Email:</strong> ${email}
      </p>
      <p style="font-size: 16px; color: #333;">
        You now have full access to manage the system efficiently. Please ensure to keep your credentials secure. 🔐
      </p>
      <hr style="border: 0; border-top: 1px solid #ddd;" />
      <p style="font-size: 14px; color: #777; text-align: center;">
        If you encounter any issues, feel free to contact our support team. <br />
        Thank you for being part of our team! 😊
      </p>
    </div>
  `,
});


export const passwordRest = (email, otp) => ({
  from: process.env.SENDER_EMAIL,
  to: email,
  subject: "🔒 Password Reset Request - OTP Verification",
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #FF5722; text-align: center;">Password Reset Request 🔐</h2>
      <p style="font-size: 16px; color: #333;">
        You have requested to reset your password. Please use the OTP provided below to complete the process. This OTP is valid for <strong>10 minutes</strong>.
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; background-color: #f3f3f3; padding: 10px 20px; font-size: 20px; font-weight: bold; color: #333; border-radius: 5px; border: 1px solid #ddd;">
          ${otp}
        </span>
      </div>
      <p style="font-size: 14px; color: #555;">
        If you did not request this password reset, please ignore this email or contact support immediately. ⚠️
      </p>
      <hr style="border: 0; border-top: 1px solid #ddd;" />
      <p style="font-size: 14px; color: #777; text-align: center;">
        Thank you for using our services. Stay secure! 🔐
      </p>
    </div>
  `,
});
