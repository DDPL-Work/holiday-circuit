import "dotenv/config";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const DEFAULT_SEND_TIMEOUT_MS = 15000;
const TEST_SENDER_ADDRESS = "Holiday Circuit <holidaycircuitofc@gmail.com>";


export const MAIL_FROM_ADDRESS =
  process.env.BREVO_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || TEST_SENDER_ADDRESS;

export const MAIL_REPLY_TO_ADDRESS =
  process.env.BREVO_REPLY_TO ||
  process.env.SUPPORT_EMAIL ||
  process.env.EMAIL_USER ||
  "holidaycircuitofc@gmail.com";

export const getEmailDeliveryErrorMessage = (error) => {
  const rawMessage = String(error?.message || "").trim();
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("api key") || normalized.includes("unauthorized")) {
    return "Email delivery failed because the Brevo API key is missing or invalid.";
  }

  if (normalized.includes("aborted") || normalized.includes("timeout") || normalized.includes("timed out")) {
    return "Email delivery failed because the mail provider did not respond in time.";
  }

  return rawMessage || "Email delivery failed due to a Brevo configuration issue.";
};

const normalizeTimeout = (value, fallback = DEFAULT_SEND_TIMEOUT_MS) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const extractEmailAndName = (value = "") => {
  const normalizedValue = String(value || "").trim();
  const bracketMatch = normalizedValue.match(/^(.*?)\s*<([^>]+)>$/);
  if (bracketMatch) {
    return {
      name: String(bracketMatch[1]).trim() || undefined,
      email: String(bracketMatch[2]).trim().toLowerCase()
    };
  }
  
  // also handle standard format without name: just email or <email>
  const looseBracketMatch = normalizedValue.match(/<([^>]+)>/);
  if (looseBracketMatch) {
    return { name: undefined, email: String(looseBracketMatch[1]).trim().toLowerCase() };
  }
  
  return { name: undefined, email: normalizedValue.toLowerCase() };
};

const normalizeFromAddress = (value = "") => {
  // Always enforce the default verified email address registered on Brevo
  // We allow overriding the name if provided, but the email must remain the verified one.
  const defaultFrom = extractEmailAndName(MAIL_FROM_ADDRESS);
  const customFrom = extractEmailAndName(String(value || "").trim());

  return { 
    name: customFrom.name || defaultFrom.name || undefined, 
    email: defaultFrom.email 
  };
};

const normalizeRecipients = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => extractEmailAndName(String(item || "").trim())).filter(r => r.email);
  }

  const normalized = extractEmailAndName(String(value || "").trim());
  return normalized.email ? [normalized] : [];
};

const normalizeAttachments = (attachments = []) => {
  if (!Array.isArray(attachments)) return undefined;

  const normalized = attachments
    .map((attachment) => {
      if (!attachment) return null;

      if (attachment.content === undefined || attachment.content === null) {
        return null;
      }

      const content =
        Buffer.isBuffer(attachment.content)
          ? attachment.content.toString("base64")
          : Buffer.from(String(attachment.content)).toString("base64");

      return {
        content,
        name: String(attachment.filename || "attachment"),
      };
    })
    .filter(Boolean);

  return normalized.length > 0 ? normalized : undefined;
};

const buildBrevoPayload = (mailOptions = {}) => {
  const to = normalizeRecipients(mailOptions.to);

  if (!to.length) {
    throw new Error("Recipient email is required");
  }

  const from = normalizeFromAddress(mailOptions.from || MAIL_FROM_ADDRESS);
  const replyTo = mailOptions.replyTo ? extractEmailAndName(mailOptions.replyTo) : extractEmailAndName(MAIL_REPLY_TO_ADDRESS);
  
  const cc = normalizeRecipients(mailOptions.cc);
  const bcc = normalizeRecipients(mailOptions.bcc);

  return {
    sender: { name: from.name || undefined, email: from.email },
    to: to.map(r => ({ name: r.name || undefined, email: r.email })),
    cc: cc.length ? cc.map(r => ({ name: r.name || undefined, email: r.email })) : undefined,
    bcc: bcc.length ? bcc.map(r => ({ name: r.name || undefined, email: r.email })) : undefined,
    replyTo: replyTo.email ? { name: replyTo.name || undefined, email: replyTo.email } : undefined,
    subject: String(mailOptions.subject || "").trim(),
    htmlContent: mailOptions.html || undefined,
    textContent: mailOptions.text || undefined,
    attachment: normalizeAttachments(mailOptions.attachments)
  };
};

const sendMail = async (mailOptions = {}) => {
  console.log("[BrevoMailer] Preparing to send email with mailOptions:", {
    to: mailOptions.to,
    from: mailOptions.from,
    subject: mailOptions.subject,
    hasHtml: !!mailOptions.html,
    hasText: !!mailOptions.text,
    attachmentsCount: mailOptions.attachments?.length || 0,
  });

  const apiKey = String(process.env.BREVO_API_KEY || "").trim();
  if (!apiKey) {
    console.error("[BrevoMailer] Error: BREVO_API_KEY is missing");
    throw new Error("BREVO_API_KEY is missing");
  }

  const payload = buildBrevoPayload(mailOptions);
  
  console.log("[BrevoMailer] Final payload sent to Brevo API:", JSON.stringify({
    ...payload,
    htmlContent: payload.htmlContent ? "[HTML CONTENT REDACTED]" : undefined,
    textContent: payload.textContent ? "[TEXT CONTENT REDACTED]" : undefined,
    attachment: payload.attachment ? `[${payload.attachment.length} ATTACHMENT(S) REDACTED]` : undefined,
  }, null, 2));

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(new Error("Brevo email request timed out")),
    normalizeTimeout(process.env.MAIL_SEND_TIMEOUT_MS),
  );

  let response;
  try {
    console.log("[BrevoMailer] Sending request to:", BREVO_API_URL);
    response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    console.error("[BrevoMailer] Network or Timeout Error during fetch:", error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  console.log("[BrevoMailer] Received response status:", response.status, response.statusText);

  let data = {};
  try {
    data = await response.json();
    console.log("[BrevoMailer] Response data:", JSON.stringify(data, null, 2));
  } catch (parseError) {
    console.warn("[BrevoMailer] Failed to parse JSON response:", parseError);
  }

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Brevo email request failed with status ${response.status}`;
    console.error("[BrevoMailer] Error response from Brevo:", errorMsg, data);
    throw new Error(errorMsg);
  }

  console.log("[BrevoMailer] Email sent successfully! MessageId:", data?.messageId);

  return {
    response: "sent",
    messageId: data?.messageId || "",
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
