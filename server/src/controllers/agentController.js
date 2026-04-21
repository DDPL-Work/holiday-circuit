
import Auth from "../models/auth.model.js";
import ApiError from "../utils/ApiError.js";
import TravelQuery from "../models/TravelQuery.model.js";
import Counter from "../models/counter.model.js";
import Quotation from "../models/quotation.model.js";
import Invoice from "../models/invoice.model.js";
import Notification from "../models/notification.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendAgentRegistrationReceivedMail, sendPasswordResetOtpMail } from "../services/sendEmail.js";
import { sendAgentClientQuotationMail } from "../services/emailService.js";
import { getRoundRobinFinanceAssignee } from "../services/financeTeamScopeService.js";

const getAuthenticatedUserId = (req) => req.user?.id || req.user?._id || null;
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const INDIAN_DESTINATION_KEYWORDS = [
  "india", "delhi", "jaipur", "udaipur", "goa", "kerala", "kashmir", "agra",
  "mumbai", "pune", "bengaluru", "bangalore", "chennai", "kolkata", "hyderabad",
  "shimla", "manali", "darjeeling", "rajasthan", "himachal", "andaman", "sikkim",
  "varanasi", "amritsar", "rishikesh", "ooty", "mysore", "coorg", "nainital",
  "mussoorie", "jaisalmer", "jodhpur", "pushkar", "kochi", "munnar", "alleppey",
  "leh", "ladakh", "ahmedabad", "surat", "bhopal", "indore", "dehradun",
];

const verifyLegacyCompatiblePassword = async (inputPassword = "", storedPassword = "") => {
  const normalizedInputPassword = String(inputPassword ?? "");
  const normalizedStoredPassword = String(storedPassword ?? "");

  if (!normalizedStoredPassword) {
    return {
      isMatch: false,
      shouldUpgradeHash: false,
    };
  }

  if (BCRYPT_HASH_PATTERN.test(normalizedStoredPassword)) {
    return {
      isMatch: await bcrypt.compare(normalizedInputPassword, normalizedStoredPassword),
      shouldUpgradeHash: false,
    };
  }

  return {
    isMatch: normalizedInputPassword === normalizedStoredPassword,
    shouldUpgradeHash: normalizedInputPassword === normalizedStoredPassword,
  };
};

const formatAuthenticatedUser = (user) => ({
  id: user._id,
  name: user.name || "",
  email: user.email || "",
  role: user.role,
  companyName: user.companyName || "",
  phone: user.phone || "",
  profileImage: user.profileImage || "",
  employeeId: user.employeeId || "",
  manager: user.manager || "",
  department: user.department || "",
  designation: user.designation || "",
  permissions: Array.isArray(user.permissions) ? user.permissions : [],
  accountStatus: user.accountStatus || "Active",
  accessExpiry: user.accessExpiry || null,
});

const normalizeTravelerDocument = (document = {}) => ({
  url: String(document?.url || "").trim(),
  fileName: String(document?.fileName || "").trim(),
  mimeType: String(document?.mimeType || "").trim(),
  size: Number(document?.size || 0),
  uploadedAt: document?.uploadedAt ? new Date(document.uploadedAt) : null,
});

const getTravelerDocumentKey = (documentType = "Passport") => {
  const normalizedType = String(documentType || "").trim().toLowerCase();
  return normalizedType.includes("gov") || normalizedType.includes("id") || normalizedType.includes("aad")
    ? "governmentId"
    : "passport";
};

const normalizeTravelerDocuments = (documents = {}, legacyDocument = {}, legacyDocumentType = "Passport") => {
  const normalizedDocuments = {
    passport: normalizeTravelerDocument(documents?.passport),
    governmentId: normalizeTravelerDocument(documents?.governmentId || documents?.govtId),
  };

  const normalizedLegacyDocument = normalizeTravelerDocument(legacyDocument);

  if (
    normalizedLegacyDocument.url &&
    !normalizedDocuments.passport.url &&
    !normalizedDocuments.governmentId.url
  ) {
    normalizedDocuments[getTravelerDocumentKey(legacyDocumentType)] = normalizedLegacyDocument;
  }

  return normalizedDocuments;
};

const isIndianDestination = (destination = "") => {
  const normalizedDestination = String(destination || "").trim().toLowerCase();
  if (!normalizedDestination) return false;
  return INDIAN_DESTINATION_KEYWORDS.some((keyword) => normalizedDestination.includes(keyword));
};

const getRequiredTravelerDocumentKeys = (query = {}) => {
  const explicitQuoteCategory = String(
    query?.quoteCategory || query?.pricingSnapshot?.quoteCategory || "",
  )
    .trim()
    .toLowerCase();

  if (explicitQuoteCategory === "international") {
    return ["passport", "governmentId"];
  }

  if (explicitQuoteCategory === "domestic") {
    return ["governmentId"];
  }

  return Boolean(query?.destination) && !isIndianDestination(query.destination)
    ? ["passport", "governmentId"]
    : ["governmentId"];
};

const normalizeTravelerDetails = (travelerDetails = [], numberOfAdults = 0, numberOfChildren = 0) => {
  const normalizedAdults = Number(numberOfAdults || 0);
  const normalizedChildren = Number(numberOfChildren || 0);
  const rawTravelers = Array.isArray(travelerDetails) ? travelerDetails : [];

  const cleanedTravelers = rawTravelers
    .map((traveler) => ({
      fullName: String(traveler?.fullName || "").trim(),
      travelerType: traveler?.travelerType === "Child" ? "Child" : "Adult",
      childAge:
        traveler?.travelerType === "Child" && traveler?.childAge !== undefined && traveler?.childAge !== null
          ? Number(traveler.childAge)
          : null,
      documentType: String(traveler?.documentType || "Passport").trim() || "Passport",
      document: normalizeTravelerDocument(traveler?.document),
      documents: normalizeTravelerDocuments(traveler?.documents, traveler?.document, traveler?.documentType),
    }))
    .filter((traveler) => traveler.fullName);

  const adults = cleanedTravelers.filter((traveler) => traveler.travelerType === "Adult");
  const children = cleanedTravelers.filter((traveler) => traveler.travelerType === "Child");

  if (adults.length !== normalizedAdults || children.length !== normalizedChildren) {
    throw new ApiError(400, "Traveler details must match adult and child counts");
  }

  const hasInvalidChildAge = children.some(
    (traveler) => !Number.isInteger(traveler.childAge) || traveler.childAge < 1 || traveler.childAge > 12,
  );

  if (hasInvalidChildAge) {
    throw new ApiError(400, "Each child traveler must have an age between 1 and 12");
  }

  return [...adults, ...children];
};

const getTravelerDocumentVerification = (query = {}) => ({
  status: String(query?.travelerDocumentVerification?.status || "Draft"),
  submittedAt: query?.travelerDocumentVerification?.submittedAt || null,
  reviewedAt: query?.travelerDocumentVerification?.reviewedAt || null,
  reviewedBy: query?.travelerDocumentVerification?.reviewedBy || null,
  reviewedByName: String(query?.travelerDocumentVerification?.reviewedByName || "").trim(),
  rejectionReason: String(query?.travelerDocumentVerification?.rejectionReason || "").trim(),
  rejectionRemarks: String(query?.travelerDocumentVerification?.rejectionRemarks || "").trim(),
  issues: Array.isArray(query?.travelerDocumentVerification?.issues)
    ? query.travelerDocumentVerification.issues.map((issue) => ({
        travelerId: String(issue?.travelerId || "").trim(),
        travelerName: String(issue?.travelerName || "").trim(),
        documentKey: String(issue?.documentKey || "").trim(),
        documentLabel: String(issue?.documentLabel || "").trim(),
      }))
    : [],
});

const resetTravelerDocumentVerification = (query, status = "Draft") => {
  query.travelerDocumentVerification = {
    status,
    submittedAt: status === "Pending" ? new Date() : null,
    reviewedAt: null,
    reviewedBy: null,
    reviewedByName: "",
    rejectionReason: "",
    rejectionRemarks: "",
    issues: [],
  };
};

const getTravelerDocumentCompletion = (query = {}) => {
  const travelers = Array.isArray(query?.travelerDetails) ? query.travelerDetails : [];
  const requiredDocumentKeys = getRequiredTravelerDocumentKeys(query);
  const isInternationalTrip = requiredDocumentKeys.length === 2;

  const rows = travelers.map((traveler) => {
    const documents = normalizeTravelerDocuments(
      traveler?.documents,
      traveler?.document,
      traveler?.documentType,
    );
    const uploadedRequiredCount = requiredDocumentKeys.filter((key) => documents?.[key]?.url).length;
    return {
      id: traveler?._id || null,
      name: traveler?.fullName || "Traveler",
      isComplete: uploadedRequiredCount === requiredDocumentKeys.length,
    };
  });

  return {
    isInternationalTrip,
    requiredDocumentKeys,
    rows,
    allComplete: rows.length > 0 && rows.every((traveler) => traveler.isComplete),
  };
};

const getLatestInvoiceForQuery = async (queryId, agentId = null) => {
  const filter = { query: queryId };

  if (agentId) {
    filter.agent = agentId;
  }

  return Invoice.findOne(filter).sort({ createdAt: -1 });
};

const isPaymentVerifiedForBooking = (invoice = null) =>
  Boolean(invoice) &&
  (invoice?.paymentVerification?.status === "Verified" || invoice?.paymentStatus === "Paid");

const getAgentCommissionAmount = (quotation = null) => {
  const explicitMarkupAmount = Number(quotation?.agentMarkup?.markupAmount || 0);
  if (explicitMarkupAmount > 0) {
    return Math.round(explicitMarkupAmount);
  }

  const clientTotalAmount = Number(quotation?.clientTotalAmount || 0);
  const opsTotalAmount = Number(quotation?.pricing?.totalAmount || 0);
  return Math.max(0, Math.round(clientTotalAmount - opsTotalAmount));
};

const formatAgentFinanceTransactionId = (prefix = "TXN", value = "") => {
  const normalized = String(value || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return `${prefix}-${(normalized || "0000").slice(-6)}`;
};

const getHashedOtp = (otp = "") =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

const generateNumericOtp = () =>
  `${Math.floor(100000 + Math.random() * 900000)}`;

const formatMailDateLabel = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const buildTravelerSummary = (query = {}) => {
  const adults = Number(query?.numberOfAdults || 0);
  const children = Number(query?.numberOfChildren || 0);
  const parts = [];

  if (adults > 0) parts.push(`${adults} Adult${adults > 1 ? "s" : ""}`);
  if (children > 0) parts.push(`${children} Child${children > 1 ? "ren" : ""}`);

  return parts.join(", ") || "Traveler details pending";
};

const buildDurationLabel = (query = {}) => {
  const start = query?.startDate ? new Date(query.startDate) : null;
  const end = query?.endDate ? new Date(query.endDate) : null;

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "-";
  }

  const timeDiff = end.getTime() - start.getTime();
  const totalDays = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1);
  const totalNights = Math.max(0, totalDays - 1);

  return `${totalNights} Night${totalNights === 1 ? "" : "s"} / ${totalDays} Day${totalDays === 1 ? "" : "s"}`;
};

const buildServiceQuantityLabel = (service = {}) => {
  const details = [];

  if (Number(service?.nights || 0) > 0) details.push(`${service.nights}N`);
  if (Number(service?.days || 0) > 0) details.push(`${service.days}D`);
  if (Number(service?.rooms || 0) > 0) details.push(`${service.rooms} Room${Number(service.rooms) > 1 ? "s" : ""}`);
  if (Number(service?.pax || 0) > 0) details.push(`${service.pax} Pax`);
  if (Number(service?.passengerCapacity || 0) > 0) details.push(`${service.passengerCapacity} Pax`);
  if (service?.vehicleType) details.push(service.vehicleType);

  return details.join(" | ");
};

const buildServiceLocationLabel = (service = {}) =>
  [service?.city, service?.country].filter(Boolean).join(", ");

const buildQuotationClientEmailPayload = ({ quotation, query, agent }) => ({
  recipientName: agent?.name || "Guest",
  agencyName: agent?.companyName || "",
  quotationNumber: quotation?.quotationNumber || "",
  queryId: query?.queryId || "",
  destination: query?.destination || "",
  travelDates: `${formatMailDateLabel(query?.startDate)} - ${formatMailDateLabel(query?.endDate)}`,
  durationLabel: buildDurationLabel(query),
  travelerSummary: buildTravelerSummary(query),
  validTill: formatMailDateLabel(quotation?.validTill),
  totalAmount: Number(quotation?.clientTotalAmount || quotation?.pricing?.totalAmount || 0),
  currency: quotation?.pricing?.currency || "INR",
  services: Array.isArray(quotation?.services)
    ? quotation.services.map((service) => ({
      title: service?.title || "Service",
      typeLabel: service?.type ? String(service.type).replace(/_/g, " ") : "Travel Service",
      location: buildServiceLocationLabel(service),
      serviceDateLabel: formatMailDateLabel(service?.serviceDate),
      quantityLabel: buildServiceQuantityLabel(service),
      description: String(service?.description || "").replace(/\|/g, " | ").trim(),
    }))
    : [],
  inclusions: Array.isArray(quotation?.inclusions)
    ? quotation.inclusions.filter(Boolean)
    : [],
});


// ========================== Register Agent ==========================

export const registerAgent = async (req, res, next) => {
  try {
    const { name, email, password, companyName, gstNumber, phone } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    const existingUser = await Auth.findOne({ email: normalizedEmail });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!req.files || req.files.length === 0) {
      return next(new ApiError(400, "Documents are required"));
    }

    const documents = req.files.map((file) => file.path);
    const agentPayload = {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "agent",
      companyName,
      gstNumber,
      documents,
      phone,
      isApproved: false,
      status: "pending",
      accountStatus: "Inactive",
      reviewedAt: null,
      reviewedBy: "",
      reviewedById: "",
      rejectionReason: "",
    };

    let agent = null;
    let statusCode = 201;
    let message = "Registered successfully. Waiting for admin approval.";

    if (existingUser) {
      const canResubmit = existingUser.role === "agent" && existingUser.status === "rejected" && !existingUser.isApproved;

      if (!canResubmit) {
        return next(new ApiError(400, "Email already exists"));
      }

      Object.assign(existingUser, agentPayload);
      agent = await existingUser.save();
      statusCode = 200;
      message = "Registration resubmitted successfully. Waiting for admin approval.";
    } else {
      agent = await Auth.create(agentPayload);
    }

    const adminUsers = await Auth.find({
      role: "admin",
      isDeleted: { $ne: true },
    }).select("_id");

    if (adminUsers.length) {
      const notificationTitle = statusCode === 200 ? "Agent Registration Resubmitted" : "New Agent Registration";
      const notificationMessage = statusCode === 200
        ? `${agent.companyName || agent.name} has resubmitted registration documents for admin review.`
        : `${agent.companyName || agent.name} has submitted a new registration and is waiting for approval.`;

      await Notification.insertMany(
        adminUsers.map((adminUser) => ({
          user: adminUser._id,
          type: "warning",
          title: notificationTitle,
          message: notificationMessage,
          link: "/admin/superAdminDashboard#agent-approvals",
          meta: {
            agentId: agent._id,
            companyName: agent.companyName || "",
            agentName: agent.name || "",
            registrationStatus: "pending",
          },
        })),
      );
    }

    await sendAgentRegistrationReceivedMail(agent.email, {
      name: agent.name,
      companyName: agent.companyName,
    });

    res.status(statusCode).json({
      success: true,
      message,
      agent,
    });

  } catch (error) {
    next(error);
  }
};


// ========================== Login Agent ==========================

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password ?? "");

    const user = await Auth.findOne({ email: normalizedEmail });

    if (!user) {
      return next(new ApiError(400, "Invalid credentials"));
    }

    const { isMatch, shouldUpgradeHash } = await verifyLegacyCompatiblePassword(
      normalizedPassword,
      user.password,
    );

    if (!isMatch) {
      return next(new ApiError(400, "Invalid credentials"));
    }

    if (shouldUpgradeHash) {
      user.password = await bcrypt.hash(normalizedPassword, 10);
      await user.save();
    }

    // Only agents need approval
    if (false && user.role === "agent" && !user.isApproved) {
      return next(new ApiError(403, "Your profile is under review. You will get access within 24–48 hours."));
    }

    if (user.role === "agent") {
      if (user.status === "rejected") {
        const rejectionReason = String(user.rejectionReason || "").trim();
        return next(new ApiError(
          403,
          rejectionReason
            ? `Your registration was rejected: ${rejectionReason}. Please submit the corrected details again.`
            : "Your registration was rejected. Please submit the corrected details again.",
        ));
      }

      if (!user.isApproved || user.status === "pending") {
        return next(new ApiError(403, "Your profile is under review. You will get access after admin approval."));
      }
    }

    if (user.isDeleted) {
      return next(new ApiError(403, "Your account access has been removed. Please contact the administrator."));
    }

    if (user.accountStatus === "Inactive") {
      return next(new ApiError(403, "Your account is inactive. Please contact the administrator."));
    }

    if (user.accessExpiry && new Date(user.accessExpiry).getTime() < Date.now()) {
      return next(new ApiError(403, "Your account access has expired. Please contact the administrator."));
    }

    const token = jwt.sign(
      { id: user._id,role: user.role ,name: user.name,email: user.email },process.env.JWT_SECRET,
      { expiresIn: "5d"}
    );

    res.status(200).json({
      message: "Login successfully",
      success: true,
      token,
      role: user.role,
      user: formatAuthenticatedUser(user),
    });

  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return next(new ApiError(401, "Unauthorized"));
    }

    const user = await Auth.findById(userId);

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const phone = String(req.body?.phone || "").trim();
    const companyName = String(req.body?.companyName || "").trim();
    const profileImage = String(req.body?.profileImage || "").trim();
    const normalizedPhone = phone || undefined;

    if (!name) {
      return next(new ApiError(400, "Name is required"));
    }

    if (!email) {
      return next(new ApiError(400, "Email is required"));
    }

    if (user.role === "agent" && !companyName) {
      return next(new ApiError(400, "Company name is required for agents"));
    }

    const emailOwner = await Auth.findOne({
      email,
      _id: { $ne: userId },
    }).select("_id");

    if (emailOwner) {
      return next(new ApiError(409, "This email is already in use"));
    }

    if (normalizedPhone) {
      const phoneOwner = await Auth.findOne({
        phone: normalizedPhone,
        _id: { $ne: userId },
      }).select("_id");

      if (phoneOwner) {
        return next(new ApiError(409, "This phone number is already in use"));
      }
    }

    user.name = name;
    user.email = email;
    user.phone = normalizedPhone;
    user.profileImage = profileImage;

    if (["agent", "dmc_partner", "finance_partner"].includes(user.role)) {
      user.companyName = companyName;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: formatAuthenticatedUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const sendForgotPasswordOtp = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return next(new ApiError(400, "A valid email address is required"));
    }

    const user = await Auth.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists for this email, a verification code has been sent.",
      });
    }

    const otp = generateNumericOtp();
    user.resetPasswordOtpHash = getHashedOtp(otp);
    user.resetPasswordOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.resetPasswordOtpVerifiedAt = null;
    await user.save();

    await sendPasswordResetOtpMail(user.email, {
      name: user.name || user.companyName || "Team Member",
      otp,
    });

    res.status(200).json({
      success: true,
      message: "A 6-digit verification code has been sent to your email.",
    });
  } catch (error) {
    next(error);
  }
};

export const verifyForgotPasswordOtp = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const otp = String(req.body?.otp || "").trim();

    if (!email || !otp) {
      return next(new ApiError(400, "Email and OTP are required"));
    }

    const user = await Auth.findOne({ email });

    if (!user || !user.resetPasswordOtpHash || !user.resetPasswordOtpExpiry) {
      return next(new ApiError(400, "No active password reset request was found"));
    }

    if (user.resetPasswordOtpExpiry.getTime() < Date.now()) {
      user.resetPasswordOtpHash = "";
      user.resetPasswordOtpExpiry = null;
      user.resetPasswordOtpVerifiedAt = null;
      await user.save();
      return next(new ApiError(400, "OTP has expired. Please request a new code"));
    }

    if (getHashedOtp(otp) !== user.resetPasswordOtpHash) {
      return next(new ApiError(400, "Invalid OTP"));
    }

    user.resetPasswordOtpVerifiedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordWithOtp = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const confirmPassword = String(req.body?.confirmPassword || "");

    if (!email || !password || !confirmPassword) {
      return next(new ApiError(400, "Email, password, and confirm password are required"));
    }

    if (password.length < 6) {
      return next(new ApiError(400, "Password must be at least 6 characters"));
    }

    if (password !== confirmPassword) {
      return next(new ApiError(400, "Password and confirm password must match"));
    }

    const user = await Auth.findOne({ email });

    if (!user) {
      return next(new ApiError(404, "Account not found"));
    }

    if (!user.resetPasswordOtpVerifiedAt) {
      return next(new ApiError(400, "Verify your OTP before creating a new password"));
    }

    if (
      !user.resetPasswordOtpExpiry ||
      user.resetPasswordOtpExpiry.getTime() < Date.now()
    ) {
      user.resetPasswordOtpHash = "";
      user.resetPasswordOtpExpiry = null;
      user.resetPasswordOtpVerifiedAt = null;
      await user.save();
      return next(new ApiError(400, "OTP session expired. Please restart password recovery"));
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordOtpHash = "";
    user.resetPasswordOtpExpiry = null;
    user.resetPasswordOtpVerifiedAt = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};


/* ========================= AGENT DASHBOARD DATA ========================= */

export const getAgentDashboard = async (req, res) => {
  try {
    const agentId = getAuthenticatedUserId(req);

    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const totalQueries = await TravelQuery.countDocuments({ agent: agentId });

    const statusCounts = await TravelQuery.aggregate([
      { $match: { agent: agentId } },
      { $group: { _id: "$agentStatus", count: { $sum: 1 } } }
    ]);

    const invoices = await Invoice.find({ agent: agentId });

    res.json({
      totalQueries,
      statusCounts,
      invoices
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ========================= CREATE TRAVEL QUERY ========================= */

export const createQuery = async (req, res, next) => {
  try {
    const createLog = (action, performedBy) => ({action, performedBy, timestamp: new Date()})
    
    // ✅ Auth check
    if (!req.user || !req.user.id) {
      return next(new ApiError(401, "Unauthorized. Agent not found"));
    }

    const {
      destination,
      clientEmail,
      startDate,
      endDate,
      numberOfAdults,
      numberOfChildren,
      customerBudget,
      transportRequired,
      sightseeingRequired,
      specialRequirements,
      travelerDetails,
    } = req.body;

    // ✅ Basic validation
    if (!destination || !startDate || !endDate || !numberOfAdults) {
      return next(new ApiError(400, "Required fields are missing"));
    }

    const normalizedClientEmail = String(clientEmail || "").trim().toLowerCase();
    if (!normalizedClientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedClientEmail)) {
      return next(new ApiError(400, "A valid client email address is required"));
    }

    const normalizedAdults = Number(numberOfAdults || 0);
    const normalizedChildren = Number(numberOfChildren || 0);
    const normalizedTravelerDetails = normalizeTravelerDetails(
      travelerDetails,
      normalizedAdults,
      normalizedChildren,
    );

    /* ================= QUERY NUMBER ================= */

    let queryCounter = await Counter.findOne({ name: "query" });

    if (!queryCounter) {
      queryCounter = await Counter.create({
        name: "query",
        seq: 1000
      });
    }

    queryCounter.seq += 1;
    await queryCounter.save();

    const queryId = `QRY-${queryCounter.seq}`;


    /* ================= OPS ROUND ROBIN ================= */

    //========================= 1️⃣ get all active ops users ================================
    const opsUsers = await Auth.find({
      role: "operations",
      isApproved: true,
      isDeleted: { $ne: true },
      accountStatus: "Active",
      manager: { $exists: true, $ne: "" },
    }).sort({ createdAt: 1 });

    if (!opsUsers.length) {
      return next(new ApiError(400, "No manager-created operations executive available for query assignment"));
    }

    //===================== 2️⃣ ops counter ==========================
    let opsCounter = await Counter.findOne({ name: "ops_assign" });

    if (!opsCounter) {
      opsCounter = await Counter.create({
        name: "ops_assign",
        seq: 0
      });
    }

    //======================== 3️⃣round robin logic ========================================
    const opsIndex = opsCounter.seq % opsUsers.length;
    const assignedOps = opsUsers[opsIndex];

    opsCounter.seq += 1;
    await opsCounter.save();

    /* ================= CREATE QUERY ================= */

    const query = await TravelQuery.create({
      agent: req.user.id,
      assignedTo: assignedOps._id,   // KEY LINE
      queryId,
      destination,
      clientEmail: normalizedClientEmail,
      startDate,
      endDate,
      numberOfAdults: normalizedAdults,
      numberOfChildren: normalizedChildren,
      customerBudget,
      hotelCategory: "4 Star",
      transportRequired,
      sightseeingRequired,
      specialRequirements,
      travelerDetails: normalizedTravelerDetails,
       //  IMPORTANT
       agentStatus: "Pending",
       opsStatus: "New_Query",
  // ✅ ACTIVITY LOG
    activityLog: [
    createLog("Query Created", "Agent"),
  ]
    });

  await Notification.create({
  user: req.user.id,
  type: "info",
  title: "Query Submitted",
  message: `Your query ${query.queryId} has been created successfully.`,
  meta: {
    queryId: query._id,
    destination: query.destination,
  },
});

    return res.status(201).json({
      success: true,
      message: "Query created and assigned successfully",
      query
    });

  } catch (error) {
    next(error);
  }
};


/* ========================= VIEW OWN QUERIES ========================= */

export const getMyQueries = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const queries = await TravelQuery.find({ agent: req.user.id }).sort({ createdAt: -1 });

    return res.json({ message: "All queries fetched successfully", queries });

  } catch (error) {
    next(error);
  }
};

/* ========================= VIEW ACTIVE BOOKINGS ========================= */

export const getMyActiveBookings = async (req, res) => {
  try {
    const agentId = getAuthenticatedUserId(req);

    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const queries = await TravelQuery.find({
      agent: agentId,
      opsStatus: { $in: ["Invoice_Requested", "Confirmed", "Vouchered"] },
    })
      .sort({ startDate: 1, createdAt: -1 })
      .lean();

    if (!queries.length) {
      return res.json([]);
    }

    const queryIds = queries.map((query) => query._id);

    const [invoices, quotations] = await Promise.all([
      Invoice.find({
        agent: agentId,
        query: { $in: queryIds },
      })
        .sort({ createdAt: -1 })
        .lean(),
      Quotation.find({
        agent: agentId,
        queryId: { $in: queryIds },
      })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const latestInvoiceByQuery = invoices.reduce((acc, invoice) => {
      const key = invoice?.query ? String(invoice.query) : "";
      if (key && !acc[key]) {
        acc[key] = invoice;
      }
      return acc;
    }, {});

    const latestQuotationByQuery = quotations.reduce((acc, quotation) => {
      const key = quotation?.queryId ? String(quotation.queryId) : "";
      if (key && !acc[key]) {
        acc[key] = quotation;
      }
      return acc;
    }, {});

    const activeBookings = [];

    for (const query of queries) {
      try {
        const key = query?._id ? String(query._id) : "";
        if (!key) continue;

        const invoice = latestInvoiceByQuery[key];
        if (!invoice) continue;

        const quotation = latestQuotationByQuery[key];

        activeBookings.push({
          _id: query._id,
          queryId: query.queryId || "",
          destination: query.destination || "",
          startDate: query.startDate || null,
          endDate: query.endDate || null,
          numberOfAdults: Number(query.numberOfAdults || 0),
          numberOfChildren: Number(query.numberOfChildren || 0),
          customerBudget: Number(query.customerBudget || 0),
          specialRequirements: query.specialRequirements || "",
          travelerDetails: Array.isArray(query.travelerDetails) ? query.travelerDetails : [],
          travelerDocumentVerification: getTravelerDocumentVerification(query),
          travelerDocumentAuditTrail: Array.isArray(query.travelerDocumentAuditTrail)
            ? query.travelerDocumentAuditTrail
            : [],
          opsStatus: query.opsStatus || "",
          agentStatus: query.agentStatus || "",
          activityLog: Array.isArray(query.activityLog) ? query.activityLog : [],
          invoice: {
            _id: invoice._id,
            invoiceNumber: invoice.invoiceNumber || "",
            totalAmount: Number(invoice.totalAmount || 0),
            currency: invoice.currency || "INR",
            lineItems: Array.isArray(invoice.lineItems) ? invoice.lineItems : [],
            pricingSnapshot: invoice.pricingSnapshot || {},
            tripSnapshot: invoice.tripSnapshot || {},
            templateVariant: invoice.templateVariant || "grand-ledger",
            paymentStatus: invoice.paymentStatus || "Pending",
            remarks: invoice.remarks || "",
            paymentSubmission: invoice.paymentSubmission || {},
            paymentVerification: invoice.paymentVerification || { status: "Pending" },
            paymentAuditTrail: Array.isArray(invoice.paymentAuditTrail) ? invoice.paymentAuditTrail : [],
            createdAt: invoice.createdAt || null,
          },
          quotation: quotation
            ? {
                _id: quotation._id,
                quotationNumber: quotation.quotationNumber || "",
                clientTotalAmount: Number(quotation.clientTotalAmount || 0),
                pricingTotalAmount: Number(quotation.pricing?.totalAmount || 0),
                quoteCategory: quotation.pricing?.quoteCategory || "",
                validTill: quotation.validTill || null,
                status: quotation.status || "",
              }
            : null,
        });
      } catch (mappingError) {
        console.error("[agent/active-bookings] booking mapping failed", {
          agentId: String(agentId),
          queryMongoId: query?._id ? String(query._id) : "",
          queryId: query?.queryId || "",
          message: mappingError?.message || "Unknown mapping error",
        });
      }
    }

    res.json(activeBookings);
  } catch (error) {
    console.error("[agent/active-bookings] request failed", {
      agentId: req.user?.id || req.user?._id || "",
      message: error?.message || "Unknown error",
      stack: error?.stack || "",
    });
    res.status(500).json({ message: error.message });
  }
};

export const uploadTravelerDocument = async (req, res, next) => {
  try {
    const agentId = getAuthenticatedUserId(req);
    const { queryId, travelerId } = req.params;

    if (!agentId) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!req.file) {
      return next(new ApiError(400, "Traveler document is required"));
    }

    const query = await TravelQuery.findOne({
      _id: queryId,
      agent: agentId,
    });

    if (!query) {
      return next(new ApiError(404, "Booking not found"));
    }

    const latestInvoice = await getLatestInvoiceForQuery(query._id, agentId);
    if (!isPaymentVerifiedForBooking(latestInvoice)) {
      return next(
        new ApiError(
          400,
          "Traveler documents can be uploaded only after finance verifies the booking payment",
        ),
      );
    }

    const traveler = query.travelerDetails.id(travelerId);

    if (!traveler) {
      return next(new ApiError(404, "Traveler not found"));
    }

    const requestedDocumentType =
      String(req.body?.documentType || traveler.documentType || "Passport").trim() || "Passport";
    const documentKey = getTravelerDocumentKey(requestedDocumentType);
    const uploadedDocument = {
      url: req.file?.path || req.file?.secure_url || "",
      fileName: req.file?.originalname || req.file?.filename || "traveler-document",
      mimeType: req.file?.mimetype || "",
      size: Number(req.file?.size || 0),
      uploadedAt: new Date(),
    };
    const existingDocuments = normalizeTravelerDocuments(
      traveler.documents,
      traveler.document,
      traveler.documentType,
    );

    traveler.documentType = requestedDocumentType;
    traveler.document = uploadedDocument;
    traveler.documents = {
      ...existingDocuments,
      [documentKey]: uploadedDocument,
    };

    const currentVerification = getTravelerDocumentVerification(query);
    if (currentVerification.status !== "Draft") {
      resetTravelerDocumentVerification(query);
      query.travelerDocumentAuditTrail.push({
        action: "Traveler documents updated",
        status: "Draft",
        performedBy: agentId,
        performedByName: req.user?.name || "Agent",
        remarks: `${traveler.fullName || "Traveler"} ${requestedDocumentType} updated by agent.`,
        performedAt: new Date(),
      });
    }

    await query.save();

    res.status(200).json({
      success: true,
      message: "Traveler document uploaded successfully",
      query,
    });
  } catch (error) {
    next(error);
  }
};

export const submitTravelerDocumentsForVerification = async (req, res, next) => {
  try {
    const agentId = getAuthenticatedUserId(req);
    const { queryId } = req.params;

    if (!agentId) {
      return next(new ApiError(401, "Unauthorized"));
    }

    const query = await TravelQuery.findOne({
      _id: queryId,
      agent: agentId,
    });

    if (!query) {
      return next(new ApiError(404, "Booking not found"));
    }

    const latestInvoice = await getLatestInvoiceForQuery(query._id, agentId);
    if (!isPaymentVerifiedForBooking(latestInvoice)) {
      return next(
        new ApiError(
          400,
          "Finance must verify the booking payment before traveler documents can be submitted",
        ),
      );
    }

    const currentVerification = getTravelerDocumentVerification(query);
    if (currentVerification.status === "Pending") {
      return next(new ApiError(400, "Traveler documents are already pending ops review"));
    }

    if (currentVerification.status === "Verified") {
      return next(new ApiError(400, "Traveler documents are already verified by ops"));
    }

    const latestQuotation = await Quotation.findOne({ queryId: query._id })
      .sort({ createdAt: -1 })
      .select("pricing.quoteCategory");

    const completion = getTravelerDocumentCompletion({
      destination: query?.destination || "",
      travelerDetails: Array.isArray(query?.travelerDetails) ? query.travelerDetails : [],
      quoteCategory: latestQuotation?.pricing?.quoteCategory || "",
    });

    if (!completion.rows.length) {
      return next(new ApiError(400, "No traveler records are available for this booking"));
    }

    if (!completion.allComplete) {
      return next(
        new ApiError(
          400,
          completion.isInternationalTrip
            ? "International trips require both Passport and Govt ID for every traveler before submission"
            : "Domestic trips require at least one Govt ID upload for every traveler before submission",
        ),
      );
    }

    resetTravelerDocumentVerification(query, "Pending");
    query.activityLog.push({
      action: "Traveler Documents Submitted",
      performedBy: req.user?.name || "Agent",
      timestamp: new Date(),
    });
    query.travelerDocumentAuditTrail.push({
      action: "Submitted for ops review",
      status: "Pending",
      performedBy: agentId,
      performedByName: req.user?.name || "Agent",
      remarks: "Traveler documents submitted to operations for verification.",
      performedAt: new Date(),
    });

    await query.save();

    if (query.assignedTo) {
      await Notification.create({
        user: query.assignedTo,
        type: "info",
        title: "Traveler Documents Submitted",
        message: `${query.queryId} traveler documents are ready for ops verification.`,
        meta: {
          queryId: query._id,
          queryNumber: query.queryId,
          verificationStatus: "Pending",
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Traveler documents submitted to operations successfully",
      query,
    });
  } catch (error) {
    next(error);
  }
};

/* ========================= VIEW QUOTATION ========================= */
// Get quotations for a specific TravelQuery
export const getQuotationsByQuery = async (req, res, next) => {
  try {
    const { queryId } = req.params;

    if (!queryId) {
      return next(new ApiError(400, "Query ID is required"));
    }

    // Check if the TravelQuery exists
    const query = await TravelQuery.findById(queryId);
    if (!query) {
      return next(new ApiError(404, "Travel query not found"));
    }

    // Role-based access
    const userRole = req.user.role; // middleware se set
    const userId = req.user.id;

    if (userRole === "agent" && query.agent.toString() !== userId) {
      return next(new ApiError(403, "Forbidden: You cannot access this quotation"));
    }

    // Fetch quotations for this query
    const quotations = await Quotation.find({ queryId: query._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quotations.length,
      quotations
    });

  } catch (error) {
    next(error);
  }
};

//================ Accept Quotation by Agent ======================

export const acceptQuotationByAgent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, markupType, markupValue } = req.body;
    const agentId = getAuthenticatedUserId(req);

    if (!agentId) {
      return next(new ApiError(401, "Unauthorized"));
    }

    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return next(new ApiError(404, "Quotation not found"));
    }

    if (String(quotation.agent?._id || quotation.agent) !== String(agentId)) {
      return next(new ApiError(403, "Forbidden: You cannot modify this quotation"));
    }

    /* STEP 1: ACCEPT QUOTE */
    if (action === "ACCEPT") {
      if (quotation.status !== "Quote Sent") {
        return next(new ApiError(400, "Quote cannot be accepted"));
      }

      quotation.status = "Quote Accepted";
      await quotation.save();

      return res.json({ success: true, quotation });
    }

    /* STEP 2: APPLY MARKUP */
    if (action === "APPLY_MARKUP") {
      if (quotation.status !== "Quote Accepted") {
        return next(new ApiError(400, "Accept quote first"));
      }

      if (!markupType || markupValue <= 0) {
        return next(new ApiError(400, "Invalid markup"));
      }

      const opsTotal = quotation.pricing.totalAmount;

      const markupAmount =
  markupType === "PERCENT"
    ? Math.round((opsTotal * markupValue) / 100)
    : Math.round(markupValue);

quotation.agentMarkup = {
  type: markupType,
  value: markupValue,
  markupAmount
};

quotation.clientTotalAmount = Math.round(opsTotal + markupAmount);
      quotation.status = "Markup Applied";

      await quotation.save();

      return res.json({ success: true, quotation });
    }

    /* STEP 3: SEND TO CLIENT */
    if (action === "SEND_TO_CLIENT") {
      if (!["Quote Accepted", "Markup Applied"].includes(quotation.status)) {
        return next(new ApiError(400, "Accept quote first"));
      }

      if (
        quotation.status === "Quote Accepted" &&
        (quotation.clientTotalAmount === undefined || quotation.clientTotalAmount === null)
      ) {
        quotation.agentMarkup = {
          type: quotation.agentMarkup?.type || "AMOUNT",
          value: Number(quotation.agentMarkup?.value || 0),
          markupAmount: Number(quotation.agentMarkup?.markupAmount || 0),
        };
        quotation.clientTotalAmount = Number(
          quotation.pricing?.totalAmount || quotation.totalAmount || 0,
        );
      }

      const [query, agent] = await Promise.all([
        TravelQuery.findById(quotation.queryId),
        Auth.findById(agentId).select("name email companyName"),
      ]);

      if (!query) {
        return next(new ApiError(404, "Travel query not found"));
      }

      const requestedRecipientEmail = String(req.body?.recipientEmail || "").trim().toLowerCase();
      const recipientEmail = String(
        requestedRecipientEmail || query?.clientEmail || agent?.email || "",
      )
        .trim()
        .toLowerCase();

      if (!recipientEmail) {
        return next(new ApiError(400, "No registered email is available to send this quotation"));
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(recipientEmail)) {
        return next(new ApiError(400, "Please provide a valid recipient email"));
      }

      const emailPayload = buildQuotationClientEmailPayload({ quotation, query, agent });

      let mailResult;
      try {
        mailResult = await sendAgentClientQuotationMail(recipientEmail, emailPayload);
      } catch (mailError) {
        console.error("Client quotation email send failed:", mailError);
        return next(new ApiError(
          502,
          "Quotation email delivery failed. Please verify the recipient email and mail settings.",
        ));
      }

      quotation.status = "Sent to Client";
      await quotation.save();

      if (query.clientEmail !== recipientEmail) {
        query.clientEmail = recipientEmail;
      }

      query.activityLog = Array.isArray(query.activityLog) ? query.activityLog : [];
      query.activityLog.push({
        action: "Sent to Client",
        performedBy: req.user?.name || "Agent",
        timestamp: new Date(),
      });
      await query.save();

      return res.json({
        success: true,
        quotation,
        recipientEmail,
        mail: mailResult,
        summary: {
          quotationNumber: quotation.quotationNumber || "",
          destination: query.destination || "",
          serviceCount: Array.isArray(emailPayload.services) ? emailPayload.services.length : 0,
          inclusionCount: Array.isArray(emailPayload.inclusions) ? emailPayload.inclusions.length : 0,
          totalAmount: emailPayload.totalAmount,
          validTill: emailPayload.validTill,
        },
      });
    }

    return next(new ApiError(400, "Invalid action"));
  } catch (error) {
    next(error);
  }
};



/* ========================= REQUEST QUOTATION REVISION ========================= */

export const requestQuotationRevision = async (req, res) => {
  try {
    const agentId = getAuthenticatedUserId(req);
    const { reason = "" } = req.body;

    const quotation = await Quotation.findOne({ _id: req.params.id, agent: agentId });

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    if (!["Quote Sent", "Sent to Client"].includes(quotation.status)) {
      return res.status(400).json({
        message: "Revision can only be requested for a quote that was sent by operations or already shared with the client",
      });
    }

    quotation.status = "Revision Requested";
    quotation.agentRevisionRemark = String(reason || "").trim();
    await quotation.save();

    const query = await TravelQuery.findById(quotation.queryId);

    if (query) {
      query.agentStatus = "Revision Requested";
      query.opsStatus = "Revision_Query";
      query.quotationStatus = "Awaiting_Decision";
      query.rejectionNote = String(reason || "").trim();
      query.activityLog = query.activityLog || [];
      query.activityLog.push({
        action: "Revision Requested",
        performedBy: req.user?.name || "Agent",
        timestamp: new Date(),
      });

      await query.save();

      if (query.assignedTo) {
        await Notification.create({
          user: query.assignedTo,
          type: "warning",
          title: "Quotation Revision Requested",
          message: `Agent requested quotation changes for ${query.queryId}. Please prepare a revised quotation.`,
          link: "/ops/bookings-management",
          meta: {
            queryId: query._id,
            queryNumber: query.queryId,
            quotationId: quotation._id,
            destination: query.destination,
            revisionReason: String(reason || "").trim(),
            nextAction: "revise_quotation",
          },
        });
      }
    }

    res.json({
      success: true,
      message: "Revision requested successfully",
      quotation,
      query,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ========================= CONFIRM QUOTATION ========================= */

export const confirmQuotation = async (req, res) => {
  try {
    const agentId = getAuthenticatedUserId(req);
    const quotation = await Quotation.findOne({ _id: req.params.id, agent: agentId });

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    if (quotation.status === "Confirmed") {
      return res.status(200).json({
        success: true,
        message: "Client approval already shared with operations",
        quotation,
      });
    }

    if (quotation.status !== "Sent to Client") {
      return res.status(400).json({
        message: "Send the quotation to the client before confirming approval",
      });
    }

    quotation.status = "Confirmed";
    await quotation.save();

    const query = await TravelQuery.findById(quotation.queryId);
    if (query) {
      query.opsStatus = "Invoice_Requested";
      query.agentStatus = "Client Approved";
      query.quotationStatus = "Sent_To_Agent";
      query.activityLog = query.activityLog || [];

      const alreadyLogged = query.activityLog.some(
        (entry) => entry.action === "Client Approved",
      );

      if (!alreadyLogged) {
        query.activityLog.push({
          action: "Client Approved",
          performedBy: "Agent",
          timestamp: new Date(),
        });
      }

      await query.save();

      if (query.assignedTo) {
        await Notification.create({
          user: query.assignedTo,
          type: "info",
          title: "Client Approved Quotation",
          message: `Agent approved quotation for ${query.queryId}. Final invoice is now requested.`,
          link: "/ops/bookings-management",
          meta: {
            queryId: query._id,
            queryNumber: query.queryId,
            quotationId: quotation._id,
            destination: query.destination,
            nextAction: "generate_final_invoice",
          },
        });
      }
    }

    res.json({
      success: true,
      message: "Client approval captured and operations notified",
      quotation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAgentFinanceOverview = async (req, res) => {
  try {
    const agentId = getAuthenticatedUserId(req);

    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const invoices = await Invoice.find({ agent: agentId })
      .populate("query", "queryId destination")
      .sort({ createdAt: -1 });

    const queryIds = [...new Set(
      invoices
        .map((invoice) =>
          invoice?.query?._id ? String(invoice.query._id) : invoice?.query ? String(invoice.query) : "",
        )
        .filter(Boolean),
    )];

    const quotations = queryIds.length
      ? await Quotation.find({ agent: agentId, queryId: { $in: queryIds } })
        .select("queryId quotationNumber pricing.totalAmount agentMarkup clientTotalAmount createdAt")
        .sort({ createdAt: -1 })
      : [];

    const latestQuotationByQuery = quotations.reduce((acc, quotation) => {
      const key = quotation?.queryId ? String(quotation.queryId) : "";
      if (key && !acc[key]) {
        acc[key] = quotation;
      }
      return acc;
    }, {});

    const transactions = [];
    let currentBalance = 0;
    let pendingCommissions = 0;
    let totalEarnings = 0;

    invoices.forEach((invoice) => {
      const queryKey = invoice?.query?._id ? String(invoice.query._id) : invoice?.query ? String(invoice.query) : "";
      const bookingReference =
        String(invoice?.query?.queryId || invoice?.invoiceNumber || "").trim() || "Booking";
      const latestQuotation = latestQuotationByQuery[queryKey] || null;
      const commissionAmount = getAgentCommissionAmount(latestQuotation);
      const paymentAmount = Math.round(
        Number(invoice?.paymentSubmission?.amount || invoice?.totalAmount || 0),
      );
      const paymentDate =
        invoice?.paymentSubmission?.paymentDate ||
        invoice?.paymentSubmission?.submittedAt ||
        invoice?.paymentVerification?.reviewedAt ||
        invoice?.createdAt ||
        null;
      const financeVerified = isPaymentVerifiedForBooking(invoice);
      const paymentVerificationStatus = String(
        invoice?.paymentVerification?.status || invoice?.paymentStatus || "Pending",
      ).trim();
      const normalizedPaymentStatus = financeVerified
        ? "Success"
        : paymentVerificationStatus === "Rejected"
          ? "Rejected"
          : "Pending";

      if (commissionAmount > 0) {
        totalEarnings += commissionAmount;
        if (financeVerified) {
          currentBalance += commissionAmount;
        } else {
          pendingCommissions += commissionAmount;
        }

        transactions.push({
          id: formatAgentFinanceTransactionId(
            "COM",
            latestQuotation?.quotationNumber || invoice?.invoiceNumber || invoice?._id,
          ),
          transactionType: "commission",
          date: paymentDate,
          description: `Booking Commission (${bookingReference})`,
          amount: commissionAmount,
          direction: "credit",
          status: normalizedPaymentStatus,
        });
      }

      if (paymentAmount > 0) {
        transactions.push({
          id: formatAgentFinanceTransactionId("PAY", invoice?.invoiceNumber || invoice?._id),
          transactionType: "payment",
          date: paymentDate,
          description: `Booking Payment (${bookingReference})`,
          amount: paymentAmount,
          direction: "debit",
          status: normalizedPaymentStatus,
        });
      }
    });

    const sortedTransactions = transactions.sort((left, right) => {
      const leftTime = left?.date ? new Date(left.date).getTime() : 0;
      const rightTime = right?.date ? new Date(right.date).getTime() : 0;
      return rightTime - leftTime;
    });

    res.json({
      currency: "INR",
      summary: {
        currentBalance: Math.round(currentBalance),
        pendingCommissions: Math.round(pendingCommissions),
        totalEarnings: Math.round(totalEarnings),
      },
      transactions: sortedTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ========================= VIEW INVOICES ========================= */

export const getMyInvoices = async (req, res) => {
  try {
    const agentId = getAuthenticatedUserId(req);

    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const invoices = await Invoice.find({
      agent: agentId
    })
      .populate("query")
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ========================= UPDATE PAYMENT STATUS (OFFLINE) ========================= */

export const updatePaymentStatus = async (req, res) => {
  try {
    const agentId = getAuthenticatedUserId(req);

    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      paymentStatus,
      remarks = "",
      paymentAmount = "",
      paymentOnBehalfOf = "",
      onBehalfOf = "",
      utrNumber = "",
      bankName = "",
      paymentDate,
    } = req.body;

    const invoice = await Invoice.findOne({ _id: req.params.id, agent: agentId });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const trimmedUtr = String(utrNumber || "").trim();
    const trimmedBankName = String(bankName || "").trim();
    const trimmedRemarks = String(remarks || "").trim();
    const trimmedPaymentOnBehalfOf = String(paymentOnBehalfOf || onBehalfOf || "").trim();
    const normalizedPaymentAmount = String(paymentAmount || "").replace(/,/g, "").trim();
    const isRejectedResubmission = invoice.paymentVerification?.status === "Rejected";
    const existingReceipt = isRejectedResubmission
      ? {}
      : invoice.paymentSubmission?.receipt || {};
    const submittedPaymentAmount = Number(normalizedPaymentAmount);
    const hasPaymentAmountInput = normalizedPaymentAmount !== "";
    const fallbackPaymentAmount = Number(invoice.totalAmount || 0);
    const resolvedPaymentAmount = hasPaymentAmountInput ? submittedPaymentAmount : fallbackPaymentAmount;
    const resolvedPaymentOnBehalfOf =
      trimmedPaymentOnBehalfOf || invoice.invoiceNumber || "Booking Payment";
    const hasSubmissionFields =
      Boolean(
        trimmedUtr ||
        trimmedBankName ||
        paymentDate ||
        req.file ||
        hasPaymentAmountInput ||
        trimmedPaymentOnBehalfOf,
      );

    if (hasSubmissionFields) {
      if (!trimmedUtr || !trimmedBankName || !paymentDate) {
        return res.status(400).json({
          message: "UTR number, bank name, and payment date are required",
        });
      }

      const parsedPaymentDate = new Date(paymentDate);
      if (Number.isNaN(parsedPaymentDate.getTime())) {
        return res.status(400).json({ message: "Invalid payment date" });
      }

      if (hasPaymentAmountInput && !/^\d+$/.test(normalizedPaymentAmount)) {
        return res.status(400).json({ message: "Payment amount must be a whole number without decimals" });
      }

      if (!Number.isFinite(resolvedPaymentAmount) || resolvedPaymentAmount <= 0) {
        return res.status(400).json({ message: "Valid invoice amount is required" });
      }

      if (!req.file && !existingReceipt?.url) {
        return res.status(400).json({ message: "Payment receipt is required" });
      }

      const previousReceiptName = String(existingReceipt?.fileName || "").trim();
      const currentReceiptName = String(
        req.file?.originalname || existingReceipt?.fileName || "",
      ).trim();
      const receiptAuditMessage = req.file
        ? previousReceiptName && previousReceiptName !== currentReceiptName
          ? `Payment receipt replaced: ${currentReceiptName}`
          : `Payment receipt uploaded: ${currentReceiptName}`
        : currentReceiptName
          ? `Payment receipt retained: ${currentReceiptName}`
          : "Payment receipt attached";

      const submissionTimestamp = new Date();
      const assignedFinanceMember = await getRoundRobinFinanceAssignee({
        keepAssigneeId:
          invoice.paymentVerification?.assignedTo || invoice.paymentVerification?.reviewedBy,
      });

      invoice.paymentSubmission = {
        amount: Math.round(resolvedPaymentAmount),
        onBehalfOf: resolvedPaymentOnBehalfOf,
        utrNumber: trimmedUtr,
        bankName: trimmedBankName,
        paymentDate: parsedPaymentDate,
        receipt: {
          url: req.file?.path || existingReceipt?.url || "",
          fileName:
            req.file?.originalname || existingReceipt?.fileName || "",
          mimeType:
            req.file?.mimetype || existingReceipt?.mimeType || "",
          size: Number(req.file?.size || existingReceipt?.size || 0),
        },
        submittedAt: submissionTimestamp,
        submittedBy: agentId,
      };

      invoice.paymentVerification = {
        status: "Pending",
        assignedTo: assignedFinanceMember?._id,
        assignedToName: assignedFinanceMember?.name || "",
        assignedToEmail: assignedFinanceMember?.email || "",
        assignedAt: assignedFinanceMember ? submissionTimestamp : undefined,
        rejectionReason: "",
        rejectionRemarks: "",
        reviewedBy: undefined,
        reviewedByName: "",
        reviewedAt: undefined,
        teamDecisionStatus: "",
        teamDecisionReason: "",
        teamDecisionRemarks: "",
        teamDecisionBy: undefined,
        teamDecisionByName: "",
        teamDecisionAt: undefined,
        sentToManagerAt: undefined,
      };
      invoice.paymentStatus = "Partially Paid";
      invoice.remarks = trimmedRemarks;
      invoice.paymentUpdatedBy = agentId;
      invoice.paymentAuditTrail.push({
        action: "Submitted",
        status: "Pending",
        remarks: [
          `Declared amount: ${invoice.currency || "INR"} ${Math.round(resolvedPaymentAmount)}`,
          `On behalf of: ${resolvedPaymentOnBehalfOf}`,
          trimmedRemarks,
          receiptAuditMessage,
          assignedFinanceMember?.name
            ? `Assigned to finance: ${assignedFinanceMember.name}`
            : "",
        ].filter(Boolean).join(" | "),
        performedBy: agentId,
        performedByName: req.user?.name || req.user?.companyName || "Agent",
        performedAt: submissionTimestamp,
      });
    } else if (paymentStatus) {
      invoice.paymentStatus = paymentStatus;
      invoice.remarks = trimmedRemarks;
      invoice.paymentUpdatedBy = agentId;
    } else {
      return res.status(400).json({
        message: "No payment submission details were provided",
      });
    }

    await invoice.save();
    await invoice.populate("query");

    if (hasSubmissionFields && invoice.paymentVerification?.assignedTo) {
      await Notification.create({
        user: invoice.paymentVerification.assignedTo,
        type: "info",
        title: "Payment Verification Assigned",
        message: `${invoice.invoiceNumber} payment from ${req.user?.companyName || req.user?.name || "Agent"} is ready for review.`,
        link: "/finance/paymentVerification",
        meta: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          queryId: invoice.query?.queryId || "",
          status: invoice.paymentVerification?.status || "Pending",
          submittedAt: invoice.paymentSubmission?.submittedAt || null,
        },
      });
    }

    res.json({
      success: true,
      message: hasSubmissionFields
        ? "Payment submitted for finance verification"
        : "Payment status updated",
      invoice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




//=============================== Notification Controller ============================

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



