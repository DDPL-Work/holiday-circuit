import "dotenv/config";
import * as resendMailer from "./resendMailer.js";
import * as smtpMailer from "./smtpMailer.js";

const providerMap = {
  resend: resendMailer,
  smtp: smtpMailer,
};

export const getActiveMailProvider = () => {
  const requestedProvider = String(process.env.MAIL_PROVIDER || "smtp")
    .trim()
    .toLowerCase();

  return providerMap[requestedProvider] ? requestedProvider : "smtp";
};

const activeMailer = providerMap[getActiveMailProvider()];

export const MAIL_FROM_ADDRESS = activeMailer.MAIL_FROM_ADDRESS;
export const MAIL_REPLY_TO_ADDRESS = activeMailer.MAIL_REPLY_TO_ADDRESS;
export const getEmailDeliveryErrorMessage = activeMailer.getEmailDeliveryErrorMessage;
export const createTransporter = (...args) => activeMailer.createTransporter(...args);
export const transporter = activeMailer.transporter;
