import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Activity, AlertCircle, BookOpen, Check, FileText, Loader2, ReceiptText, Send, UserRound, X } from "lucide-react";
import API from "../../utils/Api";

const TABS = ["Overview", "Queries", "Bookings", "Vouchers", "Reports"];

const permissionsFallback = [
  "Manage all users and roles",
  "View and modify contracted rates",
  "Full booking management access",
  "Order acceptance and processing",
  "Voucher generation and management",
  "Confirmation number entry",
  "Payment verification",
  "Internal invoice management",
];

const statIconMap = {
  "Pending Queries": { icon: AlertCircle, iconBg: "bg-amber-100 text-amber-700" },
  "Active Bookings": { icon: BookOpen, iconBg: "bg-blue-100 text-blue-700" },
  "Vouchers Generated": { icon: ReceiptText, iconBg: "bg-teal-100 text-teal-700" },
  "Pending Actions": { icon: FileText, iconBg: "bg-rose-100 text-rose-700" },
};

const statusClassMap = {
  New: "bg-blue-100 text-blue-700",
  Accepted: "bg-green-100 text-green-700",
  Confirmed: "bg-teal-100 text-teal-700",
  Vouchered: "bg-amber-100 text-amber-700",
  Sent: "bg-green-100 text-green-700",
  Generated: "bg-teal-100 text-teal-700",
  Ready: "bg-amber-100 text-amber-700",
  Booking_Accepted: "bg-green-100 text-green-700",
  Invoice_Requested: "bg-amber-100 text-amber-700",
  ConfirmedBooking: "bg-teal-100 text-teal-700",
  "New Query": "bg-blue-100 text-blue-700",
  "Pending Accept": "bg-slate-100 text-slate-700",
  "Revision Query": "bg-violet-100 text-violet-700",
  Rejected: "bg-rose-100 text-rose-700",
  "Quote Sent": "bg-sky-100 text-sky-700",
  "Client Approved": "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Draft: "bg-orange-100 text-orange-700",
  Submitted: "bg-indigo-100 text-indigo-700",
  "Voucher Ready": "bg-teal-100 text-teal-700",
  Closed: "bg-slate-200 text-slate-700",
  "Awaiting Ops": "bg-slate-100 text-slate-600",
  "In Progress": "bg-cyan-100 text-cyan-700",
  "Invoice Requested": "bg-amber-100 text-amber-700",
  "Finance Pending": "bg-amber-100 text-amber-700",
  "Admin Reply Pending": "bg-orange-100 text-orange-700",
};

const getStageBadgeClass = (status) => statusClassMap[status] || "bg-slate-100 text-slate-700";

const getRecentQueryPresentation = (query) => {
  const opsStage = String(query?.opsStage || "");

  if (opsStage === "Accepted") {
    return {
      label: "Booking Accepted",
      pill: "Accepted",
      pillClass: "bg-blue-100 text-blue-700",
      iconBg: "bg-green-100 text-green-700",
      icon: "✓",
    };
  }

  if (opsStage === "Confirmed") {
    return {
      label: "Confirmation Entered",
      pill: "Confirmed",
      pillClass: "bg-cyan-100 text-cyan-700",
      iconBg: "bg-teal-100 text-teal-700",
      icon: "✦",
    };
  }

  if (opsStage === "Vouchered") {
    return {
      label: "Voucher Generated",
      pill: "Vouchered",
      pillClass: "bg-green-100 text-green-700",
      iconBg: "bg-amber-100 text-amber-700",
      icon: "◈",
    };
  }

  if (opsStage === "Revision Query") {
    return {
      label: "Revision Requested",
      pill: "Revision",
      pillClass: "bg-violet-100 text-violet-700",
      iconBg: "bg-violet-100 text-violet-700",
      icon: "R",
    };
  }

  if (opsStage === "Rejected") {
    return {
      label: "Query Rejected",
      pill: "Rejected",
      pillClass: "bg-rose-100 text-rose-700",
      iconBg: "bg-rose-100 text-rose-700",
      icon: "X",
    };
  }

  return {
    label: "New Query",
    pill: "New",
    pillClass: "bg-violet-100 text-violet-700",
    iconBg: "bg-blue-100 text-blue-700",
    icon: "✉",
  };
};

function StatCard({ label, value, change, changeUp }) {
  const config = statIconMap[label] || statIconMap["Pending Actions"];
  const Icon = config.icon;

  return (
    <div className="cursor-default rounded-xl border border-gray-100 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${config.iconBg}`}>
          <Icon size={15} />
        </div>
      </div>
      <div className="mt-1 text-3xl font-medium leading-none text-gray-800">{value}</div>
      <div className={`mt-1 text-xs ${changeUp ? "text-green-600" : "text-red-500"}`}>{change}</div>
    </div>
  );
}

function PerformanceBars({ rows = [], animate }) {
  return (
    <div className="divide-y divide-gray-100">
      {rows.map((row, index) => (
        <div key={`${row.label}-${index}`} className="p-4">
          <div className="mb-2 flex justify-between">
            <span className="text-xs text-gray-400">{row.label}</span>
            <span className="text-sm font-medium text-gray-700">{row.value}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${row.color || "bg-blue-500"} transition-all duration-1000 ease-out`}
              style={{ width: animate ? `${row.width || 0}%` : "0%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniBarChart({ bars = [], color, animate }) {
  const max = Math.max(...bars, 1);

  return (
    <div className="mt-3 flex h-10 items-end gap-1">
      {bars.map((value, index) => (
        <div
          key={`${color}-${index}`}
          className={`flex-1 rounded-t ${color} transition-all duration-700 ease-out`}
          style={{
            height: animate ? `${Math.max(6, Math.round((value / max) * 40))}px` : "0px",
            opacity: index === bars.length - 1 ? 1 : 0.4,
            transitionDelay: `${index * 60}ms`,
          }}
        />
      ))}
    </div>
  );
}

function EmptyState({ message }) {
  return <div className="px-4 py-10 text-center text-sm text-gray-400">{message}</div>;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [visible, setVisible] = useState("Overview");
  const [animating, setAnimating] = useState(false);
  const [barsReady, setBarsReady] = useState(false);
  const [miniReady, setMiniReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/admin/dashboard");
      setDashboardData(data?.data || null);
    } catch (error) {
      console.error("Failed to fetch admin dashboard data", error);
      toast.error(error?.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setTimeout(() => setBarsReady(true), 150);
    }
  };

  const handleTabClick = (tab) => {
    if (tab === activeTab || animating) return;
    setAnimating(true);
    setBarsReady(false);
    setMiniReady(false);
    setTimeout(() => {
      setActiveTab(tab);
      setVisible(tab);
      setAnimating(false);
      if (tab === "Overview") setTimeout(() => setBarsReady(true), 120);
      if (tab === "Reports") setTimeout(() => setMiniReady(true), 100);
    }, 180);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenReplyModal = (query) => {
    setSelectedEscalation(query);
    setReplyText("");
  };

  const handleCloseReplyModal = () => {
    setSelectedEscalation(null);
    setReplyText("");
  };

  const handleSubmitReply = async () => {
    const trimmedReply = replyText.trim();

    if (!trimmedReply) {
      toast.error("Please write a reply for operations.");
      return;
    }

    if (!selectedEscalation?.id) {
      toast.error("Escalation details are missing.");
      return;
    }

    try {
      setReplySubmitting(true);
      const { data } = await API.patch(`/admin/queries/${selectedEscalation.id}/reply-to-ops`, {
        reply: trimmedReply,
      });
      toast.success(data?.message || "Reply sent to ops successfully");
      handleCloseReplyModal();
      await fetchDashboardData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to send reply right now.");
    } finally {
      setReplySubmitting(false);
    }
  };

  const permissions = dashboardData?.permissions || permissionsFallback;
  const summaryCards = dashboardData?.summaryCards || [];
  const queryFlow = dashboardData?.queryFlow || [];
  const performance = dashboardData?.performance || [];
  const queries = dashboardData?.queries || [];
  const bookings = dashboardData?.bookings || [];
  const vouchers = dashboardData?.vouchers || [];
  const reports = dashboardData?.reports || [];
  const header = dashboardData?.header || {};

  const queryCount = useMemo(() => queries.length, [queries.length]);
  const bookingCount = useMemo(() => bookings.length, [bookings.length]);
  const voucherCount = useMemo(() => vouchers.length, [vouchers.length]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-600 shadow-sm">
          <Loader2 size={18} className="animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="border-b border-gray-100 bg-white px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800">{header.title || "Dashboard"}</span>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                {header.roleLabel || "Administrator"}
              </span>
            </div>
            <p className="text-xs text-gray-400">{header.subtitle || "Complete access to all system features"}</p>
          </div>
          <span className="text-xs text-gray-400">
            Logged in as <strong className="text-gray-600">{header.loggedInAs || "Administrator"}</strong>
          </span>
        </div>
      </div>

      <div className="custom-scroll flex gap-0 overflow-x-auto border-b border-gray-100 bg-white px-3 sm:px-5">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-all duration-200 ${
              activeTab === tab
                ? "border-violet-600 font-medium text-violet-600"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div
        className="transition-all duration-200"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(6px)" : "translateY(0px)",
        }}
      >
        {visible === "Overview" && (
          <div className="space-y-4 p-3 sm:p-5">
            <div className="rounded-xl border border-gray-300 bg-white p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">Permissions</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {permissions.map((permission, index) => (
                  <div key={`${permission}-${index}`} className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <Check size={10} strokeWidth={3} />
                    </div>
                    {permission}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <StatCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  change={card.change}
                  changeUp={card.changeUp}
                />
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="overflow-hidden rounded-xl border border-gray-300 bg-white">
                <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-800">
                  <Activity size={15} className="text-violet-500" />
                  Recent Activity
                </div>
                {queryFlow.length ? (
                  <div className="space-y-4 p-4">
                    {queryFlow.slice(0, 5).map((query) => {
                      const presentation = getRecentQueryPresentation(query);

                      return (
                      <div
                        key={query.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-300/80 px-4 py-4 transition-colors duration-150 hover:bg-slate-50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs ${presentation.iconBg}`}>
                            {presentation.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-700">
                              <span>{presentation.label}</span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${presentation.pillClass}`}>
                                {presentation.pill}
                              </span>
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                              <UserRound size={12} className="text-gray-400" />
                              <span>
                                {query.agency} {"\u2192"} {query.destination}
                              </span>
                            </p>
                          </div>
                        </div>
                        <span className="ml-3 whitespace-nowrap text-xs text-gray-400">{query.time}</span>
                      </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState message="No queries available." />
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-800">
                  <Activity size={15} className="text-blue-500" />Team Performance
                </div>
                <PerformanceBars rows={performance} animate={barsReady} />
              </div>
            </div>
          </div>
        )}

        {visible === "Queries" && (
          <div className="p-5">
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
              <div className="border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
                Pending Queries & Escalations ({queryCount})
              </div>
              {queries.length ? (
                queries.map((query) => (
                  <div
                    key={query.id}
                    className="border-b border-gray-50 px-4 py-4 transition-colors duration-150 last:border-0 hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium ${query.bg} ${query.color}`}>
                        {query.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-700">
                              {query.name}{" "}
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${query.statusClass || "bg-blue-100 text-blue-700"}`}>
                                {query.status}
                              </span>
                            </p>
                            <p className="text-xs text-gray-400">
                              {query.queryId} - {query.destination}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              Ops Stage: {query.opsStatusLabel || "-"}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="whitespace-nowrap text-xs text-gray-400">{query.time}</span>
                            {query.adminCoordinationStatus === "pending_admin_reply" ? (
                              <button
                                onClick={() => handleOpenReplyModal(query)}
                                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
                              >
                                <Send size={12} />
                                Reply to Ops
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {query.opsEscalationNote ? (
                          <div className="mt-3 rounded-2xl border border-orange-100 bg-orange-50/80 px-3 py-2.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">
                              Ops note
                            </p>
                            <p className="mt-1 text-sm text-slate-700">{query.opsEscalationNote}</p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              {query.opsEscalationBy || "Operations"}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState message="No pending queries found." />
              )}
            </div>
          </div>
        )}

        {visible === "Bookings" && (
          <div className="p-5">
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
              <div className="border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
                Active Bookings ({bookingCount})
              </div>
              <div className="custom-scroll overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Agency", "Destination", "Status", "Date", "Pax", "Query Ref"].map((heading) => (
                        <th
                          key={heading}
                          className="border-b border-gray-100 px-4 py-2.5 text-left text-xs font-medium text-gray-400"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length ? (
                      bookings.map((booking) => (
                        <tr
                          key={booking.id}
                          className="border-b border-gray-50 transition-colors duration-100 last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-gray-700">{booking.agency}</td>
                          <td className="px-4 py-3 text-gray-700">{booking.destination}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${booking.statusClass}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{booking.date}</td>
                          <td className="px-4 py-3 text-gray-500">{booking.pax}</td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-500">{booking.queryId}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6">
                          <EmptyState message="No active bookings found." />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {visible === "Vouchers" && (
          <div className="p-5">
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
              <div className="border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
                Generated Vouchers ({voucherCount})
              </div>
              <div className="custom-scroll overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Voucher #", "Agency", "Destination", "Generated", "Status"].map((heading) => (
                        <th
                          key={heading}
                          className="border-b border-gray-100 px-4 py-2.5 text-left text-xs font-medium text-gray-400"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.length ? (
                      vouchers.map((voucher) => (
                        <tr
                          key={voucher.id}
                          className="border-b border-gray-50 transition-colors duration-100 last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">{voucher.num}</td>
                          <td className="px-4 py-3 text-gray-700">{voucher.agency}</td>
                          <td className="px-4 py-3 text-gray-700">{voucher.destination}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{voucher.date}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${voucher.statusClass}`}>
                              {voucher.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5">
                          <EmptyState message="No vouchers available." />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {visible === "Reports" && (
          <div className="p-5">
            <div className="grid gap-4 md:grid-cols-2">
              {reports.length ? (
                reports.map((report, index) => (
                  <div
                    key={`${report.label}-${index}`}
                    className="rounded-xl border border-gray-100 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="text-3xl font-medium text-gray-800">{report.value}</div>
                    <div className="mt-1 text-xs text-gray-400">{report.label}</div>
                    <MiniBarChart bars={report.bars} color={report.color} animate={miniReady} />
                  </div>
                ))
              ) : (
                <div className="col-span-full rounded-xl border border-gray-100 bg-white">
                  <EmptyState message="No report metrics available." />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedEscalation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
                  Admin Reply
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  {selectedEscalation.queryId} - {selectedEscalation.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{selectedEscalation.destination}</p>
              </div>
              <button
                onClick={handleCloseReplyModal}
                disabled={replySubmitting}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </div>

            {selectedEscalation.opsEscalationNote ? (
              <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">
                  Latest ops note
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {selectedEscalation.opsEscalationNote}
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  {selectedEscalation.opsEscalationBy || "Operations"}
                </p>
              </div>
            ) : null}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Reply for Ops
              </label>
              <textarea
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                placeholder="Write the admin decision, approval note, or next step for operations..."
                className="min-h-[140px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                rows={6}
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={handleCloseReplyModal}
                disabled={replySubmitting}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReply}
                disabled={replySubmitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {replySubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={14} />}
                Send Reply
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
