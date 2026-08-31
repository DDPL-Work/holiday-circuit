// Default Seller Bank Details
export const DEFAULT_SELLER_BANK_DETAILS = [
  { label: "Bank Name", value: "HDFC Bank" },
  { label: "A/c Holder Name", value: "Holiday Circuit" },
  { label: "A/c No.", value: "50200103968171" },
  { label: "IFSC", value: "HDFC0004413" },
  { label: "Branch", value: "RAMPHAL CHOWK SEC VII DWARKA" },
];

// Hardcoded Terms & Conditions
export const GENERAL_TERMS_AND_CONDITIONS = [
  {
    title: "1. Introduction",
    text: `Welcome to **Leela Travels** ("we," "our," or "us"). These Terms and Conditions ("Terms") govern your use of our travel services, including bookings, tours, and related services. By using our services, you agree to comply with and be bound by these Terms.`,
  },
  {
    title: "2. Services Provided",
    text: `• **Leela Travels** offers travel planning, tour packages, transportation arrangements, accommodation bookings, travel insurance facilitation, visa assistance, and other related services.
• Customized travel itineraries are available upon request, subject to additional fees.
• Specific service details will be outlined in individual agreements.
• We provide both private transfers and shared transfers:
  - **Private Transfers**: Exclusive transportation for the client or group point to point until and unless specified. Any delays caused by the client may result in additional charges.
  - **Shared Transfers**: Transportation shared with other travelers, operating on fixed schedules. Delays or cancellations due to other passengers are not our responsibility **(Guest might have to wait upto 30 Mins)**`,
  },
  {
    title: "3. Booking and Payment",
    text: `1. All bookings are subject to availability and confirmation at the time of Booking Advance Payment
2. Non-Refundable deposit of 25% is required to confirm your booking.
3. Full payment must be made by 30 Days before the commencement of the tour.
4. Payments can be made via UPI/Bank Transfers/Cash- **Delhi Only/Credit Card with additional 2.5 % Surcharge**/ Cheques- **Subject to realization.**
5. Late payments may incur additional charges or result in cancellation of booking.`,
  },
  {
    title: "4. Cancellations and Refunds",
    text: `1. Cancellations must be made in writing at least 10 Day prior to Departure.
2. Cancellation fees apply as follows:
   - a) 25 % if canceled 30 days before departure
   - b) 50 % if canceled 29-16 days before departure
   - c) 75 % if canceled 15-08 days before departure
   - d) 100% if canceled within 07 days before departure
   - e) No refund if canceled less than 07 days before departure
3. Refunds will be processed within 15 business days.
4. Certain bookings (e.g., flights, special events) may be non-refundable or subject to specific cancellation terms.**`,
  },
  {
    title: "5. Changes and Modifications",
    text: `1. We reserve the right to modify or cancel tours due to unforeseen circumstances, including but not limited to weather conditions, natural disasters, or political instability.
2. If changes occur, we will offer alternative arrangements or a refund at our discretion.
3. Clients requesting changes to their booking may incur administrative/Service fees.`,
  },
  {
    title: "6. Travel Documents and Requirements",
    text: `1. Clients are responsible for obtaining valid passports, visas, and any other required travel documents.
2. We are not liable for any travel disruptions due to incomplete or incorrect documentation.
3. Clients must comply with all customs, immigration, and health regulations of the destination country.`,
  },
  {
    title: "7. Health and Safety",
    text: `1. Clients must inform us of any medical conditions, allergies, or special requirements prior to booking.
2. We reserve the right to refuse participation if health and safety are at risk.
3. Clients must adhere to local health and safety guidelines, including vaccination requirements.`,
  },
  {
    title: "8. Liability",
    text: `**Leela Travels** acts as an intermediary between you and service providers such as airlines, hotels, and tour operators. We are not liable for any actions, omissions, or negligence on the part of these service providers.`,
  },
  {
    title: "9. Accommodation Policies",
    text: `**Standard check-in time is 1400-1500 Hrs , and standard check-out time is 1100-1200 Hrs. Early check-in and late check-out requests are subject to availability and may incur additional charges.**`,
  },
  {
    title: "10. Travel Insurance",
    text: `1. Travel Insurance is highly recommended and is the responsibility of the client.
2. Insurance should cover trip cancellations, medical expenses, personal liability, and loss of belongings.`,
  },
  {
    title: "11. Intellectual Property",
    text: `1. All content, logos, and materials provided by us are our intellectual property and may not be used without permission.
2. Unauthorized use of our intellectual property may result in legal action.`,
  },
  {
    title: "12. Governing Law",
    text: `1. These Terms are governed by the laws of New Delhi Jurisdiction.
2. Any disputes will be resolved in the courts of New Delhi Jurisdiction.`,
  },
  {
    title: "13. Privacy Policy",
    text: `1. We are committed to protecting your privacy. Personal data collected will be used solely for booking and communication purposes.
2. We do not share your personal information with third parties without your consent, except where required by law.`,
  },
  {
    title: "14. Force Majeure",
    text: `1. We are not liable for failure to perform our obligations due to events beyond our control, including but not limited to natural disasters, war, terrorism, and pandemics.`,
  },
  {
    title: "15. Changes to Terms and Conditions",
    text: `We reserve the right to update and modify these Terms and Conditions at any time. Please review them periodically for changes. Your continued use of our services after any modifications indicates your acceptance of the updated Terms.`,
  },
  {
    title: "16. Contact Information",
    text: `**For any inquiries, please contact us at: Leela Travels** KG 3/101, Ground Floor, Vikas Puri, New Delhi -110018, Near UK Nursing Home, Email id - ops@leelatravels.com +91 8851346665, +91 9971706003`,
  },
  {
    title: "17. Acknowledgment",
    text: `By booking with **DDLC Company**, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.`,
  },
];

export const DEFAULT_INCLUSIONS = [
  "Stay as mentioned above or in Similar hotels",
  "Meals as mentioned in the Itinerary",
  "Enterances only as mentioned in Itinerary",
  "Transport as per Itinerary - Point to Point Basis",
  "Taxes as on Date",
];

export const DEFAULT_EXCLUSIONS = [
  "Airfare",
  "Early Check and Late Check out charges",
  "Personal Expenses - Room Service, Laundry, Porterage or Mini Bar etc",
  "Hotel Security Deposit - Refundable at time of checkout",
  "TCS and GST - 2 and 5 % (if not Included)",
  "Any services not mentioned above",
  "Visa Fees if not added in Inclusions",
  "Travel Insurance - recommended",
];

export const toDisplayList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n|,|•/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const getPackageDurationDetails = (pkg = {}, query = {}) => {
  const startDate = query?.startDate ? new Date(query.startDate) : null;
  const endDate = query?.endDate ? new Date(query.endDate) : null;
  if (
    startDate &&
    endDate &&
    !Number.isNaN(startDate.getTime()) &&
    !Number.isNaN(endDate.getTime()) &&
    endDate > startDate
  ) {
    const nights = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
    return {
      nights,
      days: nights + 1,
      label: `${nights} Nights / ${nights + 1} Days`,
    };
  }

  const rawDuration = String(pkg?.duration || query?.duration || "").trim();
  const nightsMatch = rawDuration.match(/(\d+)\s*(?:n|nights?)/i);
  const daysMatch = rawDuration.match(/(\d+)\s*(?:d|days?)/i);
  const nights = Number(nightsMatch?.[1] || pkg?.nights || pkg?.numberOfNights || query?.numberOfNights || query?.nights || 0);
  const days = Number(daysMatch?.[1] || pkg?.days || pkg?.numberOfDays || query?.numberOfDays || query?.days || 0);

  return {
    nights,
    days: days || (nights ? nights + 1 : 0),
    label: nights
      ? `${nights} Nights / ${days || nights + 1} Days`
      : (rawDuration || "Duration on Request"),
  };
};

export const getTransportUsageLabel = (transport = {}) => {
  const value = String(
    transport?.usageType ||
    transport?.usage ||
    transport?.transportUsageLabel ||
    transport?.transportUsageOptionKey ||
    transport?.transferType ||
    transport?.serviceType ||
    ""
  ).trim();
  const normalized = value.toLowerCase().replace(/[_\s]+/g, "-");
  const labels = {
    "one-way-airport-transfer": "One Way / Airport Transfer",
    "inter-hotel-transfer": "Inter Hotel Transfer",
    "full-day": "Full Day",
    "half-day": "Half Day",
    "round-trip": "Round Trip",
  };
  return labels[normalized] || value.replace(/-/g, " ");
};
