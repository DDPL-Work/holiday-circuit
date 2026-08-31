import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Search,
  Plus,
  X,
  MapPin,
  Clock,
  BedDouble,
  Car,
  Compass,
  CalendarDays,
  Trash2,
  Eye,
  RefreshCw,
  Landmark,
  FileText,
  PackageCheck,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../utils/Api.js";
import toast from "react-hot-toast";
import CreatePreDefinedPackageModal from "../../modal/CreatePreDefinedPackageModal.jsx";

/* ===== Page Animation (matches Queries.jsx) ===== */
const containerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

const POPULAR_DESTINATIONS = [
  "All",
  "Goa",
  "Dubai",
  "Kashmir",
  "Kerala",
  "Mussoorie",
  "Himachal",
  "Rajasthan",
  "Thailand",
  "Bali",
];

const DEFAULT_SELLER_BANK_DETAILS = [
  { label: "Bank Name", value: "HDFC Bank" },
  { label: "A/c Holder Name", value: "Holiday Circuit" },
  { label: "A/c No.", value: "50200103968171" },
  { label: "IFSC", value: "HDFC0004413" },
  { label: "Branch", value: "RAMPHAL CHOWK SEC VII DWARKA" },
];

const getPackageNightCount = (pkg = {}) => {
  const durationMatch = String(pkg.duration || "").match(/(\d+)\s*nights?/i);
  if (durationMatch) return Math.max(1, Number(durationMatch[1]));

  const totalDays = Number(pkg.days || 0);
  return totalDays > 1 ? totalDays - 1 : 1;
};

const formatCompactDuration = (pkg = {}) => {
  const durStr = String(pkg.duration || "").trim();

  // "4D/3N" or "4 Days / 3 Nights" or "4D / 3N"
  const dFirstMatch = durStr.match(/(\d+)\s*d(?:ays?)?\s*[/,\-&]?\s*(\d+)\s*n(?:ights?)?/i);
  if (dFirstMatch) {
    return `${dFirstMatch[1]}D/${dFirstMatch[2]}N`;
  }

  // "3 Nights / 4 Days" or "3 Nights / 4Days"
  const nFirstMatch = durStr.match(/(\d+)\s*n(?:ights?)?\s*[/,\-&]?\s*(\d+)\s*d(?:ays?)?/i);
  if (nFirstMatch) {
    return `${nFirstMatch[2]}D/${nFirstMatch[1]}N`;
  }

  // If days number exists
  const daysNum = Number(pkg.days || 0);
  if (daysNum > 0) {
    const nights = Math.max(1, daysNum - 1);
    return `${daysNum}D/${nights}N`;
  }

  // If only nights specified
  const nightsOnly = durStr.match(/(\d+)\s*nights?/i);
  if (nightsOnly) {
    const n = Number(nightsOnly[1]);
    return `${n + 1}D/${n}N`;
  }

  return durStr || "Custom";
};

const getPreviewHotelNights = (pkg = {}, hotel = {}) => {
  const savedNights = Number(hotel.nights || 0);
  if (savedNights > 0) return savedNights;
  return Array.isArray(pkg.hotels) && pkg.hotels.length === 1
    ? getPackageNightCount(pkg)
    : 1;
};

export default function CreatePackage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("All");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [previewPackage, setPreviewPackage] = useState(null);
  const [deleteModalPackage, setDeleteModalPackage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Fetch all packages
  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/ops/package");
      if (res.data && res.data.data) {
        setPackages(res.data.data);
      } else {
        setPackages([]);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast.error("Failed to load package templates");
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Open Delete Confirmation Modal
  const handleDeletePackage = (pkg) => {
    setDeleteModalPackage(pkg);
  };

  // Confirm Delete in Modal
  const confirmDeletePackage = async () => {
    if (!deleteModalPackage) return;
    const id = deleteModalPackage._id;
    const title = deleteModalPackage.title || "Package";
    setDeletingId(id);
    try {
      await API.delete(`/dmc/package/${id}`);
      toast.success(`Package "${title}" deleted successfully`);
      setPackages((prev) => prev.filter((p) => p._id !== id));
      if (previewPackage?._id === id) {
        setPreviewPackage(null);
      }
      setDeleteModalPackage(null);
    } catch (error) {
      console.error("Error deleting package:", error);
      toast.error(error.response?.data?.message || "Failed to delete package");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const titleMatch = (pkg.title || "").toLowerCase().includes(search.toLowerCase());
      const destMatch = (pkg.destination || "").toLowerCase().includes(search.toLowerCase());
      const countryMatch = (pkg.country || "").toLowerCase().includes(search.toLowerCase());
      const textMatches = !search || titleMatch || destMatch || countryMatch;

      const destinationMatches =
        selectedDestination === "All" ||
        (pkg.destination || "").toLowerCase().includes(selectedDestination.toLowerCase()) ||
        (pkg.country || "").toLowerCase().includes(selectedDestination.toLowerCase());

      return textMatches && destinationMatches;
    });
  }, [packages, search, selectedDestination]);

  // Destination Counts for Tabs
  const destinationCounts = useMemo(() => {
    const counts = { All: packages.length };
    POPULAR_DESTINATIONS.forEach((dest) => {
      if (dest === "All") return;
      counts[dest] = packages.filter(
        (p) =>
          (p.destination || "").toLowerCase().includes(dest.toLowerCase()) ||
          (p.country || "").toLowerCase().includes(dest.toLowerCase())
      ).length;
    });
    return counts;
  }, [packages]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedDestination]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPackages = filteredPackages.slice(startIndex, startIndex + itemsPerPage);

  return (
    <motion.section
      variants={containerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* 1. Header */}
      <motion.header variants={itemVariant}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900">Pre-Defined Packages & Templates</h1>
              <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                OPS Hub
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage ready-to-sell tour package templates and itineraries with live DMC contracted rates.
            </p>
          </div>

          {/* Search + Refresh + Create Package Button */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search packages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 border rounded-lg text-sm border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition bg-white shadow-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={fetchPackages}
              disabled={loading}
              title="Refresh Packages"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-[#3E63DD] hover:bg-[#3252c4] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 cursor-pointer shrink-0"
            >
              <Plus size={14} />
              Create Package
            </motion.button>
          </div>
        </div>

        {/* Destination Filter Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {POPULAR_DESTINATIONS.map((dest) => {
            const isActive = selectedDestination.toLowerCase() === dest.toLowerCase();
            const count = destinationCounts[dest] ?? 0;
            return (
              <button
                key={dest}
                type="button"
                onClick={() => setSelectedDestination(dest)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-[#3E63DD] text-white shadow-[0_2px_8px_rgba(62,99,221,0.3)]"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                {dest}
                {count > 0 && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                      isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.header>

      {/* 2. List-Based Table (Light Theme) */}
      <motion.div
        variants={itemVariant}
        className="bg-white shadow-xs rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="min-w-[860px] w-full table-fixed text-xs">
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[15%]" />
              <col className="w-[12%]" />
              <col className="w-[21%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 font-semibold">
              <tr>
                <th className="text-left px-5 py-3">Package Title</th>
                <th className="text-left px-5 py-3">Destination</th>
                <th className="text-left px-5 py-3">Duration</th>
                <th className="text-left px-5 py-3">Services Included</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3 whitespace-nowrap">Package Price</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-[#3E63DD]" />
                      <p className="text-xs font-medium">Loading package templates...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedPackages.length > 0 ? (
                paginatedPackages.map((pkg, idx) => {
                  const packageCode = pkg.code || `PKG-${100 + (startIndex + idx + 1)}`;
                  const hotelsCount = Array.isArray(pkg.hotels) ? pkg.hotels.length : 0;
                  const transfersCount = Array.isArray(pkg.transfers) ? pkg.transfers.length : 0;
                  const activitiesCount =
                    (Array.isArray(pkg.activities) ? pkg.activities.length : 0) +
                    (Array.isArray(pkg.sightseeing) ? pkg.sightseeing.length : 0);
                  const itineraryCount = Array.isArray(pkg.dayWiseItinerary)
                    ? pkg.dayWiseItinerary.length
                    : 0;

                  const finalSellingPrice = Number(pkg.price || 0);

                  const serviceItems = [];
                  if (hotelsCount > 0) serviceItems.push(`${hotelsCount} Hotel${hotelsCount > 1 ? "s" : ""}`);
                  if (transfersCount > 0) serviceItems.push(`${transfersCount} Cab${transfersCount > 1 ? "s" : ""}`);
                  if (activitiesCount > 0) serviceItems.push(`${activitiesCount} Activit${activitiesCount > 1 ? "ies" : "y"}`);

                  return (
                    <tr
                      key={pkg._id}
                      onClick={() => setPreviewPackage(pkg)}
                      className="cursor-pointer transition-colors hover:bg-[#F9FAFB]"
                    >
                      {/* Package Code & Title */}
                      <td className="px-5 py-4 align-middle">
                        <div className="leading-tight">
                          <span className="text-[10px] font-bold text-blue-600 block mb-0.5 tracking-wider">
                            {packageCode}
                          </span>
                          <p className="font-semibold text-slate-900 line-clamp-1" title={pkg.title}>
                            {pkg.title || "Untitled Package"}
                          </p>
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="px-5 py-4 align-middle">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <MapPin size={13} className="text-gray-400 shrink-0" />
                          <span className="font-medium truncate">
                            {pkg.destination || "General"}
                            {pkg.country ? `, ${pkg.country}` : ""}
                          </span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="px-5 py-4 align-middle">
                        <div className="flex items-center gap-1.5 text-slate-700 whitespace-nowrap">
                          <Clock size={13} className="text-gray-400 shrink-0" />
                          <span className="font-semibold text-slate-800">
                            {formatCompactDuration(pkg)}
                          </span>
                        </div>
                      </td>

                      {/* Services Included (Simple / separated text) */}
                      <td className="px-5 py-4 align-middle">
                        <p className="text-xs font-medium text-slate-700 truncate" title={serviceItems.join(" / ") || "Standard Plan"}>
                          {serviceItems.length > 0 ? serviceItems.join(" / ") : "Standard Plan"}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 align-middle">
                        <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium leading-none bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active Template
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4 align-middle text-right font-bold text-slate-900 whitespace-nowrap text-[13px]">
                        ₹ {finalSellingPrice.toLocaleString("en-IN")}
                      </td>

                      {/* Action Buttons (View + Delete) */}
                      <td className="px-5 py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewPackage(pkg);
                            }}
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 hover:border-blue-300 cursor-pointer transition-colors whitespace-nowrap"
                          >
                            <Eye size={12} />
                            View
                          </button>

                          <button
                            type="button"
                            disabled={deletingId === pkg._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePackage(pkg);
                            }}
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-100 hover:border-rose-300 cursor-pointer transition-colors whitespace-nowrap disabled:opacity-50"
                            title="Delete Package"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <PackageCheck size={28} className="text-gray-400" />
                      <p className="text-sm font-semibold text-slate-700">No package templates found</p>
                      <p className="text-xs text-gray-400 max-w-sm">
                        {search || selectedDestination !== "All"
                          ? "No packages match your search or destination filter."
                          : "No packages created yet. Click '+ Create Package' to add your first template."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls (matches Queries.jsx) */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 bg-gray-50/50 px-6 py-4 sm:flex-row">
            <span className="text-xs font-medium text-gray-500">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredPackages.length)} of{" "}
              {filteredPackages.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                Previous
              </button>
              <div className="hidden items-center gap-1 sm:flex">
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNum = index + 1;
                  const isActive = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-7 w-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[#3E63DD] text-white shadow-xs"
                          : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* 3. Package Details Preview Modal (Clean Light Theme, Wide, rounded-xl & Transparent Scrollbar) */}
      <AnimatePresence>
        {previewPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative w-full max-w-6xl max-h-[90vh] flex flex-col rounded-xl border border-gray-200 bg-white text-slate-800 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/90">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">
                      Package Details Preview
                    </span>
                    <span className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.2 text-[10px] font-bold text-blue-700">
                      Live Template
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1">
                    {previewPackage.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewPackage(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Scrollable Body with Transparent Scrollbar */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* Destination & Price Banner */}
                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin size={14} className="text-blue-600" />
                      {previewPackage.destination}{previewPackage.country ? `, ${previewPackage.country}` : ""}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                      <Clock size={13} className="text-gray-400" />
                      Duration: <span className="font-semibold text-slate-700">{previewPackage.duration || `${previewPackage.days || 1} Days`}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-gray-500">Package Selling Price</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-blue-700">
                      ₹ {Number(previewPackage.price || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {previewPackage.description && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                      Overview
                    </h4>
                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                      {previewPackage.description}
                    </p>
                  </div>
                )}

                {/* Hotels Section */}
                {Array.isArray(previewPackage.hotels) && previewPackage.hotels.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <BedDouble size={14} /> Hotel Accommodations ({previewPackage.hotels.length})
                    </h4>
                    <div className="space-y-2">
                      {previewPackage.hotels.map((h, i) => {
                        const hotelName = h.hotelName || h.hotel_name || h.name || "Hotel Stay";
                        const serviceName = h.serviceName || h.service_name;
                        const hotelNights = getPreviewHotelNights(previewPackage, h);
                        const hotelRooms = Number(h.rooms || h.roomCount || 1);
                        const roomType = h.roomType || h.room_type || "Standard Room";
                        const roomCategory = h.roomCategory || h.category || "Double";
                        const bedType = h.bedType || h.bed_type || "Queen Bed";
                        const mealPlan = h.mealPlan || h.meal_plan || "EP";
                        const rating = h.rating || h.starRating || h.starCategory || h.stars;
                        const hTotal = Number(h.price || 0);
                        const hNightlyRate = Number(h.basePrice || (hTotal > 0 && hotelNights > 0 ? hTotal / hotelNights : 0));

                        // Extra Bed details
                        const extraBedsList = [];
                        if (h.extraAdult && Number(h.awebRate) > 0) extraBedsList.push(`Extra Adult (₹${Number(h.awebRate).toLocaleString("en-IN")})`);
                        if (h.childWithBed && Number(h.cwebRate) > 0) extraBedsList.push(`Child w/ Bed (₹${Number(h.cwebRate).toLocaleString("en-IN")})`);
                        if (h.childWithoutBed && Number(h.cwoebRate) > 0) extraBedsList.push(`Child w/o Bed (₹${Number(h.cwoebRate).toLocaleString("en-IN")})`);
                        if (extraBedsList.length === 0 && h.extraBedType && h.extraBedType !== "None") {
                          extraBedsList.push(`Extra Bed: ${h.extraBedType}`);
                        }

                        const hotelMeta = [
                          roomType ? `Room: ${roomType}` : "Standard Room",
                          roomCategory ? `Category: ${roomCategory}` : "Double",
                          bedType ? `Bed: ${bedType}` : "Queen Bed",
                          extraBedsList.length > 0 ? extraBedsList.join(", ") : "Extra Bed: None",
                          mealPlan ? `Meal: ${mealPlan}` : "EP",
                          `${hotelRooms} Room${hotelRooms > 1 ? "s" : ""} • ${hotelNights} Night${hotelNights > 1 ? "s" : ""}`,
                          rating ? `★ ${rating}` : null,
                          h.supplierName ? `Supplier: ${h.supplierName}` : null,
                        ].filter(Boolean).join(" • ");

                        return (
                          <div key={i} className="rounded-lg border border-gray-200 bg-white p-3.5 text-xs flex flex-col gap-1 shadow-2xs hover:border-gray-300 transition">
                            <div className="flex justify-between items-center gap-3">
                              <div className="min-w-0">
                                {serviceName && serviceName !== hotelName && (
                                  <span className="text-[10px] font-semibold text-slate-500 block truncate">
                                    {serviceName}
                                  </span>
                                )}
                                <span className="font-bold text-slate-900 block truncate text-xs">
                                  {hotelName}
                                </span>
                                <span className="text-[11px] text-gray-500 block truncate mt-0.5">
                                  {hotelMeta}
                                </span>
                              </div>
                              {hTotal > 0 && (
                                <div className="text-right shrink-0">
                                  <span className="font-bold text-slate-900 whitespace-nowrap block">
                                    ₹ {hTotal.toLocaleString("en-IN")}
                                  </span>
                                  {hotelNights > 1 && hNightlyRate > 0 && (
                                    <p className="text-[10px] text-gray-400">
                                      (₹{Math.round(hNightlyRate).toLocaleString("en-IN")} / night)
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            {Boolean(h.description || h.desc) && (
                              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                {h.description || h.desc}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Transports Section */}
                {Array.isArray(previewPackage.transfers) && previewPackage.transfers.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Car size={14} /> Transport Services ({previewPackage.transfers.length})
                    </h4>
                    <div className="space-y-2">
                      {previewPackage.transfers.map((t, i) => {
                        const transferName = t.name || t.serviceName || t.vehicleType || `Transport #${i + 1}`;
                        const serviceName = t.serviceName;
                        const vehicleType = t.vehicleType || t.carType || "Sedan";
                        const rawType = t.usage || t.usageType || t.transferType || t.tripType || t.serviceType || "one-way-airport-transfer";
                        const tUsageLabel = rawType === "one-way-airport-transfer"
                          ? "One Way / Airport Transfer"
                          : rawType === "inter-hotel-transfer"
                          ? "Inter-Hotel Transfer"
                          : rawType === "full-day"
                          ? "Full Day Cab"
                          : rawType === "half-day"
                          ? "Half Day Cab"
                          : String(rawType).replace(/[-_]/g, " ");

                        const paxCapacity = Number(t.passengerCapacity || t.passenger_capacity || 4);
                        const luggageCapacity = t.luggageCapacity !== undefined ? t.luggageCapacity : (t.luggage_capacity !== undefined ? t.luggage_capacity : 2);
                        const tCost = Number(t.price || 0);

                        const transferMeta = [
                          t.day ? `Day ${t.day}` : null,
                          vehicleType ? `Vehicle: ${vehicleType}` : null,
                          tUsageLabel,
                          `Capacity: ${paxCapacity} Pax, ${luggageCapacity} Bags`,
                          (t.pickupTime || t.time) ? `Pickup: ${t.pickupTime || t.time}` : null,
                          t.days
                            ? rawType === "full-day"
                              ? `${t.days} Day${Number(t.days) > 1 ? "s" : ""}`
                              : rawType === "half-day"
                              ? `${t.days} Half-Day${Number(t.days) > 1 ? "s" : ""}`
                              : `${t.days} Trip${Number(t.days) > 1 ? "s" : ""}`
                            : "1 Trip",
                          (t.fullDayExtraPerKmRate || t.halfDayExtraPerKmRate)
                            ? `Extra: ₹${t.fullDayExtraPerKmRate || t.halfDayExtraPerKmRate}/km`
                            : null,
                          t.supplierName ? `Supplier: ${t.supplierName}` : null,
                        ].filter(Boolean).join(" • ");

                        return (
                          <div key={i} className="rounded-lg border border-gray-200 bg-white p-3.5 text-xs flex flex-col gap-1 shadow-2xs hover:border-gray-300 transition">
                            <div className="flex justify-between items-center gap-3">
                              <div className="min-w-0">
                                {serviceName && serviceName !== transferName && (
                                  <span className="text-[10px] font-semibold text-slate-500 block truncate">
                                    {serviceName}
                                  </span>
                                )}
                                <span className="font-bold text-slate-900 block truncate text-xs">
                                  {transferName}
                                </span>
                                <span className="text-[11px] text-gray-500 block truncate mt-0.5">
                                  {transferMeta}
                                </span>
                              </div>
                              {tCost > 0 && (
                                <span className="font-bold text-slate-900 whitespace-nowrap shrink-0">
                                  ₹ {tCost.toLocaleString("en-IN")}
                                </span>
                              )}
                            </div>
                            {Boolean(t.description || t.fullDayNote || t.halfDayNote || t.desc) && (
                              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                {t.description || t.fullDayNote || t.halfDayNote || t.desc}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Activities & Sightseeing Section */}
                {((Array.isArray(previewPackage.activities) && previewPackage.activities.length > 0) ||
                  (Array.isArray(previewPackage.sightseeing) && previewPackage.sightseeing.length > 0)) && (
                  <div>
                    <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Compass size={14} /> Activities & Sightseeing (
                      {(previewPackage.activities?.length || 0) + (previewPackage.sightseeing?.length || 0)})
                    </h4>
                    <div className="space-y-2">
                      {[
                        ...(Array.isArray(previewPackage.activities) ? previewPackage.activities.map(a => ({ ...a, itemType: "Activity" })) : []),
                        ...(Array.isArray(previewPackage.sightseeing) ? previewPackage.sightseeing.map(s => ({ ...s, itemType: "Sightseeing" })) : []),
                      ].map((item, i) => {
                        const name = item.name || item.serviceName || item.activityName || item.sightseeingName || `${item.itemType} #${i + 1}`;
                        const serviceName = item.serviceName;
                        const tourType = item.tourType || "Sharing Tour";
                        const adults = Number(item.adults !== undefined ? item.adults : (item.pax || 1));
                        const children = Number(item.children || 0);
                        const aCost = Number(item.price || 0);
                        const aAdultPrice = Number(item.adultPrice !== undefined ? item.adultPrice : (item.basePrice || 0));
                        const aChildPrice = Number(item.childPrice || 0);

                        const details = [
                          item.day ? `Day ${item.day}` : null,
                          tourType,
                          `${adults} Adult(s)` + (children > 0 ? `, ${children} Child(ren)` : ""),
                          (item.selectedSlot || item.time) ? `Slot: ${item.selectedSlot || item.time}` : null,
                          item.supplierName ? `Supplier: ${item.supplierName}` : null,
                        ].filter(Boolean).join(" • ");

                        const isAct = item.itemType === "Activity";

                        return (
                          <div key={i} className="rounded-lg border border-gray-200 bg-white p-3.5 text-xs flex flex-col gap-1 shadow-2xs hover:border-gray-300 transition">
                            <div className="flex justify-between items-center gap-3">
                              <div className="min-w-0">
                                {serviceName && serviceName !== name && (
                                  <span className="text-[10px] font-semibold text-slate-500 block truncate">
                                    {serviceName}
                                  </span>
                                )}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${isAct ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-purple-50 text-purple-700 border border-purple-200"}`}>
                                    {item.itemType}
                                  </span>
                                  <span className="font-bold text-slate-900 truncate text-xs">
                                    {name}
                                  </span>
                                </div>
                                <span className="text-[11px] text-gray-500 block truncate mt-0.5">
                                  {details}
                                </span>
                              </div>
                              {aCost > 0 && (
                                <div className="text-right shrink-0">
                                  <span className="font-bold text-slate-900 whitespace-nowrap block">
                                    ₹ {aCost.toLocaleString("en-IN")}
                                  </span>
                                  {(aAdultPrice > 0 || aChildPrice > 0) && (
                                    <p className="text-[10px] text-gray-400">
                                      {[
                                        aAdultPrice > 0 ? `₹${aAdultPrice.toLocaleString("en-IN")} / adult` : null,
                                        aChildPrice > 0 ? `₹${aChildPrice.toLocaleString("en-IN")} / child` : null,
                                      ].filter(Boolean).join(" • ")}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            {Boolean(item.description || item.desc) && (
                              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                {item.description || item.desc}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Day-Wise Itinerary */}
                {Array.isArray(previewPackage.dayWiseItinerary) && previewPackage.dayWiseItinerary.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CalendarDays size={14} /> Day-Wise Itinerary ({previewPackage.dayWiseItinerary.length} Days)
                    </h4>
                    <div className="space-y-2">
                      {previewPackage.dayWiseItinerary.map((d, i) => (
                        <div key={i} className="rounded-lg border border-gray-200 bg-gray-50/60 p-3.5 text-xs space-y-1">
                          <span className="font-bold text-slate-900 block">
                            Day {d.day || i + 1}: {d.title || "Tour Itinerary"}
                          </span>
                          {d.description && <p className="text-[11px] text-slate-600">{d.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inclusions & Exclusions */}
                {(previewPackage.inclusions || previewPackage.exclusions) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {previewPackage.inclusions && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3.5">
                        <span className="text-[11px] font-bold text-emerald-800 block mb-1">Inclusions</span>
                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                          {previewPackage.inclusions}
                        </p>
                      </div>
                    )}
                    {previewPackage.exclusions && (
                      <div className="rounded-lg border border-rose-200 bg-rose-50/40 p-3.5">
                        <span className="text-[11px] font-bold text-rose-800 block mb-1">Exclusions</span>
                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                          {previewPackage.exclusions}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Bank Details */}
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-2xs">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                    <Landmark size={14} className="text-slate-700" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Bank Details
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <tbody className="divide-y divide-gray-200">
                        {(previewPackage.sellerBankDetails?.length > 0
                          ? previewPackage.sellerBankDetails
                          : DEFAULT_SELLER_BANK_DETAILS
                        ).map((b, idx) => (
                          <tr key={idx} className={idx % 2 === 1 ? "bg-gray-50/40" : "bg-white"}>
                            <td className="py-2.5 px-4 font-semibold text-gray-500 w-1/3 border-r border-gray-200">
                              {b.label || b.name || "Detail"}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-slate-800">
                              {b.value || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Terms and Conditions (Full Detailed Version matching Agent Side) */}
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-2xs">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                    <FileText size={14} className="text-slate-700" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Terms & Conditions
                    </h4>
                  </div>
                  
                  <div className="p-4 sm:p-5 text-xs text-slate-700 leading-relaxed space-y-4">
                    <p>
                      Welcome to <strong className="font-bold text-slate-900">Holiday Circuit</strong>. These Terms and Conditions govern your use of the <strong className="font-bold text-slate-900">Holiday Circuit</strong> services. When You Make a booking or reservation, you agree to be bound by these Terms.
                    </p>

                    {/* 1. Bookings and Reservations */}
                    <div className="space-y-2">
                      <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-gray-100 pb-1 text-teal-700">
                        Bookings and Reservations
                      </h5>
                      <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                        <li>
                          <strong className="font-bold text-slate-800">Booking Process:</strong> When you make a booking or reservation through <strong className="font-bold text-slate-900">Holiday Circuit</strong>, you agree to provide accurate and complete information. Any discrepancies or errors in the information you provide may result in the cancellation of your booking.
                        </li>
                      </ul>
                    </div>

                    {/* 2. Payment Terms */}
                    <div className="space-y-2">
                      <p>
                        <strong className="font-bold text-slate-800">Payment:</strong> Payments for bookings are due as specified during the booking process. Failure to make payments on time may result in the cancellation of your booking.
                      </p>
                      <ol className="list-none space-y-1.5 pl-2 font-semibold text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <li>1. <strong className="text-emerald-700">Minimum 50%</strong> of the booking amount is required at the time of booking confirmation.</li>
                        <li>2. Remaining 50% in 2 parts i.e. 25% of total booking amount within 30 Days prior to departure and 25% within 20 days prior to departure.</li>
                        <li>3. In Case of Airline booking/Train Tickets, <strong className="text-rose-700">100% ticket cost</strong> to be paid at the time of confirmation.</li>
                        <li>4. In Case a booking is under 100% cancellation period, then <strong className="text-rose-700">100% booking amount</strong> is required at the time of booking confirmation.</li>
                      </ol>
                    </div>

                    {/* 3. Confirmation & Auto-Cancellation Alert */}
                    <div className="space-y-2">
                      <p>
                        <strong className="font-bold text-slate-800">Confirmation:</strong> Your booking is considered confirmed only upon receipt of payment and confirmation from <strong className="font-bold text-slate-900">Holiday Circuit</strong>. Please review all booking details carefully to ensure accuracy.
                      </p>
                      <div className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700">
                        ⚠️ Booking will be auto cancelled in case of non-payment within stipulated time
                      </div>
                    </div>

                    {/* 4. Additional Operational Terms */}
                    <div className="space-y-2 text-slate-600">
                      <p>
                        <strong className="font-bold text-slate-800">Credit Card:</strong> We accept payments through Credit Cards which may attract an additional charge from <strong className="text-amber-700">3% to 5%</strong> depends upon the card type. Card charges shall be over and above the actual service/package cost.
                      </p>
                      <p>
                        <strong className="font-bold text-slate-800">Confirmation Vouchers:</strong> The service will be confirmed once the advance payment is made. However, the confirmation vouchers will only be provided <strong className="text-blue-700">7 days before the arrival date</strong>.
                      </p>
                      <p>
                        <strong className="font-bold text-slate-800">Airport Transfers & Tour Pick Ups:</strong> The service includes <strong className="text-blue-700">60 minutes of waiting time</strong> for Airport pick-ups. If you are delayed at immigration or luggage claim, please call the emergency number to extend the waiting time. Additional parking and waiting time charges may apply. For all other pick-ups, the driver will wait for <strong className="text-blue-700">10 mins at the meeting point</strong> i.e. Hotel Lobby or Reception or any other fixed meeting point.
                      </p>
                      <p>
                        <strong className="font-bold text-slate-800">Taxes:</strong> In case of any changes in taxes (such as GST/Government Tax/TCS) at the time of confirmation, the price will be adjusted accordingly and shall be charged as per the prevailing law. This means that if there is an increase or decrease in applicable taxes between the time of booking confirmation and the actual provision of services, the final price will be adjusted to reflect these changes in accordance with the relevant tax regulations.
                      </p>
                      <p>
                        <strong className="font-bold text-slate-800">Changes and Cancellations:</strong> Changes to bookings or cancellations may be subject to fees or penalties, as determined by the service providers (e.g., airlines, hotels, tour operators) and <strong className="font-bold text-slate-900">Holiday Circuit</strong>. These fees and penalties may vary depending on the service and the timing of the change or cancellation.
                      </p>
                    </div>

                    {/* 5. Travel Documents and Requirements */}
                    <div className="space-y-2">
                      <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-gray-100 pb-1 text-teal-700">
                        Travel Documents and Requirements
                      </h5>
                      <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                        <li>
                          <strong className="font-bold text-slate-800">Valid Id Proof:</strong> It is your responsibility to ensure that you have a valid ID as per destination entry requirements and any required visas or travel documents for your trip. <strong className="font-bold text-slate-900">Holiday Circuit</strong> is not responsible for any issues arising from the lack of proper travel documents.
                          <span className="block mt-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded w-fit">
                            (To Enter Nepal by Air- Valid Passport or Election Card is Mandatory. Aadhar Card is not valid for Travel)
                          </span>
                        </li>
                        <li>
                          <strong className="font-bold text-slate-800">Health and Vaccinations:</strong> You are responsible for ensuring that you meet all health and vaccination requirements for your travel destinations.
                        </li>
                        <li>
                          <strong className="font-bold text-slate-800">Travel Insurance:</strong> We strongly recommend that you purchase travel insurance to protect against unexpected events such as trip cancellations, delays, or emergencies during your travel. <strong className="font-bold text-slate-900">Holiday Circuit</strong> can assist you in obtaining travel insurance, but the decision to purchase it is ultimately yours.
                        </li>
                      </ul>
                    </div>

                    {/* 6. Changes to Itineraries */}
                    <div className="space-y-2">
                      <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-gray-100 pb-1 text-teal-700">
                        Changes to Itineraries
                      </h5>
                      <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                        <li>
                          <strong className="font-bold text-slate-800">By Holiday Circuit:</strong> We reserve the right to make changes to your itinerary or accommodations due to unforeseen circumstances. We will make every effort to inform you of such changes as soon as possible.
                        </li>
                        <li>
                          <strong className="font-bold text-slate-800">By You:</strong> Any changes requested by you to your itinerary may be subject to fees or penalties, as determined by the service providers and <strong className="font-bold text-slate-900">Holiday Circuit</strong>.
                        </li>
                      </ul>
                    </div>

                    {/* 7. Liability */}
                    <div className="space-y-2">
                      <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-gray-100 pb-1 text-teal-700">
                        Liability
                      </h5>
                      <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                        <li>
                          <strong className="font-bold text-slate-800">Service Providers:</strong> <strong className="font-bold text-slate-900">Holiday Circuit</strong> acts as an intermediary between you and service providers such as airlines, hotels, and tour operators. We are not liable for any actions, omissions, or negligence on the part of these service providers.
                        </li>
                        <li>
                          <strong className="font-bold text-slate-800">Force Majeure:</strong> <strong className="font-bold text-slate-900">Holiday Circuit</strong> is not liable for any disruptions, cancellations, or delays caused by circumstances beyond our control, including natural disasters, strikes, political unrest, or other force majeure events.
                        </li>
                      </ul>
                    </div>

                    {/* 8. Legal & Jurisdiction */}
                    <div className="space-y-1.5 text-slate-600 border-t border-gray-100 pt-3">
                      <p>
                        <strong className="font-bold text-slate-800">Governing Law and Jurisdiction:</strong> These Terms and your use of <strong className="font-bold text-slate-900">Holiday Circuit</strong> services are governed by the laws of New Delhi Jurisdiction, and any disputes shall be resolved in the courts of New Delhi Jurisdiction.
                      </p>
                      <p>
                        <strong className="font-bold text-slate-800">Changes to Terms and Conditions:</strong> We reserve the right to update and modify these Terms and Conditions at any time. Please review them periodically for changes. Your continued use of our services after any modifications indicates your acceptance of the updated Terms.
                      </p>
                    </div>

                    {/* 9. Contact Info Box */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                      <strong className="text-slate-900 font-bold">Contact Information:</strong> For any inquiries, please contact us at: <strong className="text-slate-900 font-semibold">Holiday Circuit</strong> KG 3/101, Ground Floor, Vikas Puri, New Delhi -110018, Email id - <span className="font-semibold text-blue-600">ops@holidaycircuit.com</span>, Phone - <span className="font-semibold text-slate-900">+91 8851346665, +91 9971706003</span>
                    </div>

                    <p className="border-t border-gray-200 pt-3 text-center text-xs font-semibold italic text-slate-600">
                      By booking with Holiday Circuit, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewPackage(null)}
                  className="rounded-lg bg-white border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer shadow-2xs"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Create Package Modal */}
      {isCreateModalOpen && (
        <CreatePreDefinedPackageModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            fetchPackages();
            setIsCreateModalOpen(false);
          }}
        />
      )}

      {/* 5. Delete Confirmation Modal (Clean Light Theme) */}
      <AnimatePresence>
        {deleteModalPackage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white text-slate-800 shadow-2xl overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 border border-rose-200 text-rose-600">
                    <Trash2 size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      Delete Package Template?
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Are you sure you want to delete <span className="font-semibold text-slate-800">"{deleteModalPackage.title}"</span>? This will permanently remove the package template.
                    </p>
                  </div>
                </div>

                {deleteModalPackage.destination && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-800 font-medium">
                      <MapPin size={13} className="text-blue-600" />
                      {deleteModalPackage.destination}
                    </span>
                    {Number(deleteModalPackage.price) > 0 && (
                      <span className="font-bold text-blue-700">
                        ₹ {Number(deleteModalPackage.price).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-gray-200 bg-gray-50 px-6 py-3.5">
                <button
                  type="button"
                  disabled={Boolean(deletingId)}
                  onClick={() => setDeleteModalPackage(null)}
                  className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={Boolean(deletingId)}
                  onClick={confirmDeletePackage}
                  className="flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {deletingId ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
