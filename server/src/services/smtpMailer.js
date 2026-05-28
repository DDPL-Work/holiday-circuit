import "dotenv/config";
import nodemailer from "nodemailer";

const DEFAULT_FROM_ADDRESS = "Holiday Circuit <support@holidaycircuit.com>";

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  return ["true", "1", "yes", "y", "on"].includes(normalized);
};

const normalizePort = (value, fallback = 587) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildTransportConfig = () => {
  const service =
    String(process.env.SMTP_SERVICE || "").trim() ||
    String(process.env.EMAIL_SERVICE || "").trim();
  const host =
    String(process.env.SMTP_HOST || "").trim() ||
    String(process.env.EMAIL_HOST || "").trim();
  const port = normalizePort(
    process.env.SMTP_PORT || process.env.EMAIL_PORT,
    587,
  );
  const secure = parseBoolean(
    process.env.SMTP_SECURE || process.env.EMAIL_SECURE,
    port === 465,
  );
  const user =
    String(process.env.SMTP_USER || "").trim() ||
    String(process.env.EMAIL_USER || "").trim();
  const pass =
    String(process.env.SMTP_PASS || "").trim() ||
    String(process.env.EMAIL_PASS || "").trim();

  const config = {
    auth: user || pass ? { user, pass } : undefined,
  };

  if (service) {
    config.service = service;
    config.secure = secure;
    return config;
  }

  config.host = host;
  config.port = port;
  config.secure = secure;
  return config;
};

const getMailConfigError = () => {
  const service =
    String(process.env.SMTP_SERVICE || "").trim() ||
    String(process.env.EMAIL_SERVICE || "").trim();
  const host =
    String(process.env.SMTP_HOST || "").trim() ||
    String(process.env.EMAIL_HOST || "").trim();
  const user =
    String(process.env.SMTP_USER || "").trim() ||
    String(process.env.EMAIL_USER || "").trim();
  const pass =
    String(process.env.SMTP_PASS || "").trim() ||
    String(process.env.EMAIL_PASS || "").trim();

  if (!user || !pass) {
    return new Error("SMTP credentials are missing. Set SMTP_USER and SMTP_PASS.");
  }

  if (!service && !host) {
    return new Error("SMTP host is missing. Set SMTP_HOST or SMTP_SERVICE.");
  }

  return null;
};

export const MAIL_FROM_ADDRESS =
  String(process.env.SMTP_FROM_EMAIL || "").trim() ||
  String(process.env.EMAIL_FROM || "").trim() ||
  String(process.env.EMAIL_USER || "").trim() ||
  DEFAULT_FROM_ADDRESS;

export const MAIL_REPLY_TO_ADDRESS =
  String(process.env.SMTP_REPLY_TO || "").trim() ||
  String(process.env.SUPPORT_EMAIL || "").trim() ||
  String(process.env.EMAIL_USER || "").trim() ||
  MAIL_FROM_ADDRESS;

export const getEmailDeliveryErrorMessage = (error) => {
  const rawMessage = String(error?.message || "").trim();
  const normalized = rawMessage.toLowerCase();

  if (
    normalized.includes("auth") ||
    normalized.includes("invalid login") ||
    normalized.includes("username and password not accepted")
  ) {
    return "Email delivery failed because the SMTP username or password is invalid.";
  }

  if (
    normalized.includes("enotfound") ||
    normalized.includes("eai_again") ||
    normalized.includes("connection timeout") ||
    normalized.includes("timed out")
  ) {
    return "Email delivery failed because the SMTP server could not be reached.";
  }

  if (
    normalized.includes("self signed certificate") ||
    normalized.includes("certificate") ||
    normalized.includes("ssl")
  ) {
    return "Email delivery failed because the SMTP SSL/TLS settings do not match the mail server.";
  }

  if (
    normalized.includes("recipient") ||
    normalized.includes("no recipients defined") ||
    normalized.includes("mailbox unavailable")
  ) {
    return "Email delivery failed because the recipient email address is invalid or rejected.";
  }

  if (normalized.includes("smtp credentials are missing")) {
    return "Email delivery failed because SMTP credentials are not configured.";
  }

  if (normalized.includes("smtp host is missing")) {
    return "Email delivery failed because SMTP host details are not configured.";
  }

  return rawMessage || "Email delivery failed due to an SMTP configuration issue.";
};

export const createTransporter = () => ({
  sendMail: async (mailOptions = {}) => {
    const configError = getMailConfigError();
    if (configError) {
      throw configError;
    }

    const transport = nodemailer.createTransport(buildTransportConfig());
    return transport.sendMail(mailOptions);
  },
});

export const transporter = createTransporter();
