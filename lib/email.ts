import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');
const EMAIL_FROM = process.env.EMAIL_FROM || 'Removation <no-reply@removation.ai>';

export async function sendOtpEmail(to: string, otp: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Your Removation Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333 text-align: center;">Welcome to Removation</h2>
          <p style="font-size: 16px; color: #555;">Use the following code to verify your email address:</p>
          <div style="background-color: #f9f9f9; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #000;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #999; margin-top: 20px;">This code will expire in 15 minutes.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending OTP email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception sending OTP email:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Reset your Removation Password',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="font-size: 16px; color: #555;">We received a request to reset your password. Click the button below to reset it:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #999; margin-top: 20px;">This link will expire in 15 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending reset email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception sending reset email:', error);
    return false;
  }
}
