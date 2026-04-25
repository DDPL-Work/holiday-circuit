import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import API from "../../utils/Api";
import AddNewUserModal from "../../modal/AddNewUserModal";

const roleBadge = {
  "Ops Team": "bg-blue-50 text-blue-600",
  "Finance Team": "bg-yellow-50 text-yellow-600 border border-yellow-200",
  "Finance Manager": "bg-yellow-50 text-yellow-600 border border-yellow-200",
  "DMC Partner": "bg-green-50 text-green-600 border border-green-200",
  "Operation Manager": "bg-cyan-50 text-cyan-600 border border-cyan-200",
  "Super Admin": "bg-violet-50 text-violet-600 border border-violet-200",
};

const ROLE_ORDER = [
  "Super Admin",
  "Ops Team",
  "Finance Team",
  "Operation Manager",
  "Finance Manager",
  "DMC Partner",
];

const EMPTY_DIALOG = {
  open: false,
  type: "",
  user: null,
  reason: "",
};

const formatHeaderDate = (value = new Date()) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const formatRelativeTime = (value) => {
  if (!value) return "Never";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;

  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
};

const getInitial = (name = "") =>
  String(name || "").trim().charAt(0).toUpperCase() || "U";

const getRoleLabel = (user = {}) =>
  user.roleLabel || user.role || "Super Admin";

const mapApiUserToRow = (user = {}) => ({
  id: user.id || user._id,
  name: user.name || "",
  email: user.email || "",
  phone: user.phone || "",
  role: getRoleLabel(user),
  status: user.isDeleted ? "Deleted" : user.accountStatus || "Active",
  isDeleted: Boolean(user.isDeleted),
  lastLoginAt: user.lastLoginAt || null,
  lastLogin: formatRelativeTime(user.lastLoginAt),
  updatedAt: user.updatedAt || null,
  createdAt: user.createdAt || null,
  employeeId: user.employeeId || "",
  department: user.department || "",
  designation: user.designation || "",
  manager: user.manager || "",
  permissions: Array.isArray(user.permissions) ? user.permissions : [],
  accessExpiry: user.accessExpiry || "",
});

const EditIcon = () => (
  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const RestoreIcon = () => (
  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 7v6h6" />
    <path d="M21 17a8 8 0 1 1-2.34-5.66L21 13" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 5.45 5.45l1.62-1.62a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const ShieldIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const UsersIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const AddUserIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="16" y1="11" x2="22" y2="11" />
  </svg>
);

const ChevronIcon = () => (
  <svg className="w-3.5 h-3.5 text-gray-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

function ConfirmUserActionModal({
  dialog,
  submitting,
  onClose,
  onReasonChange,
  onConfirm,
}) {
  if (!dialog?.open || !dialog?.user) return null;

  const isSoftDelete = dialog.type === "soft-delete";
  const isRestore = dialog.type === "restore";
  const title = isSoftDelete
    ? "Soft Delete User"
    : isRestore
      ? "Restore User"
      : "Permanent Delete User";
  const description = isSoftDelete
    ? `This will hide ${dialog.user.name} from the active list and mark the account as deleted.`
    : isRestore
      ? `This will bring ${dialog.user.name} back into the active management list.`
      : `This will permanently delete ${dialog.user.name}. This action cannot be undone.`;
  const confirmLabel = isSoftDelete
    ? "Soft Delete"
    : isRestore
      ? "Restore"
      : "Permanent Delete";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="px-4 py-4">
          <p className="text-sm text-gray-600">{description}</p>

          {isSoftDelete ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                Deletion Reason
              </p>
              <textarea
                value={dialog.reason}
                onChange={(e) => onReasonChange(e.target.value)}
                rows={3}
                placeholder="Enter deletion reason..."
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-gray-400"
              />
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={`rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
              dialog.type === "permanent-delete"
                ? "bg-red-500 hover:bg-red-600"
                : dialog.type === "restore"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-900 hover:bg-gray-700"
            }`}
          >
            {submitting ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const currentUser = useSelector((state) => state.auth.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userActionId, setUserActionId] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(EMPTY_DIALOG);

  const fetchManagedUsers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/admin/managed-users");
      setUsers((data?.users || []).map(mapApiUserToRow));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagedUsers();
  }, []);

  useEffect(() => {
    if (!confirmDialog.open && !isAddUserModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [confirmDialog.open, isAddUserModalOpen]);

  const activeUsersList = useMemo(
    () => users.filter((user) => !user.isDeleted),
    [users],
  );

  const deletedUsersList = useMemo(
    () => users.filter((user) => user.isDeleted),
    [users],
  );

  const roleSource = statusFilter === "Deleted" ? deletedUsersList : activeUsersList;

  const roleOptions = useMemo(() => {
    const foundRoles = new Set(roleSource.map((user) => user.role).filter(Boolean));
    const ordered = ROLE_ORDER.filter((role) => foundRoles.has(role));
    const remaining = [...foundRoles]
      .filter((role) => !ROLE_ORDER.includes(role))
      .sort();
    return ["All Roles", ...ordered, ...remaining];
  }, [roleSource]);

  const filtered = useMemo(() => {
    const baseUsers =
      statusFilter === "Deleted" ? deletedUsersList : activeUsersList;

    return baseUsers.filter((user) => {
      const keyword = search.trim().toLowerCase();
      const matchSearch =
        !keyword ||
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.phone.toLowerCase().includes(keyword);
      const matchRole = roleFilter === "All Roles" || user.role === roleFilter;
      const matchStatus =
        statusFilter === "All Status" ||
        statusFilter === "Deleted" ||
        user.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [activeUsersList, deletedUsersList, roleFilter, search, statusFilter]);

  const totalUsers = activeUsersList.length;
  const activeUsers = activeUsersList.filter((user) => user.status === "Active").length;
  const operations = activeUsersList.filter((user) =>
    ["Ops Team", "Operation Manager"].includes(user.role),
  ).length;
  const dmcPartners = activeUsersList.filter(
    (user) => user.role === "DMC Partner",
  ).length;

  const managerOptions = useMemo(
    () =>
      activeUsersList
        .filter(
          (user) =>
            user.role === "Operation Manager" || user.role === "Super Admin",
        )
        .map((user) => ({
          name: user.name,
          role: user.role,
          department: user.department || "",
        })),
    [activeUsersList],
  );

  const handleCloseModal = () => {
    setIsAddUserModalOpen(false);
    setEditingUser(null);
  };

  const closeConfirmDialog = () => {
    setConfirmDialog(EMPTY_DIALOG);
  };

  const handleCreateUser = async (payload) => {
    const { data } = await API.post("/admin/managed-users", payload);
    const nextUser = mapApiUserToRow(data?.user || {});
    setUsers((prev) => [nextUser, ...prev.filter((user) => user.id !== nextUser.id)]);
    toast.success(data?.message || "User created successfully");
    return data;
  };

  const handleUpdateUser = async (payload) => {
    const { id, ...rest } = payload || {};
    const { data } = await API.patch(`/admin/managed-users/${id}`, rest);
    const nextUser = mapApiUserToRow(data?.user || {});
    setUsers((prev) =>
      prev.map((user) => (user.id === nextUser.id ? nextUser : user)),
    );
    toast.success(data?.message || "User updated successfully");
    return data;
  };

  const openSoftDeleteDialog = (user) => {
    setConfirmDialog({
      open: true,
      type: "soft-delete",
      user,
      reason: user.deletionReason || "",
    });
  };

  const openRestoreDialog = (user) => {
    setConfirmDialog({
      open: true,
      type: "restore",
      user,
      reason: "",
    });
  };

  const openPermanentDeleteDialog = (user) => {
    setConfirmDialog({
      open: true,
      type: "permanent-delete",
      user,
      reason: "",
    });
  };

  const handleConfirmUserAction = async () => {
    const user = confirmDialog.user;
    if (!user?.id) return;

    if (confirmDialog.type === "soft-delete" && !confirmDialog.reason.trim()) {
      toast.error("Deletion reason is required");
      return;
    }

    try {
      setUserActionId(user.id);

      if (confirmDialog.type === "soft-delete") {
        const { data } = await API.delete(`/admin/managed-users/${user.id}`, {
          data: { reason: confirmDialog.reason.trim() },
        });
        const nextUser = mapApiUserToRow(data?.user || {});
        setUsers((prev) =>
          prev.map((entry) => (entry.id === nextUser.id ? nextUser : entry)),
        );
        toast.success(data?.message || "User deleted successfully");
      } else if (confirmDialog.type === "restore") {
        const { data } = await API.patch(
          `/admin/managed-users/${user.id}/restore`,
        );
        const nextUser = mapApiUserToRow(data?.user || {});
        setUsers((prev) =>
          prev.map((entry) => (entry.id === nextUser.id ? nextUser : entry)),
        );
        toast.success(data?.message || "User restored successfully");
      } else if (confirmDialog.type === "permanent-delete") {
        const { data } = await API.delete(
          `/admin/managed-users/${user.id}/permanent`,
        );
        setUsers((prev) => prev.filter((entry) => entry.id !== user.id));
        toast.success(data?.message || "User permanently deleted successfully");
      }

      closeConfirmDialog();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Action failed");
    } finally {
      setUserActionId("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-sm text-gray-800">
      <div className="bg-white border-b border-gray-200 py-2 flex justify-between items-center">
        <div>
          <p className="font-semibold text-gray-800 text-sm">Users Management</p>
          <p className="text-xs text-gray-400">{formatHeaderDate()}</p>
        </div>
        <div className="text-right text-xs text-gray-400">
          Logged in as
          <br />
          <span className="font-semibold text-gray-800">
            {currentUser?.name || "Administrator"}
          </span>
        </div>
      </div>

      <div className="py-6">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">User Management</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage team members and their access permissions
            </p>
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              setIsAddUserModalOpen(true);
            }}
            className="flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <AddUserIcon />
            Add New User
          </button>
        </div>

        <div className="flex gap-2.5 mb-5">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 cursor-pointer outline-none focus:border-gray-400 transition-colors min-w-[120px]"
            >
              {roleOptions.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <ChevronIcon />
            </div>
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 cursor-pointer outline-none focus:border-gray-400 transition-colors min-w-[110px]"
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Deleted</option>
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <ChevronIcon />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3.5 mb-5">
          {[
            { label: "Total Users", value: totalUsers, iconBg: "bg-blue-50", iconColor: "text-blue-500", Icon: UsersIcon },
            { label: "Active Users", value: activeUsers, iconBg: "bg-green-50", iconColor: "text-green-500", Icon: ShieldIcon },
            { label: "Operations", value: operations, iconBg: "bg-blue-50", iconColor: "text-blue-500", Icon: ShieldIcon },
            { label: "DMC Partners", value: dmcPartners, iconBg: "bg-green-50", iconColor: "text-green-500", Icon: ShieldIcon },
          ].map(({ label, value, iconBg, iconColor, Icon }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-[11px] text-gray-400 mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                <Icon className={`w-[18px] h-[18px] ${iconColor}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-300 rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300">
                {["User", "Contact", "Role", "Status", "Last Login", "Actions"].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 tracking-wide uppercase"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                    Loading users...
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[13px] font-bold text-gray-500 shrink-0">
                          {getInitial(user.name)}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-800">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                          <MailIcon />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                          <PhoneIcon />
                          {user.phone || "-"}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                          roleBadge[user.role] || "bg-gray-50 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          user.status === "Active"
                            ? "bg-green-50 text-green-600"
                            : user.status === "Deleted"
                              ? "bg-red-50 text-red-500"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.status === "Active"
                              ? "bg-green-500"
                              : user.status === "Deleted"
                                ? "bg-red-500"
                                : "bg-gray-400"
                          }`}
                        />
                        {user.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-[12px] text-gray-400">
                      {user.lastLogin}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.isDeleted ? (
                          <>
                            <button
                              onClick={() => openRestoreDialog(user)}
                              disabled={userActionId === user.id}
                              className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-green-600 transition-colors disabled:opacity-50"
                            >
                              <RestoreIcon />
                            </button>
                            <button
                              onClick={() => openPermanentDeleteDialog(user)}
                              disabled={userActionId === user.id}
                              className="p-1.5 rounded-md text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              <TrashIcon />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setIsAddUserModalOpen(true);
                              }}
                              disabled={userActionId === user.id}
                              className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-blue-500 transition-colors disabled:opacity-50"
                            >
                              <EditIcon />
                            </button>
                            <button
                              onClick={() => openSoftDeleteDialog(user)}
                              disabled={userActionId === user.id}
                              className="p-1.5 rounded-md text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              <TrashIcon />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddUserModalOpen ? (
        <AddNewUserModal
          onClose={handleCloseModal}
          onCreateUser={handleCreateUser}
          onUpdateUser={handleUpdateUser}
          mode={editingUser ? "edit" : "create"}
          initialUser={editingUser}
          managerOptions={managerOptions}
        />
      ) : null}

      <ConfirmUserActionModal
        dialog={confirmDialog}
        submitting={Boolean(userActionId)}
        onClose={closeConfirmDialog}
        onReasonChange={(value) =>
          setConfirmDialog((prev) => ({ ...prev, reason: value }))
        }
        onConfirm={handleConfirmUserAction}
      />
    </div>
  );
}
