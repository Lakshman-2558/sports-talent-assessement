const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"SAI Sports Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Verification Code - SAI Sports Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #667eea; margin: 0;">SAI Sports Talent Assessment</h2>
            <p style="color: #666; margin: 5px 0;">AI-Powered Sports Talent Identification</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="color: white; margin: 0 0 15px 0; font-size: 16px;">Your verification code is:</p>
            <div style="background: white; padding: 15px; border-radius: 8px; display: inline-block;">
              <h1 style="margin: 0; color: #667eea; letter-spacing: 8px; font-size: 32px;">${otp}</h1>
            </div>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            This verification code will expire in <strong>10 minutes</strong>. 
            Please do not share this code with anyone for security reasons.
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            If you didn't request this code, please ignore this email or contact our support team.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">
          
          <div style="text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              SAI Sports Talent Assessment Platform<br>
              Transforming sports talent identification with AI
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

// Send password reset confirmation email
const sendPasswordResetEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: `"SAI Sports Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Successful - SAI Sports Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #667eea; margin: 0;">SAI Sports Talent Assessment</h2>
            <p style="color: #666; margin: 5px 0;">AI-Powered Sports Talent Identification</p>
          </div>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3 style="color: #0369a1; margin: 0 0 15px 0;">Password Reset Successful</h3>
            <p style="color: #666; margin: 0;">
              Hello ${name}, your password has been reset successfully.
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            If you did not perform this action, please contact our support team immediately 
            to secure your account.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">
          
          <div style="text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              SAI Sports Talent Assessment Platform<br>
              Transforming sports talent identification with AI
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail
};