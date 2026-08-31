import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Send,
  FileText,
} from "lucide-react";
import Service from "./Service";
import {
  sectionRevealVariants,
  sideStackVariants,
  rightCardVariants,
  formatAmountValue,
  formatDateInput,
  getServiceCardDomId,
} from "./utils";

const QuotationBuilderContent = (props) => {
  const {
    CONTRACTED_RATE_FILTER_OPTIONS,
    Chip,
    Icon,
    adultPassengers,
    appliedTaxTotal,
    childPassengers,
    contractedRateFilterCounts,
    contractedRatesFilter,
    contractedRatesSearch,
    costPerPassenger,
    currency,
    days,
    deleteService,
    destinationMatchedServices,
    editingServiceCardId,
    endDate,
    exchangeRate,
    exchangeRates,
    filteredServices,
    fixedMargin,
    focusServiceEditor,
    focusedServiceCardId,
    foreignCurrencyBreakdown,
    getHotelNightStart,
    getRemainingHotelNights,
    handleFinalSend,
    handleSaveDraftQuote,
    handleSelectedServiceDelete,
    handleSelectedServiceEditAction,
    iconClasses,
    index,
    isActive,
    isInvoiceRequestedStage,
    key,
    map,
    marginType,
    markup,
    nights,
    now,
    openOpsChargesPopup,
    openSelectedServicesModalForService,
    opsMarkup,
    option,
    order,
    originalTotal,
    packageTemplateAmount,
    queryRequirementTags,
    quotation,
    remainingHotelNights,
    renderQuotationWorkspaceButtons,
    renderSelectedServicesSection,
    savingDraftQuote,
    selectedSendOption,
    selectedServices,
    selectedTransportUsageLabels,
    selectedTransportUsageLimitLabels,
    sendOptions,
    sendOptionsPanelStyle,
    serviceDate,
    serviceEdits,
    services,
    servicesLoadError,
    servicesLoading,
    servicesTotal,
    setContractedRatesFilter,
    setContractedRatesSearch,
    setExchangeRates,
    setFixedMargin,
    setMarginType,
    setMarkup,
    setSelectedSendOption,
    setShowQueryRequirements,
    setShowQuickServiceModal,
    setShowSendOptions,
    shouldShowDualPricing,
    showQueryRequirements,
    showSendOptions,
    startDate,
    target,
    toggleService,
    toneClasses,
    totalAmount,
    totalInInr,
    totalPassengers,
    tourType,
    tripDuration,
    tripEndDate,
    tripNights,
    type,
    typeAccent,
    updateField,
    value,
    values,
  } = props;

  return (
    <motion.div
      variants={sectionRevealVariants}
      className="grid grid-cols-1 lg:grid-cols-3 gap-3"
    >
      {/* LEFT SIDE */}
      <motion.div
        variants={sideStackVariants}
        className="lg:col-span-2 space-y-8"
      >
        {/* Query Info */}
        <motion.div
          variants={sectionRevealVariants}
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm text-slate-900"
        >
          <h2 className="text-md font-semibold text-slate-900 mb-6">
            Query Information
          </h2>

          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            {/* Agent Name */}
            <div>
              <p className="text-gray-500 text-xs mb-1">Agent Name</p>
              <p className="text-slate-900 text-xs font-semibold">
                {order?.agent?.companyName}
              </p>
            </div>

            {/* Agent Email */}
            <div>
              <p className="text-gray-500 text-xs mb-1">Agent Email</p>
              <p className="text-slate-900 text-xs font-semibold">
                {order?.agent?.email}
              </p>
            </div>

            {/* Destination */}
            <div>
              <p className="text-gray-500 text-xs mb-1">Destination</p>
              <p className="text-slate-900 text-xs font-semibold">
                {order?.destination}
              </p>
            </div>

            {/* Travel Date */}
            <div>
              <p className="text-gray-500 text-xs mb-1">Travel Date</p>
              <p className="text-slate-900 text-xs font-semibold">
                {new Date(order?.startDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* Duration */}
            <div>
              <p className="text-gray-500 text-xs">Duration</p>
              <p className="text-slate-900 text-xs font-semibold">
                {tripDuration.label}
              </p>
            </div>

            {/* Passengers */}
            <div>
              <p className="text-gray-500 text-xs">Passengers</p>
              <p className="text-slate-900 text-xs font-semibold">
                {totalPassengers} PAX
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {adultPassengers} Adult{adultPassengers === 1 ? "" : "s"} |{" "}
                {childPassengers} Child{childPassengers === 1 ? "" : "ren"}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-gray-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Query Requirements
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Click to view the request context before building the quote.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQueryRequirements((prev) => !prev)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-[11px] font-semibold text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer"
              >
                {showQueryRequirements ? "Hide Details" : "Show Details"}
                {showQueryRequirements ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {showQueryRequirements && (
                <motion.div
                  initial={{ height: 0, opacity: 0, y: -8 }}
                  animate={{ height: "auto", opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-4">
                    {queryRequirementTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {queryRequirementTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-[11px] font-medium text-slate-700 shadow-2xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mb-3">
                        No structured requirements added.
                      </p>
                    )}

                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500 mb-2">
                        Special Preferences / Notes
                      </p>
                      {order?.specialRequirements ? (
                        <div className="flex flex-wrap gap-2">
                          {order.specialRequirements
                            .split(/[.,;\n]/)
                            .map((item) => item.trim())
                            .filter(Boolean)
                            .map((item, index) => (
                              <span
                                key={`${item}-${index}`}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 border border-gray-200 text-xs text-slate-700"
                              >
                                {item}
                              </span>
                            ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">
                          No special preferences shared for this query.
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {isInvoiceRequestedStage && (
          <motion.div
            variants={sectionRevealVariants}
            className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-amber-500" />
              <div>
                <p className="font-semibold text-slate-900">
                  Client approval is already received for this query
                </p>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  This booking has moved ahead from quotation building and is
                  now in the amount and documents workflow.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <>
          {/*=================================== Select Contracted Rates Service =============================== */}

          <motion.div
            variants={sectionRevealVariants}
            className="dark-scrollbar h-120 overflow-y-auto bg-slate-50 pr-1"
          >
            <div className="sticky top-0 z-10 mb-3 bg-slate-50 p-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Select Contracted Rates
                  </h2>
                  <p className="max-w-2xl text-[11px] leading-relaxed text-slate-500">
                    Tune ops charges and tax values from one compact control
                    desk before sharing the quotation.
                  </p>
                </div>

                <button
                  onClick={() => setShowQuickServiceModal(true)}
                  className="text-xs bg-[#3E63DD] hover:bg-[#3252c4] text-white px-3.5 py-2 rounded-lg font-semibold cursor-pointer shadow-xs transition"
                >
                  + Quick Add Service
                </button>
              </div>

              <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-xs">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={contractedRatesSearch}
                        onChange={(e) =>
                          setContractedRatesSearch(e.target.value)
                        }
                        placeholder={
                          servicesLoading
                            ? "Loading contracted rates..."
                            : "Search hotel, transport, activity or sightseeing"
                        }
                        disabled={servicesLoading}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition-colors focus:border-[#3E63DD] focus:ring-1 focus:ring-[#3E63DD] disabled:cursor-wait disabled:opacity-60 shadow-2xs"
                      />
                      {(contractedRatesSearch ||
                        contractedRatesFilter !== "all") && (
                        <button
                          type="button"
                          onClick={() => {
                            setContractedRatesSearch("");
                            setContractedRatesFilter("all");
                          }}
                          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer shadow-2xs"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-[10px] text-gray-500">
                      {servicesLoading
                        ? "Contracted rates are loading in the background..."
                        : filteredServices.length ===
                            destinationMatchedServices.length
                          ? `${destinationMatchedServices.length} services available for ${order?.destination || "this destination"}`
                          : `Showing ${filteredServices.length} of ${destinationMatchedServices.length} services for ${order?.destination || "this destination"}`}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {CONTRACTED_RATE_FILTER_OPTIONS.map((option) => {
                      const isActive = contractedRatesFilter === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={servicesLoading}
                          onClick={() => setContractedRatesFilter(option.value)}
                          className={`rounded-full border px-3.5 py-1.5 text-[11px] font-medium transition-all cursor-pointer ${
                            isActive
                              ? "border-[#3E63DD] bg-[#3E63DD] text-white shadow-2xs font-semibold"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                          } disabled:cursor-wait disabled:opacity-60`}
                        >
                          {option.label} (
                          {contractedRateFilterCounts[option.value] || 0})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Service Card */}
            {servicesLoading ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center shadow-xs">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-[#3E63DD]" />
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  Loading contracted services
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Quotation Builder is ready. Rates are being fetched in the
                  background.
                </p>
              </div>
            ) : servicesLoadError ? (
              <div className="rounded-2xl border border-dashed border-red-300 bg-red-50 px-4 py-8 text-center">
                <p className="text-sm font-semibold text-red-700">
                  {servicesLoadError}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Refresh the page or try again in a moment.
                </p>
              </div>
            ) : filteredServices.length > 0 ? (
              filteredServices.map((service, index) => (
                <Service
                  key={service.id}
                  index={index}
                  service={service}
                  cardDomId={getServiceCardDomId(service.id)}
                  isEditorFocused={focusedServiceCardId === service.id}
                  isEditMode={editingServiceCardId === service.id}
                  exchangeRates={exchangeRates}
                  allServices={services}
                  toggleService={toggleService}
                  updateField={updateField}
                  deleteService={deleteService}
                  onStartServiceEdit={focusServiceEditor}
                  onOpenSelectedServices={openSelectedServicesModalForService}
                  tripNights={tripNights}
                  remainingHotelNights={getRemainingHotelNights(
                    services,
                    service.id,
                  )}
                  hotelNightStart={getHotelNightStart(services, service.id)}
                  tripStartDate={formatDateInput(order?.startDate)}
                  tripEndDate={formatDateInput(order?.endDate)}
                  totalPassengers={totalPassengers}
                  adultPassengers={adultPassengers}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center shadow-xs">
                <p className="text-sm font-semibold text-slate-900">
                  No contracted services found
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Try another search term or check whether contracted services
                  exist for {order?.destination || "this destination"}.
                </p>
              </div>
            )}
          </motion.div>
          {!isInvoiceRequestedStage && renderSelectedServicesSection()}
        </>
      </motion.div>

      {/*========================= RIGHT SIDE =================================================== */}
      <motion.div variants={sideStackVariants} className="space-y-6">
        {/*=========================== DMC Margin Section ============================= */}
        <motion.div
          variants={rightCardVariants}
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-slate-900"
        >
          {/* Title */}
          <h2 className="font-semibold text-slate-900 mb-4 text-start flex items-center gap-2">
            OPS Margin
          </h2>

          {/* Margin Type */}
          <p className="text-xs text-gray-500 mb-1 text-start font-medium">
            Margin Type
          </p>

          <select
            value={marginType}
            onChange={(e) => setMarginType(e.target.value)}
            className="w-full bg-white border border-gray-300 text-sm mt-1 rounded-2xl pl-4 p-2.5 mb-4 outline-none text-slate-900 cursor-pointer focus:border-[#3E63DD] focus:ring-1 focus:ring-[#3E63DD] shadow-2xs"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount</option>
          </select>

          {/*========================================= Markup Percentage Section ================================ */}

          <p className="text-xs text-gray-500 mb-2 text-start font-medium">
            {marginType === "percentage" ? "Markup Percentage" : "Fixed Margin"}
          </p>

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={marginType === "percentage" ? markup : fixedMargin}
              onChange={(e) =>
                marginType === "percentage"
                  ? setMarkup(e.target.value)
                  : setFixedMargin(roundCurrencyAmount(e.target.value))
              }
              className="w-full bg-white border border-gray-300 text-sm font-bold rounded-2xl text-start pl-5 p-2.5 outline-none text-slate-900 focus:border-[#3E63DD] focus:ring-1 focus:ring-[#3E63DD] shadow-2xs"
            />

            <span className="text-[#3E63DD] text-lg font-bold">
              {marginType === "percentage" ? "%" : "₹"}
            </span>
          </div>
        </motion.div>

        {/* ==================================== Price Breakdown Section ============================================ */}

        {!isInvoiceRequestedStage &&
          selectedSendOption === "__price_breakdown_preview__" && (
            <motion.div
              variants={rightCardVariants}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-slate-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[13px] font-semibold text-slate-900">
                    Selected Services
                  </h2>
                  <p className="mt-1 max-w-47.5 text-[10px] leading-relaxed text-slate-500">
                    All checked services are listed here for quick edit or
                    delete.
                  </p>
                </div>
                <div className="flex min-w-20 items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-2 py-1.5 text-center text-blue-700 shadow-2xs">
                  <span className="text-[10px] font-bold leading-none">
                    {selectedServices.length}
                  </span>
                  <span className="text-[10px] font-bold leading-none">
                    selected
                  </span>
                </div>
              </div>

              {selectedServices.length > 0 ? (
                <div className="dark-scrollbar mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                  {selectedServices.map((service) => {
                    const serviceEdits =
                      getSelectedServiceQuotationEdits(service);
                    const selectedTransportUsageLabels =
                      normalizeServiceFilterType(service.type) === "transfer"
                        ? getSelectedTransportUsageOptionLabels(service)
                        : [];
                    const selectedTransportUsageLimitLabels =
                      normalizeServiceFilterType(service.type) === "transfer"
                        ? getSelectedTransportUsageLimitLabels(
                            service,
                            getTransportUsageLimitOptionsForKeys(
                              getSelectedTransportUsageOptionKeys(service),
                            ),
                          )
                        : [];

                    const Chip = ({
                      icon,
                      label,
                      value,
                      accent = "text-slate-700",
                      iconColor = "text-slate-500",
                    }) => (
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-slate-50 px-2.5 py-1.25">
                        {icon && (
                          <span
                            className={`shrink-0 ${iconColor}`}
                            style={{ lineHeight: 0 }}
                          >
                            {icon}
                          </span>
                        )}
                        {label && (
                          <span className="text-[10px] font-medium text-slate-500 shrink-0">
                            {label}:
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold leading-none truncate max-w-30 ${accent}`}
                        >
                          {value}
                        </span>
                      </div>
                    );

                    const typeAccent =
                      service.type === "hotel"
                        ? {
                            bg: "bg-indigo-50",
                            border: "border-indigo-200",
                            text: "text-indigo-800 font-semibold",
                          }
                        : service.type === "activity"
                          ? {
                              bg: "bg-emerald-50",
                              border: "border-emerald-200",
                              text: "text-emerald-800 font-semibold",
                            }
                          : service.type === "transfer" ||
                              service.type === "car"
                            ? {
                                bg: "bg-violet-50",
                                border: "border-violet-200",
                                text: "text-violet-800 font-semibold",
                              }
                            : {
                                bg: "bg-blue-50",
                                border: "border-blue-200",
                                text: "text-blue-800 font-semibold",
                              };

                    return (
                      <div
                        key={`selected-${service.id}`}
                        className="rounded-[24px] border border-gray-200 bg-white p-3 shadow-2xs"
                      >
                        <div className="rounded-[18px] border border-gray-200 bg-slate-50 px-3 py-3">
                          <div className="flex items-start gap-2.5">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-2xs">
                              {renderSelectedServiceSummaryIcon(service)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-semibold leading-tight text-slate-900">
                                {service.title}
                              </p>
                              {(service.city || service.country) && (
                                <p className="mt-0.5 text-[10px] text-slate-500 truncate">
                                  {[service.city, service.country]
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              )}
                            </div>

                            <div className="flex-shrink-0 text-right pl-1">
                              <p className="text-[12px] font-bold text-amber-700 leading-tight whitespace-nowrap">
                                {formatCurrencyValue(
                                  service.originalTotal || 0,
                                  service.currency,
                                )}
                              </p>
                              {service.isForeignCurrency && (
                                <p className="mt-0.5 text-[10px] text-sky-700 whitespace-nowrap">
                                  ₹ {formatAmountValue(service.totalInInr || 0)}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            <div
                              className={`inline-flex items-center rounded-lg border px-2.5 py-[5px] ${typeAccent.bg} ${typeAccent.border}`}
                            >
                              <span
                                className={`text-[10px] font-semibold leading-none ${typeAccent.text}`}
                              >
                                {getServiceTypeLabel(service.type)}
                              </span>
                            </div>

                            {service.serviceDate && (
                              <Chip
                                icon={
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <rect
                                      x="3"
                                      y="4"
                                      width="18"
                                      height="18"
                                      rx="2"
                                    />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                  </svg>
                                }
                                value={formatServiceDateLabel(
                                  service.serviceDate,
                                )}
                              />
                            )}

                            {service.type === "hotel" &&
                              Number(service.nights || 0) > 0 && (
                                <Chip
                                  icon={
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M2 4v16" />
                                      <path d="M2 8h18a2 2 0 0 1 2 2v10" />
                                      <path d="M2 17h20" />
                                      <path d="M6 8v9" />
                                    </svg>
                                  }
                                  value={`${service.nights} night${Number(service.nights) > 1 ? "s" : ""}`}
                                  accent="text-sky-800"
                                />
                              )}

                            {service.type === "hotel" &&
                              Number(service.rooms || 0) > 0 && (
                                <Chip
                                  icon={
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                      <polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                  }
                                  value={`${service.rooms} room${Number(service.rooms) > 1 ? "s" : ""}`}
                                />
                              )}

                            {service.type === "hotel" && service.bedType && (
                              <Chip
                                icon={
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M2 9V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v5" />
                                    <path d="M2 20v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4" />
                                    <path d="M2 14h20" />
                                    <path d="M7 14v2" />
                                    <path d="M17 14v2" />
                                  </svg>
                                }
                                value={getBedTypeOptionLabel(service.bedType)}
                                accent="text-amber-800"
                                iconColor="text-amber-600"
                              />
                            )}

                            {selectedTransportUsageLabels.map((label) => (
                              <Chip
                                key={`${service.id}-usage-${label}`}
                                icon={
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M10 17h4V5H2v12h3" />
                                    <path d="M20 17h2v-5l-3-4h-5v9h1" />
                                    <circle cx="7.5" cy="17.5" r="2.5" />
                                    <circle cx="17.5" cy="17.5" r="2.5" />
                                  </svg>
                                }
                                value={label}
                                accent="text-violet-800"
                                iconColor="text-violet-600"
                              />
                            ))}

                            {selectedTransportUsageLimitLabels.map((label) => (
                              <Chip
                                key={`${service.id}-limit-${label}`}
                                icon={
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M4 19.5V4.5" />
                                    <path d="M8 19.5V4.5" />
                                    <path d="M12 19.5V4.5" />
                                    <path d="M16 19.5V4.5" />
                                    <path d="M20 19.5V4.5" />
                                  </svg>
                                }
                                value={label}
                                accent="text-amber-800"
                                iconColor="text-amber-600"
                              />
                            ))}

                            {(service.type === "transfer" ||
                              service.type === "car") &&
                              Number(service.days || 0) > 0 && (
                                <Chip
                                  icon={
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <circle cx="12" cy="12" r="10" />
                                      <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                  }
                                  value={`${service.days} day${Number(service.days) > 1 ? "s" : ""}`}
                                  accent="text-violet-800"
                                  iconColor="text-violet-600"
                                />
                              )}

                            {(service.pickupTime || service.time) && (
                              <Chip
                                icon={
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                }
                                value={`Pickup: ${service.pickupTime || service.time}`}
                                accent="text-amber-800"
                                iconColor="text-amber-600"
                              />
                            )}

                            {service.type === "activity" && (
                              <>
                                {service.tourType && (
                                  <Chip
                                    icon={
                                      <svg
                                        width="10"
                                        height="10"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <circle cx="12" cy="12" r="10" />
                                        <polygon points="12 8 8 12 12 16 16 12 12 8" />
                                      </svg>
                                    }
                                    value={service.tourType}
                                    accent="text-emerald-800"
                                    iconColor="text-emerald-600"
                                  />
                                )}
                                {service.pricingBasis && (
                                  <Chip
                                    icon={
                                      <svg
                                        width="10"
                                        height="10"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                      </svg>
                                    }
                                    value={service.pricingBasis}
                                    accent="text-emerald-800"
                                    iconColor="text-emerald-600"
                                  />
                                )}
                                {Number(service.pax || 0) > 0 && (
                                  <Chip
                                    icon={
                                      <svg
                                        width="10"
                                        height="10"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                      </svg>
                                    }
                                    value={`${service.pax} pax`}
                                    accent="text-emerald-800"
                                    iconColor="text-emerald-600"
                                  />
                                )}
                                {service.maxPax && (
                                  <Chip
                                    icon={
                                      <svg
                                        width="10"
                                        height="10"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                      </svg>
                                    }
                                    value={
                                      service.maxPax.includes("Max")
                                        ? service.maxPax
                                        : `Max: ${service.maxPax}`
                                    }
                                    accent="text-purple-800"
                                    iconColor="text-purple-600"
                                  />
                                )}
                              </>
                            )}

                            {service.type === "sightseeing" && (
                              <>
                                {service.tourType && (
                                  <Chip
                                    icon={
                                      <svg
                                        width="10"
                                        height="10"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <circle cx="12" cy="12" r="10" />
                                        <polygon points="12 8 8 12 12 16 12 16 12 12 8" />
                                      </svg>
                                    }
                                    value={service.tourType}
                                    accent="text-sky-800"
                                    iconColor="text-sky-600"
                                  />
                                )}
                                {service.pricingBasis && (
                                  <Chip
                                    icon={
                                      <svg
                                        width="10"
                                        height="10"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                      </svg>
                                    }
                                    value={service.pricingBasis}
                                    accent="text-emerald-800"
                                    iconColor="text-emerald-600"
                                  />
                                )}
                                {Number(service.pax || 0) > 0 && (
                                  <Chip
                                    icon={
                                      <svg
                                        width="10"
                                        height="10"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                      </svg>
                                    }
                                    value={`${service.pax} pax`}
                                    accent="text-blue-800"
                                    iconColor="text-blue-600"
                                  />
                                )}
                                {service.maxPax && (
                                  <Chip
                                    icon={
                                      <svg
                                        width="10"
                                        height="10"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                      </svg>
                                    }
                                    value={
                                      service.maxPax.includes("Max")
                                        ? service.maxPax
                                        : `Max: ${service.maxPax}`
                                    }
                                    accent="text-purple-800"
                                    iconColor="text-purple-600"
                                  />
                                )}
                              </>
                            )}
                          </div>

                          {serviceEdits.length > 0 && (
                            <div className="mt-3 rounded-[14px] border border-sky-200 bg-sky-50 px-3 py-2.5">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-sky-800">
                                  Quotation Edits
                                </p>
                                <span className="rounded-full border border-sky-300 bg-white px-2 py-0.5 text-[8px] font-semibold text-sky-800">
                                  {serviceEdits.length} update
                                  {serviceEdits.length === 1 ? "" : "s"}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {serviceEdits.map((edit) => {
                                  const toneClasses =
                                    edit.variant === "success"
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                      : edit.variant === "warning"
                                        ? "border-amber-300 bg-amber-50 text-amber-900"
                                        : edit.variant === "danger"
                                          ? "border-red-300 bg-red-50 text-red-800"
                                          : "border-sky-300 bg-sky-50 text-sky-800";
                                  const iconClasses =
                                    edit.variant === "success"
                                      ? "text-emerald-600"
                                      : edit.variant === "warning"
                                        ? "text-amber-600"
                                        : edit.variant === "danger"
                                          ? "text-red-600"
                                          : "text-sky-600";

                                  return (
                                    <span
                                      key={`${service.id}-${edit.key}-${edit.label}`}
                                      className={`inline-flex items-center gap-1 rounded-[8px] border px-2.5 py-[5px] text-[10px] font-medium leading-none ${toneClasses}`}
                                    >
                                      <CheckCircle2
                                        size={11}
                                        className={`shrink-0 ${iconClasses}`}
                                      />
                                      <span className="font-semibold">
                                        {edit.label}
                                      </span>
                                      <span className="opacity-40">:</span>
                                      <span>{edit.value}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-2.5 flex items-center justify-between gap-3 px-0.5">
                          <p className="text-[10px] font-medium text-slate-500">
                            Quick Actions
                          </p>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleSelectedServiceEditAction(service)
                              }
                              className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100 cursor-pointer shadow-2xs"
                            >
                              {editingServiceCardId === service.id
                                ? "Save"
                                : "Edit"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleSelectedServiceDelete(service)
                              }
                              className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-1.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-100 cursor-pointer shadow-2xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-slate-50 px-4 py-6 text-center">
                  <p className="text-sm font-semibold text-slate-900">
                    No services selected yet
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Pick services from the left panel and they will appear here
                    automatically.
                  </p>
                </div>
              )}
            </motion.div>
          )}

        <motion.div
          variants={rightCardVariants}
          className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-sm space-y-4 text-slate-900"
        >
          <div className="flex justify-between items-center gap-3">
            <h2 className="font-semibold text-slate-900 text-base">
              Price Breakdown
            </h2>

            <button
              onClick={openOpsChargesPopup}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg font-semibold cursor-pointer shadow-xs transition"
            >
              + OPS Charges
            </button>
          </div>
          <p className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-slate-500 text-xs">Selected Items</span>
            <span className="font-semibold text-slate-800 text-xs">
              {isInvoiceRequestedStage ? 0 : selectedServices.length} items
            </span>
          </p>
          <p className="flex justify-between">
            <span className="text-slate-500 text-xs">
              OPS Markup (
              {marginType === "percentage"
                ? `${markup}%`
                : `₹ ${formatAmountValue(fixedMargin)}`}
              )
            </span>
            <span className="text-amber-700 font-semibold text-xs">
              ₹ {formatAmountValue(isInvoiceRequestedStage ? 0 : opsMarkup)}
            </span>
          </p>
          <p className="flex justify-between">
            <span className="text-slate-500 text-xs">
              Taxes (GST + TCS + Other)
            </span>
            <span
              className={`text-xs font-semibold ${(isInvoiceRequestedStage ? 0 : appliedTaxTotal) > 0 ? "text-emerald-700" : "text-slate-500"}`}
            >
              ₹{" "}
              {formatAmountValue(isInvoiceRequestedStage ? 0 : appliedTaxTotal)}
            </span>
          </p>
          <p className="flex justify-between">
            <span className="text-slate-500 text-xs">Services Total</span>
            <span
              className={`text-xs font-semibold ${(isInvoiceRequestedStage ? 0 : servicesTotal) > 0 ? "text-sky-700" : "text-slate-500"}`}
            >
              ₹ {formatAmountValue(isInvoiceRequestedStage ? 0 : servicesTotal)}
            </span>
          </p>
          <p className="flex justify-between">
            <span className="text-slate-500 text-xs">
              Package Template Add-on
            </span>
            <span
              className={`text-xs font-semibold ${(isInvoiceRequestedStage ? 0 : packageTemplateAmount) > 0 ? "text-emerald-700" : "text-slate-500"}`}
            >
              ₹{" "}
              {formatAmountValue(
                isInvoiceRequestedStage ? 0 : packageTemplateAmount,
              )}
            </span>
          </p>
          {!isInvoiceRequestedStage && shouldShowDualPricing && (
            <div className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-3 text-xs">
              <p className="font-semibold text-slate-800">
                Foreign Currency Snapshot
              </p>
              <div className="mt-2 space-y-2">
                {foreignCurrencyBreakdown.map((item) => (
                  <div
                    key={item.currency}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {formatCurrencyValue(item.originalTotal, item.currency)}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        1 {item.currency} = ₹{" "}
                        {formatExchangeRateValue(item.exchangeRate)}
                      </p>
                    </div>
                    <span className="text-sky-700 font-semibold">
                      ₹ {formatAmountValue(item.inrTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!isInvoiceRequestedStage && shouldShowDualPricing && (
            <div className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-3 text-xs">
              <p className="font-semibold text-slate-800">FX to ₹</p>
              <div className="mt-2 space-y-2">
                {foreignCurrencyBreakdown.map((item) => (
                  <label
                    key={`${item.currency}-fx`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
                  >
                    <span className="text-slate-700 font-medium">
                      1 {item.currency}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">=</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          exchangeRates[item.currency] ?? item.exchangeRate
                        }
                        onChange={(e) =>
                          setExchangeRates((prev) => ({
                            ...prev,
                            [item.currency]: Number(e.target.value || 0),
                          }))
                        }
                        className="w-24 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-right text-slate-900 outline-none focus:border-[#3E63DD] shadow-2xs font-semibold"
                      />
                      <span className="text-slate-500">₹</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold mt-4 pt-3 border-t border-gray-200">
            <span className="mt-0.5 text-slate-900">Total Amount</span>
            <span className="text-[#3E63DD] mt-0.5">
              ₹ {formatAmountValue(isInvoiceRequestedStage ? 0 : totalAmount)}
            </span>
          </div>
          <p className="flex justify-between text-slate-500 text-xs">
            <span>Cost per Passenger</span>
            <span className="font-semibold text-slate-700">
              ₹{" "}
              {formatAmountValue(
                isInvoiceRequestedStage ? 0 : costPerPassenger,
              )}
            </span>
          </p>
        </motion.div>

        {/*============================================ Buttons Finalize Button ==================================  */}
        <motion.div variants={rightCardVariants} className="hidden">
          {isInvoiceRequestedStage ? (
            <div className="space-y-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-3 text-[11px] leading-5 text-sky-800">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex shrink-0 items-center gap-1 text-sky-700">
                  <AlertCircle size={12} strokeWidth={2.4} />
                </div>
                <p>
                  Client approval is already received. This booking now
                  continues in the shared amount and documents workflow.
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowSendOptions(!showSendOptions)}
              className="w-full bg-[#3E63DD] text-white text-md py-3 rounded-xl font-semibold hover:bg-[#3252c4] flex items-center justify-center gap-2 cursor-pointer shadow-sm transition"
            >
              <Send size={16} />
              Finalize & Send Quote
            </button>
          )}

          {/*======================== POPUp Send To =================================================== */}
          {/* Popup */}
          <div
            style={sendOptionsPanelStyle}
            className={`absolute bottom-full mb-3 right-0 min-w-[320px] backdrop-blur-xl
      bg-white border border-gray-200
      rounded-xl shadow-2xl overflow-hidden z-50
      transform transition-all duration-300 ease-out origin-bottom-right text-slate-900
      ${
        !isInvoiceRequestedStage && showSendOptions
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          : "opacity-0 scale-95 translate-y-2 pointer-events-none"
      }`}
          >
            {/** Header Info */}
            <div className="px-5 py-3 border-b border-gray-100 bg-slate-50">
              <p className="text-sm font-semibold text-slate-900">
                Agent: {order?.agent?.companyName}
              </p>
              <p className="text-xs text-slate-500">
                Email: {order?.agent?.email}
              </p>
              <p className="text-xs text-slate-500">
                Selected Services: {services.filter((s) => s.checked).length}
              </p>
              <p className="text-xs font-semibold text-amber-700">
                Total Amount: {"\u20B9"} {formatAmountValue(totalAmount)}
              </p>
            </div>

            {/** Options */}
            {sendOptions.map((option, idx) => {
              const Icon = option.icon;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedSendOption(option.label)}
                  className={`flex items-center gap-3 px-5 py-3 cursor-pointer border-b border-gray-100
  ${selectedSendOption === option.label ? "bg-blue-50" : "hover:bg-slate-50"}`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {option.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {option.description}
                    </p>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => handleFinalSend()}
              className="w-full bg-[#3E63DD] hover:bg-[#3252c4] text-white py-2.5 font-semibold cursor-pointer transition"
            >
              Send Now
            </button>
          </div>
        </motion.div>

        {!isInvoiceRequestedStage &&
          renderQuotationWorkspaceButtons(rightCardVariants)}

        {/*============================================ Buttons Finalize Button ==================================  */}
        <motion.div variants={rightCardVariants} className="relative w-full">
          {!isInvoiceRequestedStage && (
            <button
              onClick={() => setShowSendOptions(!showSendOptions)}
              className="w-full bg-[#3E63DD] hover:bg-[#3252c4] text-white text-md py-3 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition"
            >
              <Send size={16} />
              Finalize & Send Quote
            </button>
          )}

          <div
            style={sendOptionsPanelStyle}
            className={`absolute bottom-full mb-3 right-0 min-w-[320px] backdrop-blur-xl
      bg-white border border-gray-200
      rounded-2xl shadow-2xl overflow-hidden z-50 text-slate-900
      transform transition-all duration-300 ease-out origin-bottom-right
      ${
        !isInvoiceRequestedStage && showSendOptions
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          : "opacity-0 scale-95 translate-y-2 pointer-events-none"
      }`}
          >
            <div className="px-5 py-3 border-b border-gray-100 bg-slate-50">
              <p className="text-sm font-semibold text-slate-900">
                Agent: {order?.agent?.companyName}
              </p>
              <p className="text-xs text-slate-500">
                Email: {order?.agent?.email}
              </p>
              <p className="text-xs text-slate-500">
                Selected Services: {services.filter((s) => s.checked).length}
              </p>
              <p className="text-xs font-semibold text-amber-700">
                Total Amount: {"\u20B9"} {formatAmountValue(totalAmount)}
              </p>
            </div>

            {sendOptions.map((option, idx) => {
              const Icon = option.icon;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedSendOption(option.label)}
                  className={`flex items-center gap-3 px-5 py-3 cursor-pointer border-b border-gray-100
  ${selectedSendOption === option.label ? "bg-blue-50" : "hover:bg-slate-50"}`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {option.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {option.description}
                    </p>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => handleFinalSend()}
              className="w-full bg-[#3E63DD] hover:bg-[#3252c4] text-white py-2.5 font-semibold cursor-pointer transition"
            >
              Send Now
            </button>
          </div>
        </motion.div>

        {!isInvoiceRequestedStage && (
          <motion.button
            variants={rightCardVariants}
            type="button"
            onClick={handleSaveDraftQuote}
            disabled={savingDraftQuote}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-2.5 text-md font-semibold text-slate-700 hover:bg-gray-50 shadow-xs disabled:cursor-not-allowed disabled:opacity-70 transition"
          >
            <FileText size={18} />
            {savingDraftQuote ? "Saving Draft..." : "Save as Draft"}
          </motion.button>
        )}

        {/* Footer Note */}
        {!isInvoiceRequestedStage && (
          <motion.p
            variants={rightCardVariants}
            className="text-xs border border-blue-200 p-4 rounded-2xl text-blue-800 bg-blue-50 shadow-2xs"
          >
            {`Note: The quotation will be sent to ${order?.agent?.email || "agent email"}. Once the agent uploads the payment receipt, you can track the verification status in the Booking Hub.`}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default QuotationBuilderContent;
