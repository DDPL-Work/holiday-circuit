const RESEND_API_URL = "https://api.resend.com/emails";
const TEST_SENDER_ADDRESS = "Holiday Circuit <onboarding@resend.dev>";
const PERSONAL_SENDER_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "me.com",
  "aol.com",
]);

export const MAIL_FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL || TEST_SENDER_ADDRESS;

export const MAIL_REPLY_TO_ADDRESS =
  process.env.RESEND_REPLY_TO ||
  process.env.SUPPORT_EMAIL ||
  process.env.EMAIL_USER ||
  "support@holidaycircuit.com";

export const getEmailDeliveryErrorMessage = (error) => {
  const rawMessage = String(error?.message || "").trim();
  const normalized = rawMessage.toLowerCase();

  if (
    normalized.includes("resend.dev") ||
    normalized.includes("403") ||
    normalized.includes("verify a domain") ||
    normalized.includes("your own email address")
  ) {
    return "Email delivery failed because Resend test sender is restricted. Verify your domain in Resend and update RESEND_FROM_EMAIL to that domain.";
  }

  if (
    normalized.includes("verified domain") ||
    normalized.includes("domain is not verified") ||
    normalized.includes("domain mismatch")
  ) {
    return "Email delivery failed because RESEND_FROM_EMAIL is not using a verified Resend domain.";
  }

  if (normalized.includes("api key")) {
    return "Email delivery failed because the Resend API key is missing or invalid.";
  }

  if (normalized.includes("recipient")) {
    return "Email delivery failed because the recipient email address is invalid or rejected.";
  }

  return rawMessage || "Email delivery failed due to a Resend configuration issue.";
};

const extractEmailAddress = (value = "") => {
  const normalizedValue = String(value || "").trim();
  const bracketMatch = normalizedValue.match(/<([^>]+)>/);
  return String(bracketMatch?.[1] || normalizedValue).trim().toLowerCase();
};

const normalizeFromAddress = (value = "") => {
  const normalizedValue = String(value || "").trim();
  const emailAddress = extractEmailAddress(normalizedValue);
  const domain = emailAddress.split("@")[1] || "";

  if (!emailAddress) {
    return TEST_SENDER_ADDRESS;
  }

  if (domain === "resend.dev") {
    return normalizedValue || TEST_SENDER_ADDRESS;
  }

  if (PERSONAL_SENDER_DOMAINS.has(domain)) {
    return TEST_SENDER_ADDRESS;
  }

  return normalizedValue;
};

const normalizeRecipients = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  const normalized = String(value || "").trim();
  return normalized ? [normalized] : [];
};

const normalizeAttachments = (attachments = []) =>
  Array.isArray(attachments)
    ? attachments
        .map((attachment) => {
          if (!attachment) return null;

          if (attachment.path) {
            return {
              path: String(attachment.path),
              filename: String(attachment.filename || "attachment"),
              contentType: attachment.contentType || undefined,
              contentId: attachment.contentId || undefined,
            };
          }

          if (attachment.content === undefined || attachment.content === null) {
            return null;
          }

          const content =
            Buffer.isBuffer(attachment.content)
              ? attachment.content.toString("base64")
              : Buffer.from(String(attachment.content)).toString("base64");

          return {
            content,
            filename: String(attachment.filename || "attachment"),
            contentType: attachment.contentType || undefined,
            contentId: attachment.contentId || undefined,
          };
        })
        .filter(Boolean)
    : [];

const buildResendPayload = (mailOptions = {}) => {
  const to = normalizeRecipients(mailOptions.to);

  if (!to.length) {
    throw new Error("Recipient email is required");
  }

  return {
    from: normalizeFromAddress(mailOptions.from || MAIL_FROM_ADDRESS),
    to,
    cc: normalizeRecipients(mailOptions.cc),
    bcc: normalizeRecipients(mailOptions.bcc),
    replyTo: mailOptions.replyTo || undefined,
    subject: String(mailOptions.subject || "").trim(),
    html: mailOptions.html || undefined,
    text: mailOptions.text || undefined,
    attachments: normalizeAttachments(mailOptions.attachments),
    headers: mailOptions.headers || undefined,
  };
};

const sendMail = async (mailOptions = {}) => {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing");
  }

  const payload = buildResendPayload(mailOptions);

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "holiday-circuit-mailer/1.0",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Resend email request failed with status ${response.status}`,
    );
  }

  return {
    response: "sent",
    messageId: data?.id || "",
    accepted: payload.to,
    rejected: [],
    pending: [],
    data,
  };
};

export const createTransporter = () => ({
  sendMail,
});

export const transporter = createTransporter();
