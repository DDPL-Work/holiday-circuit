import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { ArrowLeft, Pencil, RotateCw, Copy, FileText, Trash2, Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { resolveClientDetails } from "./CreateProformaInvoice";

// Utility to convert numbers to English words (e.g. 69000 -> Sixty-Nine Thousand Only)
const numberToWords = (num) => {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? "-" + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
  };

  const val = Math.round(Number(num || 0));
  if (val === 0) return "Zero Only";
  return `${inWords(val)} Only`;
};

// The PDF is rasterised one A4 page at a time. Keep terms in deliberately
// small, readable chunks so no text is clipped at the end of the canvas.
// A continuation page has much more room than the invoice page, whose top
// section contains the billing details and totals.
const FIRST_PAGE_TERMS_LINE_CAPACITY = 50;
const TERMS_PAGE_LINE_CAPACITY = 110;

const escapePdfHtml = (value) => String(value || "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#039;");

const estimateTermLines = (term) => {
  const lines = String(term || "").split(/\r?\n/);
  return lines.reduce(
    (total, line) => total + Math.max(1, Math.ceil(line.trim().length / 88)) + 1,
    0,
  );
};

const takeTermsForPage = (terms = [], lineCapacity) => {
  const pageTerms = [];
  let usedLines = 0;

  for (let index = 0; index < terms.length; index += 1) {
    const linesNeeded = estimateTermLines(terms[index]);
    if (pageTerms.length && usedLines + linesNeeded > lineCapacity) {
      return { pageTerms, remainingTerms: terms.slice(index) };
    }
    pageTerms.push(terms[index]);
    usedLines += linesNeeded;
  }

  return { pageTerms, remainingTerms: [] };
};

const splitTermsAcrossPages = (terms = [], lineCapacity = TERMS_PAGE_LINE_CAPACITY) => {
  const pages = [];
  let page = [];
  let usedLines = 0;

  terms.forEach((term) => {
    const linesNeeded = estimateTermLines(term);
    if (page.length && usedLines + linesNeeded > lineCapacity) {
      pages.push(page);
      page = [];
      usedLines = 0;
    }
    page.push(term);
    usedLines += linesNeeded;
  });

  if (page.length) pages.push(page);
  return pages;
};

const buildInvoiceCleanHtml = ({
  sellerLogo,
  sellerDetails,
  buyerDetails,
  issueDate,
  dueDate,
  queryId,
  overview,
  items,
  calculateItemBase,
  getItemTaxesList,
  calculateSingleTax,
  grandTotal,
  bankDetails,
  hasBankDetails,
  invoiceData,
}) => {
  const renderedTableRows = items
    .map((item, idx) => {
      const base = calculateItemBase(item);
      const taxesList = getItemTaxesList(item);

      const mainRow = `
        <tr style="border-bottom: 1px solid #7dd3c7;">
          <td style="padding: 6px 8px; text-align: center; vertical-align: top; border-right: 1px solid #7dd3c7; font-weight: 700; color: #0f172a;">${idx + 1}.</td>
          <td style="padding: 6px 10px; vertical-align: top; border-right: 1px solid #7dd3c7; white-space: pre-line; line-height: 1.4; color: #1e293b;">${item.particularText}</td>
          <td style="padding: 6px 10px; vertical-align: top; text-align: right; font-weight: 700; color: #0f172a;">INR ${base.toLocaleString("en-IN")}.00</td>
        </tr>
      `;

      const taxRows = taxesList
        .map((tax) => {
          const taxAmt = calculateSingleTax(item, tax);
          const isPercent = item.taxType !== "amount";
          const rateText = isPercent ? `@ ${Number(tax.value ?? tax.taxPercentage ?? 0).toFixed(2)} %` : "";
          return `
            <tr style="background-color: #f8fafc; font-size: 10px; color: #475569; border-bottom: 1px solid #f1f5f9;">
              <td style="border-right: 1px solid #7dd3c7;"></td>
              <td style="padding: 3px 10px; border-right: 1px solid #7dd3c7; font-style: italic;">${tax.name || "GST"} ${rateText}</td>
              <td style="padding: 3px 10px; text-align: right; font-weight: 600;">INR ${taxAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          `;
        })
        .join("");

      return mainRow + taxRows;
    })
    .join("");

  let termsList = [];
  if (invoiceData?.termsConditions) {
    if (typeof invoiceData.termsConditions === "string") {
      termsList = invoiceData.termsConditions
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean);
    } else if (Array.isArray(invoiceData.termsConditions)) {
      termsList = invoiceData.termsConditions
        .map((t) => (typeof t === "string" ? t.trim() : JSON.stringify(t)))
        .filter(Boolean);
    }
  }

  if (termsList.length === 0) {
    termsList = [
      "1. Balance payment to be cleared before travel",
      "2. Cancellation as per supplier policy; service charges non-refundable",
      "3. Amendments subject to availability & extra cost",
      "4. No refund for no-show / unused services",
      "5. Guests must carry valid travel documents",
      "6. Not liable for delays, cancellations, or unforeseen events",
      "7. All disputes are subject to Delhi jurisdiction only",
    ];
  }

  const { pageTerms: firstPageTerms, remainingTerms } = takeTermsForPage(
    termsList,
    FIRST_PAGE_TERMS_LINE_CAPACITY,
  );
  const continuationTermsPages = splitTermsAcrossPages(remainingTerms);
  const totalTermsPages = 1 + continuationTermsPages.length;
  const firstPageTermsHtml = firstPageTerms
    .map((term) => `<div style="margin-bottom: 3.5px; line-height: 1.38; white-space: pre-line;">${escapePdfHtml(term)}</div>`)
    .join("");

  const termsPagesHtml = continuationTermsPages
    .map((termsOnPage, pageIndex) => {
      const pageTermsHtml = termsOnPage
        .map((term) => `<div style="margin-bottom: 8px; line-height: 1.52; white-space: pre-line;">${escapePdfHtml(term)}</div>`)
        .join("");

      return `
        <div class="pdf-page" style="width: 794px; height: 1120px; box-sizing: border-box; padding: 24px 28px; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; font-size: 11px; line-height: 1.45;">
          <div>
            <div style="background-color: #0f766e; color: #ffffff; text-align: center; font-weight: 800; letter-spacing: 1px; font-size: 12.5px; padding: 7px 0; text-transform: uppercase; border-radius: 2px;">PROFORMA INVOICE</div>
            <div style="margin-top: 16px; border: 1px solid #7dd3c7; border-radius: 2px; overflow: hidden; background: #ffffff;">
              <div style="background-color: #e6fffb; color: #0f766e; text-align: center; font-weight: 800; padding: 7px 0; font-size: 12px; text-transform: uppercase;">Terms and Conditions</div>
              <div style="padding: 8px 12px; color: #64748b; font-size: 9.5px; font-weight: 700; border-bottom: 1px solid #ccfbf1; text-align: right;">Trip ID: ${escapePdfHtml(queryId)} &nbsp;|&nbsp; Page ${pageIndex + 2} of ${totalTermsPages}</div>
              <div style="padding: 16px 18px 12px; color: #334155; background: #ffffff;">
                ${pageTermsHtml}
              </div>
            </div>
          </div>
          <div style="text-align: center; padding-top: 6px; font-size: 8.5px; color: #94a3b8; font-style: italic; border-top: 1px solid #f1f5f9;">This is a computer generated document. No signature required.</div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="pdf-page" style="width: 794px; height: 1120px; box-sizing: border-box; padding: 24px 28px; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; font-size: 10.5px; line-height: 1.4;">
      <div>
        <!-- Dark Teal Banner -->
        <div style="background-color: #0f766e; color: #ffffff; text-align: center; font-weight: 800; letter-spacing: 1px; font-size: 12.5px; padding: 7px 0; text-transform: uppercase; border-radius: 2px;">
          PROFORMA INVOICE
        </div>

        <!-- Header Info -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-bottom: 6px;">
          <div style="min-height: 48px; display: flex; align-items: center;">
            ${
              sellerLogo
                ? `<img src="${sellerLogo}" crossorigin="anonymous" style="max-height: 60px; max-width: 200px; object-fit: contain;" />`
                : `<span style="font-size: 18px; font-weight: 900; font-style: italic; color: #0f172a; border-bottom: 2px solid #0f766e; padding-bottom: 2px;">${sellerDetails.name}</span>`
            }
          </div>
          <div style="font-size: 10px; font-weight: 700; text-align: right; line-height: 1.5;">
            <div><span style="color: #64748b; margin-right: 10px; font-weight: 600;">Issue Date</span><span style="color: #0f172a;">${issueDate}</span></div>
            <div><span style="color: #64748b; margin-right: 10px; font-weight: 600;">Due Date</span><span style="color: #0f172a;">${dueDate}</span></div>
            <div><span style="color: #64748b; margin-right: 10px; font-weight: 600;">Trip ID</span><span style="color: #0f172a;">${queryId}</span></div>
          </div>
        </div>

        <!-- Seller & Buyer -->
        <div style="display: flex; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 8px; margin-top: 2px; font-size: 10.5px;">
          <!-- Seller -->
          <div style="width: 48%; line-height: 1.38;">
            <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 2px;">SELLER</div>
            <div style="font-size: 11.5px; font-weight: 800; color: #0f172a;">${sellerDetails.name}</div>
            <div style="color: #475569; font-style: italic;">${sellerDetails.address}</div>
            <div style="color: #475569; font-style: italic;">${sellerDetails.cityState} ${sellerDetails.countryZip}</div>
            <div style="color: #334155; font-weight: 600; margin-top: 2px;">${sellerDetails.phone} • ${sellerDetails.email}</div>
            <div style="margin-top: 3px; font-size: 9.5px; color: #1e293b; line-height: 1.35;">
              <div>PAN: <strong>${sellerDetails.pan}</strong></div>
              <div>GST: <strong>${sellerDetails.gst}</strong></div>
              <div>MSME REG NO : <strong>${sellerDetails.msme}</strong></div>
              <div>TAN NO - <strong>${sellerDetails.tan}</strong></div>
            </div>
          </div>

          <!-- Buyer -->
          <div style="width: 48%; text-align: right; line-height: 1.38;">
            <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 2px;">BUYER (BILL TO)</div>
            <div style="font-size: 11.5px; font-weight: 800; color: #0f172a;">${buyerDetails.name}</div>
            <div style="color: #475569; font-style: italic;">${buyerDetails.address}</div>
            <div style="color: #475569; font-style: italic;">${buyerDetails.country}</div>
            ${buyerDetails.phone ? `<div style="color: #334155; font-weight: 600; margin-top: 2px;">Phone: ${buyerDetails.phone}</div>` : ""}
            ${buyerDetails.email ? `<div style="color: #334155; font-weight: 600;">Email: ${buyerDetails.email}</div>` : ""}
          </div>
        </div>

        <!-- Overview -->
        ${
          overview && overview.trim()
            ? `
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 10px;">
            <div style="font-size: 9px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 2px;">OVERVIEW</div>
            <div style="color: #334155; white-space: pre-line; line-height: 1.35;">${overview.trim()}</div>
          </div>
        `
            : ""
        }

        <!-- Particulars Table -->
        <div style="margin-top: 8px; border: 1px solid #7dd3c7; border-radius: 2px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: left;">
            <thead>
              <tr style="background-color: #e6fffb; border-bottom: 1px solid #7dd3c7; color: #0f766e; font-weight: 800; font-size: 9.5px; text-transform: uppercase;">
                <th style="padding: 5px 8px; width: 40px; text-align: center; border-right: 1px solid #7dd3c7;">S.NO.</th>
                <th style="padding: 5px 10px; border-right: 1px solid #7dd3c7;">PARTICULARS</th>
                <th style="padding: 5px 10px; width: 120px; text-align: right;">AMOUNT (INR)</th>
              </tr>
            </thead>
            <tbody>
              ${renderedTableRows}
              <tr style="background-color: #f8fafc; font-weight: 800; border-top: 2px solid #7dd3c7; color: #0f172a;">
                <td colspan="2" style="padding: 6px 10px; text-align: right; border-right: 1px solid #7dd3c7; text-transform: uppercase; font-size: 9.5px;">TOTAL (INR)</td>
                <td style="padding: 6px 10px; text-align: right; font-size: 11px; color: #0f766e; font-weight: 900;">INR ${grandTotal.toLocaleString("en-IN")}.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Amount in Words -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 10px;">
          <div>
            <div style="font-size: 8.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">AMOUNT CHARGEABLE (IN WORDS)</div>
            <div style="font-size: 11px; font-weight: 900; color: #0f766e; margin-top: 1px;">INR: ${numberToWords(grandTotal)}</div>
          </div>
          <div style="color: #64748b; font-weight: 700; font-size: 9.5px;">E. & O.E.</div>
        </div>

        <!-- Bank Details -->
        ${
          hasBankDetails
            ? `
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #7dd3c7; font-size: 10px;">
            <div style="font-size: 8.5px; font-weight: 800; color: #0f766e; text-transform: uppercase; margin-bottom: 2px;">SELLER'S BANK DETAILS</div>
            <div style="color: #334155; line-height: 1.35;">
              ${bankDetails.bankName || bankDetails.branchName ? `<div>Bank Name: <strong style="color: #0f172a;">${bankDetails.bankName || bankDetails.branchName}</strong></div>` : ""}
              ${bankDetails.branchName && bankDetails.bankName && bankDetails.branchName !== bankDetails.bankName ? `<div>Branch: <strong>${bankDetails.branchName}</strong></div>` : ""}
              ${bankDetails.accountHolderName ? `<div>A/c Holder Name: <strong>${bankDetails.accountHolderName}</strong></div>` : ""}
              ${bankDetails.accountNumber ? `<div>A/c No. <strong>${bankDetails.accountNumber}</strong></div>` : ""}
              ${bankDetails.ifscCode ? `<div>IFSC: <strong>${bankDetails.ifscCode}</strong></div>` : ""}
            </div>
          </div>
        `
            : ""
        }

        <!-- Use the blank area on the invoice page before continuing terms. -->
        <div style="margin-top: 10px; border: 1px solid #7dd3c7; border-radius: 2px; overflow: hidden; background: #ffffff;">
          <div style="background-color: #e6fffb; color: #0f766e; text-align: center; font-weight: 800; padding: 3px 0; font-size: 9.5px; text-transform: uppercase;">Terms and Conditions</div>
          <div style="padding: 4px 10px; color: #64748b; font-size: 8px; font-weight: 700; border-bottom: 1px solid #ccfbf1; text-align: right;">Trip ID: ${escapePdfHtml(queryId)} &nbsp;|&nbsp; Page 1 of ${totalTermsPages}</div>
          <div style="padding: 6px 10px; font-size: 9.5px; color: #334155; line-height: 1.38; background: #ffffff;">
            ${firstPageTermsHtml}
          </div>
        </div>
      </div>

      <!-- Computer Generated Document Notice -->
      <div style="text-align: center; padding-top: 6px; font-size: 8.5px; color: #94a3b8; font-style: italic; border-top: 1px solid #f1f5f9;">
        This is a computer generated document. No signature required.
      </div>
    </div>
    ${termsPagesHtml}
  `;
};

const ProformaInvoiceView = ({ invoiceData = {}, onEdit, onDelete, onNew, queryData = {} }) => {
  const { user } = useSelector((state) => state.auth || {});

  const queryId = invoiceData?.queryId || queryData?.queryId || queryData?.id || "4310346";
  
  const sellerDetails = invoiceData?.sellerDetails || {
    name: invoiceData?.sellerName || queryData?.sellerName || "DDLC Company Pvt. Ltd.",
    address: invoiceData?.sellerAddress || queryData?.sellerAddress || "KG 3/69, Ground Floor, Vikas Puri",
    cityState: invoiceData?.sellerCityState || queryData?.sellerCityState || "New Delhi, Delhi",
    countryZip: invoiceData?.sellerCountryZip || queryData?.sellerCountryZip || "India, 110018",
    phone: invoiceData?.sellerPhone || queryData?.sellerPhone || "9368825518",
    email: invoiceData?.sellerEmail || queryData?.sellerEmail || "joy@gmail.com",
    pan: invoiceData?.sellerPan || queryData?.sellerPan || "ABAPW1816B",
    gst: invoiceData?.sellerGst || queryData?.sellerGst || "07ABAPW1816B3ZZ",
    msme: invoiceData?.sellerMsme || queryData?.sellerMsme || "UDYAM-DL-10-0079437",
    tan: invoiceData?.sellerTan || queryData?.sellerTan || "DELV30189F",
  };

  const sellerLogo =
    invoiceData?.sellerLogo ||
    invoiceData?.logo ||
    queryData?.brandingLogo ||
    queryData?.agentLogo ||
    queryData?.agent?.brandingLogo ||
    queryData?.agent?.brandLogoUrl ||
    queryData?.agent?.logo ||
    queryData?.sellerLogo ||
    (user?.role === "agent" ? (user?.brandingLogo || user?.brandLogoUrl || user?.logo) : "") ||
    user?.brandingLogo ||
    user?.brandLogoUrl ||
    user?.logo ||
    "";

  const clientInfo = resolveClientDetails(queryData);
  const clientLeadName = invoiceData?.buyerName && invoiceData?.buyerName !== "Carma Tours" ? invoiceData.buyerName : (clientInfo.name || "Client");
  const clientLeadPhone = invoiceData?.buyerPhone || clientInfo.phone || "";
  const clientLeadEmail = invoiceData?.buyerEmail || clientInfo.email || "";
  const clientLeadAddress = invoiceData?.buyerAddress || clientInfo.address || "";
  const clientLeadCountry = invoiceData?.buyerCountry || clientInfo.country || "India";

  const buyerDetails = invoiceData?.buyerDetails || {
    name: clientLeadName,
    address: clientLeadAddress,
    country: clientLeadCountry,
    phone: clientLeadPhone,
    email: clientLeadEmail,
  };

  const bankDetails = invoiceData?.bankDetails || {
    bankName: invoiceData?.bankName || queryData?.bankName || "",
    branchName: invoiceData?.branchName || queryData?.branchName || "",
    accountHolderName: invoiceData?.accountHolderName || queryData?.accountHolderName || "",
    accountNumber: invoiceData?.accountNumber || queryData?.accountNumber || "",
    ifscCode: invoiceData?.ifscCode || queryData?.ifscCode || "",
  };

  const hasBankDetails = Boolean(
    bankDetails?.bankName ||
    bankDetails?.branchName ||
    bankDetails?.accountHolderName ||
    bankDetails?.accountNumber ||
    bankDetails?.ifscCode
  );

  const issueDate = invoiceData?.issueDate || "02 Aug, 2026";
  const dueDate = invoiceData?.dueDate || "30 Jul, 2026";
  const overview = invoiceData?.overview || queryData?.overview || "";

  const extractQuotationAmount = (data) => {
    if (!data) return 0;
    const candidates = [
      data?.headerPackageAmount,
      data?.clientTotalAmount,
      data?.quotationAmount,
      data?.quotation,
      data?.quoteAmount,
      data?.activeQuote?.clientTotalAmount,
      data?.activeQuote?.pricing?.totalAmount,
      data?.activeQuote?.pricing?.subTotal,
      data?.activeQuote?.pricing?.grandTotal,
      data?.activeQuote?.totalAmount,
      data?.totalAmount,
      data?.finalQuoteAmount,
      data?.packagePrice,
      data?.pkgPrice,
      data?.pricing?.grandTotal,
      data?.pricing?.totalAmount,
      data?.pricing?.subTotal,
      data?.costing?.agentCost,
      data?.costing?.totalCost,
      data?.costing?.grandTotal,
      data?.costing?.total,
      data?.amount,
      data?.price,
      data?.cost,
    ];

    for (const cand of candidates) {
      const cleaned = String(cand || "").replace(/[^0-9.]/g, "");
      const parsed = Number(cleaned);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    if (Array.isArray(data?.quotes) && data.quotes.length > 0) {
      for (const q of data.quotes) {
        const cleaned = String(q?.clientTotalAmount || q?.pricing?.totalAmount || q?.pricing?.subTotal || q?.totalAmount || "").replace(/[^0-9.]/g, "");
        const qAmt = Number(cleaned);
        if (!isNaN(qAmt) && qAmt > 0) return qAmt;
      }
    }

    return 0;
  };

  const extractedPrice = extractQuotationAmount(queryData);
  const defaultBaseAmount = extractedPrice > 0 ? extractedPrice : 160000;

  const items = invoiceData?.items || [
    {
      particularText: `Trip#: ${queryId}\nIndia Tour Package\n${buyerDetails.name} - 04 Oct 2026 - 4N,5D - 8A`,
      qty: 1,
      baseAmount: defaultBaseAmount,
      applyTax: true,
      taxType: "percentage",
      taxes: [{ id: 1, name: "GST", value: 0 }],
    },
  ];

  const calculateItemBase = (item) => {
    return Number(item.qty || 1) * Number(item.baseAmount || 0);
  };

  const getItemTaxesList = (item) => {
    if (!item.applyTax) return [];
    if (Array.isArray(item.taxes) && item.taxes.length > 0) {
      return item.taxes;
    }
    if (item.taxPercentage !== undefined || item.taxName) {
      return [{ id: 1, name: item.taxName || "GST", value: Number(item.taxPercentage || 0) }];
    }
    return [];
  };

  const calculateSingleTax = (item, tax) => {
    if (!item.applyTax) return 0;
    const base = calculateItemBase(item);
    const val = Number(tax.value ?? tax.taxPercentage ?? 0);
    if (item.taxType === "amount") {
      return val;
    }
    return (base * val) / 100;
  };

  const calculateItemTotalTaxes = (item) => {
    const taxList = getItemTaxesList(item);
    return taxList.reduce((sum, tax) => sum + calculateSingleTax(item, tax), 0);
  };

  const grandTotal = invoiceData?.grandTotal ?? items.reduce((sum, item) => {
    return sum + calculateItemBase(item) + calculateItemTotalTaxes(item);
  }, 0);

  const invoicePaperRef = useRef(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    const toastId = toast.loading("Downloading Proforma Invoice PDF...");

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "794px";
    container.style.backgroundColor = "#ffffff";
    container.style.zIndex = "-9999";
    container.style.opacity = "1";
    container.style.pointerEvents = "none";
    container.innerHTML = buildInvoiceCleanHtml({
      sellerLogo,
      sellerDetails,
      buyerDetails,
      issueDate,
      dueDate,
      queryId,
      overview,
      items,
      calculateItemBase,
      getItemTaxesList,
      calculateSingleTax,
      grandTotal,
      numberToWords,
      bankDetails,
      hasBankDetails,
      invoiceData,
    });

    document.body.appendChild(container);

    try {
      const images = container.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 400);
          });
        })
      );

      await new Promise((resolve) => setTimeout(resolve, 150));

      const pageElements = container.querySelectorAll(".pdf-page");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pageElements.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        const canvas = await html2canvas(pageElements[i], {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          width: 794,
          height: 1120,
          windowWidth: 794,
          windowHeight: 1120,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      }

      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }

      const cleanId = String(queryId).replace(/^#\s*/, "") || "Invoice";
      pdf.save(`Proforma_Invoice_${cleanId}.pdf`);
      toast.success("Proforma Invoice PDF downloaded successfully!", { id: toastId });
    } catch (err) {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      console.error("PDF generation failed:", err);
      toast.error("Could not download PDF. Please try again.", { id: toastId });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Invoice link copied to clipboard");
  };

  return (
    <div className="w-full font-sans space-y-4 text-slate-800">
      {/* Top Header Strip */}
      <div className="w-full bg-white pb-2 flex items-center justify-between border-b border-slate-100">
        <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">Proforma Invoice</h2>
        <button
          type="button"
          onClick={onNew}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span className="text-sm font-normal">+</span>
          <span>New</span>
        </button>
      </div>

      {/* Info & Action Toolbar Bar */}
      <div className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-md p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-6 text-xs text-slate-600 font-medium">
          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">Created By</span>
            <span className="font-bold text-slate-900 text-xs">You</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">Created On</span>
            <span className="font-bold text-slate-900 text-xs">a few seconds ago</span>
          </div>
        </div>

        {/* Floating Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toast.success("Refreshed invoice view")}
            className="p-2 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-600 rounded-md cursor-pointer transition-colors shadow-2xs"
            title="Refresh"
          >
            <RotateCw size={14} />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="p-2 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-600 rounded-md cursor-pointer transition-colors shadow-2xs"
            title="Copy URL"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="px-3 py-1.5 bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs rounded-md flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs disabled:opacity-75 disabled:cursor-not-allowed"
            title="Download PDF"
          >
            {isGeneratingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span>{isGeneratingPdf ? "Generating..." : "PDF"}</span>
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-1.5 bg-[#eff6ff] border border-blue-200 text-[#2563eb] hover:bg-blue-100 font-bold text-xs rounded-md flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <Pencil size={13} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-2 bg-white border border-slate-200/90 hover:bg-rose-50 text-rose-500 rounded-md cursor-pointer transition-colors shadow-2xs"
            title="Delete Invoice"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Main A4 Template Render */}
      <div
        ref={invoicePaperRef}
        id="proforma-invoice-paper"
        className="w-full bg-white border border-slate-200/90 shadow-md rounded-xs p-6 lg:p-8 space-y-6 font-sans"
      >
        {/* Dark Teal Banner */}
        <div className="w-full bg-[#0f766e] text-white text-center font-extrabold tracking-wider text-xs sm:text-sm py-2 uppercase">
          PROFORMA INVOICE
        </div>

        {/* Header Info: Agent's Branding Logo alone & Dates */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="min-h-[4.5rem] flex items-center">
              {sellerLogo ? (
                <img
                  src={sellerLogo}
                  alt={sellerDetails.name || "Agent Branding Logo"}
                  className="h-16 sm:h-20 max-h-24 w-auto object-contain max-w-[260px]"
                />
              ) : (
                <span className="text-2xl font-black italic tracking-tighter text-slate-900 border-b-2 border-[#0f766e] pb-0.5">
                  {sellerDetails.name}
                </span>
              )}
            </div>
          </div>
          <div className="text-xs font-bold text-slate-800 space-y-1 sm:text-right">
            <div className="flex sm:justify-end gap-3">
              <span className="text-slate-400 font-semibold">Issue Date</span>
              <span className="text-slate-900">{issueDate}</span>
            </div>
            <div className="flex sm:justify-end gap-3">
              <span className="text-slate-400 font-semibold">Due Date</span>
              <span className="text-slate-900">{dueDate}</span>
            </div>
            <div className="flex sm:justify-end gap-3">
              <span className="text-slate-400 font-semibold">Trip ID</span>
              <span className="text-slate-900">{queryId}</span>
            </div>
          </div>
        </div>

        {/* Seller & Buyer Grid (Plain Text, No Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-xs">
          {/* Seller (Main Agent) */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SELLER</p>
            <h3 className="text-sm font-bold text-slate-900">{sellerDetails.name}</h3>
            <p className="text-slate-600 italic leading-relaxed">{sellerDetails.address}</p>
            <p className="text-slate-600 italic">{sellerDetails.cityState} {sellerDetails.countryZip}</p>
            <p className="text-slate-700 font-semibold pt-1">{sellerDetails.phone} • {sellerDetails.email}</p>
            <div className="pt-2 text-slate-800 font-medium space-y-0.5 text-[11px]">
              <p>PAN: <span className="font-bold">{sellerDetails.pan}</span></p>
              <p>GST: <span className="font-bold">{sellerDetails.gst}</span></p>
              <p>MSME REG NO : <span className="font-bold">{sellerDetails.msme}</span></p>
              <p>TAN NO - <span className="font-bold">{sellerDetails.tan}</span></p>
            </div>
          </div>

          {/* Buyer (Agent's Client) */}
          <div className="sm:text-right space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">BUYER (BILL TO)</p>
            <h3 className="text-sm font-bold text-slate-900">{buyerDetails.name}</h3>
            <p className="text-slate-600 italic leading-relaxed">{buyerDetails.address}</p>
            <p className="text-slate-600 italic">{buyerDetails.country}</p>
            <p className="text-slate-700 font-semibold pt-1">Phone: {buyerDetails.phone}</p>
            <p className="text-slate-700 font-semibold">Email: {buyerDetails.email}</p>
          </div>
        </div>

        {/* Overview Section */}
        {overview && overview.trim() && (
          <div className="pt-3.5 pb-1 border-t border-slate-200 text-xs">
            <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-1">OVERVIEW</p>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed font-normal">{overview.trim()}</p>
          </div>
        )}

        {/* Particulars Table */}
        <div className="w-full border border-teal-200/80 rounded-xs overflow-hidden pt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#e6fffb]/70 border-b border-[#7dd3c7] text-[#0f766e] font-extrabold uppercase text-[11px]">
                <th className="py-2.5 px-3 w-16 text-center border-r border-[#7dd3c7]/60">S.NO.</th>
                <th className="py-2.5 px-4 border-r border-[#7dd3c7]/60">PARTICULARS</th>
                <th className="py-2.5 px-4 w-44 text-right">AMOUNT (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-100 text-slate-800 font-medium">
              {items.map((item, idx) => {
                const base = calculateItemBase(item);
                const taxesList = getItemTaxesList(item);

                return (
                  <React.Fragment key={idx}>
                    <tr>
                      <td className="py-3 px-3 text-center align-top border-r border-teal-100 font-bold">{idx + 1}.</td>
                      <td className="py-3 px-4 align-top border-r border-teal-100 whitespace-pre-line leading-relaxed">
                        {item.particularText}
                      </td>
                      <td className="py-3 px-4 align-top text-right font-bold border-teal-100">
                        INR {base.toLocaleString("en-IN")}.00
                      </td>
                    </tr>
                    {taxesList.map((tax, tIdx) => {
                      const taxAmt = calculateSingleTax(item, tax);
                      const isPercent = item.taxType !== "amount";
                      return (
                        <tr key={tIdx} className="bg-slate-50/50 text-[11px] text-slate-600">
                          <td className="border-r border-teal-100"></td>
                          <td className="py-1.5 px-4 border-r border-teal-100 italic">
                            {tax.name || "GST"} {isPercent ? `@ ${Number(tax.value ?? tax.taxPercentage ?? 0).toFixed(2)} %` : ""}
                          </td>
                          <td className="py-1.5 px-4 text-right font-semibold">
                            INR {taxAmt.toLocaleString("en-IN")}.00
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              <tr className="bg-slate-50 font-bold border-t-2 border-[#7dd3c7] text-slate-900">
                <td colSpan={2} className="py-3 px-4 text-right border-r border-[#7dd3c7]/60 text-xs uppercase font-extrabold">
                  Total (INR)
                </td>
                <td className="py-3 px-4 text-right font-extrabold text-sm text-[#0f766e]">
                  INR {grandTotal.toLocaleString("en-IN")}.00
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Amount Chargeable In Words & E. & O.E. */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 text-xs">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AMOUNT CHARGEABLE (IN WORDS)</p>
            <p className="text-sm font-extrabold text-[#0f766e] mt-0.5">
              INR: {numberToWords(grandTotal)}
            </p>
          </div>
          <div className="text-slate-400 font-bold text-xs sm:text-right">
            E. & O.E.
          </div>
        </div>

        {/* Seller's Bank Details (Only shown if filled in Create Proforma Form) */}
        {hasBankDetails && (
          <div className="pt-3 border-t border-teal-200/80 space-y-1 text-xs">
            <p className="text-[11px] font-bold text-[#0f766e] uppercase tracking-wider">SELLER'S BANK DETAILS</p>
            <div className="text-slate-700 space-y-0.5 leading-relaxed">
              {(bankDetails.bankName || bankDetails.branchName) && (
                <p>Bank Name: <span className="font-bold text-slate-900">{bankDetails.bankName || bankDetails.branchName}</span></p>
              )}
              {bankDetails.branchName && bankDetails.bankName && bankDetails.branchName !== bankDetails.bankName && (
                <p>Branch: <span className="font-semibold">{bankDetails.branchName}</span></p>
              )}
              {bankDetails.accountHolderName && (
                <p>A/c Holder Name: <span className="font-semibold">{bankDetails.accountHolderName}</span></p>
              )}
              {bankDetails.accountNumber && (
                <p>A/c No. <span className="font-semibold">{bankDetails.accountNumber}</span></p>
              )}
              {bankDetails.ifscCode && (
                <p>IFSC: <span className="font-semibold">{bankDetails.ifscCode}</span></p>
              )}
            </div>
          </div>
        )}

        {/* Terms and Conditions Section */}
        <div className="w-full border border-teal-200/80 rounded-xs overflow-hidden mt-4">
          <div className="w-full bg-[#e6fffb]/70 text-[#0f766e] text-center font-bold py-1.5 text-xs">
            Terms and Conditions
          </div>
          <div className="p-4 text-xs text-slate-700 space-y-1.5 font-medium leading-relaxed bg-white">
            {invoiceData?.termsConditions ? (
              typeof invoiceData.termsConditions === "string" ? (
                invoiceData.termsConditions
                  .split("\n")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((t, idx) => <p key={idx}>{t}</p>)
              ) : Array.isArray(invoiceData.termsConditions) ? (
                invoiceData.termsConditions.map((t, idx) => (
                  <p key={idx}>{typeof t === "string" ? t : JSON.stringify(t)}</p>
                ))
              ) : (
                <p>{String(invoiceData.termsConditions)}</p>
              )
            ) : (
              <>
                <p>1. Balance payment to be cleared before travel</p>
                <p>2. Cancellation as per supplier policy; service charges non-refundable</p>
                <p>3. Amendments subject to availability & extra cost</p>
                <p>4. No refund for no-show / unused services</p>
                <p>5. Guests must carry valid travel documents</p>
                <p>6. Not liable for delays, cancellations, or unforeseen events</p>
                <p>7. All disputes are subject to Delhi jurisdiction only</p>
              </>
            )}
          </div>
        </div>

        {/* Computer Generated Document Notice */}
        <div className="text-center pt-6 pb-2 text-[11px] text-slate-400 font-medium italic border-t border-slate-100">
          This is a computer generated document. No signature required.
        </div>
      </div>
    </div>
  );
};

export default ProformaInvoiceView;
