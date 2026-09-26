export const ALLOWED_PERMISSIONS = Object.freeze([
  // General
  "View",
  "Edit",
  "Export",
  "Delete",

  // Administration & Governance
  "Override",
  "Manage Users",
  "System Config",

  // Operations & Queries
  "Manage Booking",
  "Create Query",
  "Query Create",
  "Add Query",

  // Finance & Invoicing
  "Approve Payments",
  "Reject Payment",
  "Submit Invoice",
  "Manage Verifications",

  // Discounts & Coupons
  "Manage Discounts",
  "Discounts & Coupons",
  "Discount",
]);

export const ROLE_DEFAULT_PERMISSIONS = Object.freeze({
  admin: [
    "View",
    "Edit",
    "Export",
    "Override",
    "Delete",
    "Manage Users",
    "Manage Discounts",
    "Approve Payments",
    "Create Query",
    "System Config",
  ],
  operation_manager: [
    "View",
    "Edit",
    "Export",
    "Manage Booking",
    "Create Query",
    "Manage Discounts",
  ],
  ops_team: [
    "View",
    "Edit",
    "Export",
    "Manage Booking",
    "Create Query",
  ],
  finance_manager: [
    "View",
    "Export",
    "Approve Payments",
    "Reject Payment",
    "Manage Verifications",
  ],
  finance_team: [
    "View",
    "Export",
    "Approve Payments",
    "Reject Payment",
  ],
  dmc: [
    "View",
    "Edit",
    "Export",
    "Submit Invoice",
  ],
  agent: [
    "View",
    "Manage Booking",
    "Discount",
  ],
});

export const isValidPermission = (permission) =>
  typeof permission === "string" && ALLOWED_PERMISSIONS.includes(permission.trim());

export const validatePermissionsList = (permissions = []) => {
  if (!Array.isArray(permissions)) return [];
  return permissions.filter((p) => isValidPermission(p));
};
