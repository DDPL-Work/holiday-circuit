import {MAIL_FROM_ADDRESS,MAIL_REPLY_TO_ADDRESS,transporter,} from "./mailer.js";

const escapeHtml = (value = "") =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");




export const sendAgentRegistrationReceivedMail = async (
  email,
  {
    name = "Partner",
    companyName = "your agency",
  } = {},
) => {
  await transporter.sendMail({
    from: MAIL_FROM_ADDRESS,
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
    from: MAIL_FROM_ADDRESS,
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
    supportEmail = process.env.SUPPORT_EMAIL || MAIL_REPLY_TO_ADDRESS,
  } = {},
) => {
  const safeReason = String(reason || "").trim();

  await transporter.sendMail({
    from: MAIL_FROM_ADDRESS,
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
    from: MAIL_FROM_ADDRESS,
    to: email,
    subject: "Your Holiday Circuit Password Reset Code",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      </head>
      <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter',sans-serif;">

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
          <tr>
            <td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

                <!-- Accent bar -->
                <tr>
                  <td style="background:linear-gradient(90deg,#0ea5e9,#6366f1);height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px 40px 32px;">

                    <p style="margin:0 0 28px;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;">Holiday Circuit</p>

                    <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#0f172a;line-height:1.3;">Password Reset Code</h1>
                    <p style="margin:0 0 28px;font-size:14px;line-height:1.75;color:#64748b;">
                      Hi <strong style="color:#0f172a;">${name}</strong>, use the code below to reset your password. It expires in <strong style="color:#0f172a;">10 minutes</strong>.
                    </p>

                    <!-- OTP box -->
                    <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
                      <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;">Your OTP</p>
                      <p style="margin:0;font-size:36px;font-weight:700;color:#0f172a;letter-spacing:0.22em;font-family:'Courier New',monospace;">${otp}</p>
                    </div>

                    <p style="margin:0;font-size:13px;line-height:1.75;color:#94a3b8;">
                      Didn't request this? Ignore this email — your password won't change.
                    </p>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:16px 40px;border-top:1px solid #f1f5f9;">
                    <p style="margin:0;font-size:11px;color:#cbd5e1;">© Holiday Circuit · Do not reply to this email</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>

      </body>
      </html>
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
  const safeName = escapeHtml(name);
  const safeRole = escapeHtml(role);
  const safeLoginEmail = escapeHtml(loginEmail || email);
  const safePassword = escapeHtml(password);
  const safeLoginUrl = escapeHtml(String(loginUrl || "#").trim() || "#");

  await transporter.sendMail({
    from: MAIL_FROM_ADDRESS,
    to: email,
    subject: "Holiday Circuit Workspace Credentials",
    html: `
     <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Holiday Circuit Workspace Credentials</title>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background:#eef2ff;font-family:'Inter',sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(160deg,#eef2ff 0%,#fdf4ff 50%,#fff1f2 100%);padding:48px 16px;min-height:100vh;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Top brand strip -->
          <tr>
            <td style="padding-bottom:20px;" align="center">
              <span style="font-family:'Syne',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:#7c3aed;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.18);padding:6px 16px;border-radius:30px;">
                ✦ Holiday Circuit Workspace ✦
              </span>
            </td>
          </tr>

          <!-- Hero header card -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed 0%,#a855f7 40%,#ec4899 100%);border-radius:24px 24px 0 0;padding:40px 40px 36px;position:relative;overflow:hidden;">
              <!-- Decorative circles -->
              <div style="position:absolute;top:-30px;right:-30px;width:140px;height:140px;background:rgba(255,255,255,0.07);border-radius:50%;"></div>
              <div style="position:absolute;bottom:-20px;left:60px;width:80px;height:80px;background:rgba(255,255,255,0.05);border-radius:50%;"></div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <!-- Check icon -->
                    <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:rgba(255,255,255,0.15);border:1.5px solid rgba(255,255,255,0.3);border-radius:14px;margin-bottom:20px;">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <h1 style="margin:0 0 8px;font-family:'Syne',sans-serif;font-size:34px;font-weight:800;color:#ffffff;line-height:1.15;letter-spacing:-0.02em;">
                      Your account<br/>is ready
                    </h1>
                    <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;">
                      Hello <strong style="color:#fff;font-weight:600;">${safeName}</strong>, welcome aboard.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px 28px;border-left:1px solid rgba(124,58,237,0.08);border-right:1px solid rgba(124,58,237,0.08);">

              <p style="margin:0 0 28px;font-size:14px;line-height:1.85;color:#64748b;">
                An administrator has created your <strong style="color:#1e1b4b;">Holiday Circuit</strong> workspace account. Use the credentials below to sign in.
              </p>

              <!-- Role badge row -->
              <div style="display:flex;align-items:center;margin-bottom:24px;">
                <div style="background:linear-gradient(135deg,#f5f3ff,#fdf4ff);border:1px solid rgba(124,58,237,0.15);border-radius:14px;padding:14px 20px;width:100%;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#a855f7;">Assigned Role</p>
                  <p style="margin:0;font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:#4c1d95;">${safeRole}</p>
                </div>
              </div>

              <!-- Credentials grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <!-- Login Email -->
                  <td width="48%" style="background:linear-gradient(135deg,#fff7ed,#fef3c7);border:1px solid rgba(245,158,11,0.2);border-radius:14px;padding:16px 18px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d97706;">Login Email</p>
                    <p style="margin:0;font-size:13px;font-weight:600;color:#92400e;word-break:break-all;">${safeLoginEmail}</p>
                  </td>
                  <td width="4%"></td>
                  <!-- Role info -->
                  <td width="48%" style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid rgba(16,185,129,0.2);border-radius:14px;padding:16px 18px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#059669;">Account Status</p>
                    <p style="margin:0;font-size:13px;font-weight:600;color:#065f46;">Active &amp; Ready</p>
                  </td>
                </tr>
              </table>

              <!-- Password block -->
              <div style="border-radius:18px;overflow:hidden;margin-bottom:24px;box-shadow:0 4px 24px rgba(124,58,237,0.12);">
                <div style="background:linear-gradient(135deg,#4c1d95,#6d28d9,#7c3aed);padding:12px 20px;">
                  <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.6);">Temporary Password</p>
                </div>
                <div style="background:#1e1b4b;padding:20px;text-align:center;">
                  <code style="font-size:26px;font-weight:700;letter-spacing:0.22em;color:#e9d5ff;font-family:'Courier New',monospace;">
                    ${safePassword}
                  </code>
                </div>
                <div style="background:linear-gradient(135deg,#fdf4ff,#f5f3ff);padding:10px 20px;">
                  <p style="margin:0;font-size:12px;color:#7c3aed;">Change this password on your first login for security.</p>
                </div>
              </div>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${safeLoginUrl}" style="display:inline-block;padding:15px 48px;background:linear-gradient(135deg,#7c3aed,#a855f7,#ec4899);color:#ffffff;text-decoration:none;font-family:'Syne',sans-serif;font-size:15px;font-weight:700;border-radius:14px;letter-spacing:0.04em;box-shadow:0 6px 24px rgba(124,58,237,0.35);">
                      Open Login Portal →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 18px;">
                <p style="margin:0;font-size:12px;line-height:1.8;color:#94a3b8;">
                  Not expecting this email? Please contact the Holiday Circuit admin team immediately to secure your account.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:linear-gradient(135deg,#f5f3ff,#fdf4ff);border-radius:0 0 24px 24px;padding:20px 40px;border:1px solid rgba(124,58,237,0.08);border-top:1px solid rgba(124,58,237,0.1);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:12px;color:#a78bfa;font-family:'Syne',sans-serif;font-weight:600;">Holiday Circuit</p>
                    <p style="margin:2px 0 0;font-size:11px;color:#c4b5fd;">Automated Credential Notification</p>
                  </td>
                  <td align="right">
                    <p style="margin:0;font-size:10px;color:#c4b5fd;letter-spacing:0.1em;text-transform:uppercase;">Do Not Reply</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `,
  });
};

const formatQueryMailDate = (value = "") => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatQueryMailAmount = (value = 0) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return "Not shared";

  return `INR ${Math.round(amount).toLocaleString("en-IN")}`;
};

const buildQueryInfoRow = (label, value) => `
  <tr>
    <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(label)}</td>
    <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:700;text-align:right;">${escapeHtml(value || "-")}</td>
  </tr>
`;

export const sendNewQueryAssignedMail = async (
  email,
  {
    opsName = "Operations Team",
    queryId = "",
    destination = "",
    startDate = "",
    endDate = "",
    numberOfAdults = 0,
    numberOfChildren = 0,
    customerBudget = 0,
    hotelCategory = "",
    transportRequired = false,
    sightseeingRequired = false,
    specialRequirements = "",
    agentName = "Agent",
    agentCompany = "",
    agentEmail = "",
    dashboardUrl = "",
  } = {},
) => {
  const totalTravelers = Number(numberOfAdults || 0) + Number(numberOfChildren || 0);
  const safeDashboardUrl = String(dashboardUrl || "").trim();
  const safeNotes = String(specialRequirements || "").trim();
  const inclusions = [
    transportRequired ? "Transport required" : "Transport not requested",
    sightseeingRequired ? "Sightseeing required" : "Sightseeing not requested",
  ];

  await transporter.sendMail({
    from: MAIL_FROM_ADDRESS,
    to: email,
    replyTo: MAIL_REPLY_TO_ADDRESS,
    subject: `New Query Assigned: ${queryId || destination || "Holiday Circuit"}`,
    html: `
      <div style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:680px;margin:0 auto;padding:28px 16px;">
          <div style="overflow:hidden;border-radius:22px;border:1px solid #dbeafe;background:#ffffff;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
            <div style="padding:24px 28px;background:linear-gradient(135deg,#020617 0%,#0f2a57 100%);color:#ffffff;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#bfdbfe;">Holiday Circuit</p>
              <h1 style="margin:0;font-size:26px;line-height:1.25;color:#ffffff;">New query assigned</h1>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.7;color:#cbd5e1;">Hello ${escapeHtml(opsName)}, a fresh travel query has been assigned to your queue for review and quotation planning.</p>
            </div>

            <div style="padding:24px 28px;">
              <div style="display:block;margin-bottom:18px;padding:16px 18px;border-radius:18px;background:#eff6ff;border:1px solid #bfdbfe;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#2563eb;">Query reference</p>
                <p style="margin:0;font-size:24px;font-weight:800;color:#0f172a;">${escapeHtml(queryId || "-")}</p>
                <p style="margin:6px 0 0;font-size:13px;color:#475569;">${escapeHtml(destination || "Destination pending")}</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;margin-bottom:18px;">
                ${buildQueryInfoRow("Travel dates", `${formatQueryMailDate(startDate)} - ${formatQueryMailDate(endDate)}`)}
                ${buildQueryInfoRow("Travelers", `${totalTravelers || 0} PAX (${Number(numberOfAdults || 0)} Adult${Number(numberOfAdults || 0) === 1 ? "" : "s"}, ${Number(numberOfChildren || 0)} Child${Number(numberOfChildren || 0) === 1 ? "" : "ren"})`)}
                ${buildQueryInfoRow("Budget / person", formatQueryMailAmount(customerBudget))}
                ${buildQueryInfoRow("Hotel category", hotelCategory || "Not specified")}
                ${buildQueryInfoRow("Services", inclusions.join(" | "))}
                ${buildQueryInfoRow("Agent", `${agentCompany || agentName}${agentEmail ? ` (${agentEmail})` : ""}`)}
              </table>

              <div style="padding:16px 18px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:18px;">
                <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#64748b;">Special preferences / notes</p>
                <p style="margin:0;font-size:14px;line-height:1.7;color:#334155;">${escapeHtml(safeNotes || "No special preferences shared by the agent.")}</p>
              </div>

              <div style="padding:16px 18px;border-radius:18px;background:#ecfdf5;border:1px solid #bbf7d0;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:800;color:#065f46;">Suggested next action</p>
                <p style="margin:0;font-size:13px;line-height:1.7;color:#047857;">Review the query details, validate availability, and start preparing the quotation from the operations dashboard.</p>
                ${
                  safeDashboardUrl
                    ? `<a href="${escapeHtml(safeDashboardUrl)}" style="display:inline-block;margin-top:12px;padding:11px 16px;border-radius:999px;background:#0f172a;color:#ffffff;text-decoration:none;font-size:13px;font-weight:800;">Open assigned queries</a>`
                    : ""
                }
              </div>

              <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#64748b;">This is an automated assignment email from Holiday Circuit.</p>
            </div>
          </div>
        </div>
      </div>
    `,
    text: [
      "New query assigned",
      `Query: ${queryId || "-"}`,
      `Destination: ${destination || "-"}`,
      `Travel dates: ${formatQueryMailDate(startDate)} - ${formatQueryMailDate(endDate)}`,
      `Travelers: ${totalTravelers || 0} PAX`,
      `Budget per person: ${formatQueryMailAmount(customerBudget)}`,
      `Hotel category: ${hotelCategory || "Not specified"}`,
      `Services: ${inclusions.join(" | ")}`,
      `Agent: ${agentCompany || agentName}${agentEmail ? ` (${agentEmail})` : ""}`,
      `Notes: ${safeNotes || "No special preferences shared by the agent."}`,
      safeDashboardUrl ? `Dashboard: ${safeDashboardUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
};


export const sendAgentQueryCreatedMail = async (
  email,
  {
    agentName = "Agent",
    queryId = "",
    destination = "",
    startDate = "",
    endDate = "",
    numberOfAdults = 0,
    numberOfChildren = 0,
    customerBudget = 0,
    hotelCategory = "",
    transportRequired = false,
    sightseeingRequired = false,
    specialRequirements = "",
    assignedOpsName = "Operations Team",
    dashboardUrl = "",
  } = {},
) => {
  const totalTravelers = Number(numberOfAdults || 0) + Number(numberOfChildren || 0);
  const safeDashboardUrl = String(dashboardUrl || "").trim();
  const safeNotes = String(specialRequirements || "").trim();
  const services = [
    transportRequired ? "Transport required" : "Transport not requested",
    sightseeingRequired ? "Sightseeing required" : "Sightseeing not requested",
  ];

  await transporter.sendMail({
    from: MAIL_FROM_ADDRESS,
    to: email,
    replyTo: MAIL_REPLY_TO_ADDRESS,
    subject: `Travel Query Created: ${queryId || destination || "Holiday Circuit"}`,
    html: `
      <div style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:680px;margin:0 auto;padding:28px 16px;">
          <div style="overflow:hidden;border-radius:22px;border:1px solid #bbf7d0;background:#ffffff;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
            <div style="padding:24px 28px;background:linear-gradient(135deg,#047857 0%,#0f2a57 100%);color:#ffffff;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#bbf7d0;">Holiday Circuit</p>
              <h1 style="margin:0;font-size:26px;line-height:1.25;color:#ffffff;">Travel query created</h1>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.7;color:#dcfce7;">Hello ${escapeHtml(agentName)}, your travel query has been received and assigned to our operations team.</p>
            </div>

            <div style="padding:24px 28px;">
              <div style="display:block;margin-bottom:18px;padding:16px 18px;border-radius:18px;background:#ecfdf5;border:1px solid #bbf7d0;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#047857;">Query reference</p>
                <p style="margin:0;font-size:24px;font-weight:800;color:#0f172a;">${escapeHtml(queryId || "-")}</p>
                <p style="margin:6px 0 0;font-size:13px;color:#475569;">${escapeHtml(destination || "Destination pending")}</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;margin-bottom:18px;">
                ${buildQueryInfoRow("Travel dates", `${formatQueryMailDate(startDate)} - ${formatQueryMailDate(endDate)}`)}
                ${buildQueryInfoRow("Travelers", `${totalTravelers || 0} PAX (${Number(numberOfAdults || 0)} Adult${Number(numberOfAdults || 0) === 1 ? "" : "s"}, ${Number(numberOfChildren || 0)} Child${Number(numberOfChildren || 0) === 1 ? "" : "ren"})`)}
                ${buildQueryInfoRow("Budget / person", formatQueryMailAmount(customerBudget))}
                ${buildQueryInfoRow("Hotel category", hotelCategory || "Not specified")}
                ${buildQueryInfoRow("Services", services.join(" | "))}
                ${buildQueryInfoRow("Assigned team", assignedOpsName || "Operations Team")}
              </table>

              <div style="padding:16px 18px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:18px;">
                <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#64748b;">Requirement note</p>
                <p style="margin:0;font-size:14px;line-height:1.7;color:#334155;">${escapeHtml(safeNotes || "No requirement note shared.")}</p>
              </div>

              <div style="padding:16px 18px;border-radius:18px;background:#eff6ff;border:1px solid #bfdbfe;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:800;color:#1e3a8a;">What happens next</p>
                <p style="margin:0;font-size:13px;line-height:1.7;color:#1d4ed8;">Operations will review availability and prepare the quotation. You can track the query from your agent dashboard.</p>
                ${
                  safeDashboardUrl
                    ? `<a href="${escapeHtml(safeDashboardUrl)}" style="display:inline-block;margin-top:12px;padding:11px 16px;border-radius:999px;background:#0f172a;color:#ffffff;text-decoration:none;font-size:13px;font-weight:800;">Open my queries</a>`
                    : ""
                }
              </div>

              <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#64748b;">This is an automated confirmation email from Holiday Circuit.</p>
            </div>
          </div>
        </div>
      </div>
    `,
    text: [
      "Travel query created",
      `Query: ${queryId || "-"}`,
      `Destination: ${destination || "-"}`,
      `Travel dates: ${formatQueryMailDate(startDate)} - ${formatQueryMailDate(endDate)}`,
      `Travelers: ${totalTravelers || 0} PAX`,
      `Budget per person: ${formatQueryMailAmount(customerBudget)}`,
      `Hotel category: ${hotelCategory || "Not specified"}`,
      `Services: ${services.join(" | ")}`,
      `Assigned team: ${assignedOpsName || "Operations Team"}`,
      `Notes: ${safeNotes || "No requirement note shared."}`,
      safeDashboardUrl ? `Dashboard: ${safeDashboardUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
};



export const sendAccountDeletionMail = async (
  email,
  {
    name = "Team Member",
    role = "Team Member",
    reason = "",
    supportEmail = process.env.SUPPORT_EMAIL || MAIL_REPLY_TO_ADDRESS,
  } = {},
) => {
  const safeReason = String(reason || "").trim();

  await transporter.sendMail({
    from: MAIL_FROM_ADDRESS,
    to: email,
    subject: "Your Holiday Circuit Access Has Been Removed",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
      </head>
      <body style="margin:0;padding:0;background:#0c0c0e;font-family:'DM Sans',sans-serif;">

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0c0c0e;padding:48px 16px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

                <!-- Header bar -->
                <tr>
                  <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:20px 20px 0 0;padding:32px 40px 28px;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <span style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#c9a84c;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.25);padding:5px 12px;border-radius:20px;">Holiday Circuit</span>
                        </td>
                        <td align="right">
                          <!-- Lock icon SVG -->
                          <span style="display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.25);border-radius:50%;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="3" y="11" width="18" height="11" rx="2" stroke="#ef4444" stroke-width="2"/>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Main card body -->
                <tr>
                  <td style="background:#111118;padding:40px 40px 32px;border-left:1px solid rgba(255,255,255,0.05);border-right:1px solid rgba(255,255,255,0.05);">

                    <h1 style="margin:0 0 6px;font-family:'DM Serif Display',Georgia,serif;font-size:32px;font-weight:400;color:#f1f5f9;line-height:1.2;letter-spacing:-0.01em;">
                      Access Removed
                    </h1>
                    <p style="margin:0 0 28px;font-size:13px;color:#4a5568;letter-spacing:0.04em;">Workspace access notification</p>

                    <!-- Divider -->
                    <div style="height:1px;background:linear-gradient(90deg,rgba(201,168,76,0.4),rgba(201,168,76,0),rgba(201,168,76,0));margin-bottom:28px;"></div>

                    <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#6b7280;">Hello</p>
                    <p style="margin:0 0 22px;font-size:22px;font-family:'DM Serif Display',Georgia,serif;color:#e2e8f0;">${name}</p>

                    <p style="margin:0 0 24px;font-size:14px;line-height:1.8;color:#94a3b8;">
                      An administrator has removed your access to the <strong style="color:#cbd5e1;font-weight:600;">Holiday Circuit</strong> workspace. Your role
                      <span style="display:inline-block;font-size:12px;font-weight:600;color:#c9a84c;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);padding:2px 10px;border-radius:20px;margin:0 2px;letter-spacing:0.04em;">${role}</span>
                      has been deactivated effective immediately.
                    </p>

                    ${
                      safeReason
                        ? `<!-- Reason block -->
                        <div style="background:#1a0a0a;border:1px solid rgba(239,68,68,0.2);border-left:3px solid #ef4444;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
                          <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#ef4444;">Reason Provided</p>
                          <p style="margin:0;font-size:14px;line-height:1.75;color:#fca5a5;">${safeReason}</p>
                        </div>`
                        : ""
                    }

                    <!-- Info box -->
                    <div style="background:#0e1a2e;border:1px solid rgba(99,143,210,0.15);border-radius:12px;padding:16px 20px;margin-bottom:8px;">
                      <p style="margin:0;font-size:13px;line-height:1.8;color:#6b8fd2;">
                        Think this is a mistake?
                        <a href="mailto:${supportEmail}" style="color:#c9a84c;font-weight:600;text-decoration:none;border-bottom:1px solid rgba(201,168,76,0.3);">${supportEmail}</a>
                        — we're here to help sort it out.
                      </p>
                    </div>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#0d0d14;border-radius:0 0 20px 20px;padding:20px 40px;border:1px solid rgba(255,255,255,0.05);border-top:1px solid rgba(255,255,255,0.06);">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:12px;color:#374151;">
                            © Holiday Circuit · Automated Notification
                          </p>
                        </td>
                        <td align="right">
                          <p style="margin:0;font-size:11px;color:#1f2937;letter-spacing:0.08em;text-transform:uppercase;">Do not reply</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>

      </body>
      </html>
    `,
  });
};


