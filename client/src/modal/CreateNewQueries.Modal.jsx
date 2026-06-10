import { useEffect, useRef, useState } from "react";
import { MapPin, ArrowLeft, CheckCircle2, Sparkles, X, AlertCircle, User } from "lucide-react";
import API from "../utils/Api.js";
import { motion, AnimatePresence } from "framer-motion";

const childAgeOptions = Array.from({ length: 12 }, (_, index) => index + 1);

const COMMON_DOMAIN_TYPOS = {
  "mail.com": "gmail.com",
  "email.com": "gmail.com",
  "tmail.com": "gmail.com",
  "fmail.com": "gmail.com",
  "hmail.com": "gmail.com",
  "vmail.com": "gmail.com",
  "bmail.com": "gmail.com",
  "rmail.com": "gmail.com",
  "gmeil.com": "gmail.com",
  "gmaile.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmil.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmail.con": "gmail.com",
  "yaho.com": "yahoo.com",
  "yhoo.com": "yahoo.com",
  "outlok.com": "outlook.com",
  "hotmial.com": "hotmail.com",
  "icloud.co": "icloud.com",
};

const createAdultTraveler = () => ({ fullName: "" });
const createChildTraveler = () => ({ fullName: "", age: "" });

const resizeTravelerList = (count, currentList, builder) =>
  Array.from({ length: count }, (_, index) => currentList[index] || builder());

const getTodayDateString = () => {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
};

const CreateNewQueries = ({ onClose, onCreated, queryToEdit = null, isOpsView = false }) => {
  const [step, setStep] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [formData, setFormData] = useState({
    destination: "",
    clientEmail: "",
    startDate: "",
    endDate: "",
    numberOfAdults: 1,
    numberOfChildren: 0,
    customerBudget: 0,
    hotelCategory: "4 Star",
    transportRequired: false,
    sightseeingRequired: false,
    specialRequirements: "",
    adultTravelers: [createAdultTraveler()],
    childTravelers: [],
  });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [formAlert, setFormAlert] = useState(null);
  const closeTimeoutRef = useRef(null);
  const todayDate = getTodayDateString();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (queryToEdit) {
      const adults = (queryToEdit.travelerDetails || [])
        .filter((t) => t.travelerType === "Adult")
        .map((t) => ({ fullName: t.fullName }));
      
      const children = (queryToEdit.travelerDetails || [])
        .filter((t) => t.travelerType === "Child")
        .map((t) => ({ fullName: t.fullName, age: t.childAge || "" }));

      setFormData({
        destination: queryToEdit.destination || "",
        clientEmail: queryToEdit.clientEmail || "",
        startDate: queryToEdit.startDate ? new Date(queryToEdit.startDate).toISOString().slice(0, 10) : "",
        endDate: queryToEdit.endDate ? new Date(queryToEdit.endDate).toISOString().slice(0, 10) : "",
        numberOfAdults: queryToEdit.numberOfAdults || adults.length || 1,
        numberOfChildren: queryToEdit.numberOfChildren || children.length || 0,
        customerBudget: queryToEdit.customerBudget || 0,
        hotelCategory: queryToEdit.hotelCategory || "4 Star",
        transportRequired: Boolean(queryToEdit.transportRequired),
        sightseeingRequired: Boolean(queryToEdit.sightseeingRequired),
        specialRequirements: queryToEdit.specialRequirements || "",
        adultTravelers: adults.length > 0 ? adults : [createAdultTraveler()],
        childTravelers: children,
      });
    }
  }, [queryToEdit]);

  const resetForm = () => {
    setFormData({
      destination: "",
      clientEmail: "",
      startDate: "",
      endDate: "",
      numberOfAdults: 1,
      numberOfChildren: 0,
      customerBudget: 0,
      hotelCategory: "4 Star",
      transportRequired: false,
      sightseeingRequired: false,
      specialRequirements: "",
      adultTravelers: [createAdultTraveler()],
      childTravelers: [],
    });
    setFormAlert(null);
    setStep(1);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (formAlert) setFormAlert(null);

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    if (name === "numberOfAdults") {
      const nextCount = Math.max(1, Number(value || 1));
      setFormData((prev) => ({
        ...prev,
        numberOfAdults: nextCount,
        adultTravelers: resizeTravelerList(nextCount, prev.adultTravelers, createAdultTraveler),
      }));
      return;
    }

    if (name === "numberOfChildren") {
      const nextCount = Math.max(0, Number(value || 0));
      setFormData((prev) => ({
        ...prev,
        numberOfChildren: nextCount,
        childTravelers: resizeTravelerList(nextCount, prev.childTravelers, createChildTraveler),
      }));
      return;
    }

    if (name === "startDate") {
      setFormData((prev) => ({
        ...prev,
        startDate: value,
        endDate: prev.endDate && prev.endDate < value ? "" : prev.endDate,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTravelerChange = (travelerType, index, field, value) => {
    if (formAlert) setFormAlert(null);
    setFormData((prev) => {
      const targetKey = travelerType === "child" ? "childTravelers" : "adultTravelers";
      const updatedTravelers = [...prev[targetKey]];
      updatedTravelers[index] = {
        ...updatedTravelers[index],
        [field]: value,
      };

      return {
        ...prev,
        [targetKey]: updatedTravelers,
      };
    });
  };

  const validateTravelerStep = () => {
    const missingAdultIndex = formData.adultTravelers.findIndex(
      (traveler) => !String(traveler.fullName || "").trim(),
    );

    if (missingAdultIndex !== -1) {
      setFormAlert({
        title: "Traveler Name Missing",
        message:
          missingAdultIndex === 0
            ? "Please add the lead client name to continue."
            : `Please enter the name for Adult Traveler ${missingAdultIndex + 1}.`,
      });
      return false;
    }

    const missingChildIndex = formData.childTravelers.findIndex(
      (traveler) => !String(traveler.fullName || "").trim() || !Number(traveler.age),
    );

    if (missingChildIndex !== -1) {
      const missingChild = formData.childTravelers[missingChildIndex];
      const childNameMissing = !String(missingChild?.fullName || "").trim();
      const childAgeMissing = !Number(missingChild?.age);

      setFormAlert({
        title: "Child Details Incomplete",
        message:
          childNameMissing && childAgeMissing
            ? `Please enter the name and age for Child Traveler ${missingChildIndex + 1}.`
            : childNameMissing
              ? `Please enter the name for Child Traveler ${missingChildIndex + 1}.`
              : `Please select the age for Child Traveler ${missingChildIndex + 1}.`,
      });
      return false;
    }

    return true;
  };

  const buildTravelerPayload = () => [
    ...formData.adultTravelers.map((traveler) => ({
      fullName: traveler.fullName.trim(),
      travelerType: "Adult",
      documentType: "Passport",
    })),
    ...formData.childTravelers.map((traveler) => ({
      fullName: traveler.fullName.trim(),
      travelerType: "Child",
      childAge: Number(traveler.age),
      documentType: "Passport",
    })),
  ];

  const handleSubmit = async () => {
    if (!formData.startDate || !formData.endDate) {
      setFormAlert({
        title: "Travel Dates Required",
        message: "Please select both start date and end date before submitting the query.",
      });
      setStep(1);
      return;
    }

    if (!queryToEdit && formData.startDate < todayDate) {
      setFormAlert({
        title: "Invalid Start Date",
        message: "Start date can only be today or a future date.",
      });
      setStep(1);
      return;
    }

    if (formData.endDate <= formData.startDate) {
      setFormAlert({
        title: "Invalid End Date",
        message: "End date must be later than start date.",
      });
      setStep(1);
      return;
    }

    try {
      const payload = {
        ...formData,
        travelerDetails: buildTravelerPayload(),
      };

      const response = queryToEdit
        ? await API.put(
            isOpsView
              ? `/ops/manager/queries/${queryToEdit._id}`
              : `/agent/queries/${queryToEdit._id}`,
            payload,
          )
        : await API.post("/agent/queries", payload);
      onCreated?.(response?.data?.query);
      setShowSuccessPopup(true);
    } catch (error) {
      console.error(error.response?.data || error.message);
      window.alert(error?.response?.data?.message || "Unable to save query right now.");
    }
  };

  const closeModal = (shouldReset = false) => {
    setFormAlert(null);
    setShowSuccessPopup(false);
    setIsModalVisible(false);

    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      if (shouldReset) {
        resetForm();
      }
      onClose?.();
    }, 260);
  };

  const handlePopupClose = () => {
    closeModal(true);
  };

  const stepVariant = {
    hidden: { opacity: 0, x: 18 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
      opacity: 0,
      x: -14,
      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
    },
  };

  const handleClose = (e) => {
    e?.stopPropagation?.();
    closeModal();
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isModalVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 sm:px-4 sm:py-6"
          >
            <motion.div
              onClick={() => closeModal()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />

            <motion.section
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.97, y: 26 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.985, y: 18 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`relative z-10 flex max-h-[calc(100vh-20px)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:max-h-[calc(100vh-32px)] sm:p-5 ${isOpsView ? 'max-w-[460px]' : 'max-w-[520px]'}`}
            >
          {isOpsView ? (
            <div className="relative -mx-4 -mt-4 mb-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-4 text-white sm:-mx-5 sm:-mt-5 sm:mb-5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex items-center gap-1.5 text-slate-300 hover:text-white transition bg-transparent border-none outline-none p-0 cursor-pointer"
                >
                  <ArrowLeft className="h-5 w-5 stroke-[1.8]" />
                  <span className="text-sm font-semibold">Back</span>
                </button>
                <div className="text-right">
                  <h3 className="text-sm font-bold tracking-wide uppercase text-indigo-200">
                    {queryToEdit ? "Edit Query" : "New Query"}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Step {step} of 3</p>
                </div>
              </div>
            </div>
          ) : (
            <header className="mb-2 flex items-center justify-between">
              <div
                onClick={handleClose}
                className="flex cursor-pointer items-center gap-1 rounded-xl p-1 hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5 stroke-[1.8] text-gray-800" />
                <h2 className="text-md font-semibold">Back</h2>
              </div>

              <div>
                <p className="text-sm text-gray-500">Step {step} of 3</p>
              </div>
            </header>
          )}

          <AnimatePresence>
            {formAlert && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute left-3 right-3 top-14 z-20"
              >
                <div className="pointer-events-auto rounded-2xl border border-amber-200 bg-[linear-gradient(135deg,rgba(255,251,235,0.98)_0%,rgba(254,243,199,0.96)_100%)] px-4 py-3 shadow-[0_16px_40px_rgba(120,53,15,0.18)]">
                  <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-amber-100 p-2 text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
                      {formAlert.title}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-amber-900">
                      {formAlert.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormAlert(null)}
                    className="rounded-full p-1 text-amber-500 transition hover:bg-white/60 hover:text-amber-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="custom-scroll flex-1 overflow-y-auto pr-1">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={stepVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full bg-transparent shadow-none"
                >
                <div className={isOpsView ? "mb-3" : "mb-6"}>
                  <h2 className="mt-1 text-xl font-semibold">{queryToEdit ? "Edit Query" : "Create New Query"}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Tell us about the travel requirements.
                  </p>
                </div>

                {isOpsView ? (
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Destination</label>
                      <div className="relative">
                        <MapPin
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          name="destination"
                          placeholder="maldives, paris"
                          value={formData.destination}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-gray-300 py-1.5 pl-9 pr-4 focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Client Email</label>
                      <input
                        type="email"
                        name="clientEmail"
                        placeholder="client@example.com"
                        value={formData.clientEmail}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-300 px-4 py-1.5 focus:outline-none text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative mb-3">
                      <label className="mb-1 block text-sm font-medium">Destination</label>
                      <MapPin
                        size={16}
                        className="absolute left-5 top-11 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        name="destination"
                        placeholder="maldives, paris"
                        value={formData.destination}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-300 py-1.5 pl-10 pr-4 focus:outline-none"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="mb-1 block text-sm font-medium">Client Email</label>
                      <input
                        type="email"
                        name="clientEmail"
                        placeholder="client@example.com"
                        value={formData.clientEmail}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      min={queryToEdit ? undefined : todayDate}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      min={formData.startDate || (queryToEdit ? undefined : todayDate)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      const normalizedClientEmail = String(formData.clientEmail || "").trim().toLowerCase();
                      if (!normalizedClientEmail) {
                        setFormAlert({
                          title: "Client Email Required",
                          message: "Please enter the client email address before moving ahead.",
                        });
                        return;
                      }

                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedClientEmail)) {
                        setFormAlert({
                          title: "Invalid Client Email",
                          message: "Please enter a valid client email address.",
                        });
                        return;
                      }

                      const atIndex = normalizedClientEmail.lastIndexOf("@");
                      const domain = normalizedClientEmail.slice(atIndex + 1);
                      if (COMMON_DOMAIN_TYPOS[domain]) {
                        setFormAlert({
                          title: "Email Typo Detected",
                          message: `Did you mean ${normalizedClientEmail.slice(0, atIndex)}@${COMMON_DOMAIN_TYPOS[domain]}? Please correct the email.`,
                        });
                        return;
                      }

                      if (!formData.startDate || !formData.endDate) {
                        setFormAlert({
                          title: "Travel Dates Required",
                          message: "Please select both start date and end date before moving ahead.",
                        });
                        return;
                      }

                      if (!queryToEdit && formData.startDate < todayDate) {
                        setFormAlert({
                          title: "Invalid Start Date",
                          message: "Start date can only be today or a future date.",
                        });
                        return;
                      }

                      if (formData.endDate <= formData.startDate) {
                        setFormAlert({
                          title: "Invalid End Date",
                          message: "End date must be later than start date.",
                        });
                        return;
                      }

                      setFormAlert(null);
                      setStep(2);
                    }}
                    className="flex cursor-pointer items-center gap-1 rounded-xl bg-slate-900 px-6 py-2 text-sm text-white"
                  >
                    Next →
                  </button>
                </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={stepVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full bg-transparent shadow-none"
                >
                <h2 className="text-xl font-semibold">{queryToEdit ? "Edit Query" : "Create New Query"}</h2>
                <p className={`${isOpsView ? 'mb-3' : 'mb-6'} text-sm text-gray-500`}>
                  Tell us about the travel requirements.
                </p>

                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Adults</label>
                    <input
                      type="number"
                      min="1"
                      name="numberOfAdults"
                      value={formData.numberOfAdults}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-300 px-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Children</label>
                    <input
                      type="number"
                      min="0"
                      name="numberOfChildren"
                      value={formData.numberOfChildren}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-300 px-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  {Number(formData.numberOfAdults || 0) > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                      <p className="text-sm font-semibold text-slate-800">Client / Adult Traveler Names</p>
                      <div className="mt-2.5 grid gap-2.5">
                        {formData.adultTravelers.map((traveler, index) => (
                          <input
                            key={`adult-${index}`}
                            value={traveler.fullName}
                            onChange={(e) => handleTravelerChange("adult", index, "fullName", e.target.value)}
                            placeholder={index === 0 ? "Lead Client Name" : `Adult Traveler ${index + 1} Name`}
                            className="w-full rounded-xl border border-gray-300 px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <AnimatePresence initial={false}>
                    {Number(formData.numberOfChildren || 0) > 0 && (
                      <motion.div
                        key="child-traveler-details"
                        initial={{ opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -6, height: 0 }}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                          <p className="text-sm font-semibold text-slate-800">Child Traveler Details</p>
                          <div className="mt-2.5 grid gap-2.5">
                            {formData.childTravelers.map((traveler, index) => (
                              <div
                                key={`child-${index}`}
                                className="grid gap-3 md:grid-cols-[1.6fr_1fr]"
                              >
                                <input
                                  value={traveler.fullName}
                                  onChange={(e) => handleTravelerChange("child", index, "fullName", e.target.value)}
                                  placeholder={`Child Traveler ${index + 1} Name`}
                                  className="w-full rounded-xl border border-gray-300 px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <select
                                  value={traveler.age}
                                  onChange={(e) => handleTravelerChange("child", index, "age", e.target.value)}
                                  className="w-full rounded-xl border border-gray-300 px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Age</option>
                                  {childAgeOptions.map((age) => (
                                    <option key={age} value={age}>
                                      {age} Years
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mb-3.5 mt-2.5">
                  <label className="mb-1 block text-sm font-medium">Budget per person (Optional)</label>
                  <input
                    type="number"
                    name="customerBudget"
                    placeholder="e.g. 50000"
                    value={formData.customerBudget}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                  <label className="mb-1 block text-sm font-medium">Hotel Category</label>
                  <select
                    name="hotelCategory"
                    value={formData.hotelCategory}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="3 Star">3 Star</option>
                    <option value="4 Star">4 Star</option>
                    <option value="5 Star">5 Star</option>
                  </select>
                  <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        name="transportRequired"
                        checked={formData.transportRequired}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                      />
                      Transport Required
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        name="sightseeingRequired"
                        checked={formData.sightseeingRequired}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                      />
                      Sightseeing Required
                    </label>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setFormAlert(null);
                      setStep(1);
                    }}
                    className="cursor-pointer rounded-xl border border-gray-300 px-5 py-2 text-sm"
                  >
                    Previous
                  </button>

                  <button
                    onClick={() => {
                      if (!validateTravelerStep()) return;
                      setFormAlert(null);
                      setStep(3);
                    }}
                    className="flex cursor-pointer items-center gap-1 rounded-xl bg-slate-900 px-6 py-2 text-sm text-white"
                  >
                    Next →
                  </button>
                </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={stepVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full bg-transparent shadow-none"
                >
                <h2 className="text-xl font-semibold">{queryToEdit ? "Edit Query" : "Create New Query"}</h2>
                <p className={`${isOpsView ? 'mb-3' : 'mb-6'} text-sm text-gray-500`}>
                  Tell us about the travel requirements.
                </p>

                <div className={isOpsView ? "mb-3" : "mb-6"}>
                  <label className="mb-1 block text-sm font-medium">
                    Special Preferences / Notes
                  </label>
                  <textarea
                    name="specialRequirements"
                    placeholder="e.g. Vegan food, Honeymoon inclusions, 5-star hotels only..."
                    value={formData.specialRequirements}
                    onChange={handleChange}
                    rows={5}
                    className="w-full rounded-xl border border-gray-300 px-2 py-2 text-sm focus:outline-none"
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setFormAlert(null);
                      setStep(2);
                    }}
                    className="cursor-pointer rounded-xl border border-gray-300 px-5 py-2 text-sm"
                  >
                    Previous
                  </button>

                  <button
                    onClick={handleSubmit}
                    className="cursor-pointer rounded-xl bg-slate-900 px-6 py-2 text-sm text-white"
                  >
                    {queryToEdit ? "Save Changes →" : "Submit Query →"}
                  </button>
                </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 18 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-2xl animate-scale-in"
            >
              <div className="relative bg-gradient-to-r from-[#107c41] via-[#0e4e2c] to-[#0b1e36] px-6 py-5 text-white">
                <button
                  onClick={handlePopupClose}
                  className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-white transition hover:bg-white/20"
                >
                  <X size={15} />
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-sm backdrop-blur-md">
                    <CheckCircle2 size={22} className="text-emerald-100" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-100/80">
                      {queryToEdit ? "Query Updated" : "Query Submitted"}
                    </p>
                    <h3 className="text-base font-bold leading-tight">
                      {queryToEdit ? "Travel Query Updated" : "Travel Query Created Successfully"}
                    </h3>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-emerald-50/85 font-medium leading-relaxed">
                  {queryToEdit
                    ? "Your query details have been updated successfully and will be processed shortly."
                    : "Your request is now in the pipeline and will move into ops processing shortly."}
                </p>
              </div>

              <div className="px-6 py-5">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-slate-100/50 px-2.5 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Destination</p>
                    <p className="mt-1 text-xs font-bold text-slate-900 truncate" title={formData.destination}>
                      {formData.destination || "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-slate-100/50 px-2.5 py-2 text-center">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Dates</p>
                    <p className="mt-1 text-xs font-bold text-slate-900 whitespace-nowrap">
                      {formatDate(formData.startDate)} - {formatDate(formData.endDate)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-slate-100/50 px-2.5 py-2 text-right">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Travellers</p>
                    <p className="mt-1 text-xs font-bold text-slate-900">
                      {Number(formData.numberOfAdults || 0) + Number(formData.numberOfChildren || 0)} PAX
                    </p>
                  </div>
                </div>

                {/* TRAVELERS LIST */}
                <div className="mt-3 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/40 p-3.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-1.5 mb-2 border-b border-slate-100 pb-1.5">
                    <User size={13} className="text-slate-500" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Traveler Details & Names</p>
                  </div>
                  <div className="max-h-[85px] overflow-y-auto space-y-2 pr-1 custom-scroll">
                    {formData.adultTravelers.map((t, idx) => (
                      <div key={`idx-a-${idx}`} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={t.fullName}>
                          {t.fullName || `Adult Traveler ${idx + 1}`}
                        </span>
                        <span className="shrink-0 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/60 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                          {idx === 0 ? "Lead Client" : "Adult"}
                        </span>
                      </div>
                    ))}
                    {formData.childTravelers.map((t, idx) => (
                      <div key={`idx-c-${idx}`} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={t.fullName}>
                          {t.fullName || `Child Traveler ${idx + 1}`}
                        </span>
                        <span className="shrink-0 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100/60 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                          Child ({t.age ? `${t.age} Yrs` : "N/A"})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 px-3.5 py-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 rounded-lg bg-gradient-to-tr from-emerald-100 to-teal-100 p-1.5 text-emerald-700 shadow-sm">
                      <Sparkles size={13} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-900 leading-tight">
                        {queryToEdit ? "Information" : "Next Step"}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-emerald-800/90">
                        {queryToEdit
                          ? "The operations team will be notified of the updates and adapt the itinerary/quotation if required."
                          : "Ops team will review availability, prepare pricing, and move this query forward for quotation."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-3 border-t border-slate-100 pt-3.5">
                  <button
                    onClick={handlePopupClose}
                    className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4.5 py-1.5 text-xs font-semibold text-slate-700 transition active:scale-95 duration-150 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={handlePopupClose}
                    className="rounded-xl bg-gradient-to-r from-[#107c41] via-[#0e4e2c] to-[#0b1e36] px-5 py-2 text-xs font-bold text-white transition hover:opacity-95 shadow-[0_2px_8px_rgba(16,124,65,0.25)] active:scale-95 duration-150 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CreateNewQueries;
