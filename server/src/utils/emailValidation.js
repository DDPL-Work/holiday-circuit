const COMMON_DOMAIN_TYPOS = new Map([
  ["mail.com", "gmail.com"],
  ["email.com", "gmail.com"],
  ["tmail.com", "gmail.com"],
  ["fmail.com", "gmail.com"],
  ["hmail.com", "gmail.com"],
  ["vmail.com", "gmail.com"],
  ["bmail.com", "gmail.com"],
  ["rmail.com", "gmail.com"],
  ["gmeil.com", "gmail.com"],
  ["gmaile.com", "gmail.com"],
  ["gamil.com", "gmail.com"],
  ["gmial.com", "gmail.com"],
  ["gnail.com", "gmail.com"],
  ["gmail.co", "gmail.com"],
  ["gmil.com", "gmail.com"],
  ["gmal.com", "gmail.com"],
  ["gmaill.com", "gmail.com"],
  ["gmail.con", "gmail.com"],
  ["yaho.com", "yahoo.com"],
  ["yhoo.com", "yahoo.com"],
  ["outlok.com", "outlook.com"],
  ["hotmial.com", "hotmail.com"],
  ["icloud.co", "icloud.com"],
]);

export const getEmailTypoSuggestion = (email = "") => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const atIndex = normalizedEmail.lastIndexOf("@");

  if (atIndex <= 0 || atIndex === normalizedEmail.length - 1) {
    return "";
  }

  const localPart = normalizedEmail.slice(0, atIndex);
  const domain = normalizedEmail.slice(atIndex + 1);
  const suggestedDomain = COMMON_DOMAIN_TYPOS.get(domain);

  if (!suggestedDomain) {
    return "";
  }

  return `${localPart}@${suggestedDomain}`;
};

export const getEmailValidationError = (email = "") => {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return "Please enter a valid email address";
  }

  const suggestion = getEmailTypoSuggestion(normalizedEmail);
  if (suggestion) {
    return `Email address looks mistyped. Did you mean ${suggestion}?`;
  }

  return "";
};
