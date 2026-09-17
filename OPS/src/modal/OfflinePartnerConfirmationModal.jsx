import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Building2,
  Calendar,
  Phone,
  CheckCircle2,
  FileText,
  Upload,
  Sparkles,
  ShieldCheck,
  Check,
  Loader2,
  Car,
  Compass,
  MapPin,
  CheckCheck,
  Info,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../utils/Api.js";

const getServiceTypeIcon = (type = "") => {
  const normalized = String(type).toLowerCase();
  if (normalized.includes("hotel") || normalized.includes("stay") || normalized.includes("room")) {
    return <Building2 size={15} className="text-amber-600" />;
  }
  if (normalized.includes("transfer") || normalized.includes("cab") || normalized.includes("car") || normalized.includes("transport")) {
    return <Car size={15} className="text-blue-600" />;
  }
  return <Compass size={15} className="text-emerald-600" />;
};

const getServiceTypeBadgeColor = (type = "") => {
  const normalized = String(type).toLowerCase();
  if (normalized.includes("hotel") || normalized.includes("stay") || normalized.includes("room")) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (normalized.includes("transfer") || normalized.includes("cab") || normalized.includes("car") || normalized.includes("transport")) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
};

export default function OfflinePartnerConfirmationModal({
  voucherData,
  onClose,
  onSuccess,
}) {
  const queryId = voucherData?.query || voucherData?.queryId || voucherData?.id || "";
  const initialPartner = voucherData?.businessPartnerName || "MakeMyTrip / Offline Supplier";

  const [partnerName, setPartnerName] = useState(initialPartner);
  const [globalEmergency, setGlobalEmergency] = useState(
    voucherData?.existingConfirmation?.emergencyContact ||
    "24/7 Local Support: +91 98765 43210 | ops@holidaycircuit.com"
  );
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [saving, setSaving] = useState(false);

  // Initialize services from quotationServices or services list
  const initialServicesList = useMemo(() => {
    const rawServices = voucherData?.quotationServices?.length
      ? voucherData.quotationServices
      : (voucherData?.services || []);

    return rawServices.map((s, idx) => {
      const title = s.serviceName || s.title || s.name || `Service #${idx + 1}`;
      const type = s.type || "hotel";
      const sDate = s.serviceDate || voucherData?.travelDate || voucherData?.date || "";
      const existingCnf = s.confirmationNumber || (s.confirmation && s.confirmation !== "Pending" ? s.confirmation : "");
      const existingVch = s.voucherNumber || existingCnf || "";
      const status = s.status && s.status !== "Pending" ? s.status : "Confirmed";

      return {
        serviceId: s.serviceId || s._id || s.id || `${idx}`,
        type: type,
        serviceName: title,
        serviceDate: sDate ? String(sDate).slice(0, 10) : "",
        status: status,
        confirmationNumber: existingCnf,
        voucherNumber: existingVch,
        supplierName: s.supplierName || partnerName || "",
        emergency: s.emergency || globalEmergency,
        city: s.city || voucherData?.destination || "",
        roomCategory: s.roomCategory || "",
        roomType: s.roomType || "",
        rooms: s.rooms || "",
        vehicleType: s.vehicleType || "",
      };
    });
  }, [voucherData]);

  const [servicesList, setServicesList] = useState(initialServicesList);

  // Document Vault State
  const [supplierFile, setSupplierFile] = useState(null);
  const [voucherFile, setVoucherFile] = useState(null);
  const [termsFile, setTermsFile] = useState(null);

  const updateServiceField = (index, field, value) => {
    setServicesList((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      // Auto-mirror voucher number if empty and CNF is typed
      if (field === "confirmationNumber" && !updated[index].voucherNumber) {
        updated[index].voucherNumber = value ? `VCH-${value.replace(/^CNF-?/i, "")}` : "";
      }
      return updated;
    });
  };

  const handleApplyGlobalEmergencyToAll = () => {
    if (!globalEmergency.trim()) {
      toast.error("Please enter a global emergency contact string first");
      return;
    }
    setServicesList((prev) =>
      prev.map((s) => ({
        ...s,
        emergency: globalEmergency.trim(),
      }))
    );
    toast.success("Applied 24/7 support contact to all services!");
  };

  const handleMarkAllConfirmed = () => {
    setServicesList((prev) =>
      prev.map((s) => ({
        ...s,
        status: "Confirmed",
      }))
    );
    toast.success("Marked all services as Confirmed");
  };

  const handleAutoGenerateCnf = () => {
    const qClean = queryId.replace(/[^a-zA-Z0-9]/g, "");
    setServicesList((prev) =>
      prev.map((s, idx) => {
        const rand = Math.floor(10000 + Math.random() * 90000);
        const autoCnf = s.confirmationNumber || `CNF-${qClean ? `${qClean}-` : ""}${rand}`;
        const autoVch = s.voucherNumber || `VCH-${rand}`;
        return {
          ...s,
          status: "Confirmed",
          confirmationNumber: autoCnf,
          voucherNumber: autoVch,
        };
      })
    );
    toast.success("Auto-generated CNF & Voucher references for pending services!");
  };

  // Filtered services for the category tabs
  const filteredServices = useMemo(() => {
    if (selectedCategory === "all") return servicesList;
    if (selectedCategory === "hotels") {
      return servicesList.filter((s) => {
        const t = String(s.type).toLowerCase();
        return t.includes("hotel") || t.includes("stay") || t.includes("room");
      });
    }
    if (selectedCategory === "transfers") {
      return servicesList.filter((s) => {
        const t = String(s.type).toLowerCase();
        return t.includes("transfer") || t.includes("cab") || t.includes("car") || t.includes("transport");
      });
    }
    if (selectedCategory === "activities") {
      return servicesList.filter((s) => {
        const t = String(s.type).toLowerCase();
        return !t.includes("hotel") && !t.includes("stay") && !t.includes("transfer") && !t.includes("cab");
      });
    }
    return servicesList;
  }, [servicesList, selectedCategory]);

  const hotelCount = servicesList.filter((s) => {
    const t = String(s.type).toLowerCase();
    return t.includes("hotel") || t.includes("stay") || t.includes("room");
  }).length;

  const transferCount = servicesList.filter((s) => {
    const t = String(s.type).toLowerCase();
    return t.includes("transfer") || t.includes("cab") || t.includes("car") || t.includes("transport");
  }).length;

  const activityCount = servicesList.length - hotelCount - transferCount;

  const confirmedCount = servicesList.filter(
    (s) => s.confirmationNumber && s.status === "Confirmed"
  ).length;

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (!queryId) {
      toast.error("Query reference ID is missing");
      return;
    }

    // Validate at least one service has confirmation number or name
    const missingCnfs = servicesList.filter((s) => !String(s.confirmationNumber || "").trim());
    if (missingCnfs.length > 0) {
      const confirmProceed = window.confirm(
        `${missingCnfs.length} of ${servicesList.length} services do not have a CNF number yet. Do you want to save anyway?`
      );
      if (!confirmProceed) return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("queryId", queryId);
      formData.append("businessPartnerName", partnerName.trim());
      formData.append("emergencyContact", globalEmergency.trim());
      formData.append("status", "submitted");
      formData.append("services", JSON.stringify(servicesList));

      if (supplierFile) {
        formData.append("supplierConfirmation", supplierFile);
      }
      if (voucherFile) {
        formData.append("voucherReference", voucherFile);
      }
      if (termsFile) {
        formData.append("termsConditions", termsFile);
      }

      const { data } = await API.post("/ops/vouchers/offline-confirmation", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(
        data?.message || "All offline partner services confirmed and synced successfully!"
      );
      onSuccess?.(data?.data);
      onClose?.();
    } catch (err) {
      console.error("Failed to save offline partner confirmations:", err);
      toast.error(
        err?.response?.data?.message || "Failed to save offline confirmations. Please check details."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative flex max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-gray-200 bg-white text-slate-800 shadow-2xl overflow-hidden font-sans"
        >
          {/* Header - Matching CreatePreDefinedPackageModal / UploadBusinessPartner Style */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/95 px-6 py-3.5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-600 shrink-0 shadow-xs">
                <Building2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
                    Offline Partner Service Confirmation & Emergency Support
                  </h2>
                  <span className="rounded-full border border-amber-300 bg-amber-100/80 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-800">
                    Offline Partner Flow
                  </span>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    {queryId}
                  </span>
                  {voucherData?.destination && (
                    <span className="text-xs text-slate-500 font-medium">
                      • {voucherData.destination} ({voucherData.passengers || "Pax"})
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Manage CNF numbers, voucher references & local emergency support for all booked quotation services
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body with Custom Scroller */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scroll">
            
            {/* Top Control Bar: Partner Name, Global 24/7 Support, Quick Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-2xs">
              
              <div className="lg:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Offline Business Partner / Supplier Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="e.g. MakeMyTrip, Agoda, Yatra, Hotel Oberoi..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="lg:col-span-5">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Phone size={12} className="text-amber-600" />
                    Global 24/7 Local Support Contact
                  </label>
                  <button
                    type="button"
                    onClick={handleApplyGlobalEmergencyToAll}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    Apply to All
                  </button>
                </div>
                <input
                  type="text"
                  value={globalEmergency}
                  onChange={(e) => setGlobalEmergency(e.target.value)}
                  placeholder="24/7 Local Support: +91 98765 43210 | ops@holidaycircuit.com"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="lg:col-span-3 flex flex-col justify-end gap-1.5">
                <span className="text-[10.5px] font-bold text-slate-600">Quick Tools</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoGenerateCnf}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-[10.5px] font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer shadow-2xs"
                    title="Auto-fills CNF & VCH numbers for pending services"
                  >
                    <Sparkles size={11} />
                    Auto-Fill CNF
                  </button>
                  <button
                    type="button"
                    onClick={handleMarkAllConfirmed}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[10.5px] font-bold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
                  >
                    <CheckCheck size={12} />
                    All Confirmed
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filter Tabs & Statistics Strip */}
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-gray-200 pb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    selectedCategory === "all"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-gray-100 text-slate-600 hover:bg-gray-200"
                  }`}
                >
                  All Services ({servicesList.length})
                </button>
                {hotelCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("hotels")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      selectedCategory === "hotels"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                    }`}
                  >
                    Hotels ({hotelCount})
                  </button>
                )}
                {transferCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("transfers")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      selectedCategory === "transfers"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200"
                    }`}
                  >
                    Transfers ({transferCount})
                  </button>
                )}
                {activityCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("activities")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      selectedCategory === "activities"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                    }`}
                  >
                    Activities & Sightseeing ({activityCount})
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Confirmed:</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold border ${
                  confirmedCount === servicesList.length
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-amber-50 text-amber-700 border-amber-300"
                }`}>
                  <Check size={12} className="stroke-[3]" />
                  {confirmedCount} / {servicesList.length}
                </span>
              </div>
            </div>

            {/* Services List - Grouped Cards in 1 Modal */}
            <div className="space-y-4">
              {filteredServices.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-8 text-center text-slate-400 text-xs">
                  No services found in this category.
                </div>
              ) : (
                filteredServices.map((service, idx) => {
                  // Find index in main servicesList
                  const realIndex = servicesList.findIndex(
                    (s) => s.serviceId === service.serviceId || s.serviceName === service.serviceName
                  );
                  const targetIndex = realIndex >= 0 ? realIndex : idx;

                  const isConfirmed = service.status === "Confirmed" && Boolean(service.confirmationNumber);

                  return (
                    <div
                      key={service.serviceId || idx}
                      className={`rounded-xl border p-4 sm:p-5 transition-all shadow-xs ${
                        isConfirmed
                          ? "border-emerald-200 bg-emerald-50/15"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      {/* Service Card Top Header */}
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white shadow-2xs">
                            {targetIndex + 1}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${getServiceTypeBadgeColor(service.type)}`}>
                            {getServiceTypeIcon(service.type)}
                            {service.type || "Service"}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {service.serviceName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {service.city && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                              <MapPin size={11} className="text-slate-400" />
                              {service.city}
                            </span>
                          )}
                          {service.roomCategory && (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              {service.roomCategory} {service.roomType ? `• ${service.roomType}` : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Inputs Grid: Status, CNF #, Voucher #, Date, Emergency Contact */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-start">
                        
                        {/* 1. Status (Cols 1-2) */}
                        <div className="lg:col-span-2">
                          <label className="block text-[10.5px] font-bold text-slate-600 mb-1">
                            Status *
                          </label>
                          <select
                            value={service.status || "Confirmed"}
                            onChange={(e) => updateServiceField(targetIndex, "status", e.target.value)}
                            className={`w-full rounded-lg border px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer ${
                              service.status === "Confirmed"
                                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                : service.status === "Re-Confirmed"
                                ? "bg-blue-50 border-blue-300 text-blue-800"
                                : "bg-amber-50 border-amber-300 text-amber-800"
                            }`}
                          >
                            <option value="Confirmed">Confirmed</option>
                            <option value="Re-Confirmed">Re-Confirmed</option>
                            <option value="Pending">Pending</option>
                          </select>
                        </div>

                        {/* 2. Confirmation No (CNF) (Cols 3-5) */}
                        <div className="lg:col-span-3">
                          <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                            Confirmation No (CNF) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={service.confirmationNumber || ""}
                            onChange={(e) => updateServiceField(targetIndex, "confirmationNumber", e.target.value)}
                            placeholder="e.g. CNF-17241 / MMT-88219"
                            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* 3. Voucher Reference (Cols 6-8) */}
                        <div className="lg:col-span-3">
                          <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                            Voucher Reference
                          </label>
                          <input
                            type="text"
                            value={service.voucherNumber || ""}
                            onChange={(e) => updateServiceField(targetIndex, "voucherNumber", e.target.value)}
                            placeholder="e.g. VCH-88219"
                            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* 4. Service Date (Cols 9-10) */}
                        <div className="lg:col-span-2">
                          <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                            Service Date
                          </label>
                          <input
                            type="date"
                            value={service.serviceDate || ""}
                            onChange={(e) => updateServiceField(targetIndex, "serviceDate", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 cursor-pointer [color-scheme:light]"
                          />
                        </div>

                        {/* 5. Offline Supplier Name (Cols 11-12) */}
                        <div className="lg:col-span-2">
                          <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                            Supplier / Partner
                          </label>
                          <input
                            type="text"
                            value={service.supplierName || ""}
                            onChange={(e) => updateServiceField(targetIndex, "supplierName", e.target.value)}
                            placeholder={partnerName || "MakeMyTrip"}
                            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* 6. Emergency Support Row (Cols 1-12) */}
                        <div className="lg:col-span-12 pt-1 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                              <Phone size={10} className="text-amber-600" />
                              24/7 Local Support / Emergency Contact for this Service
                            </label>
                            {service.emergency !== globalEmergency && (
                              <button
                                type="button"
                                onClick={() => updateServiceField(targetIndex, "emergency", globalEmergency)}
                                className="text-[9.5px] font-bold text-blue-600 hover:underline cursor-pointer"
                              >
                                Reset to Global
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={service.emergency || ""}
                            onChange={(e) => updateServiceField(targetIndex, "emergency", e.target.value)}
                            placeholder="e.g. 24/7 Local Support: +91 98765 43210 | ops@holidaycircuit.com"
                            className="w-full rounded-lg border border-gray-200 bg-amber-50/20 px-2.5 py-1 text-[11px] text-slate-700 outline-none focus:border-amber-400"
                          />
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Document Upload Vault (Optional attachments matching DMC format) */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/90 p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-800">
                  Document Upload Vault (Optional Attachments)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Supplier Confirmation */}
                <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50/30 p-3 flex flex-col justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-blue-900">Supplier Confirmation</p>
                    <p className="text-[10px] text-blue-600">PDF / Image / Word</p>
                    {supplierFile && (
                      <p className="mt-1 text-[10.5px] font-bold text-emerald-700 truncate max-w-[180px]">
                        ✓ {supplierFile.name}
                      </p>
                    )}
                  </div>
                  <label className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs">
                    <Upload size={12} />
                    <span>{supplierFile ? "Change" : "Choose File"}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setSupplierFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 2. Voucher Reference */}
                <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/30 p-3 flex flex-col justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-emerald-900">Voucher Reference</p>
                    <p className="text-[10px] text-emerald-600">PDF / Image / Word</p>
                    {voucherFile && (
                      <p className="mt-1 text-[10.5px] font-bold text-emerald-700 truncate max-w-[180px]">
                        ✓ {voucherFile.name}
                      </p>
                    )}
                  </div>
                  <label className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs">
                    <Upload size={12} />
                    <span>{voucherFile ? "Change" : "Choose File"}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setVoucherFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 3. Terms & Conditions */}
                <div className="rounded-xl border border-dashed border-purple-300 bg-purple-50/30 p-3 flex flex-col justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-purple-900">Terms & Conditions</p>
                    <p className="text-[10px] text-purple-600">PDF / Word</p>
                    {termsFile && (
                      <p className="mt-1 text-[10.5px] font-bold text-emerald-700 truncate max-w-[180px]">
                        ✓ {termsFile.name}
                      </p>
                    )}
                  </div>
                  <label className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1 text-xs font-bold text-white hover:bg-purple-700 transition cursor-pointer shadow-xs">
                    <Upload size={12} />
                    <span>{termsFile ? "Change" : "Choose File"}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setTermsFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* Sticky Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50/95 px-6 py-3.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                {confirmedCount} of {servicesList.length} services confirmed
              </span>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer ${
                  saving
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-[#3E63DD] hover:bg-blue-700 active:scale-95"
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Saving Confirmations...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Save & Confirm All Services</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
