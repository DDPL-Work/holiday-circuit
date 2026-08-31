import React from "react";
import { CalendarDays, FileText, Clock, BadgeCheck, Wallet, Building2 } from "lucide-react";
import {
  getInitials,
  formatCurrency,
  getBookingPaymentMeta,
} from "../utils/dashboardHelpers";

export const MasterBookingsTable = ({
  bookingRows = [],
  paginatedBookingRows = [],
  pendingBookingCount = 0,
  verifiedBookingCount = 0,
  bookingPage = 1,
  setBookingPage,
  totalBookingPages = 1,
  bookingStartIndex = 0,
  bookingItemsPerPage = 5,
}) => {
  return (
    <div style={{ padding: "0 16px" }}>
      <div id="contracted-rates" className="scroll-mt-5" />
      <div id="booking-management" className="scroll-mt-5" />
      <div id="order-acceptance" className="scroll-mt-5" />
      <div id="voucher-management" className="scroll-mt-5" />
      <div id="fulfillment-confirmation" className="scroll-mt-5" />
      <div id="payment-verification" className="scroll-mt-5" />
      <div id="internal-invoice" className="scroll-mt-5" />
      <div id="rate-contracts" className="scroll-mt-5" />
      <div id="invoices-payments" className="scroll-mt-5" />
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CalendarDays size={17} color="#2563eb" />
            </span>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>Master Controls - Bookings</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Track booking payments and mapped DMC partners</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", fontSize: 12, fontWeight: 600 }}>
              <FileText size={12} /> {bookingRows.length} live bookings
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999, border: "1px solid #fde68a", background: "#fffbeb", color: "#b45309", fontSize: 12, fontWeight: 600 }}>
              <Clock size={12} /> {pendingBookingCount} pending
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#15803d", fontSize: 12, fontWeight: 600 }}>
              <BadgeCheck size={12} /> {verifiedBookingCount} verified
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="custom-scroll" style={{ overflowX: "auto", overflowY: "hidden", paddingBottom: 8 }}>
          <table style={{ width: "100%", minWidth: 780, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                {["Booking Ref", "Agent", "Amount", "Payment Status", "DMC Partner"].map((h) => (
                  <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedBookingRows.length ? paginatedBookingRows.map((booking, index) => {
                const paymentMeta = getBookingPaymentMeta(booking.paymentStatus);
                const PaymentIcon = paymentMeta.Icon;
                return (
                  <tr key={booking.id || index} style={{ borderBottom: "1px solid #E0E0E0", verticalAlign: "middle" }}>
                    <td style={{ padding: "12px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 34, height: 34, borderRadius: 10, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <FileText size={14} color="#2563eb" />
                        </span>
                        <div style={{ minWidth: 90 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}>{booking.id}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" }}>Booking reference</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 34, height: 34, borderRadius: "50%", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#475569", flexShrink: 0 }}>
                          {getInitials(booking.agent)}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{booking.agent}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" }}>Agent account</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 34, height: 34, borderRadius: 10, background: "#ecfdf3", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Wallet size={14} color="#16a34a" />
                        </span>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                            {typeof booking.amount === "number" ? formatCurrency(booking.amount) : booking.amount}
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" }}>Total payable</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 999, border: `1px solid ${paymentMeta.borderColor}`, background: paymentMeta.background, color: paymentMeta.textColor, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                        <PaymentIcon size={12} color={paymentMeta.iconColor} />
                        {paymentMeta.label}
                      </span>
                      <p style={{ margin: "3px 0 0", fontSize: 10, color: "#94a3b8" }}>Finance checkpoint</p>
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 34, height: 34, borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Building2 size={14} color="#b45309" />
                        </span>
                        <div style={{ minWidth: 120 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{booking.dmc || "-"}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" }}>Mapped fulfillment partner</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={5} style={{ padding: "32px 18px", textAlign: "center", fontSize: 13, color: "#94a3b8" }}>No booking records available yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {bookingRows.length > bookingItemsPerPage && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderTop: "1px solid #e2e8f0",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 505, color: "#64748b" }}>
              Showing {bookingStartIndex + 1} to {Math.min(bookingStartIndex + bookingItemsPerPage, bookingRows.length)} of {bookingRows.length} entries
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                onClick={() => setBookingPage((prev) => Math.max(prev - 1, 1))}
                disabled={bookingPage === 1}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  background: bookingPage === 1 ? "#f8fafc" : "#fff",
                  color: bookingPage === 1 ? "#94a3b8" : "#475569",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: bookingPage === 1 ? "not-allowed" : "pointer",
                  opacity: bookingPage === 1 ? 0.55 : 1,
                  transition: "all 0.15s ease",
                }}
              >
                Previous
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {Array.from({ length: totalBookingPages }).map((_, index) => {
                  const pageNum = index + 1;
                  const isSelected = bookingPage === pageNum;

                  if (totalBookingPages > 5 && index !== 0 && index !== totalBookingPages - 1 && Math.abs(bookingPage - 1 - index) > 1) {
                    if (index === 1 && bookingPage > 3) return <span key={index} style={{ padding: "0 4px", fontSize: 12, color: "#94a3b8" }}>...</span>;
                    if (index === totalBookingPages - 2 && bookingPage < totalBookingPages - 2) return <span key={index} style={{ padding: "0 4px", fontSize: 12, color: "#94a3b8" }}>...</span>;
                    return null;
                  }

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setBookingPage(pageNum)}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        border: isSelected ? "none" : "1px solid #e2e8f0",
                        background: isSelected
                          ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                          : "#fff",
                        color: isSelected ? "#fff" : "#475569",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: isSelected ? "0 4px 10px rgba(99, 102, 241, 0.15)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setBookingPage((prev) => Math.min(prev + 1, totalBookingPages))}
                disabled={bookingPage === totalBookingPages}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  background: bookingPage === totalBookingPages ? "#f8fafc" : "#fff",
                  color: bookingPage === totalBookingPages ? "#94a3b8" : "#475569",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: bookingPage === totalBookingPages ? "not-allowed" : "pointer",
                  opacity: bookingPage === totalBookingPages ? 0.55 : 1,
                  transition: "all 0.15s ease",
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
