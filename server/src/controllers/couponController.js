import mongoose from "mongoose";
import Auth from "../models/auth.model.js";
import Coupon from "../models/coupon.model.js";
import Notification from "../models/notification.model.js";
import ApiError from "../utils/ApiError.js";
import { generateUniqueCouponCode } from "../services/couponCodeService.js";
import { sendCouponEmail } from "../services/emailService.js";

const ACTIVE_AGENT_FILTER = {
  role: "agent",
  isDeleted: { $ne: true },
  accountStatus: "Active",
  status: "approve",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ensureAdmin = (req) => {
  if (req.user?.role !== "admin") {
    throw new ApiError(403, "Only super admins can manage coupons");
  }
};

const formatDisplayDate = (value) => {
  if (!value) return "Never";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-GB");
};

const isCouponSent = (coupon) =>
  Boolean(coupon?.lastSentAt) || Number(coupon?.sentCount || 0) > 0;

const isCouponExpired = (coupon) => {
  if (!coupon?.endDate) return false;
  const end = new Date(coupon.endDate);
  if (Number.isNaN(end.getTime())) return false;
  end.setHours(23, 59, 59, 999);
  return end < new Date();
};

const isCouponScheduled = (coupon) => {
  if (!coupon?.startDate) return false;
  const start = new Date(coupon.startDate);
  if (Number.isNaN(start.getTime())) return false;
  return start > new Date();
};

const isCouponRedeemed = (coupon) => Boolean(coupon?.redeemedAt || coupon?.redeemedByInvoice);

const isCouponUsageExhausted = (coupon) =>
  Boolean(coupon?.usageLimit) && Number(coupon?.usageCount || 0) >= Number(coupon?.usageLimit || 0);

const getCouponRemainingUses = (coupon) => {
  if (isCouponRedeemed(coupon)) return 0;
  if (!coupon?.usageLimit) return null;
  return Math.max(Number(coupon.usageLimit || 0) - Number(coupon.usageCount || 0), 0);
};

const getCouponStatus = (coupon) => {
  if (isCouponRedeemed(coupon)) return "used";
  if (isCouponUsageExhausted(coupon)) return "expired";
  if (isCouponExpired(coupon)) return "expired";
  if (isCouponScheduled(coupon)) return "scheduled";
  return "active";
};

const couponNotificationFilter = {
  $or: [
    { "meta.kind": "coupon" },
    { "meta.couponId": { $exists: true } },
    { title: "New Coupon Shared" },
  ],
};

const formatCoupon = (coupon) => ({
  status: getCouponStatus(coupon),
  isActive: getCouponStatus(coupon) === "active",
  isExpired: isCouponExpired(coupon),
  isScheduled: isCouponScheduled(coupon),
  isRedeemed: isCouponRedeemed(coupon),
  isUsageExhausted: isCouponUsageExhausted(coupon),
  isSent: isCouponSent(coupon),
  remainingUses: getCouponRemainingUses(coupon),
  id: coupon._id,
  code: coupon.code || "",
  discount: coupon.discountLabel || "",
  discountType: coupon.discountType || "",
  discountValue: Number(coupon.discountValue || 0),
  description: coupon.description || "",
  startDate: coupon.startDate ? formatDisplayDate(coupon.startDate) : "Not set",
  startDateValue: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 10) : "",
  endDate: coupon.endDate ? formatDisplayDate(coupon.endDate) : "Never",
  endDateValue: coupon.endDate ? new Date(coupon.endDate).toISOString().slice(0, 10) : "",
  users: coupon.usageLimit ? String(coupon.usageLimit) : "Unlimited",
  usageLimit: coupon.usageLimit || null,
  usageCount: Number(coupon.usageCount || 0),
  email: coupon.assignedAgentEmail || "",
  assignedAgentId: coupon.assignedAgent || "",
  assignedAgentName: coupon.assignedAgentName || "",
  sentCount: Number(coupon.sentCount || 0),
  lastSentAt: coupon.lastSentAt ? formatDisplayDate(coupon.lastSentAt) : "",
  lastSentAtValue: coupon.lastSentAt ? new Date(coupon.lastSentAt).toISOString() : "",
  redeemedAt: coupon.redeemedAt ? formatDisplayDate(coupon.redeemedAt) : "",
  redeemedAtValue: coupon.redeemedAt ? new Date(coupon.redeemedAt).toISOString() : "",
  redeemedInvoiceId: coupon.redeemedByInvoice || null,
  redeemedInvoiceNumber: coupon.redeemedInvoiceNumber || "",
  createdAt: coupon.createdAt ? new Date(coupon.createdAt).toISOString() : "",
});

const formatAgentOption = (agent) => ({
  id: agent._id,
  name: agent.name || "",
  companyName: agent.companyName || "",
  email: agent.email || "",
  label: agent.companyName || agent.name || agent.email || "Agent",
});

const parseDiscountInput = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) {
    throw new ApiError(400, "Discount is required");
  }

  const numericValue = Number.parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new ApiError(400, "Enter a valid discount like 20% or Rs500");
  }

  if (raw.includes("%")) {
    if (numericValue > 100) {
      throw new ApiError(400, "Percentage discount cannot exceed 100%");
    }

    return {
      discountType: "percentage",
      discountValue: Number(numericValue.toFixed(2)),
      discountLabel: `${Number(numericValue.toFixed(2))}%`,
    };
  }

  const roundedValue = Number(numericValue.toFixed(2));
  return {
    discountType: "flat",
    discountValue: roundedValue,
    discountLabel: `INR ${Math.round(roundedValue).toLocaleString("en-IN")}`,
  };
};

const parseUsageLimitInput = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw || /^unlimited$/i.test(raw)) return null;

  const parsed = Number.parseInt(raw.replace(/[^\d]/g, ""), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, "Usage must be a positive number or Unlimited");
  }

  return parsed;
};

const parseDateInput = (value = "") => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, "Please provide a valid date");
  }

  return parsed;
};

const getAgentBySelection = async ({ assignedAgentId = "", email = "" } = {}) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (assignedAgentId && mongoose.Types.ObjectId.isValid(assignedAgentId)) {
    const agent = await Auth.findOne({
      _id: assignedAgentId,
      ...ACTIVE_AGENT_FILTER,
    }).select("name companyName email");

    if (agent) return agent;
  }

  if (!normalizedEmail || !emailPattern.test(normalizedEmail)) {
    throw new ApiError(400, "Please select a valid approved agent email");
  }

  const agent = await Auth.findOne({
    email: normalizedEmail,
    ...ACTIVE_AGENT_FILTER,
  }).select("name companyName email");

  if (!agent) {
    throw new ApiError(404, "Approved active agent not found for this email");
  }

  return agent;
};

const buildCouponPayload = async (req, existingCoupon = null) => {
  const code = String(req.body?.code || "").trim().toUpperCase();
  const description = String(req.body?.description || "").trim();
  const startDate = parseDateInput(req.body?.startDate || "");
  const endDate = parseDateInput(req.body?.endDate || "");

  if (!code) {
    throw new ApiError(400, "Coupon code is required");
  }

  if (endDate && startDate && endDate < startDate) {
    throw new ApiError(400, "End date cannot be earlier than start date");
  }

  const duplicateCoupon = await Coupon.findOne({
    code,
    ...(existingCoupon ? { _id: { $ne: existingCoupon._id } } : {}),
  }).select("_id");

  if (duplicateCoupon) {
    throw new ApiError(400, "A coupon with this code already exists");
  }

  const agent = await getAgentBySelection({
    assignedAgentId: req.body?.assignedAgentId || existingCoupon?.assignedAgent || "",
    email: req.body?.email || existingCoupon?.assignedAgentEmail || "",
  });

  const discountMeta = parseDiscountInput(req.body?.discount || existingCoupon?.discountLabel || "");
  const usageLimit = parseUsageLimitInput(
    req.body?.usage ?? req.body?.users ?? existingCoupon?.usageLimit ?? "",
  );

  return {
    code,
    ...discountMeta,
    description,
    startDate,
    endDate,
    usageLimit,
    assignedAgent: agent._id,
    assignedAgentName: agent.companyName || agent.name || "",
    assignedAgentEmail: String(agent.email || "").trim().toLowerCase(),
    updatedBy: req.user?.id || null,
  };
};

export const generateCouponCode = async (req, res, next) => {
  try {
    ensureAdmin(req);

    const code = await generateUniqueCouponCode();

    res.status(200).json({
      success: true,
      data: {
        code,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminCoupons = async (req, res, next) => {
  try {
    ensureAdmin(req);

    const [coupons, agents] = await Promise.all([
      Coupon.find().sort({ createdAt: -1 }),
      Auth.find(ACTIVE_AGENT_FILTER)
        .select("name companyName email")
        .sort({ companyName: 1, name: 1, email: 1 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        coupons: coupons.map(formatCoupon),
        agents: agents.map(formatAgentOption),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    ensureAdmin(req);

    const payload = await buildCouponPayload(req);
    const coupon = await Coupon.create({
      ...payload,
      createdBy: req.user?.id || null,
    });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: {
        coupon: formatCoupon(coupon),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    ensureAdmin(req);

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return next(new ApiError(404, "Coupon not found"));
    }

    const payload = await buildCouponPayload(req, coupon);

    Object.assign(coupon, payload);
    await coupon.save();

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: {
        coupon: formatCoupon(coupon),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    ensureAdmin(req);

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return next(new ApiError(404, "Coupon not found"));
    }

    await coupon.deleteOne();

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
      data: {
        id: req.params.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const sendCouponToAgent = async (req, res, next) => {
  try {
    ensureAdmin(req);

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return next(new ApiError(404, "Coupon not found"));
    }

    const agent = await Auth.findOne({
      _id: coupon.assignedAgent,
      ...ACTIVE_AGENT_FILTER,
    }).select("name companyName email");

    if (!agent?.email) {
      return next(new ApiError(400, "Assigned agent email is missing or inactive"));
    }

    await sendCouponEmail(agent.email, {
      agentName: agent.companyName || agent.name || "Agent",
      code: coupon.code,
      discount: coupon.discountLabel,
      description: coupon.description,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      usageLimit: coupon.usageLimit,
    });

    const sentAt = new Date();
    coupon.lastSentAt = sentAt;
    coupon.lastSentBy = req.user?.id || null;
    coupon.sentCount = Number(coupon.sentCount || 0) + 1;
    await coupon.save();

    await Notification.create({
      user: agent._id,
      type: "info",
      title: "New Coupon Shared",
      message: `${coupon.code} has been shared with your account. Use it while making your payment.`,
      link: "/agent/bookings",
      meta: {
        kind: "coupon",
        couponId: coupon._id,
        code: coupon.code,
        discount: coupon.discountLabel,
        description: coupon.description,
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        usageLimit: coupon.usageLimit,
        sentAt,
      },
    });

    res.status(200).json({
      success: true,
      message: "Coupon sent to agent successfully",
      data: {
        coupon: formatCoupon(coupon),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAgentCoupons = async (req, res, next) => {
  try {
    if (req.user?.role !== "agent") {
      throw new ApiError(403, "Only agents can view coupon inbox");
    }

    const coupons = await Coupon.find({
      assignedAgent: req.user?.id,
      $or: [{ lastSentAt: { $ne: null } }, { sentCount: { $gt: 0 } }],
    }).sort({ lastSentAt: -1, createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      user: req.user?.id,
      isRead: false,
      ...couponNotificationFilter,
    });

    const formattedCoupons = coupons.map(formatCoupon);

    res.status(200).json({
      success: true,
      data: {
        coupons: formattedCoupons,
        unreadCount,
        totalCount: formattedCoupons.length,
        activeCount: formattedCoupons.filter((coupon) => coupon.isActive).length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markAgentCouponNotificationsRead = async (req, res, next) => {
  try {
    if (req.user?.role !== "agent") {
      throw new ApiError(403, "Only agents can update coupon inbox");
    }

    await Notification.updateMany(
      {
        user: req.user?.id,
        isRead: false,
        ...couponNotificationFilter,
      },
      { isRead: true },
    );

    res.status(200).json({
      success: true,
      message: "Coupon notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};
