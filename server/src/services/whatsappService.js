import twilio from "twilio";

const resolveClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio WhatsApp credentials are not configured.");
  }

  return twilio(accountSid, authToken);
};

const normalizeIndianPhoneNumber = (value = "") => {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length >= 11 && String(value || "").trim().startsWith("+")) return `+${digits}`;

  return `+${digits}`;
};

const DEFAULT_SELLER_BANK_DETAILS = Object.freeze([
  { label: "Bank Name", value: "HDFC Bank" },
  { label: "A/c Holder Name", value: "Holiday Circuit" },
  { label: "A/c No.", value: "50200103968171" },
  { label: "IFSC", value: "HDFC0004413" },
  { label: "Branch", value: "RAMPHAL CHOWK SEC VII DWARKA" },
]);

const DEFAULT_WHATSAPP_TERMS = Object.freeze([
  "Welcome to Leela Travels. These Terms & Conditions govern your travel booking and services.",
  "Services include travel planning, packages, transfers (Private & Shared - wait up to 30 mins), hotels & visa assistance.",
  "Booking & Payment: 25% non-refundable advance to confirm. Full payment required 30 days before departure.",
  "Cancellations: 25% (30 days before), 50% (29-16 days), 75% (15-8 days), 100% (within 7 days). Refunds in 15 days.",
  "Changes & Modifications: Administrative/service fees apply for client-requested itinerary changes.",
  "Travel Documents: Passport, visa & health documentation compliance is the client's sole responsibility.",
  "Health & Safety: Medical conditions must be declared in advance; compliance with safety rules is mandatory.",
  "Liability: Leela Travels acts as an intermediary for airlines, hotels & transporters.",
  "Accommodation Policies: Standard check-in 14:00-15:00 Hrs, check-out 11:00-12:00 Hrs.",
  "Travel Insurance: Highly recommended for medical, cancellation & personal loss coverage.",
  "Intellectual Property & Privacy: Personal data is protected and used solely for booking purposes.",
  "Governing Law: All disputes subject to New Delhi Jurisdiction only.",
  "Force Majeure: Not liable for delays/cancellations due to natural disasters, weather, or emergencies.",
  "Contact: Holiday Circuit, 2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058 | ops@holidaycircuit.com | +91 8851346665.",
  "By booking with Holiday Circuit, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.",
]);

const normalizeSellerBankDetails = (items = []) => {
  const normalizedItems = Array.isArray(items)
    ? items
      .map((item) => ({
        label: String(item?.label || "").trim(),
        value: String(item?.value || "").trim(),
      }))
      .filter((item) => item.label && item.value)
    : [];

  return normalizedItems.length ? normalizedItems : [...DEFAULT_SELLER_BANK_DETAILS];
};

const normalizeTermsAndConditions = (items = []) => {
  const normalizedItems = Array.isArray(items)
    ? items.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  return normalizedItems.length ? normalizedItems : [...DEFAULT_WHATSAPP_TERMS];
};

const buildWhatsappMessage = (quoteDetails = {}) => {
  const includeSellerBankDetails = quoteDetails?.includeSellerBankDetails !== false;
  const sellerBankDetails = normalizeSellerBankDetails(quoteDetails?.sellerBankDetails);
  const termsAndConditions = normalizeTermsAndConditions(quoteDetails?.termsAndConditions);
  const sellerBankSection = includeSellerBankDetails && sellerBankDetails.length
    ? `\n\nSeller Bank Details\n----------\n${sellerBankDetails
      .map((item) => `${item.label}: ${item.value}`)
      .join("\n")}`
    : "";
  const termsSection = termsAndConditions.length
    ? `\n\nTerms and Conditions\n----------\n${termsAndConditions
      .map((item, index) => `${index + 1}. ${item}`)
      .join("\n")}`
    : "";

  return `
*Holiday Circuit*

Dear ${quoteDetails.agentName || quoteDetails.recipientName || "Partner"},

Your travel quotation has been successfully prepared. Please review the details below.

Quotation No: ${quoteDetails.quotationNumber || "-"}
Destination: ${quoteDetails.destination || "-"}
Total Amount: INR ${Math.round(Number(quoteDetails.totalAmount || quoteDetails.price || 0)).toLocaleString("en-IN")}
Valid Until: ${quoteDetails.validTill || "-"}

${sellerBankSection}
${termsSection}

Please review the quotation and confirm at the earliest to secure availability and pricing.

Regards,
Holiday Circuit Team
`.trim();
};

export const getWhatsAppDeliveryErrorMessage = (error) => {
  const errorCode = Number(error?.code || error?.status || 0);

  if (errorCode === 63015) {
    return "WhatsApp delivery failed because this phone number has not joined the Twilio WhatsApp sandbox yet. Ask the agent to send the sandbox join code to +14155238886 first.";
  }

  if (errorCode === 21617) {
    return "WhatsApp delivery failed because the message body is too long for the current sender setup.";
  }

  return error?.message || "WhatsApp delivery failed.";
};

export const sendWhatsAppMessage = async (phoneOrQuoteDetails, maybeQuoteDetails) => {
  const quoteDetails =
    maybeQuoteDetails && typeof maybeQuoteDetails === "object"
      ? { ...maybeQuoteDetails, phone: phoneOrQuoteDetails || maybeQuoteDetails?.phone }
      : phoneOrQuoteDetails || {};

  const normalizedPhone = normalizeIndianPhoneNumber(quoteDetails?.phone);
  if (!normalizedPhone) {
    throw new Error("Agent phone number is missing for WhatsApp delivery.");
  }

  const fromNumber =
    process.env.TWILIO_WHATSAPP_FROM ||
    process.env.TWILIO_WHATSAPP_NUMBER ||
    "whatsapp:+14155238886";
  const client = resolveClient();
  const response = await client.messages.create({
    from: fromNumber,
    to: `whatsapp:${normalizedPhone}`,
    body: buildWhatsappMessage(quoteDetails),
  });

  return {
    status: "sent",
    sid: response.sid,
    to: normalizedPhone,
  };
};
