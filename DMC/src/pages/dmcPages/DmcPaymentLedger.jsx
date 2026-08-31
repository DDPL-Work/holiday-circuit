import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import API from "../../utils/Api";

import {
  todayInput,
  EMPTY_CLAIMED_SUMMARY,
  buildClaimedSummaryFromFields,
  sortPayableServices,
  addDaysToDate,
  readStoredUser,
  createInvoiceNumber,
  SERVICES_PER_PAGE,
} from "./dmcPaymentLedger/utils/dmcPaymentLedgerHelpers";

import { PaymentLedgerHeader } from "./dmcPaymentLedger/components/Header/PaymentLedgerHeader";
import { PaymentLedgerStatsCards } from "./dmcPaymentLedger/components/Summary/PaymentLedgerStatsCards";
import { BookedServicesTable } from "./dmcPaymentLedger/components/Table/BookedServicesTable";
import { BulkInvoiceSettlementForm } from "./dmcPaymentLedger/components/Form/BulkInvoiceSettlementForm";
import { FinanceUploadedInvoicesTable } from "./dmcPaymentLedger/components/Invoices/FinanceUploadedInvoicesTable";

export default function DmcPaymentLedger() {
  const storedUser = useMemo(readStoredUser, []);
  const resolvedCreditDays = useMemo(() => {
    if (storedUser && Array.isArray(storedUser.creditDays) && storedUser.creditDays.length > 0) {
      return storedUser.creditDays.map(Number);
    }
    if (storedUser && storedUser.creditDays !== undefined) {
      const parsed = Number(storedUser.creditDays);
      if (!Number.isNaN(parsed)) return [parsed];
    }
    return [7, 15];
  }, [storedUser]);

  const [creditPeriodDays, setCreditPeriodDays] = useState(7);
  const [ledger, setLedger] = useState({ summary: {}, services: [] });
  const [selectedRefs, setSelectedRefs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [invoiceSource, setInvoiceSource] = useState("system_template");
  const [uploadedInvoiceFile, setUploadedInvoiceFile] = useState(null);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [invoiceExtraction, setInvoiceExtraction] = useState(null);
  const [isExtractionOpen, setIsExtractionOpen] = useState(false);

  const [invoiceMeta, setInvoiceMeta] = useState({
    supplierName: storedUser?.companyName || storedUser?.name || "",
    invoiceNumber: createInvoiceNumber(),
    invoiceDate: todayInput(),
    creditPeriodDays: 7,
    dueDate: addDaysToDate(todayInput(), 7),
    templateVariant: "aurora-ledger",
  });

  const [taxConfig, setTaxConfig] = useState({ gstRate: 0, tcsRate: 0, otherTax: 0 });
  const [claimedSummary, setClaimedSummary] = useState(EMPTY_CLAIMED_SUMMARY);

  const handleMetaChange = (field, value) => {
    setInvoiceMeta((prev) => {
      if (field === "invoiceDate") {
        return {
          ...prev,
          invoiceDate: value,
          dueDate: addDaysToDate(value, prev.creditPeriodDays),
        };
      }

      if (field === "creditPeriodDays") {
        const numericVal = Number(value);
        return {
          ...prev,
          creditPeriodDays: numericVal,
          dueDate: addDaysToDate(prev.invoiceDate, numericVal),
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const selectedRows = useMemo(
    () => (ledger.services || []).filter((service) => selectedRefs.includes(service.serviceRef)),
    [ledger.services, selectedRefs],
  );
  const selectedCurrency = selectedRows[0]?.currency || "INR";

  const selectedSubtotal = selectedRows.reduce(
    (sum, service) => sum + Number(service.amount || 0),
    0,
  );
  const selectedGst = (selectedSubtotal * Number(taxConfig.gstRate || 0)) / 100;
  const selectedTcs = (selectedSubtotal * Number(taxConfig.tcsRate || 0)) / 100;
  const selectedTotal =
    selectedSubtotal + selectedGst + selectedTcs + Number(taxConfig.otherTax || 0);
  const selectableServices = (ledger.services || []).filter((service) => !service.isClaimed);
  const dueServices = selectableServices.filter((service) => service.isDue);
  const ledgerServices = useMemo(
    () => sortPayableServices(ledger.services || []),
    [ledger.services],
  );
  const financeUploadedInvoices = ledger.financeUploadedInvoices || [];
  const totalPages = Math.max(1, Math.ceil(ledgerServices.length / SERVICES_PER_PAGE));
  const paginatedServices = ledgerServices.slice(
    (currentPage - 1) * SERVICES_PER_PAGE,
    currentPage * SERVICES_PER_PAGE,
  );
  const pageStart = ledgerServices.length ? (currentPage - 1) * SERVICES_PER_PAGE + 1 : 0;
  const pageEnd = Math.min(currentPage * SERVICES_PER_PAGE, ledgerServices.length);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    setUploadedInvoiceFile(file);
    setIsFileUploading(true);
    setInvoiceExtraction(null);
    setIsExtractionOpen(false);

    try {
      const formData = new FormData();
      formData.append("uploadedInvoice", file);
      formData.append("claimedSummary", JSON.stringify(claimedSummary));
      formData.append("expectedSummary", JSON.stringify({
        subtotal: selectedSubtotal,
        taxAmount: selectedGst + selectedTcs + Number(taxConfig.otherTax || 0),
        totalTax: selectedGst + selectedTcs + Number(taxConfig.otherTax || 0),
        grandTotal: selectedTotal,
        currency: selectedCurrency,
      }));

      const { data } = await API.post("/dmc/internal-invoice/parse-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const extraction = data?.data || null;
      const fields = extraction?.fields || {};
      setInvoiceExtraction(extraction);
      setIsExtractionOpen(true);
      setInvoiceMeta((prev) => ({
        ...prev,
        supplierName: fields.supplierName || prev.supplierName,
        invoiceNumber: fields.invoiceNumber || prev.invoiceNumber,
        invoiceDate: fields.invoiceDate || prev.invoiceDate,
        dueDate: fields.dueDate || (fields.invoiceDate ? addDaysToDate(fields.invoiceDate, prev.creditPeriodDays) : prev.dueDate),
      }));

      setClaimedSummary(buildClaimedSummaryFromFields(fields));

      if (extraction?.status === "parsed") {
        toast.success("Invoice parsed and values filled");
      } else {
        toast("Invoice uploaded. Please review fields manually.");
      }
    } catch (error) {
      setInvoiceExtraction({
        status: "failed",
        source: "upload",
        error: error?.response?.data?.message || "Unable to parse this invoice automatically.",
      });
      setIsExtractionOpen(true);
      toast.error(error?.response?.data?.message || "Invoice parser needs manual review");
    } finally {
      setIsFileUploading(false);
      event.target.value = "";
    }
  };

  const loadLedger = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/dmc/payment-ledger", {
        params: { creditPeriodDays },
      });
      setLedger(data?.data || { summary: {}, services: [] });
      setSelectedRefs((prev) => {
        const availableRefs = new Set(
          (data?.data?.services || [])
            .filter((service) => !service.isClaimed)
            .map((service) => service.serviceRef),
        );
        return prev.filter((serviceRef) => availableRefs.has(serviceRef));
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load payment ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, [creditPeriodDays]);

  useEffect(() => {
    setCurrentPage(1);
  }, [creditPeriodDays]);

  useEffect(() => {
    handleMetaChange("creditPeriodDays", creditPeriodDays);
  }, [creditPeriodDays]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const toggleService = (serviceRef) => {
    setSelectedRefs((prev) =>
      prev.includes(serviceRef)
        ? prev.filter((item) => item !== serviceRef)
        : [...prev, serviceRef],
    );
  };

  const selectDueServices = () => {
    setSelectedRefs(dueServices.map((service) => service.serviceRef));
  };

  const submitBatch = async () => {
    if (!selectedRefs.length) {
      toast.error("Select services before submitting a bulk settlement");
      return;
    }

    const needsTemplate = invoiceSource === "system_template";
    if (
      !invoiceMeta.supplierName ||
      !invoiceMeta.invoiceNumber ||
      !invoiceMeta.invoiceDate ||
      !invoiceMeta.dueDate ||
      (needsTemplate && !invoiceMeta.templateVariant)
    ) {
      toast.error("Please fill all invoice header fields");
      return;
    }

    if (invoiceSource === "uploaded_invoice") {
      if (!uploadedInvoiceFile) {
        toast.error("Please upload your invoice PDF or Word document");
        return;
      }

      if (Number(claimedSummary.grandTotal || 0) <= 0) {
        toast.error("Please enter claimed invoice total");
        return;
      }
    }

    try {
      setSubmitting(true);
      if (invoiceSource === "uploaded_invoice") {
        const formData = new FormData();
        formData.append("serviceRefs", JSON.stringify(selectedRefs));
        formData.append("invoiceSource", invoiceSource);
        formData.append("invoiceMeta", JSON.stringify({
          ...invoiceMeta,
          dueDate: invoiceMeta.dueDate,
          invoiceSource,
        }));
        formData.append("taxConfig", JSON.stringify(taxConfig));
        formData.append("claimedSummary", JSON.stringify(claimedSummary));
        formData.append("templateVariant", invoiceMeta.templateVariant);
        formData.append("uploadedInvoice", uploadedInvoiceFile);
        await API.post("/dmc/settlement-batches", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await API.post("/dmc/settlement-batches", {
          serviceRefs: selectedRefs,
          invoiceSource,
          invoiceMeta: {
            ...invoiceMeta,
            dueDate: invoiceMeta.dueDate,
            invoiceSource,
          },
          taxConfig,
          claimedSummary,
          templateVariant: invoiceMeta.templateVariant,
        });
      }
      toast.success("Bulk settlement sent to finance");
      setSelectedRefs([]);
      setUploadedInvoiceFile(null);
      setInvoiceExtraction(null);
      setInvoiceMeta((prev) => ({
        ...prev,
        invoiceNumber: createInvoiceNumber(),
      }));
      await loadLedger();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to submit bulk settlement",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-1 font-sans">
      {/* HEADER */}
      <PaymentLedgerHeader
        creditPeriodDays={creditPeriodDays}
        setCreditPeriodDays={setCreditPeriodDays}
        loadLedger={loadLedger}
        loading={loading}
      />

      {/* SUMMARY CARDS */}
      <PaymentLedgerStatsCards
        summary={ledger.summary}
        selectedRefsCount={selectedRefs.length}
        selectedTotal={selectedTotal}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        {/* BOOKED SERVICES TABLE */}
        <BookedServicesTable
          selectDueServices={selectDueServices}
          setSelectedRefs={setSelectedRefs}
          loading={loading}
          ledgerServices={ledgerServices}
          paginatedServices={paginatedServices}
          selectedRefs={selectedRefs}
          toggleService={toggleService}
          pageStart={pageStart}
          pageEnd={pageEnd}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />

        {/* BULK INVOICE SETTLEMENT FORM */}
        <BulkInvoiceSettlementForm
          invoiceSource={invoiceSource}
          setInvoiceSource={setInvoiceSource}
          invoiceMeta={invoiceMeta}
          handleMetaChange={handleMetaChange}
          resolvedCreditDays={resolvedCreditDays}
          taxConfig={taxConfig}
          setTaxConfig={setTaxConfig}
          isFileUploading={isFileUploading}
          uploadedInvoiceFile={uploadedInvoiceFile}
          setUploadedInvoiceFile={setUploadedInvoiceFile}
          handleFileChange={handleFileChange}
          invoiceExtraction={invoiceExtraction}
          setInvoiceExtraction={setInvoiceExtraction}
          isExtractionOpen={isExtractionOpen}
          setIsExtractionOpen={setIsExtractionOpen}
          selectedSubtotal={selectedSubtotal}
          selectedGst={selectedGst}
          selectedTcs={selectedTcs}
          selectedTotal={selectedTotal}
          selectedCurrency={selectedCurrency}
          claimedSummary={claimedSummary}
          setClaimedSummary={setClaimedSummary}
          selectedRefs={selectedRefs}
          submitBatch={submitBatch}
          submitting={submitting}
        />
      </div>

      {/* FINANCE UPLOADED INVOICES TABLE */}
      <FinanceUploadedInvoicesTable
        financeUploadedInvoices={financeUploadedInvoices}
        loading={loading}
      />
    </div>
  );
}
