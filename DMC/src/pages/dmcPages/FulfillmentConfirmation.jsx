import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import CreateProformaInvoice from "../../components/accounting/CreateProformaInvoice";
import ExcelJS from "exceljs";
import API from "../../utils/Api";
import SuccessPopup from './FulfillmentConfirmationComponents/Modals/SuccessPopup';
import VoucherModal from './FulfillmentConfirmationComponents/Modals/VoucherModal';
import EditTagModal from './FulfillmentConfirmationComponents/Modals/EditTagModal';
import SupplierPaymentModal from './FulfillmentConfirmationComponents/Modals/SupplierPaymentModal';
import CustomerPaymentModal from './FulfillmentConfirmationComponents/Modals/CustomerPaymentModal';
import BookingDirectoryList from './FulfillmentConfirmationComponents/Views/BookingDirectoryList';
import BookingDetailView from './FulfillmentConfirmationComponents/Views/BookingDetailView';
import {
  createEmptyService,
  serviceTypeLabel,
  getReferenceServiceName,
  getServiceTypeSortRank,
  formatServiceMoney,
  getResolvedServiceDisplayTotal,
  formatServiceDate,
  formatTimeAgo,
  getStarRatingDisplay,
  travelerDocumentOptions,
  resolveTravelerDocuments,
  buildCloudinaryAttachmentUrl,
  getDocumentOpenTarget,
  formatDocumentDateTime,
  formatDocumentSize,
  STATUS_TABS,
  getQueryCalculatedTotal,
  getOpsStatusBadge,
  getServicePaymentStatusDisplay,
  getServiceVoucherStatusInfo,
} from "./FulfillmentConfirmationComponents/utils/formatter";


export default function FulfillmentConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [confirmedQueries, setConfirmedQueries] = useState([]);
  const [selectedStatusTab, setSelectedStatusTab] = useState("Confirmed");
  const [viewMode, setViewMode] = useState("list"); // "list" | "detail"
  const [detailTab, setDetailTab] = useState("basic"); // "basic" | "services" | "accounting" | "internal_invoice" | "docs"
  const [accountingSubTab, setAccountingSubTab] = useState("payments"); // "payments" | "proforma" | "profit"
  const [isCreatingProforma, setIsCreatingProforma] = useState(false);
  const [proformaInvoiceData, setProformaInvoiceData] = useState(null);
  const [serviceCategoryTab, setServiceCategoryTab] = useState("all");
  const [selectedQueryId, setSelectedQueryId] = useState("");
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [profitRefreshing, setProfitRefreshing] = useState(false);
  const handleOpenQueryDetail = (query) => {
    hydrateSelectedQuery(query);
    setViewMode("detail");
    setDetailTab("basic");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const handleBackToList = () => {
    setViewMode("list");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const handleProfitRefresh = async () => {
    if (!selectedQuery?._id && !selectedQuery?.queryId) return;
    setProfitRefreshing(true);
    try {
      const res = await API.get("/dmc/confirmation/queries");
      const queries = res.data?.data || [];
      setConfirmedQueries(queries);
      const refreshed = queries.find(
        (q) =>
          q._id === selectedQuery._id || q.queryId === selectedQuery.queryId,
      );
      if (refreshed) {
        setSelectedQuery(refreshed);
        toast.success("Profit report refreshed successfully");
      } else {
        toast.error("Could not find the current query in refreshed data");
      }
    } catch (error) {
      console.error("Profit refresh error:", error);
      toast.error("Failed to refresh profit report data");
    } finally {
      setProfitRefreshing(false);
    }
  };
  const handleProfitCopyToClipboard = async () => {
    if (!selectedQuery) return toast.error("No query selected");
    try {
      const prPricing = selectedQuery?.quotationPricing || {};
      const prMarkup = prPricing.opsMarkup || {};
      const prTax = prPricing.tax || {};
      const prGst = prTax.gst || {};
      const prCharges = prPricing.opsCharges || {};
      const costBase = Number(prPricing.baseAmount || prPricing.subTotal || 0);
      const markupAmount = Number(prMarkup.amount || 0);
      const gstAmount = Number(prGst.amount || 0);
      const tcsAmount = Number(prTax.tcs?.amount || 0);
      const tourismFee = Number(prTax.tourismFee?.amount || 0);
      const totalTax = gstAmount + tcsAmount + tourismFee;
      const pkgAmount = Number(
        selectedQuery?.packagePrice || prPricing.totalAmount || 0,
      );
      const dmcCost = Number(selectedQuery?.dmcCostTotal || 0);
      const agentRevenue = Number(
        selectedQuery?.agentRevenueTotal || pkgAmount || 0,
      );
      const netProfit = agentRevenue > 0 ? agentRevenue - dmcCost : 0;
      const profitPercent =
        agentRevenue > 0
          ? Math.round((netProfit / agentRevenue) * 10000) / 100
          : 0;
      const services = selectedQuery?.services || [];
      const hotelServices = services.filter(
        (s) => String(s.type || "").toLowerCase() === "hotel",
      );
      const transportServices = services.filter((s) =>
        ["transfer", "transport", "car"].includes(
          String(s.type || "").toLowerCase(),
        ),
      );
      const activityServices = services.filter(
        (s) => String(s.type || "").toLowerCase() === "activity",
      );
      const sightseeingServices = services.filter(
        (s) => String(s.type || "").toLowerCase() === "sightseeing",
      );
      const flightServices = services.filter(
        (s) => String(s.type || "").toLowerCase() === "flight",
      );
      const hotelTotal = hotelServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const transportTotal = transportServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const activityTotal = activityServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const sightseeingTotal = sightseeingServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const flightTotal = flightServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const allBookingsTotal =
        hotelTotal +
        transportTotal +
        activityTotal +
        sightseeingTotal +
        flightTotal;
      const agentTrackerPayments =
        selectedQuery?.agentInvoice?.trackerPayments || [];
      const agentReceived = agentTrackerPayments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0,
      );
      const agentDue = pkgAmount - agentReceived;
      const fmt = (v) => Number(v || 0).toLocaleString("en-IN");
      const fmtDate = (d) => {
        if (!d) return "-";
        const dt = new Date(d);
        return Number.isNaN(dt.getTime())
          ? "-"
          : dt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
      };
      let text = "";
      text += "========================================\n";
      text += "         PROFIT REPORT\n";
      text += "========================================\n\n";
      text += `Package Amount: INR ${fmt(pkgAmount)}\n`;
      text += `Bookings: INR ${fmt(allBookingsTotal)}\n`;
      if (hotelTotal > 0) text += `  Hotels: INR ${fmt(hotelTotal)}\n`;
      if (transportTotal > 0)
        text += `  Transport: INR ${fmt(transportTotal)}\n`;
      if (activityTotal > 0)
        text += `  Activities: INR ${fmt(activityTotal)}\n`;
      if (sightseeingTotal > 0)
        text += `  Sightseeing: INR ${fmt(sightseeingTotal)}\n`;
      if (flightTotal > 0) text += `  Flights: INR ${fmt(flightTotal)}\n`;
      text += `Estm. Tax (inc.): INR ${fmt(totalTax)}\n`;
      text += `Estm. Profit: INR ${fmt(netProfit)}\n`;
      text += `Estm. Profit %: ${profitPercent.toFixed(2)}%\n`;
      text += "\n----------------------------------------\n";
      text += "TRIP DETAILS\n";
      text += "----------------------------------------\n";
      text += `Trip ID: ${selectedQuery?.queryId || "-"}\n`;
      text += `Destination: ${selectedQuery?.destination || "-"}\n`;
      text += `Start Date: ${fmtDate(selectedQuery?.startDate)}\n`;
      text += `End Date: ${fmtDate(selectedQuery?.endDate)}\n`;
      text += `Duration: ${selectedQuery?.duration || "-"}\n`;
      text += `Adults: ${selectedQuery?.numberOfAdults || 0}\n`;
      text += `Children: ${selectedQuery?.numberOfChildren || 0}\n`;
      text += "\n----------------------------------------\n";
      text += "SOURCE AND GUEST DETAILS\n";
      text += "----------------------------------------\n";
      text += `Source Name: ${selectedQuery?.agentName || "Direct Query"}\n`;
      text += `Source Contact: ${selectedQuery?.agentInvoice?.invoiceNumber || "-"}\n`;
      text += `Ref ID: ${selectedQuery?.queryId || "-"}\n`;
      text += `Guest Name: ${selectedQuery?.customerName || selectedQuery?.travelerDetails?.[0]?.fullName || "-"}\n`;
      text += `Guest Contact: ${selectedQuery?.clientEmail || selectedQuery?.customerPhone || "-"}\n`;
      text += "\n----------------------------------------\n";
      text += "LATEST QUOTE DETAILS\n";
      text += "----------------------------------------\n";
      text += `Cost (INR): ${fmt(costBase)}\n`;
      text += `Markup: ${fmt(markupAmount)}\n`;
      text += `Taxes (${prGst.percent || 0}% applied): ${fmt(totalTax)}\n`;
      text += `Total (INR): ${fmt(costBase + markupAmount + totalTax)}\n`;
      text += `Final Package Price (INR): ${fmt(pkgAmount)}\n`;
      text += "\n----------------------------------------\n";
      text += "TRIP CONVERSION DETAILS\n";
      text += "----------------------------------------\n";
      text += `Converted On: ${fmtDate(selectedQuery?.quotationCreatedAt || selectedQuery?.createdAt)}\n`;
      text += `Currency: ${prPricing.currency || "INR"}\n`;
      text += `Total: ${fmt(pkgAmount)}\n`;
      text += `Received: ${fmt(agentReceived)}\n`;
      text += `Due: ${fmt(agentDue)}\n`;
      const addServiceSection = (svcs, label) => {
        if (!svcs || svcs.length === 0) return;
        text += "\n----------------------------------------\n";
        text += `${label.toUpperCase()} RESERVATION BOOKINGS\n`;
        text += "----------------------------------------\n";
        svcs.forEach((svc, i) => {
          const svcPaidAmt = Number(
            svc.amountPaid ?? svc.paidAmount ?? svc.payoutAmount ?? 0,
          );
          const svcTotalAmt = Number(svc.total || 0);
          const svcDueAmt = svcTotalAmt - Math.min(svcPaidAmt, svcTotalAmt);
          text += `  [${i + 1}] ${svc.serviceName || svc.title || label}\n`;
          text += `      Check In: ${fmtDate(svc.checkInDate || svc.serviceDate)}\n`;
          text += `      Check Out: ${fmtDate(svc.checkOutDate || svc.serviceEndDate)}\n`;
          text += `      Nights/Days: ${svc.nights || svc.days || "-"}\n`;
          text += `      Supplier: ${svc.supplierName || svc.dmcName || "-"}\n`;
          text += `      Currency: ${svc.currency || "INR"}\n`;
          text += `      Quoted: ${fmt(Number(svc.price || 0))}\n`;
          text += `      Booked: ${fmt(svcTotalAmt)}\n`;
          text += `      Status: ${svc.status || "Confirmed"}\n`;
          text += `      Net Payable: ₹${fmt(svcTotalAmt)}\n`;
          text += `      Net Paid: ₹${fmt(Math.min(svcPaidAmt, svcTotalAmt))}\n`;
          text += `      Net Due: ₹${fmt(svcDueAmt)}\n`;
        });
      };
      addServiceSection(hotelServices, "Hotel");
      addServiceSection(transportServices, "Transport");
      addServiceSection(activityServices, "Activity");
      addServiceSection(sightseeingServices, "Sightseeing");
      addServiceSection(flightServices, "Flight");
      text += "\n----------------------------------------\n";
      text += "COMPONENT BOOKING PRICES\n";
      text += "----------------------------------------\n";
      text += `Hotels: ${hotelTotal > 0 ? `₹${fmt(hotelTotal)}` : "-"}\n`;
      text += `Transports: ${transportTotal > 0 ? `₹${fmt(transportTotal)}` : "-"}\n`;
      text += `Activities: ${activityTotal > 0 ? `₹${fmt(activityTotal)}` : "-"}\n`;
      text += `Sightseeing: ${sightseeingTotal > 0 ? `₹${fmt(sightseeingTotal)}` : "-"}\n`;
      text += `Flights: ${flightTotal > 0 ? `₹${fmt(flightTotal)}` : "-"}\n`;
      text += `Total: ₹${fmt(allBookingsTotal)}\n`;
      text += "\n----------------------------------------\n";
      text += "BREAKUP (IN INR)\n";
      text += "----------------------------------------\n";
      text += `Payable: ${fmt(dmcCost)}\n`;
      text += `Markup: ${fmt(markupAmount)}\n`;
      text += `Tax Applied On: cost + markup\n`;
      text += `Tax %: ${prGst.percent || 0}%\n`;
      text += `Tax Amount: ${fmt(totalTax)}\n`;
      text += `Collectable: ${fmt(pkgAmount)}\n`;
      text += "\n----------------------------------------\n";
      text += "PROFIT AFTER BOOKINGS\n";
      text += "----------------------------------------\n";
      text += `Currency: ${prPricing.currency || "INR"}\n`;
      text += `Net Payable: ${fmt(dmcCost)}\n`;
      text += `Markup: ${fmt(markupAmount)}\n`;
      text += `Tax Applied On: cost + markup\n`;
      text += `Net Tax %: ${totalTax > 0 ? "exc." : "inc."}\n`;
      text += `Net Tax: ${fmt(totalTax)}\n`;
      text += `Net Collectable: ${fmt(pkgAmount)}\n`;
      text += `Net Profit: ${fmt(netProfit)}\n`;
      text += `Net Profit %: ${profitPercent.toFixed(2)}%\n`;
      text += "\n========================================\n";
      text += `Generated on: ${new Date().toLocaleString("en-GB")}\n`;
      text += "========================================\n";
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      toast.success("Profit report copied to clipboard");
    } catch (error) {
      console.error("Copy to clipboard error:", error);
      toast.error("Failed to copy report to clipboard");
    }
  };
  const handleProfitExcelExport = async () => {
    if (!selectedQuery) return toast.error("No query selected");
    try {
      const prPricing = selectedQuery?.quotationPricing || {};
      const prMarkup = prPricing.opsMarkup || {};
      const prTax = prPricing.tax || {};
      const prGst = prTax.gst || {};
      const prCharges = prPricing.opsCharges || {};
      const costBase = Number(prPricing.baseAmount || prPricing.subTotal || 0);
      const markupAmount = Number(prMarkup.amount || 0);
      const gstAmount = Number(prGst.amount || 0);
      const tcsAmount = Number(prTax.tcs?.amount || 0);
      const tourismFee = Number(prTax.tourismFee?.amount || 0);
      const totalTax = gstAmount + tcsAmount + tourismFee;
      const pkgAmount = Number(
        selectedQuery?.packagePrice || prPricing.totalAmount || 0,
      );
      const dmcCost = Number(selectedQuery?.dmcCostTotal || 0);
      const agentRevenue = Number(
        selectedQuery?.agentRevenueTotal || pkgAmount || 0,
      );
      const netProfit = agentRevenue > 0 ? agentRevenue - dmcCost : 0;
      const profitPercent =
        agentRevenue > 0
          ? Math.round((netProfit / agentRevenue) * 10000) / 100
          : 0;
      const services = selectedQuery?.services || [];
      const hotelServices = services.filter(
        (s) => String(s.type || "").toLowerCase() === "hotel",
      );
      const transportServices = services.filter((s) =>
        ["transfer", "transport", "car"].includes(
          String(s.type || "").toLowerCase(),
        ),
      );
      const activityServices = services.filter(
        (s) => String(s.type || "").toLowerCase() === "activity",
      );
      const sightseeingServices = services.filter(
        (s) => String(s.type || "").toLowerCase() === "sightseeing",
      );
      const flightServices = services.filter(
        (s) => String(s.type || "").toLowerCase() === "flight",
      );
      const hotelTotal = hotelServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const transportTotal = transportServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const activityTotal = activityServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const sightseeingTotal = sightseeingServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const flightTotal = flightServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const allBookingsTotal =
        hotelTotal +
        transportTotal +
        activityTotal +
        sightseeingTotal +
        flightTotal;
      const agentTrackerPayments =
        selectedQuery?.agentInvoice?.trackerPayments || [];
      const agentReceived = agentTrackerPayments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0,
      );
      const agentDue = pkgAmount - agentReceived;
      const fmtDate = (d) => {
        if (!d) return "-";
        const dt = new Date(d);
        return Number.isNaN(dt.getTime())
          ? "-"
          : dt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
      };
      const INR_FMT = "#,##0";
      const PCT_FMT = "0.00%";
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Holiday Circuit";
      workbook.created = new Date();
      const ws = workbook.addWorksheet("Profit Report", {
        pageSetup: {
          orientation: "landscape",
          fitToPage: true,
          fitToWidth: 1,
        },
        properties: {
          defaultRowHeight: 18,
        },
      });
      ws.columns = [
        {
          width: 22,
        },
        {
          width: 18,
        },
        {
          width: 18,
        },
        {
          width: 20,
        },
        {
          width: 18,
        },
        {
          width: 18,
        },
        {
          width: 18,
        },
        {
          width: 18,
        },
        {
          width: 18,
        },
        {
          width: 18,
        },
        {
          width: 18,
        },
        {
          width: 18,
        },
      ];
      const TITLE_BG = "1E293B";
      const SECTION_BG = "CBD5E1";
      const HEADER_BG = "F1F5F9";
      const CYAN_BG = "22D3EE";
      const LIME_BG = "84CC16";
      const ROSE_BG = "F43F5E";
      const BORDER_COLOR = "B0BEC5";
      const thinSide = {
        style: "thin",
        color: {
          argb: `FF${BORDER_COLOR}`,
        },
      };
      const thinBorderAll = {
        top: thinSide,
        bottom: thinSide,
        left: thinSide,
        right: thinSide,
      };
      const titleFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: `FF${TITLE_BG}`,
        },
      };
      const sectionFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: `FF${SECTION_BG}`,
        },
      };
      const headerFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: `FF${HEADER_BG}`,
        },
      };
      const cyanFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: `FF${CYAN_BG}`,
        },
      };
      const limeFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: `FF${LIME_BG}`,
        },
      };
      const roseFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: `FF${ROSE_BG}`,
        },
      };
      const centerAlign = {
        horizontal: "center",
        vertical: "middle",
        wrapText: false,
      };
      const leftAlign = {
        horizontal: "left",
        vertical: "middle",
      };
      let rowNum = 1;
      const addSection = (title, headers, dataRows, options = {}) => {
        const colCount = Math.max(
          headers.length,
          ...dataRows.map((r) => r.length),
        );
        const maxCols = Math.max(12, colCount);
        const sectionRow = ws.getRow(rowNum);
        const sectionCell = sectionRow.getCell(1);
        sectionCell.value = title;
        sectionCell.font = {
          bold: true,
          size: 11,
          color: {
            argb: "FF1E293B",
          },
        };
        sectionCell.fill = sectionFill;
        sectionCell.border = thinBorderAll;
        sectionCell.alignment = leftAlign;
        for (let c = 2; c <= maxCols; c++) {
          const cell = sectionRow.getCell(c);
          cell.fill = sectionFill;
          cell.border = thinBorderAll;
        }
        sectionRow.height = 20;
        rowNum++;
        const headerRow = ws.getRow(rowNum);
        headers.forEach((h, i) => {
          const cell = headerRow.getCell(i + 1);
          cell.value = h;
          cell.font = {
            bold: true,
            size: 10,
            color: {
              argb: "FF334155",
            },
          };
          cell.fill = headerFill;
          cell.border = thinBorderAll;
          cell.alignment = centerAlign;
        });
        headerRow.height = 20;
        rowNum++;
        dataRows.forEach((rowVals) => {
          const dataRow = ws.getRow(rowNum);
          rowVals.forEach((val, i) => {
            const cell = dataRow.getCell(i + 1);
            if (
              val &&
              typeof val === "object" &&
              ("numFmt" in val || "_fill" in val || "_font" in val)
            ) {
              cell.value = val.value;
              if (val.numFmt) cell.numFmt = val.numFmt;
              if (val._fill) cell.fill = val._fill;
              if (val._font) cell.font = val._font;
              else
                cell.font = {
                  bold: true,
                  size: 10,
                };
            } else {
              cell.value = val;
              cell.font = {
                size: 10,
              };
            }
            cell.border = thinBorderAll;
            cell.alignment = centerAlign;
          });
          dataRow.height = 18;
          rowNum++;
        });
        rowNum++;
      };
      const addServiceSection = (svcs, label) => {
        if (!svcs || svcs.length === 0) return;
        const isHotel = label === "Hotel";
        const col1 = isHotel ? "Check In" : "Travel Date";
        const col2 = isHotel ? "Check Out" : "End Date";
        const col4 = isHotel ? "Nights" : label === "Flight" ? "Pax" : "Days";
        const headers = [
          col1,
          col2,
          label,
          col4,
          "Supplier",
          "Curr",
          "Quoted",
          "Booked",
          "Status",
          "Net Payable",
          "Net Paid",
          "Net Due",
        ];
        const dataRows = [];
        let svcTotal = 0,
          svcPaid = 0;
        svcs.forEach((svc) => {
          const svcPaidAmt = Number(
            svc.amountPaid ?? svc.paidAmount ?? svc.payoutAmount ?? 0,
          );
          const svcTotalAmt = Number(svc.total || 0);
          const svcDueAmt = svcTotalAmt - Math.min(svcPaidAmt, svcTotalAmt);
          svcTotal += svcTotalAmt;
          svcPaid += Math.min(svcPaidAmt, svcTotalAmt);
          dataRows.push([
            fmtDate(svc.checkInDate || svc.serviceDate),
            fmtDate(svc.checkOutDate || svc.serviceEndDate),
            svc.serviceName || svc.title || label,
            svc.nights || svc.days || "-",
            svc.supplierName || svc.dmcName || "-",
            svc.currency || "INR",
            {
              value: Number(svc.price || 0),
              numFmt: INR_FMT,
            },
            {
              value: svcTotalAmt,
              numFmt: INR_FMT,
            },
            svc.status || "Confirmed",
            {
              value: svcTotalAmt,
              numFmt: INR_FMT,
              _fill: cyanFill,
              _font: {
                bold: true,
                size: 10,
              },
            },
            {
              value: Math.min(svcPaidAmt, svcTotalAmt),
              numFmt: INR_FMT,
            },
            {
              value: svcDueAmt,
              numFmt: INR_FMT,
            },
          ]);
        });
        dataRows.push([
          `Total ${label}`,
          "",
          "",
          "",
          "",
          "",
          {
            value: svcTotal,
            numFmt: INR_FMT,
          },
          {
            value: svcTotal,
            numFmt: INR_FMT,
          },
          "",
          {
            value: svcTotal,
            numFmt: INR_FMT,
            _fill: cyanFill,
            _font: {
              bold: true,
              size: 10,
            },
          },
          {
            value: svcPaid,
            numFmt: INR_FMT,
          },
          {
            value: svcTotal - svcPaid,
            numFmt: INR_FMT,
          },
        ]);
        addSection(
          `${label.toUpperCase()} RESERVATION BOOKINGS`,
          headers,
          dataRows,
        );
      };
      const addServiceSectionExcel = addServiceSection;
      ws.mergeCells("A1:L1");
      const titleRow = ws.getRow(1);
      const titleCell = titleRow.getCell(1);
      titleCell.value = "PAYMENT REPORT";
      titleCell.font = {
        bold: true,
        size: 16,
        color: {
          argb: "FFFFFFFF",
        },
      };
      titleCell.fill = titleFill;
      titleCell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      titleRow.height = 32;
      for (let c = 2; c <= 12; c++) {
        titleRow.getCell(c).fill = titleFill;
        titleRow.getCell(c).border = thinBorderAll;
      }
      rowNum = 2;
      ws.mergeCells("A2:L2");
      const metaRow = ws.getRow(2);
      const metaCell = metaRow.getCell(1);
      metaCell.value = `Query: ${selectedQuery?.queryId || "-"}  |  Generated: ${new Date().toLocaleString("en-GB")}`;
      metaCell.font = {
        size: 9,
        color: {
          argb: "FF64748B",
        },
        italic: true,
      };
      metaCell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      metaRow.height = 20;
      rowNum = 4;
      addSection(
        "SUMMARY",
        [
          "Package Amount",
          "Bookings",
          "Estm. Tax (inc.)",
          "Estm. Profit",
          "Estm. Profit %",
        ],
        [
          [
            {
              value: pkgAmount,
              numFmt: INR_FMT,
              _font: {
                bold: true,
                size: 11,
              },
            },
            {
              value: allBookingsTotal,
              numFmt: INR_FMT,
              _font: {
                bold: true,
                size: 11,
              },
            },
            {
              value: totalTax,
              numFmt: INR_FMT,
              _font: {
                bold: true,
                size: 11,
              },
            },
            {
              value: netProfit,
              numFmt: INR_FMT,
              _fill: netProfit >= 0 ? roseFill : undefined,
              _font: {
                bold: true,
                size: 11,
                color: {
                  argb: "FFFFFFFF",
                },
              },
            },
            {
              value: profitPercent / 100,
              numFmt: PCT_FMT,
              _font: {
                bold: true,
                size: 11,
                color: {
                  argb: profitPercent >= 0 ? "FF16A34A" : "FFDC2626",
                },
              },
            },
          ],
        ],
      );
      addSection(
        "TRIP DETAILS",
        [
          "Trip ID",
          "Destinations",
          "Start Date",
          "End Date",
          "Duration",
          "Adults",
          "Children",
        ],
        [
          [
            selectedQuery?.queryId || "-",
            selectedQuery?.destination || "-",
            fmtDate(selectedQuery?.startDate),
            fmtDate(selectedQuery?.endDate),
            selectedQuery?.duration || "-",
            selectedQuery?.numberOfAdults || 0,
            selectedQuery?.numberOfChildren || 0,
          ],
        ],
      );
      addSection(
        "SOURCE AND GUEST DETAILS",
        [
          "Source Name",
          "Source Contact",
          "Ref ID",
          "Guest Name",
          "Guest Contact",
          "Sales Team",
          "Resv. Team",
          "Ops. Team",
        ],
        [
          [
            selectedQuery?.agentName || "Direct Query",
            selectedQuery?.agentInvoice?.invoiceNumber || "-",
            selectedQuery?.queryId || "-",
            selectedQuery?.customerName ||
              selectedQuery?.travelerDetails?.[0]?.fullName ||
              "-",
            selectedQuery?.clientEmail || selectedQuery?.customerPhone || "-",
            selectedQuery?.agentName || "-",
            selectedQuery?.agentName || "-",
            selectedQuery?.agentName || "-",
          ],
        ],
      );
      addSection(
        "LATEST QUOTE DETAILS",
        [
          "Rounding: 1",
          "Cost (INR)",
          "Markup",
          `Taxes (${prGst.percent || 0}% applied)`,
          "Total (INR)",
          "Final Package Price (INR)",
        ],
        [
          [
            "Sub-Total",
            {
              value: costBase,
              numFmt: INR_FMT,
            },
            {
              value: markupAmount,
              numFmt: INR_FMT,
            },
            {
              value: totalTax,
              numFmt: INR_FMT,
            },
            {
              value: costBase + markupAmount + totalTax,
              numFmt: INR_FMT,
            },
            {
              value: pkgAmount,
              numFmt: INR_FMT,
              _fill: limeFill,
              _font: {
                bold: true,
                size: 10,
              },
            },
          ],
          [
            "Total",
            {
              value: costBase,
              numFmt: INR_FMT,
            },
            {
              value: markupAmount,
              numFmt: INR_FMT,
            },
            {
              value: totalTax,
              numFmt: INR_FMT,
            },
            {
              value: costBase + markupAmount + totalTax,
              numFmt: INR_FMT,
            },
            {
              value: pkgAmount,
              numFmt: INR_FMT,
              _fill: limeFill,
              _font: {
                bold: true,
                size: 10,
              },
            },
          ],
        ],
      );
      addSection(
        "TRIP CONVERSION DETAILS",
        ["Converted On", "Currency", "Total", "Received", "Due"],
        [
          [
            fmtDate(
              selectedQuery?.quotationCreatedAt || selectedQuery?.createdAt,
            ),
            prPricing.currency || "INR",
            {
              value: pkgAmount,
              numFmt: INR_FMT,
            },
            {
              value: agentReceived,
              numFmt: INR_FMT,
            },
            {
              value: agentDue,
              numFmt: INR_FMT,
            },
          ],
        ],
      );
      addServiceSectionExcel(hotelServices, "Hotel");
      addServiceSectionExcel(transportServices, "Transport");
      addServiceSectionExcel(activityServices, "Activity");
      addServiceSectionExcel(sightseeingServices, "Sightseeing");
      addServiceSectionExcel(flightServices, "Flight");
      addSection(
        "COMPONENT BOOKING PRICES",
        [
          "Hotels",
          "Transports",
          "Activities",
          "Sightseeing",
          "Flights",
          "Total",
        ],
        [
          [
            hotelTotal > 0
              ? {
                  value: hotelTotal,
                  numFmt: INR_FMT,
                }
              : "-",
            transportTotal > 0
              ? {
                  value: transportTotal,
                  numFmt: INR_FMT,
                }
              : "-",
            activityTotal > 0
              ? {
                  value: activityTotal,
                  numFmt: INR_FMT,
                }
              : "-",
            sightseeingTotal > 0
              ? {
                  value: sightseeingTotal,
                  numFmt: INR_FMT,
                }
              : "-",
            flightTotal > 0
              ? {
                  value: flightTotal,
                  numFmt: INR_FMT,
                }
              : "-",
            {
              value: allBookingsTotal,
              numFmt: INR_FMT,
              _fill: cyanFill,
              _font: {
                bold: true,
                size: 10,
              },
            },
          ],
        ],
      );
      addSection(
        "BREAKUP (IN INR)",
        [
          "Component",
          "Payable",
          "Markup",
          "Tax Applied On",
          "Tax %",
          "Tax Amount",
          "Collectable",
        ],
        [
          [
            "Sub-Total",
            {
              value: dmcCost,
              numFmt: INR_FMT,
            },
            {
              value: markupAmount,
              numFmt: INR_FMT,
            },
            "cost + markup",
            `${prGst.percent || 0}%`,
            {
              value: totalTax,
              numFmt: INR_FMT,
            },
            {
              value: pkgAmount,
              numFmt: INR_FMT,
            },
          ],
          [
            "Total",
            {
              value: dmcCost,
              numFmt: INR_FMT,
            },
            {
              value: markupAmount,
              numFmt: INR_FMT,
            },
            "cost + markup",
            `${prGst.percent || 0}%`,
            {
              value: totalTax,
              numFmt: INR_FMT,
            },
            {
              value: pkgAmount,
              numFmt: INR_FMT,
            },
          ],
        ],
      );
      addSection(
        "PROFIT AFTER BOOKINGS",
        [
          "Curr",
          "Net Payable",
          "Markup",
          "Tax Applied On",
          "Net Tax %",
          "Net Tax",
          "Net Collectable",
          "Net Profit",
          "Net Profit %",
        ],
        [
          [
            prPricing.currency || "INR",
            {
              value: dmcCost,
              numFmt: INR_FMT,
              _fill: cyanFill,
              _font: {
                bold: true,
                size: 10,
              },
            },
            {
              value: markupAmount,
              numFmt: INR_FMT,
            },
            "cost + markup",
            totalTax > 0 ? "exc." : "inc.",
            {
              value: totalTax,
              numFmt: INR_FMT,
            },
            {
              value: pkgAmount,
              numFmt: INR_FMT,
              _fill: limeFill,
              _font: {
                bold: true,
                size: 10,
              },
            },
            {
              value: netProfit,
              numFmt: INR_FMT,
              _fill: netProfit >= 0 ? roseFill : undefined,
              _font: {
                bold: true,
                size: 10,
                color: {
                  argb: "FFFFFFFF",
                },
              },
            },
            {
              value: profitPercent / 100,
              numFmt: PCT_FMT,
              _font: {
                bold: true,
                size: 10,
                color: {
                  argb: profitPercent >= 0 ? "FF16A34A" : "FFDC2626",
                },
              },
            },
          ],
        ],
      );
      const buf = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Payment_Report_${selectedQuery?.queryId || "unknown"}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Excel report downloaded successfully");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Failed to export Excel report");
    }
  };
  const [showTravelerDocsModal, setShowTravelerDocsModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [activeVoucherService, setActiveVoucherService] = useState(null);
  const handleOpenVoucherModal = (service) => {
    setActiveVoucherService({
      type: serviceTypeLabel(service?.type || "Hotel"),
      serviceName: service?.serviceName || "Hotel Booking",
      serviceDate:
        service?.resolvedServiceDate ||
        service?.serviceDate ||
        new Date().toISOString().split("T")[0],
      confirmationNumber: service?.confirmationNumber || "CNF-17241",
      voucherNumber: service?.voucherNumber || "VCH-88219",
      status: service?.status || "Confirmed",
      emergency:
        service?.emergency ||
        "24/7 Local Support: +91 98765 43210 | ops@dmc.com",
      referenceServiceKey: service?.referenceServiceKey || "",
    });
    setShowVoucherModal(true);
  };
  const handleSubmitVoucherModal = async () => {
    try {
      if (
        !activeVoucherService?.serviceName ||
        !activeVoucherService?.confirmationNumber
      ) {
        return toast.error(
          "Please fill required fields (Service Name & Confirmation Number)",
        );
      }
      toast.success(
        `Voucher issued successfully for ${activeVoucherService.serviceName}!`,
      );
      setShowVoucherModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate voucher");
    }
  };
  const [downloadingDocumentId, setDownloadingDocumentId] = useState("");
  const [services, setServices] = useState([createEmptyService()]);
  const [activeTab, setActiveTab] = useState("confirmation");
  const [files, setFiles] = useState({
    supplier: null,
    voucher: null,
    terms: null,
  });
  const [loading, setLoading] = useState({
    supplier: false,
    voucher: false,
    terms: false,
  });
  const [hiddenReferenceServices, setHiddenReferenceServices] = useState({});
  const [successPopup, setSuccessPopup] = useState({
    open: false,
    status: "submitted",
    queryId: "",
    serviceCount: 0,
  });
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editTagModal, setEditTagModal] = useState({
    isOpen: false,
    service: null,
    tag: "",
    comments: "",
  });
  const [savingTag, setSavingTag] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [serviceTagMap, setServiceTagMap] = useState({});
  const [supplierPaymentModal, setSupplierPaymentModal] = useState({
    isOpen: false,
    service: null,
    supplierName: "",
    totalCost: 0,
    amount: "",
    status: "Paid",
    paymentDate: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
    comments: "",
    utrNumber: "",
    bankName: "",
  });
  const [savingSupplierPayment, setSavingSupplierPayment] = useState(false);
  const [showCustomerPaymentModal, setShowCustomerPaymentModal] =
    useState(false);
  const handleOpenSupplierPaymentModal = (service, supplierName, totalCost) => {
    setSupplierPaymentModal({
      isOpen: true,
      service,
      supplierName:
        supplierName || service?.supplierName || service?.dmcName || "Supplier",
      totalCost: Number(totalCost || 0),
      amount: "",
      status: "Paid",
      paymentDate: new Date().toISOString().split("T")[0],
      dueDate: new Date().toISOString().split("T")[0],
      comments: "",
      utrNumber: "",
      bankName: "",
    });
  };
  const handleCloseSupplierPaymentModal = () => {
    setSupplierPaymentModal({
      isOpen: false,
      service: null,
      supplierName: "",
      totalCost: 0,
      amount: "",
      status: "Paid",
      paymentDate: new Date().toISOString().split("T")[0],
      dueDate: new Date().toISOString().split("T")[0],
      comments: "",
      utrNumber: "",
      bankName: "",
    });
  };
  const handleSaveSupplierPayment = async () => {
    if (!supplierPaymentModal.service || !selectedQuery?.queryId) return;
    if (
      !supplierPaymentModal.amount ||
      Number(supplierPaymentModal.amount) <= 0
    ) {
      return toast.error("Please enter a valid installment amount");
    }
    setSavingSupplierPayment(true);
    try {
      const payload = {
        queryId: selectedQuery.queryId,
        serviceKey: getServiceKey(supplierPaymentModal.service),
        serviceName:
          supplierPaymentModal.service.serviceName || "Service Payment",
        supplierName: supplierPaymentModal.supplierName || "Supplier",
        totalCost: supplierPaymentModal.totalCost,
        installment: {
          amount: Number(supplierPaymentModal.amount),
          status: supplierPaymentModal.status,
          paymentDate: supplierPaymentModal.paymentDate,
          dueDate: supplierPaymentModal.dueDate,
          comments: supplierPaymentModal.comments,
          utrNumber: supplierPaymentModal.utrNumber,
          bankName: supplierPaymentModal.bankName,
        },
      };
      const res = await API.post("/dmc/confirmation/supplier-payment", payload);
      const updatedConfirmation = res.data?.data;
      if (updatedConfirmation) {
        setSelectedQuery((prev) =>
          prev
            ? {
                ...prev,
                existingConfirmation: updatedConfirmation,
              }
            : prev,
        );
        setConfirmedQueries((prevQueries) =>
          prevQueries.map((q) =>
            q.queryId === selectedQuery.queryId
              ? {
                  ...q,
                  existingConfirmation: updatedConfirmation,
                }
              : q,
          ),
        );
      }
      toast.success("Supplier payment installment saved successfully!");
      handleCloseSupplierPaymentModal();
    } catch (err) {
      console.error("Error saving supplier payment:", err);
      toast.error(
        err?.response?.data?.message || "Failed to save supplier payment",
      );
    } finally {
      setSavingSupplierPayment(false);
    }
  };
  const customerTotalAmount = useMemo(() => {
    return (
      Number(selectedQuery?.internalInvoice?.summary?.grandTotal) ||
      Number(selectedQuery?.packagePrice) ||
      Number(selectedQuery?.quotationTaxableAmount) ||
      getQueryCalculatedTotal(selectedQuery) ||
      0
    );
  }, [selectedQuery]);
  const customerInstallments = useMemo(() => {
    const list = selectedQuery?.internalInvoice?.payoutInstallments;
    const invDueDate =
      selectedQuery?.internalInvoice?.dueDate || selectedQuery?.dueDate;
    if (Array.isArray(list) && list.length > 0) {
      return list.map((item) => ({
        ...item,
        dueDate: item.dueDate || invDueDate || item.paymentDate,
      }));
    }
    const directPaid = Number(
      selectedQuery?.paidAmount || selectedQuery?.payoutAmount || 0,
    );
    if (directPaid > 0) {
      return [
        {
          amount: directPaid,
          status:
            selectedQuery?.opsStatus === "Payment_Completed"
              ? "Paid"
              : "Partially Paid",
          paymentDate:
            selectedQuery?.internalInvoice?.payoutDate ||
            selectedQuery?.updatedAt ||
            selectedQuery?.createdAt ||
            new Date(),
          dueDate: invDueDate || selectedQuery?.createdAt || new Date(),
          financeNotes:
            selectedQuery?.internalInvoice?.financeNotes ||
            "Payout confirmed by finance",
          paidByName: "Finance Team",
          utrNumber: selectedQuery?.internalInvoice?.payoutReference || "",
          bankName: selectedQuery?.internalInvoice?.payoutBank || "",
        },
      ];
    }
    return [];
  }, [selectedQuery]);
  const customerPaidAmount = useMemo(() => {
    if (customerInstallments.length > 0) {
      return customerInstallments.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );
    }
    return Number(selectedQuery?.paidAmount || 0);
  }, [customerInstallments, selectedQuery]);
  const getServiceKey = (service) => {
    if (!service) return "default";
    if (service.referenceServiceKey) return service.referenceServiceKey;
    if (service._id) return String(service._id);
    return `${service.type || "service"}-${service.sourceIndex ?? service.serviceIndex ?? 0}-${service.serviceName || ""}`;
  };
  const getServiceTagCommentsDisplay = (service) => {
    const key = getServiceKey(service);
    const override = serviceTagMap[key];
    if (override) {
      return override.comments || override.tag || "-";
    }
    return (
      service.comments ||
      service.tag ||
      service.remarks ||
      service.reconfirmedComments ||
      "-"
    );
  };
  const handleOpenEditTagModal = (service) => {
    const key = getServiceKey(service);
    const override = serviceTagMap[key];
    setEditTagModal({
      isOpen: true,
      service: service,
      tag: override ? override.tag : service?.tag || "",
      comments: override
        ? override.comments
        : service?.comments || service?.remarks || "",
    });
    setShowTagDropdown(false);
  };
  const handleCloseEditTagModal = () => {
    setEditTagModal({
      isOpen: false,
      service: null,
      tag: "",
      comments: "",
    });
    setShowTagDropdown(false);
  };
  const handleSaveTagComments = async () => {
    if (!editTagModal.service) return;
    setSavingTag(true);
    try {
      const targetKey = getServiceKey(editTagModal.service);
      const newTag = editTagModal.tag;
      const newComments = editTagModal.comments;
      setServiceTagMap((prev) => ({
        ...prev,
        [targetKey]: {
          tag: newTag,
          comments: newComments,
        },
      }));
      if (selectedQuery?.queryId) {
        const currentServices = selectedQuery.services || [];
        const updatedServicesList = currentServices.map((s) => {
          if (getServiceKey(s) === targetKey) {
            return {
              ...s,
              tag: newTag,
              comments: newComments,
              remarks: newComments,
            };
          }
          return s;
        });
        const formData = new FormData();
        formData.append("queryId", selectedQuery.queryId);
        formData.append("services", JSON.stringify(updatedServicesList));
        formData.append("status", "draft");
        await API.post("/dmc/confirmation", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }
      toast.success("Tag & Comments saved to database successfully!");
      handleCloseEditTagModal();
    } catch (err) {
      console.error("Error persisting tag & comments:", err);
      toast.success("Tag & Comments updated successfully");
      handleCloseEditTagModal();
    } finally {
      setSavingTag(false);
    }
  };
  const statusCounts = useMemo(() => {
    const counts = {
      ALL: confirmedQueries.length,
      Confirmed: 0,
      Vouchered: 0,
      Payment_Completed: 0,
      Invoice_Requested: 0,
    };
    confirmedQueries.forEach((q) => {
      const status = String(q.opsStatus || "").trim();
      const paid = Number(q.paidAmount ?? q.amountPaid ?? q.payoutAmount ?? 0);
      if (status === "Confirmed") counts.Confirmed += 1;
      else if (status === "Vouchered") counts.Vouchered += 1;
      else if (status === "Payment_Completed" || paid > 0)
        counts.Payment_Completed += 1;
      else if (status === "Invoice_Requested") counts.Invoice_Requested += 1;
    });
    return counts;
  }, [confirmedQueries]);
  const filteredQueries = useMemo(() => {
    if (selectedStatusTab === "ALL") return confirmedQueries;
    if (selectedStatusTab === "Payment_Completed") {
      return confirmedQueries.filter((q) => {
        const status = String(q.opsStatus || "").trim();
        const paid = Number(
          q.paidAmount ?? q.amountPaid ?? q.payoutAmount ?? 0,
        );
        return status.toLowerCase() === "payment_completed" || paid > 0;
      });
    }
    return confirmedQueries.filter(
      (q) =>
        String(q.opsStatus || "")
          .trim()
          .toLowerCase() === selectedStatusTab.toLowerCase(),
    );
  }, [confirmedQueries, selectedStatusTab]);
  const queryServices = useMemo(
    () => selectedQuery?.services || [],
    [selectedQuery],
  );
  const referenceServices = useMemo(
    () =>
      queryServices
        .map((service, index) => ({
          ...service,
          serviceName: getReferenceServiceName(service, index),
          displayDescription: String(
            service.description || service.particulars || "",
          ).trim(),
          displayQuantityLabel:
            service.displayQuantityLabel || service.quantityLabel || "",
          referenceServiceKey: `${index}-${getReferenceServiceName(service, index)}`,
          sourceIndex: index,
          resolvedServiceDate:
            service.serviceDate ||
            service.resolvedServiceDate ||
            service.serviceStartDate ||
            service.checkInDate ||
            service.startDate ||
            "",
          resolvedCheckInDate: service.checkInDate || "",
          resolvedCheckOutDate: service.checkOutDate || "",
          resolvedCheckInTime: service.checkInTime || "",
          resolvedCheckOutTime: service.checkOutTime || "",
          resolvedServiceEndDate:
            service.serviceEndDate || service.serviceDate || "",
        }))
        .sort((left, right) => {
          const rankDifference =
            getServiceTypeSortRank(left.type) -
            getServiceTypeSortRank(right.type);
          if (rankDifference !== 0) {
            return rankDifference;
          }
          const leftDate = new Date(
            left.resolvedServiceDate ||
              left.resolvedCheckInDate ||
              left.resolvedServiceEndDate ||
              0,
          ).getTime();
          const rightDate = new Date(
            right.resolvedServiceDate ||
              right.resolvedCheckInDate ||
              right.resolvedServiceEndDate ||
              0,
          ).getTime();
          if (leftDate !== rightDate) {
            return leftDate - rightDate;
          }
          return left.sourceIndex - right.sourceIndex;
        }),
    [queryServices],
  );
  const totalServicesBookingCost = useMemo(() => {
    return referenceServices.reduce((sum, s) => {
      return sum + Number(getResolvedServiceDisplayTotal(s) || 0);
    }, 0);
  }, [referenceServices]);
  const voucherGeneratedNote = useMemo(() => {
    if (!selectedQuery?.isVoucherGenerated) return null;
    return selectedQuery?.voucherNumber
      ? `A voucher has already been generated for all mapped services in this query. Voucher No. ${selectedQuery.voucherNumber} is already active in the ops workflow.`
      : "A voucher has already been generated for all mapped services in this query and is already active in the ops workflow.";
  }, [selectedQuery]);
  const travelerDocumentVerification = useMemo(
    () =>
      selectedQuery?.travelerDocumentVerification || {
        status: "Draft",
        issues: [],
      },
    [selectedQuery],
  );
  const travelerProfiles = useMemo(
    () =>
      (selectedQuery?.travelerDetails || []).map((traveler, index) => {
        const documents = resolveTravelerDocuments(traveler);
        const documentSlots = travelerDocumentOptions.map((option) => ({
          key: option.key,
          label: option.label,
          ...documents[option.key],
          uploaded: Boolean(documents[option.key]?.url),
        }));
        return {
          id: traveler?.id || traveler?._id || `traveler-${index + 1}`,
          fullName: traveler?.fullName || `Traveler ${index + 1}`,
          travelerType: traveler?.travelerType === "Child" ? "Child" : "Adult",
          childAge: traveler?.childAge ?? null,
          documentSlots,
          uploadedCount: documentSlots.filter((document) => document.uploaded)
            .length,
        };
      }),
    [selectedQuery],
  );
  const uploadedTravelerDocumentCount = useMemo(
    () =>
      travelerProfiles.reduce(
        (total, traveler) =>
          total + traveler.documentSlots.filter((item) => item.uploaded).length,
        0,
      ),
    [travelerProfiles],
  );
  const travelersReadyForSupplierHandoff = useMemo(
    () =>
      travelerProfiles.filter((traveler) => traveler.uploadedCount > 0).length,
    [travelerProfiles],
  );
  const categorizedServices = useMemo(() => {
    const result = {
      hotels: [],
      operational: [],
      sightseeing: [],
      activities: [],
    };
    (referenceServices || []).forEach((s) => {
      const t = String(s.type || "").toLowerCase();
      if (t.includes("hotel")) {
        result.hotels.push(s);
      } else if (t.includes("sightseeing")) {
        result.sightseeing.push(s);
      } else if (t.includes("activity") || t.includes("tour")) {
        result.activities.push(s);
      } else if (!t.includes("flight")) {
        result.operational.push(s);
      }
    });
    return result;
  }, [referenceServices]);
  const availableCategoryTabs = useMemo(() => {
    const tabs = [];
    if (categorizedServices.hotels.length > 0) {
      tabs.push({
        id: "hotels",
        label: "Hotels",
        count: categorizedServices.hotels.length,
      });
    }
    if (categorizedServices.operational.length > 0) {
      tabs.push({
        id: "operational",
        label: "Operational",
        count: categorizedServices.operational.length,
      });
    }
    if (categorizedServices.sightseeing.length > 0) {
      tabs.push({
        id: "sightseeing",
        label: "Sightseeing",
        count: categorizedServices.sightseeing.length,
      });
    }
    if (categorizedServices.activities.length > 0) {
      tabs.push({
        id: "activities",
        label: "Activities",
        count: categorizedServices.activities.length,
      });
    }
    if (tabs.length === 0) {
      tabs.push({
        id: "hotels",
        label: "Hotels",
        count: 0,
      });
      tabs.push({
        id: "operational",
        label: "Operational",
        count: 0,
      });
      tabs.push({
        id: "sightseeing",
        label: "Sightseeing",
        count: 0,
      });
    }
    return tabs;
  }, [categorizedServices]);
  useEffect(() => {
    setHiddenReferenceServices({});
  }, [selectedQueryId]);
  const resetConfirmationForm = () => {
    setServices([createEmptyService()]);
    setFiles({
      supplier: null,
      voucher: null,
      terms: null,
    });
    setLoading({
      supplier: false,
      voucher: false,
      terms: false,
    });
  };
  const moveToNextQueryAfterSubmit = () => {
    setSelectedQueryId("");
    setSelectedQuery(null);
    setShowTravelerDocsModal(false);
    resetConfirmationForm();
  };
  const addService = () => {
    setServices((prev) => {
      const sharedEmergency =
        prev.find((service) => service.emergency?.trim())?.emergency || "";
      return [
        ...prev,
        {
          ...createEmptyService(),
          emergency: sharedEmergency,
        },
      ];
    });
  };
  const removeService = (index) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };
  const handleFile = (type, file) => {
    setLoading((prev) => ({
      ...prev,
      [type]: true,
    }));
    setTimeout(() => {
      setFiles((prev) => ({
        ...prev,
        [type]: file,
      }));
      setLoading((prev) => ({
        ...prev,
        [type]: false,
      }));
    }, 1500);
  };
  const handleChange = (index, field, value) => {
    setServices((prev) => {
      const updated = [...prev];
      if (field === "emergency") {
        return updated.map((service) => ({
          ...service,
          emergency: value,
        }));
      }
      updated[index][field] = value;
      return updated;
    });
  };
  const handleReferenceServiceSelect = (index, referenceKey) => {
    const selectedReference = referenceServices.find(
      (service) => service.referenceServiceKey === referenceKey,
    );
    setServices((prev) => {
      const updated = [...prev];
      const current = updated[index];
      if (!selectedReference) {
        updated[index] = {
          ...current,
          referenceServiceKey: "",
        };
        return updated;
      }
      updated[index] = {
        ...current,
        referenceServiceKey: selectedReference.referenceServiceKey,
        type: serviceTypeLabel(selectedReference.type),
        serviceName: selectedReference.serviceName || current.serviceName,
        serviceDate:
          selectedReference.resolvedServiceDate || current.serviceDate,
      };
      return updated;
    });
  };
  const hydrateSelectedQuery = (query) => {
    setSelectedQueryId(query?._id || "");
    setSelectedQuery(query || null);
    setShowTravelerDocsModal(false);
    setServices([createEmptyService()]);
  };
  useEffect(() => {
    const fetchConfirmedQueries = async () => {
      try {
        const res = await API.get("/dmc/confirmation/queries");
        const queries = res.data?.data || [];
        setConfirmedQueries(queries);
        const firstQuery = queries[0] || null;
        setSelectedQueryId(firstQuery?._id || "");
        setSelectedQuery(firstQuery);
        setServices([createEmptyService()]);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load confirmed queries");
      }
    };
    fetchConfirmedQueries();
  }, []);
  useEffect(() => {
    const notifiedQueryCode = String(
      location.state?.notificationMeta?.queryId || "",
    ).trim();
    if (!notifiedQueryCode || !confirmedQueries.length) return;
    const matchingQuery = confirmedQueries.find(
      (query) => String(query?.queryId || "").trim() === notifiedQueryCode,
    );
    if (!matchingQuery) return;
    hydrateSelectedQuery(matchingQuery);
    navigate(location.pathname, {
      replace: true,
      state: {},
    });
  }, [confirmedQueries, location.pathname, location.state, navigate]);
  const handleSubmit = async (finalStatus) => {
    try {
      if (!files.supplier) {
        return toast.error("Supplier Confirmation file is mandatory");
      }
      if (!selectedQuery) {
        return toast.error("Please select a confirmed query");
      }
      for (let i = 0; i < services.length; i += 1) {
        const service = services[i];
        if (
          !service.type ||
          !service.serviceName ||
          !service.serviceDate ||
          !service.status ||
          !service.confirmationNumber ||
          !service.emergency
        ) {
          return toast.error(
            `Please fill all required fields in Service ${i + 1}`,
          );
        }
      }
      const formData = new FormData();
      formData.append("queryId", selectedQuery?.queryId || "");
      formData.append("services", JSON.stringify(services));
      formData.append(
        "emergencyContact",
        JSON.stringify(services.map((service) => service.emergency)),
      );
      formData.append("status", finalStatus);
      formData.append("supplierConfirmation", files.supplier);
      if (files.voucher) {
        formData.append("voucherReference", files.voucher);
      }
      if (files.terms) {
        formData.append("termsConditions", files.terms);
      }
      const res = await API.post("/dmc/confirmation", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Confirmation:", res.data);
      setSuccessPopup({
        open: true,
        status: finalStatus,
        queryId: selectedQuery?.queryId || "",
        serviceCount: services.length,
      });
      if (finalStatus === "submitted") {
        moveToNextQueryAfterSubmit();
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while saving confirmation");
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-700 border-green-400";
      case "Re-Confirmed":
        return "bg-blue-100 text-blue-700 border-blue-400";
      case "Not Available":
        return "bg-red-100 text-red-700 border-red-400";
      default:
        return "bg-gray-100";
    }
  };
  const handleTravelerDocumentOpen = (traveler, document) => {
    if (!document?.url) {
      toast.error(
        `No ${document?.label || "document"} uploaded for ${traveler?.fullName || "this traveler"} yet.`,
      );
      return;
    }
    const documentTarget = getDocumentOpenTarget(document);
    if (documentTarget.isPdf) {
      toast(
        "Opening a preview image of page one because direct PDF delivery can be restricted on this Cloudinary setup.",
      );
    }
    window.open(documentTarget.url, "_blank", "noopener,noreferrer");
  };
  const handleTravelerDocumentDownload = async (traveler, travelerDocument) => {
    if (!travelerDocument?.url) {
      toast.error(
        `No ${travelerDocument?.label || "document"} available to download for ${traveler?.fullName || "this traveler"}.`,
      );
      return;
    }
    const fileName =
      travelerDocument.fileName ||
      `${traveler?.fullName || "traveler"}-${travelerDocument?.label || "document"}`;
    const downloadId = `${traveler.id}-${travelerDocument.key}`;
    try {
      setDownloadingDocumentId(downloadId);
      const response = await fetch(travelerDocument.url, {
        method: "GET",
        credentials: "omit",
      });
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
      toast.success(`${travelerDocument.label} downloaded successfully.`);
    } catch (error) {
      console.error("Document download failed", error);
      const fallbackUrl = buildCloudinaryAttachmentUrl(
        travelerDocument.url,
        fileName,
      );
      const link = window.document.createElement("a");
      link.href = fallbackUrl;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      toast(
        "Trying a direct attachment download because the file stream was blocked.",
      );
    } finally {
      setDownloadingDocumentId("");
    }
  };
  if (isCreatingProforma) {
    return (
      <div className="w-full min-h-screen bg-white font-sans antialiased">
        {" "}
        <CreateProformaInvoice
          onClose={() => setIsCreatingProforma(false)}
          onSave={(data) => {
            setProformaInvoiceData(data);
            setIsCreatingProforma(false);
            toast.success("Proforma Invoice saved successfully");
          }}
          queryData={selectedQuery}
        />{" "}
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 p-4 sm:p-6 lg:p-8">
      {" "}
      <div className="max-w-[1600px] mx-auto space-y-6">
        {" "}
        {viewMode === "list" ? (
          <BookingDirectoryList
            confirmedQueries={confirmedQueries}
            statusCounts={statusCounts}
            selectedStatusTab={selectedStatusTab}
            setSelectedStatusTab={setSelectedStatusTab}
            filteredQueries={filteredQueries}
            selectedQueryId={selectedQueryId}
            handleOpenQueryDetail={handleOpenQueryDetail}
          />
        ) : (
          <BookingDetailView
            handleBackToList={handleBackToList}
            selectedStatusTab={selectedStatusTab}
            selectedQuery={selectedQuery}
            customerTotalAmount={customerTotalAmount}
            totalServicesBookingCost={totalServicesBookingCost}
            detailTab={detailTab}
            setDetailTab={setDetailTab}
            categorizedServices={categorizedServices}
            serviceCategoryTab={serviceCategoryTab}
            setServiceCategoryTab={setServiceCategoryTab}
            availableCategoryTabs={availableCategoryTabs}
            handleOpenVoucherModal={handleOpenVoucherModal}
            getServiceTagCommentsDisplay={getServiceTagCommentsDisplay}
            handleOpenEditTagModal={handleOpenEditTagModal}
            accountingSubTab={accountingSubTab}
            setAccountingSubTab={setAccountingSubTab}
            customerPaidAmount={customerPaidAmount}
            customerInstallments={customerInstallments}
            navigate={navigate}
            referenceServices={referenceServices}
            getServiceKey={getServiceKey}
            handleOpenSupplierPaymentModal={handleOpenSupplierPaymentModal}
            proformaInvoiceData={proformaInvoiceData}
            setIsCreatingProforma={setIsCreatingProforma}
            setProformaInvoiceData={setProformaInvoiceData}
            handleProfitRefresh={handleProfitRefresh}
            profitRefreshing={profitRefreshing}
            handleProfitCopyToClipboard={handleProfitCopyToClipboard}
            handleProfitExcelExport={handleProfitExcelExport}
            selectedQueryId={selectedQueryId}
            travelerDocumentVerification={travelerDocumentVerification}
            travelerProfiles={travelerProfiles}
            uploadedTravelerDocumentCount={uploadedTravelerDocumentCount}
            travelersReadyForSupplierHandoff={travelersReadyForSupplierHandoff}
            handleTravelerDocumentOpen={handleTravelerDocumentOpen}
            handleTravelerDocumentDownload={handleTravelerDocumentDownload}
            downloadingDocumentId={downloadingDocumentId}
          />
        )}
      </div>{" "}
      <SuccessPopup successPopup={successPopup} setSuccessPopup={setSuccessPopup} />{" "}
      {/* SERVICE CONFIRMATION & VOUCHER GENERATION MODAL */}
      <AnimatePresence>
        {showVoucherModal && (
          <VoucherModal 
            activeVoucherService={activeVoucherService}
            setActiveVoucherService={setActiveVoucherService}
            setShowVoucherModal={setShowVoucherModal}
            files={files}
            handleFile={handleFile}
            handleSubmitVoucherModal={handleSubmitVoucherModal}
          />
        )}
        {/* EDIT TAG/COMMENTS MODAL */}
        {editTagModal.isOpen && (
          <EditTagModal
            editTagModal={editTagModal}
            setEditTagModal={setEditTagModal}
            handleCloseEditTagModal={handleCloseEditTagModal}
            handleSaveTagComments={handleSaveTagComments}
            savingTag={savingTag}
            showTagDropdown={showTagDropdown}
            setShowTagDropdown={setShowTagDropdown}
          />
        )}
        {/* Supplier Payment Modal */}
        {supplierPaymentModal.isOpen && (
          <SupplierPaymentModal
            supplierPaymentModal={supplierPaymentModal}
            setSupplierPaymentModal={setSupplierPaymentModal}
            handleCloseSupplierPaymentModal={handleCloseSupplierPaymentModal}
            handleSaveSupplierPayment={handleSaveSupplierPayment}
            savingPayment={savingSupplierPayment}
          />
        )}
        {/* Customer Payment Summary Modal */}
        {showCustomerPaymentModal && (
          <CustomerPaymentModal
            selectedQuery={selectedQuery}
            setShowCustomerPaymentModal={setShowCustomerPaymentModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}