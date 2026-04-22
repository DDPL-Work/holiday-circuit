import { Search, Filter, FileText, AlertCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import ActiveBookingDetails from "./ActiveBookingDetails.jsx";
import API from "../../utils/Api";

const containerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Dates pending";

  const format = (value) =>
    value.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return `${format(start)} - ${format(end)}`;
};

const getDisplayStatus = (query, invoice) => {
  if (query?.opsStatus === "Vouchered") {
    return { label: "Vouchered", className: "bg-indigo-100 text-indigo-700" };
  }

  const verificationStatus = invoice?.paymentVerification?.status || "Pending";
  const submitted = Boolean(invoice?.paymentSubmission?.submittedAt);
  const isPaymentVerified = verificationStatus === "Verified" || invoice?.paymentStatus === "Paid";
  const isBookingConfirmed = invoice ? isPaymentVerified : query?.opsStatus === "Confirmed";

  if (isBookingConfirmed) {
    return { label: "Booking Confirmed", className: "bg-green-100 text-green-700" };
  }

  if (!invoice) {
    return { label: "Invoice Pending", className: "bg-slate-100 text-slate-700" };
  }

  if (verificationStatus === "Rejected") {
    return { label: "Payment Rejected", className: "bg-red-100 text-red-700" };
  }

  if (submitted) {
    return { label: "Under Review", className: "bg-blue-100 text-blue-700" };
  }

  return { label: "Finance Pending", className: "bg-amber-100 text-amber-700" };
};

const mapBookingRecord = (record) => {
  const query = {
    _id: record?._id,
    queryId: record?.queryId,
    destination: record?.destination,
    startDate: record?.startDate,
    endDate: record?.endDate,
    numberOfAdults: record?.numberOfAdults,
    numberOfChildren: record?.numberOfChildren,
    customerBudget: record?.customerBudget,
    specialRequirements: record?.specialRequirements,
    travelerDetails: record?.travelerDetails || [],
    travelerDocumentVerification: record?.travelerDocumentVerification || { status: "Draft" },
    travelerDocumentAuditTrail: record?.travelerDocumentAuditTrail || [],
    opsStatus: record?.opsStatus,
    agentStatus: record?.agentStatus,
    activityLog: record?.activityLog || [],
  };
  const invoice = record?.invoice || null;
  const quotation = record?.quotation || null;
  const adultCount = Number(query?.numberOfAdults || 0);
  const childCount = Number(query?.numberOfChildren || 0);
  const totalTravelers = adultCount + childCount;
  const totalAmount =
    Number(invoice?.totalAmount || 0) ||
    Number(quotation?.clientTotalAmount || 0) ||
    Number(quotation?.pricingTotalAmount || 0) ||
    Number(query?.customerBudget || 0);

  return {
    _id: query?._id,
    invoiceId: invoice?._id || "",
    invoiceNumber: invoice?.invoiceNumber || "Invoice Pending",
    bookingReference: query?.queryId || invoice?.invoiceNumber || "Booking Pending",
    destination: query?.destination || "Destination Pending",
    dates: formatDateRange(query?.startDate, query?.endDate),
    travelers: totalTravelers || "-",
    travelerSummary: {
      adults: adultCount,
      children: childCount,
    },
    travelerDetails: record?.travelerDetails || [],
    travelerDocumentVerification: record?.travelerDocumentVerification || { status: "Draft" },
    travelerDocumentAuditTrail: record?.travelerDocumentAuditTrail || [],
    query,
    invoice,
    quotation,
    totalAmount,
    currency: invoice?.currency || "INR",
    lineItems: invoice?.lineItems || [],
    pricingSnapshot: invoice?.pricingSnapshot || {},
    tripSnapshot: invoice?.tripSnapshot || {},
    templateVariant: invoice?.templateVariant || "grand-ledger",
    paymentSubmission: invoice?.paymentSubmission || {},
    paymentVerification: invoice?.paymentVerification || { status: "Pending" },
    paymentAuditTrail: invoice?.paymentAuditTrail || [],
    paymentStatus: invoice?.paymentStatus || "Pending",
    remarks: invoice?.remarks || "",
    displayStatus: getDisplayStatus(query, invoice),
    assignedFinanceName: invoice?.paymentVerification?.assignedToName || "",
    assignedFinanceEmail: invoice?.paymentVerification?.assignedToEmail || "",
    reviewedByName: invoice?.paymentVerification?.reviewedByName || "",
    invoiceReady: Boolean(invoice),
  };
};

const ActiveBookings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openActiveBookingDetails, setOpenActiveBookingDetails] = useState(false);
  const [selectedActiveBooking, setSelectedActiveBooking] = useState(null);
  const [documentPortalContext, setDocumentPortalContext] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const autoOpenedBookingRef = useRef("");
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await API.get("/agent/active-bookings");
        setBookings((data || []).map(mapBookingRecord));
      } catch (fetchError) {
        console.error(fetchError);
        setError(fetchError?.response?.data?.message || "Failed to load active bookings");
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  useEffect(() => {
    const requestedBookingId = location.state?.openBookingId;

    if (!requestedBookingId || loading || !bookings.length) return;
    if (autoOpenedBookingRef.current === requestedBookingId) return;

    const matchedBooking = bookings.find((booking) => booking._id === requestedBookingId);
    if (!matchedBooking) return;

    autoOpenedBookingRef.current = requestedBookingId;
    setSelectedActiveBooking(matchedBooking);
    setDocumentPortalContext({
      source: "document-portal",
      issues: location.state?.documentIssues || [],
      issueSummary: location.state?.issueSummary || "",
      reviewStatus: location.state?.reviewStatus || "",
    });
    setOpenActiveBookingDetails(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [bookings, loading, location.pathname, location.state, navigate]);

  const filteredBookings = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return bookings.filter((booking) => {
      return (
        String(booking.bookingReference || "").toLowerCase().includes(searchLower) ||
        String(booking.destination || "").toLowerCase().includes(searchLower) ||
        String(booking.invoiceNumber || "").toLowerCase().includes(searchLower)
      );
    });
  }, [bookings, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, bookings.length]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  const handleBookingUpdated = (payload) => {
    if (!selectedActiveBooking) return;

    const nextRecord = {
      ...selectedActiveBooking.query,
      _id: selectedActiveBooking._id,
      invoice:
        payload?.type === "payment"
          ? payload.invoice
          : selectedActiveBooking.query?.invoice || selectedActiveBooking.invoice,
      quotation: selectedActiveBooking.quotation,
      activityLog: payload?.query?.activityLog || selectedActiveBooking.query?.activityLog || [],
      travelerDetails: payload?.query?.travelerDetails || selectedActiveBooking.travelerDetails || [],
      travelerDocumentVerification:
        payload?.query?.travelerDocumentVerification ||
        selectedActiveBooking.travelerDocumentVerification ||
        selectedActiveBooking.query?.travelerDocumentVerification ||
        { status: "Draft" },
      travelerDocumentAuditTrail:
        payload?.query?.travelerDocumentAuditTrail ||
        selectedActiveBooking.travelerDocumentAuditTrail ||
        selectedActiveBooking.query?.travelerDocumentAuditTrail ||
        [],
    };
    if (payload?.query) {
      nextRecord.queryId = payload.query?.queryId || nextRecord.queryId;
      nextRecord.destination = payload.query?.destination || nextRecord.destination;
      nextRecord.startDate = payload.query?.startDate || nextRecord.startDate;
      nextRecord.endDate = payload.query?.endDate || nextRecord.endDate;
      nextRecord.numberOfAdults = payload.query?.numberOfAdults ?? nextRecord.numberOfAdults;
      nextRecord.numberOfChildren = payload.query?.numberOfChildren ?? nextRecord.numberOfChildren;
      nextRecord.customerBudget = payload.query?.customerBudget ?? nextRecord.customerBudget;
      nextRecord.specialRequirements = payload.query?.specialRequirements || nextRecord.specialRequirements;
      nextRecord.opsStatus = payload.query?.opsStatus || nextRecord.opsStatus;
      nextRecord.agentStatus = payload.query?.agentStatus || nextRecord.agentStatus;
    }
    if (payload?.type !== "traveler-document" && payload?.invoice) {
      nextRecord.invoice = payload.invoice;
    }
    const nextBooking = mapBookingRecord(nextRecord);
    setBookings((prev) =>
      prev.map((booking) => (booking._id === nextBooking._id ? nextBooking : booking)),
    );
    setSelectedActiveBooking(nextBooking);
  };
  if (openActiveBookingDetails && selectedActiveBooking) {
    return (
      <ActiveBookingDetails
        onClose={() => {
          setOpenActiveBookingDetails(false);
          setDocumentPortalContext(null);
        }}
        booking={selectedActiveBooking}
        onBookingUpdated={handleBookingUpdated}
        documentPortalContext={documentPortalContext}
      />
    );
  }
  return (
    <motion.section
      variants={containerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-5 p-"
    >
      <motion.header variants={itemVariant} className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Active Bookings</h1>
          <p className="text-sm text-gray-500">
            Manage your invoices, payments, and traveler documents.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <motion.div variants={itemVariant} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 py-2 pl-9 pr-4 text-xs focus:outline-none sm:min-w-[240px]"
            />
          </motion.div>
          <motion.button
            variants={itemVariant}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-xl border border-gray-300 p-2 hover:bg-gray-100"
          >
            <Filter size={16} />
          </motion.button>
        </div>
      </motion.header>
      {error && (
        <motion.div
          variants={itemVariant}
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </motion.div>
      )}
      <motion.div variants={itemVariant} className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full text-xs">
          <thead className="border-b border-b-gray-300 bg-gray-50 text-gray-500">
            <tr>
              <th className="px-6 py-3 text-left">Booking ID</th>
              <th className="px-6 py-3 text-left">Destination</th>
              <th className="px-6 py-3 text-left">Travel Dates</th>
              <th className="px-6 py-3 text-left">Pax</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-400">
                  Loading active bookings...
                </td>
              </tr>
            ) : paginatedBookings.length > 0 ? (
              paginatedBookings.map((booking) => (
                <tr
                  key={booking._id}
                  className="transition-colors hover:bg-[#F9FAFB]"
                >
                  <td className="px-6 py-4 font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{booking.bookingReference}</p>
                        <p className="text-[10px] text-slate-400">{booking.invoiceNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{booking.destination}</td>
                  <td className="px-6 py-4">{booking.dates}</td>
                  <td className="px-6 py-4">{booking.travelers}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex w-[140px] items-center justify-center whitespace-nowrap rounded-full px-2.5 py-2 text-[11px] font-medium leading-none ${booking.displayStatus.className}`}>
                      {booking.displayStatus.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setDocumentPortalContext(null);
                        setSelectedActiveBooking(booking);
                        setOpenActiveBookingDetails(true);
                      }}
                      className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs text-white"
                    >
                      Manage
                    </motion.button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-400">
                  No active bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 px-6 py-4 sm:flex-row">
            <span className="text-xs font-medium text-gray-500">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredBookings.length)} of {filteredBookings.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <div className="hidden items-center gap-1 sm:flex">
                {Array.from({ length: totalPages }).map((_, index) => {
                  if (
                    totalPages > 5 &&
                    index !== 0 &&
                    index !== totalPages - 1 &&
                    Math.abs(currentPage - 1 - index) > 1
                  ) {
                    if (index === 1 && currentPage > 3) {
                      return <span key={index} className="px-1 text-gray-400">...</span>;
                    }
                    if (index === totalPages - 2 && currentPage < totalPages - 2) {
                      return <span key={index} className="px-1 text-gray-400">...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                        currentPage === index + 1
                          ? "bg-slate-900 text-white"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.section>
  );
};

export default ActiveBookings;
