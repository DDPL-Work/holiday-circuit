import Auth from "../models/auth.model.js";
import Notification from "../models/notification.model.js";

const ADMIN_MIRROR_ROLES = new Set([
  "agent",
  "operations",
  "finance_partner",
  "operation_manager",
  "finance_manager",
]);

const getActiveAdmins = async () =>
  Auth.find({
    role: "admin",
    isDeleted: { $ne: true },
    accountStatus: { $ne: "Inactive" },
  }).select("_id");

const normalizePayloads = (payloads = []) =>
  (Array.isArray(payloads) ? payloads : [payloads]).filter(Boolean);

const shouldMirrorToAdmins = ({ mirrorToAdmins = false, sourceRole = "" } = {}) =>
  Boolean(mirrorToAdmins) && ADMIN_MIRROR_ROLES.has(String(sourceRole || "").trim());

const buildMirrorTemplates = (payloads, options = {}) => {
  const explicitTemplates = normalizePayloads(options.adminPayloads);

  if (explicitTemplates.length) {
    return explicitTemplates;
  }

  return payloads.map((payload) => {
    const { user, meta = {}, ...rest } = payload;

    return {
      ...rest,
      meta: {
        ...meta,
        mirroredForAdmin: true,
        originalRecipientUserId: user || null,
      },
    };
  });
};

const buildAdminMirrorPayloads = async (payloads, options = {}) => {
  if (!shouldMirrorToAdmins(options)) {
    return [];
  }

  const adminUsers = await getActiveAdmins();
  if (!adminUsers.length) {
    return [];
  }

  const templates = buildMirrorTemplates(payloads, options);
  if (!templates.length) {
    return [];
  }

  return adminUsers.flatMap((adminUser) =>
    templates.map((template) => {
      const { meta = {}, ...rest } = template;

      return {
        user: adminUser._id,
        ...rest,
        meta: {
          ...meta,
          mirroredForAdmin: true,
          notificationSourceRole: String(options.sourceRole || "").trim(),
          notificationSourceUserId: options.sourceUserId || null,
          notificationSourceName: String(options.sourceName || "").trim(),
        },
      };
    }),
  );
};

export const createNotification = async (payload, options = {}) => {
  const [createdNotification] = await Notification.create([payload]);
  const adminPayloads = await buildAdminMirrorPayloads([payload], options);

  if (adminPayloads.length) {
    await Notification.insertMany(adminPayloads);
  }

  return createdNotification;
};

export const createNotifications = async (payloads, options = {}) => {
  const normalizedPayloads = normalizePayloads(payloads);
  if (!normalizedPayloads.length) {
    return [];
  }

  const createdNotifications = await Notification.insertMany(normalizedPayloads);
  const adminPayloads = await buildAdminMirrorPayloads(normalizedPayloads, options);

  if (adminPayloads.length) {
    await Notification.insertMany(adminPayloads);
  }

  return createdNotifications;
};
