import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendAgentRegistrationReceivedMail = async (
  email,
  {
    name = "Partner",
    companyName = "your agency",
  } = {},
) => {
  await transporter.sendMail({
    from: `"Holiday Circuit" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Holiday Circuit Registration Received",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:28px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Holiday Circuit Partner Desk</p>
        <h2 style="margin:0 0 14px;font-size:28px;color:#0f172a;">Registration received</h2>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569;">Hello ${name},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#475569;">We have received the registration for <strong>${companyName}</strong>. Our admin team is reviewing your GST and KYC documents.</p>
        <div style="padding:16px 18px;border-radius:16px;background:#ffffff;border:1px solid #dbeafe;margin-bottom:18px;">
          <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#2563eb;font-weight:700;">Current status</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">Pending verification</p>
        </div>
        <p style="margin:0 0 10px;font-size:13px;line-height:1.7;color:#64748b;">You will receive another email as soon as the review is completed. If any document correction is needed, we will share the reason there as well.</p>
        <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;">Team Holiday Circuit</p>
      </div>
    `,
  });
};

export const sendAgentApprovalMail = async (
  email,
  {
    name = "Partner",
    companyName = "your agency",
    loginUrl = process.env.FRONTEND_LOGIN_URL,
  } = {},
) => {
  await transporter.sendMail({
    from: `"Holiday Circuit" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Holiday Circuit Registration Approved",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:28px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Holiday Circuit Partner Desk</p>
        <h2 style="margin:0 0 14px;font-size:28px;color:#0f172a;">Your agent account is approved</h2>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569;">Hello ${name},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#475569;">Your registration for <strong>${companyName}</strong> has been verified successfully. You can now sign in and access the Holiday Circuit agent workspace.</p>
        <a href="${loginUrl}" style="display:inline-block;padding:12px 20px;border-radius:12px;background:#0f172a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Open Agent Login</a>
        <p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#64748b;">If you face any issue while signing in, reply to this email and our team will help you out.</p>
      </div>
    `,
  });
};

export const sendAgentRejectionMail = async (
  email,
  {
    name = "Partner",
    companyName = "your agency",
    reason = "",
    supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER,
  } = {},
) => {
  const safeReason = String(reason || "").trim();

  await transporter.sendMail({
    from: `"Holiday Circuit" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Holiday Circuit Registration Needs Correction",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:28px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Holiday Circuit Partner Desk</p>
        <h2 style="margin:0 0 14px;font-size:28px;color:#0f172a;">Registration sent back for update</h2>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569;">Hello ${name},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#475569;">We reviewed the registration for <strong>${companyName}</strong>, but some details still need correction before we can activate the account.</p>
        <div style="border:1px solid #fecaca;border-radius:16px;background:#fff1f2;padding:14px 16px;margin-bottom:18px;">
          <p style="margin:0 0 6px;font-size:12px;color:#991b1b;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">Reason shared by admin</p>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#7f1d1d;">${safeReason || "Please review the submitted business details and upload the correct documents."}</p>
        </div>
        <p style="margin:0 0 12px;font-size:13px;line-height:1.7;color:#64748b;">You can submit the registration again after correcting the issue. If you need help, reach us at <a href="mailto:${supportEmail}" style="color:#0f172a;font-weight:700;text-decoration:none;">${supportEmail}</a>.</p>
        <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;">Team Holiday Circuit</p>
      </div>
    `,
  });
};

export const sendPasswordResetOtpMail = async (email, { name = "Team Member", otp = "" } = {}) => {
  await transporter.sendMail({
    from: `"Holiday Circuit" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Holiday Circuit Password Reset OTP",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:18px;border:1px solid #e2e8f0;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Holiday Circuit Workspace</p>
        <h2 style="margin:0 0 12px;font-size:26px;color:#0f172a;">Password Recovery Verification</h2>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569;">Hello ${name},</p>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">Use the following one-time password to continue resetting your Holiday Circuit workspace password. This code is valid for 10 minutes.</p>
        <div style="margin:0 0 20px;padding:18px 22px;border-radius:16px;background:#0f172a;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:0.35em;text-align:center;">
          ${otp}
        </div>
        <p style="margin:0 0 10px;font-size:13px;line-height:1.7;color:#64748b;">If you did not request this reset, you can safely ignore this email. Your existing password will remain unchanged.</p>
        <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;">Team Holiday Circuit</p>
      </div>
    `,
  });
};

export const sendTeamMemberCredentialsMail = async (
  email,
  {
    name = "Team Member",
    role = "Team Member",
    loginEmail = email,
    password = "",
    loginUrl = process.env.FRONTEND_LOGIN_URL,
  } = {},
) => {
  await transporter.sendMail({
    from: `"Holiday Circuit" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Holiday Circuit Workspace Credentials",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:28px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Holiday Circuit Workspace</p>
        <h2 style="margin:0 0 14px;font-size:28px;color:#0f172a;">Your account is ready</h2>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569;">Hello ${name},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#475569;">An administrator has created your <strong>Holiday Circuit</strong> workspace account. Use the credentials below to sign in.</p>
        <div style="border:1px solid #cbd5e1;border-radius:18px;background:#ffffff;padding:18px 20px;margin-bottom:18px;">
          <p style="margin:0 0 10px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.12em;">Assigned role</p>
          <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#0f172a;">${role}</p>
          <p style="margin:0 0 8px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.12em;">Login email</p>
          <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#0f172a;">${loginEmail}</p>
          <p style="margin:0 0 8px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.12em;">Temporary password</p>
          <div style="padding:14px 16px;border-radius:14px;background:#0f172a;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.08em;text-align:center;">
            ${password}
          </div>
        </div>
        <p style="margin:0 0 18px;font-size:13px;line-height:1.7;color:#64748b;">For security, sign in and change this password after your first login.</p>
        <a href="${loginUrl}" style="display:inline-block;padding:12px 20px;border-radius:12px;background:#0f172a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Open Login</a>
        <p style="margin:20px 0 0;font-size:12px;line-height:1.7;color:#94a3b8;">If you were not expecting this email, please contact the Holiday Circuit admin team.</p>
      </div>
    `,
  });
};

export const sendAccountDeletionMail = async (
  email,
  {
    name = "Team Member",
    role = "Team Member",
    reason = "",
    supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER,
  } = {},
) => {
  const safeReason = String(reason || "").trim();

  await transporter.sendMail({
    from: `"Holiday Circuit" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Holiday Circuit Workspace Access Removed",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:28px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Holiday Circuit Workspace</p>
        <h2 style="margin:0 0 14px;font-size:28px;color:#0f172a;">Your access has been removed</h2>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569;">Hello ${name},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#475569;">
          An administrator has removed your Holiday Circuit workspace access for the role <strong>${role}</strong>.
        </p>
        ${
          safeReason
            ? `<div style="border:1px solid #fecaca;border-radius:16px;background:#fff1f2;padding:14px 16px;margin-bottom:18px;">
                 <p style="margin:0 0 6px;font-size:12px;color:#991b1b;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">Reason</p>
                 <p style="margin:0;font-size:14px;line-height:1.7;color:#7f1d1d;">${safeReason}</p>
               </div>`
            : ""
        }
        <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;">
          If you believe this is a mistake, please reach out to the admin team at <a href="mailto:${supportEmail}" style="color:#0f172a;font-weight:700;text-decoration:none;">${supportEmail}</a>.
        </p>
        <p style="margin:18px 0 0;font-size:12px;line-height:1.7;color:#94a3b8;">Team Holiday Circuit</p>
      </div>
    `,
  });
};
