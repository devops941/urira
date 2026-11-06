import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { ENV } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;
export let lastSentOtpForTesting: string | null = null;

const resolveLogoPath = (): string | null => {
  const possiblePaths = [
    path.resolve(process.cwd(), 'assets/logo.png'),
    path.resolve(process.cwd(), 'server/assets/logo.png'),
    path.resolve(process.cwd(), '../mobile/assets/images/logo.png'),
    path.resolve(process.cwd(), 'mobile/assets/images/logo.png'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
};

const getTransporter = (): nodemailer.Transporter => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      secure: ENV.SMTP_PORT === 465,
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
};

export const sendOtpNotification = async (
  recipient: string,
  otp: string,
  purpose: 'REGISTRATION' | 'PASSWORD_RESET',
  channel: 'EMAIL' | 'SMS' = 'EMAIL'
): Promise<void> => {
  lastSentOtpForTesting = otp;
  const isRegistration = purpose === 'REGISTRATION';
  const actionText = isRegistration ? 'Account Verification' : 'Password Reset';
  const headingText = isRegistration ? 'Verify Your Email' : 'Reset Your Password';
  const subText = isRegistration
    ? 'Welcome to <strong>UYIRA</strong>! Please enter the 6-digit verification code below to verify your email and activate your health account.'
    : 'We received a request to reset your <strong>UYIRA</strong> account password. Enter the 6-digit code below to set a new password.';

  // Always log to console for instant developer feedback
  console.log(`\n======================================================`);
  console.log(`🏥 [UYIRA Auth Verification Service]`);
  console.log(`To: ${recipient} (${channel})`);
  console.log(`Purpose: ${actionText}`);
  console.log(`OTP Code: [ ${otp} ] (Valid for ${ENV.OTP_EXPIRES_IN_MINUTES} minutes)`);
  console.log(`======================================================\n`);

  if (!ENV.SMTP_USER || !ENV.SMTP_PASS) {
    console.warn('⚠️ SMTP_USER or SMTP_PASS not set. Email not dispatched to inbox.');
    return;
  }

  try {
    const mailClient = getTransporter();
    const logoFile = resolveLogoPath();

    const attachments = logoFile
      ? [
          {
            filename: false as any,
            path: logoFile,
            contentType: 'image/png',
            contentDisposition: 'inline' as const,
            cid: 'uyiralogo',
          },
        ]
      : [];

    const logoHtml = logoFile
      ? `<div style="background-color: #FFFFFF; display: inline-block; padding: 10px 22px; border-radius: 999px; margin-bottom: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.12);">
           <img src="cid:uyiralogo" alt="UYIRA" style="width: 130px; height: auto; max-height: 48px; display: block;" />
         </div>`
      : `<h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 3px;">UYIRA</h1>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${actionText}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <!-- Hidden Inbox Preview Text -->
        <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #FFFFFF; opacity: 0;">
          Your UYIRA verification code is ${otp}. Use this code to ${isRegistration ? 'activate your health account' : 'reset your password'}.
        </div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F1F5F9; padding: 40px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #E2E8F0;">
                
                <!-- Brand Header -->
                <tr>
                  <td align="center" style="background-color: #12372A; padding: 36px 24px 28px 24px;">
                    ${logoHtml}
                    <p style="color: #A7F3D0; margin: 0; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
                      Smart Health &amp; Wellness Monitoring
                    </p>
                  </td>
                </tr>

                <!-- Main Body -->
                <tr>
                  <td style="padding: 36px 32px 28px 32px;">
                    <h2 style="color: #0F2922; font-size: 22px; font-weight: 800; margin: 0 0 14px; text-align: center; letter-spacing: -0.3px;">
                      ${headingText}
                    </h2>
                    
                    <p style="color: #475569; font-size: 15px; line-height: 24px; margin: 0 0 28px; text-align: center;">
                      ${subText}
                    </p>

                    <!-- OTP Code Card -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 26px;">
                      <tr>
                        <td align="center" style="background-color: #F0FDF4; border: 2px dashed #86EFAC; border-radius: 16px; padding: 22px 16px;">
                          <span style="font-family: 'Courier New', Courier, monospace, sans-serif; color: #12372A; font-size: 38px; font-weight: 800; letter-spacing: 12px; display: inline-block; margin-left: 12px;">
                            ${otp}
                          </span>
                        </td>
                      </tr>
                    </table>

                    <!-- Expiration Notice -->
                    <p style="color: #64748B; font-size: 13px; text-align: center; margin: 0 0 24px; font-weight: 500;">
                      ⏱️ This code will expire in <strong style="color: #12372A;">${ENV.OTP_EXPIRES_IN_MINUTES} minutes</strong>.
                    </p>

                    <!-- Security Alert Box -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; padding: 14px 16px; margin-bottom: 8px;">
                      <tr>
                        <td>
                          <p style="color: #334155; font-size: 12px; line-height: 18px; margin: 0;">
                             <strong>Security Warning:</strong> Never share this OTP with anyone. The UYIRA team will never ask for your verification code. If you did not make this request, please ignore this email.
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 20px;">
                    <p style="color: #94A3B8; font-size: 12px; line-height: 18px; margin: 0 0 6px;">
                      Sent securely by <strong>UYIRA Health Platform</strong>
                    </p>
                    <p style="color: #CBD5E1; font-size: 11px; margin: 0;">
                      &copy; ${new Date().getFullYear()} UYIRA Health. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const info = await mailClient.sendMail({
      from: `"${ENV.FROM_NAME}" <${ENV.SMTP_FROM || ENV.SMTP_USER}>`,
      to: recipient,
      subject: `UYIRA Health — Your ${actionText} Code: ${otp}`,
      html: htmlContent,
      attachments,
    });

    console.log(`✅ Branded verification email successfully delivered to ${recipient} [MessageID: ${info.messageId}]`);
  } catch (error) {
    console.error(`❌ Failed to send verification email to ${recipient}:`, error);
  }
};
