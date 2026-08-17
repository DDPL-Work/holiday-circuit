import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  PackagePlus,
  Search,
  MapPin,
  Calendar,
  BedDouble,
  Car,
  Sparkles,
  Trash2,
  Eye,
  IndianRupee,
  RefreshCw,
  Clock,
  Layers,
  ChevronRight,
  X,
  CalendarDays,
  FileText,
  Building2,
  Landmark,
  Compass,
} from "lucide-react";
import API from "../../utils/Api.js";
import toast from "react-hot-toast";
import CreatePreDefinedPackageModal from "../../modal/CreatePreDefinedPackageModal.jsx";

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

const PACKAGE_PREVIEW_TERMS = [
  {
    title: "Bookings & Payments",
    items: [
      "Provide accurate and complete information when making a booking or reservation. Incorrect information may result in cancellation.",
      "A minimum 50% of the booking amount is required at confirmation. The remaining 50% is payable in two parts: 25% within 30 days and 25% within 20 days before departure.",
      "Airline and train tickets require 100% payment at confirmation. If a booking falls within a 100% cancellation period, the complete booking amount is due at confirmation.",
      "Bookings may be automatically cancelled if payment is not received within the stipulated time. Credit-card payments can attract an additional 3% to 5% charge.",
    ],
  },
  {
    title: "Confirmation, Transfers & Taxes",
    items: [
      "A booking is confirmed only after payment is received and Holiday Circuit issues confirmation. Vouchers are generally provided 7 days before arrival.",
      "Airport transfers include up to 60 minutes of waiting time. Other pickups include 10 minutes at the agreed meeting point; additional parking and waiting charges may apply.",
      "Package prices are adjusted for any applicable GST, Government Tax or TCS change at the time of confirmation, in accordance with prevailing law.",
    ],
  },
  {
    title: "Travel Documents & Changes",
    items: [
      "Guests are responsible for valid ID, visas and all destination-entry requirements. For Nepal air travel, a valid passport or voter ID is mandatory; Aadhaar is not valid for travel.",
      "Guests are responsible for meeting health and vaccination requirements. Travel insurance is strongly recommended for cancellations, delays and emergencies.",
      "Itineraries or accommodations may change because of unforeseen circumstances. Guest-requested changes can be subject to supplier fees or penalties.",
    ],
  },
  {
    title: "Cancellations, Liability & Jurisdiction",
    items: [
      "Changes and cancellations may incur fees or penalties according to airline, hotel, tour operator and other supplier policies.",
      "Holiday Circuit acts as an intermediary and is not liable for service-provider actions, omissions or negligence, or for force-majeure events such as natural disasters, strikes or political unrest.",
      "These terms are governed by New Delhi jurisdiction. Holiday Circuit may update these terms from time to time.",
    ],
  },
];

const getPackageNightCount = (pkg = {}) => {
  const durationMatch = String(pkg.duration || "").match(/(\d+)\s*nights?/i);
  if (durationMatch) return Math.max(1, Number(durationMatch[1]));

  const totalDays = Number(pkg.days || 0);
  return totalDays > 1 ? totalDays - 1 : 1;
};

const getPreviewHotelNights = (pkg = {}, hotel = {}) => {
  const savedNights = Number(hotel.nights || 0);
  if (savedNights > 0) return savedNights;

  // Older packages were saved before `nights` was persisted. A package with
  // one hotel necessarily uses the complete package stay.
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
        (pkg.destination || "").toLowerCase() === selectedDestination.toLowerCase();

      return textMatches && destinationMatches;
    });
  }, [packages, search, selectedDestination]);

  // Stats calculation
  const totalPackagesCount = packages.length;
  const uniqueDestinationsCount = new Set(
    packages.map((p) => (p.destination || "").toLowerCase()).filter(Boolean)
  ).size;
  const avgPackagePrice =
    totalPackagesCount > 0
      ? Math.round(packages.reduce((sum, p) => sum + Number(p.price || 0), 0) / totalPackagesCount)
      : 0;

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* 1. Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-[#121824] via-[#161f2e] to-[#121824] p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <PackagePlus size={18} />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
              Pre-Defined Packages & Templates
            </h1>
            <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
              OPS Hub
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Create, manage and customize ready-to-sell tour package templates with live DMC contracted rates, multi-service breakdowns, and automatic tax calculations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchPackages}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#161d27] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <PackagePlus size={15} />
            <span>+ Create Package</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Stat Counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-800/80 bg-[#121722] p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400">Total Packages</p>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-100 mt-1">{totalPackagesCount}</p>
          <p className="text-[10px] text-amber-400/90 mt-0.5 font-medium">Ready for quotation</p>
        </div>
        <div className="rounded-lg border border-slate-800/80 bg-[#121722] p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400">Destinations Covered</p>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-100 mt-1">{uniqueDestinationsCount}</p>
          <p className="text-[10px] text-sky-400/90 mt-0.5 font-medium">Domestic & International</p>
        </div>
        <div className="rounded-lg border border-slate-800/80 bg-[#121722] p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400">Average Package Price</p>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1">
            ₹ {avgPackagePrice.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-emerald-500/90 mt-0.5 font-medium">Inclusive of taxes</p>
        </div>
        <div className="rounded-lg border border-slate-800/80 bg-[#121722] p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400">Contracted Rates Link</p>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-300 mt-1">100% Live</p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">DMC Connected Engine</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="rounded-xl border border-slate-800 bg-[#121722] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search packages by title, destination, or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#161d27] pl-9 pr-8 py-2 text-xs font-medium text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Destination Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          <span className="text-[11px] text-slate-400 font-semibold mr-1 shrink-0">Destination:</span>
          {POPULAR_DESTINATIONS.map((dest) => (
            <button
              key={dest}
              type="button"
              onClick={() => setSelectedDestination(dest)}
              className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedDestination.toLowerCase() === dest.toLowerCase()
                  ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                  : "bg-[#18212e] text-slate-300 border border-slate-700/80 hover:bg-[#1f2b3c] hover:text-slate-100"
              }`}
            >
              {dest}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Packages Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <RefreshCw size={28} className="animate-spin text-amber-400" />
          <p className="text-xs font-medium">Loading package templates...</p>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-[#121722]/60 p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <PackagePlus size={26} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-200">No Packages Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {search || selectedDestination !== "All"
                ? "No package templates match your search or destination filter."
                : "No pre-defined packages created yet. Start by creating your first template."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-md cursor-pointer inline-flex items-center gap-2"
          >
            <PackagePlus size={15} />
            <span>Create First Package</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPackages.map((pkg) => {
            const hotelsCount = Array.isArray(pkg.hotels) ? pkg.hotels.length : 0;
            const transfersCount = Array.isArray(pkg.transfers) ? pkg.transfers.length : 0;
            const activitiesCount =
              (Array.isArray(pkg.activities) ? pkg.activities.length : 0) +
              (Array.isArray(pkg.sightseeing) ? pkg.sightseeing.length : 0);
            const itineraryCount = Array.isArray(pkg.dayWiseItinerary)
              ? pkg.dayWiseItinerary.length
              : 0;

            const baseCost = Number(pkg.basePrice || pkg.price || 0);
            const finalSellingPrice = Number(pkg.price || 0);
            const taxObj = pkg.tax || {};
            const totalTaxAmount = Number(taxObj.totalTax || 0);

            return (
              <div
                key={pkg._id}
                className="group relative rounded-xl border border-slate-800/90 bg-[#121722] p-5 space-y-4 hover:border-amber-500/40 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                {/* Top Badge & Duration */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                      <MapPin size={11} /> {pkg.destination || "General"}
                      {pkg.country ? ` • ${pkg.country}` : ""}
                    </span>

                    <span className="flex items-center gap-1 rounded-md bg-slate-800/90 border border-slate-700 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                      <Clock size={11} className="text-amber-400" />
                      {pkg.duration || (pkg.days ? `${pkg.days} Days` : "Custom Duration")}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-2">
                    {pkg.title}
                  </h3>

                  {/* Description preview */}
                  {pkg.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {pkg.description}
                    </p>
                  )}
                </div>

                {/* Services Pills Row */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <div className="rounded bg-[#161d27] border border-slate-800 p-1.5 flex flex-col justify-between">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium leading-tight line-clamp-1" title="Hotel Service">Hotel Service</span>
                      <span className="text-xs font-bold text-amber-300 mt-1">{hotelsCount}</span>
                    </div>
                    <div className="rounded bg-[#161d27] border border-slate-800 p-1.5 flex flex-col justify-between">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium leading-tight line-clamp-1" title="Transport Service">Transport Service</span>
                      <span className="text-xs font-bold text-sky-300 mt-1">{transfersCount}</span>
                    </div>
                    <div className="rounded bg-[#161d27] border border-slate-800 p-1.5 flex flex-col justify-between">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium leading-tight line-clamp-1" title="Activity / Sightseeing">Activity / Sightseeing</span>
                      <span className="text-xs font-bold text-emerald-300 mt-1">{activitiesCount}</span>
                    </div>
                    <div className="rounded bg-[#161d27] border border-slate-800 p-1.5 flex flex-col justify-between">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium leading-tight line-clamp-1" title="Itinerary">Itinerary</span>
                      <span className="text-xs font-bold text-purple-300 mt-1">{itineraryCount}D</span>
                    </div>
                  </div>

                  {/* Price Box */}
                  <div className="rounded-lg border border-slate-800 bg-[#0f141c] p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">
                        Package Selling Price
                      </p>
                      {totalTaxAmount > 0 && (
                        <p className="text-[10px] text-amber-400/90 font-medium">
                          Services: ₹{baseCost.toLocaleString("en-IN")} + Taxes: ₹{totalTaxAmount.toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-extrabold text-amber-400">
                        ₹ {finalSellingPrice.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewPackage(pkg)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-slate-700 bg-[#161d27] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>View Details</span>
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === pkg._id}
                      onClick={() => handleDeletePackage(pkg)}
                      className="flex items-center justify-center rounded-md border border-slate-800 bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition cursor-pointer disabled:opacity-50"
                      title="Delete Package"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Package Details Preview Modal */}
      {previewPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl border border-slate-700 bg-[#121722] text-slate-100 shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-[#161f2e]">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                  Package Details Preview
                </span>
                <h3 className="text-base font-bold text-slate-100 line-clamp-1">{previewPackage.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPackage(null)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
              
              {/* Destination & Price Banner */}
              <div className="rounded-lg border border-slate-800 bg-[#0f141c] p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <MapPin size={13} className="text-amber-400" />
                    {previewPackage.destination} {previewPackage.country ? `(${previewPackage.country})` : ""}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Duration: {previewPackage.duration || `${previewPackage.days || 1} Days`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Selling Price</p>
                  <p className="text-lg font-extrabold text-amber-400">
                    ₹ {Number(previewPackage.price || 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Description */}
              {previewPackage.description && (
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Overview</h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-[#161d27] p-3 rounded-lg border border-slate-800">
                    {previewPackage.description}
                  </p>
                </div>
              )}

              {/* Hotels */}
              {Array.isArray(previewPackage.hotels) && previewPackage.hotels.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <BedDouble size={13} /> Hotel Services ({previewPackage.hotels.length})
                  </h4>
                  <div className="space-y-1.5">
                    {previewPackage.hotels.map((h, i) => {
                      const hotelName = h.hotelName || h.hotel_name || h.name || "Hotel Stay";
                      const serviceName = String(h.serviceName || h.name || "").trim();
                      const hotelNights = getPreviewHotelNights(previewPackage, h);
                      const showServiceName = serviceName && serviceName.toLowerCase() !== String(hotelName).toLowerCase();
                      
                      const roomType = h.roomType || "Standard Room";
                      const roomCategory = h.roomCategory || h.category || "Double";
                      const bedType = h.bedType || "Queen Bed";
                      const mealPlan = h.mealPlan || h.meal_plan || "CP (Breakfast Included)";
                      const rating = h.rating || h.starRating || h.stars;
                      const city = h.city || previewPackage.destination;

                      return (
                        <div key={i} className="rounded-md border border-slate-800 bg-[#161d27] p-2.5 text-xs flex justify-between items-center gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-200 block">{hotelName}</span>
                              {rating && (
                                <span className="rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-bold text-amber-300">
                                  {rating}★
                                </span>
                              )}
                              {city && (
                                <span className="text-[10px] text-slate-400">
                                  ({city})
                                </span>
                              )}
                            </div>

                            {showServiceName && (
                              <span className="mt-0.5 text-[10px] font-medium text-amber-300 block truncate">
                                Service: {serviceName}
                              </span>
                            )}

                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                              <span className="text-amber-300 font-medium">{roomType}</span>
                              <span className="text-slate-600">•</span>
                              <span>{roomCategory}</span>
                              <span className="text-slate-600">•</span>
                              <span>{bedType}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-300 font-medium">{hotelNights} Night{hotelNights === 1 ? "" : "s"}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-emerald-400">{mealPlan}</span>
                            </div>
                          </div>
                          {Number(h.price) > 0 && (
                            <span className="font-bold text-amber-300 whitespace-nowrap">₹ {Number(h.price).toLocaleString("en-IN")}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Transports */}
              {Array.isArray(previewPackage.transfers) && previewPackage.transfers.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Car size={13} /> Transport Services ({previewPackage.transfers.length})
                  </h4>
                  <div className="space-y-1.5">
                    {previewPackage.transfers.map((t, i) => {
                      const transferName = t.name || t.serviceName || "Transfer Service";
                      const vehicleType = t.vehicleType || t.carType || "Sedan";
                      
                      // Format transfer type
                      const rawType = t.usageType || t.transferType || t.tripType || t.serviceType || "one-way";
                      let transferTypeLabel = "One-Way Transfer";
                      if (/round[-_]?trip/i.test(rawType)) transferTypeLabel = "Round-Trip Transfer";
                      else if (/point[-_]?to[-_]?point/i.test(rawType)) transferTypeLabel = "Point to Point Transfer";
                      else if (/full[-_]?day/i.test(rawType)) transferTypeLabel = "Full Day Transfer";
                      else if (/half[-_]?day/i.test(rawType)) transferTypeLabel = "Half Day Transfer";
                      else if (/airport/i.test(rawType)) transferTypeLabel = "Airport Transfer";
                      else if (/intercity/i.test(rawType)) transferTypeLabel = "Intercity Transfer";
                      else if (rawType && rawType !== "one-way") {
                        transferTypeLabel = String(rawType).replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                      }

                      // Capacity
                      const paxCapacity = Number(t.passengerCapacity || t.passenger_capacity || t.pax || (/suv|innova/i.test(vehicleType) ? 6 : (/tempo|traveller|minibus/i.test(vehicleType) ? 12 : 4)));
                      const luggageCapacity = Number(t.luggageCapacity || t.luggage_capacity || t.luggage || (/suv|innova/i.test(vehicleType) ? 4 : (/tempo|traveller/i.test(vehicleType) ? 8 : 2)));
                      const transferMode = t.mode ? (t.mode.toLowerCase().includes("shared") ? "Shared" : "Private") : "Private";

                      return (
                        <div key={i} className="rounded-md border border-slate-800 bg-[#161d27] p-2.5 text-xs flex justify-between items-center gap-3">
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-200 block">{transferName}</span>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                              <span className="text-sky-300 font-medium">{vehicleType}</span>
                              <span className="text-slate-600">•</span>
                              <span>{transferTypeLabel}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-300 font-medium">{paxCapacity} Pax Capacity</span>
                              <span className="text-slate-600">•</span>
                              <span>{luggageCapacity} Bags Luggage</span>
                              {transferMode && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-amber-300/90">{transferMode}</span>
                                </>
                              )}
                            </div>
                            {t.description && (
                              <p className="mt-1 text-[10px] text-slate-400 line-clamp-1">{t.description}</p>
                            )}
                          </div>
                          {Number(t.price) > 0 && (
                            <span className="font-bold text-sky-300 whitespace-nowrap">₹ {Number(t.price).toLocaleString("en-IN")}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Activities & Sightseeing */}
              {((Array.isArray(previewPackage.activities) && previewPackage.activities.length > 0) || (Array.isArray(previewPackage.sightseeing) && previewPackage.sightseeing.length > 0)) && (
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Compass size={13} /> Activities & Sightseeing ({((previewPackage.activities?.length || 0) + (previewPackage.sightseeing?.length || 0))})
                  </h4>
                  <div className="space-y-1.5">
                    {(previewPackage.activities || []).map((a, i) => {
                      const actName = a.serviceName || a.activityName || a.name || a.title || "Activity Service";
                      const tourType = a.tourType || "Group Tour";
                      const pricingBasis = a.pricingBasis || "Per Pax";
                      const paxNum = Number(a.pax || 1);
                      const maxPax = a.maxPax || (tourType.toLowerCase().includes("group") && !tourType.toLowerCase().includes("per group") ? "Shared Group" : tourType.toLowerCase().includes("vip") ? "Up to 6 Pax" : "Up to 4 Pax");
                      const basePrice = Number(a.basePrice || 0);
                      const supplierName = a.supplierName || a.dmcName || "";
                      const isPerGroup = String(pricingBasis).toLowerCase().includes("group") && !String(pricingBasis).toLowerCase().includes("pax");
                      const desc = a.description || "";

                      return (
                        <div key={`act-${i}`} className="rounded-md border border-slate-800 bg-[#161d27] p-2.5 text-xs flex justify-between items-center gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-200 block">{actName}</span>
                              {supplierName && (
                                <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 text-[10px] text-emerald-400 font-medium">
                                  DMC: {supplierName}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                              {a.day && (
                                <>
                                  <span className="text-amber-400 font-semibold">Day {a.day}</span>
                                  <span className="text-slate-600">•</span>
                                </>
                              )}
                              <span className="text-emerald-400 font-medium">{tourType}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-300 font-medium">{pricingBasis}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-amber-300 font-medium">{paxNum} Pax</span>
                              {maxPax && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-purple-300">{maxPax.includes("Max") || maxPax.includes("N/A") || maxPax.includes("Shared") ? maxPax : `Max: ${maxPax}`}</span>
                                </>
                              )}
                              {basePrice > 0 && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span>Base: ₹{basePrice.toLocaleString("en-IN")}</span>
                                </>
                              )}
                            </div>
                            {desc && (
                              <p className="mt-1 text-[10px] text-slate-400 line-clamp-1">{desc}</p>
                            )}
                          </div>
                          {Number(a.price) > 0 && (
                            <div className="text-right shrink-0">
                              <span className="font-bold text-emerald-300 whitespace-nowrap">₹ {Number(a.price).toLocaleString("en-IN")}</span>
                              {basePrice > 0 && !isPerGroup && paxNum > 1 && (
                                <p className="text-[9px] text-slate-400">(₹{basePrice.toLocaleString("en-IN")} × {paxNum} Pax)</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {(previewPackage.sightseeing || []).map((s, i) => {
                      const sightName = s.serviceName || s.sightseeingName || s.name || s.title || "Sightseeing Tour";
                      const tourType = s.tourType || "Group Tour";
                      const pricingBasis = s.pricingBasis || "Per Pax";
                      const paxNum = Number(s.pax || 1);
                      const maxPax = s.maxPax || (tourType.toLowerCase().includes("group") && !tourType.toLowerCase().includes("per group") ? "Shared Group" : tourType.toLowerCase().includes("vip") ? "Up to 6 Pax" : "Up to 4 Pax");
                      const basePrice = Number(s.basePrice || 0);
                      const supplierName = s.supplierName || s.dmcName || "";
                      const isPerGroup = String(pricingBasis).toLowerCase().includes("group") && !String(pricingBasis).toLowerCase().includes("pax");
                      const desc = s.description || "";

                      return (
                        <div key={`sight-${i}`} className="rounded-md border border-slate-800 bg-[#161d27] p-2.5 text-xs flex justify-between items-center gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-200 block">{sightName}</span>
                              {supplierName && (
                                <span className="rounded bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.2 text-[10px] text-purple-400 font-medium">
                                  DMC: {supplierName}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                              {s.day && (
                                <>
                                  <span className="text-amber-400 font-semibold">Day {s.day}</span>
                                  <span className="text-slate-600">•</span>
                                </>
                              )}
                              <span className="text-purple-400 font-medium">{tourType}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-300 font-medium">{pricingBasis}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-amber-300 font-medium">{paxNum} Pax</span>
                              {maxPax && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-purple-300">{maxPax.includes("Max") || maxPax.includes("N/A") || maxPax.includes("Shared") ? maxPax : `Max: ${maxPax}`}</span>
                                </>
                              )}
                              {basePrice > 0 && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span>Base: ₹{basePrice.toLocaleString("en-IN")}</span>
                                </>
                              )}
                            </div>
                            {desc && (
                              <p className="mt-1 text-[10px] text-slate-400 line-clamp-1">{desc}</p>
                            )}
                          </div>
                          {Number(s.price) > 0 && (
                            <div className="text-right shrink-0">
                              <span className="font-bold text-purple-300 whitespace-nowrap">₹ {Number(s.price).toLocaleString("en-IN")}</span>
                              {basePrice > 0 && !isPerGroup && paxNum > 1 && (
                                <p className="text-[9px] text-slate-400">(₹{basePrice.toLocaleString("en-IN")} × {paxNum} Pax)</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Day-wise Itinerary */}
              {Array.isArray(previewPackage.dayWiseItinerary) && previewPackage.dayWiseItinerary.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <CalendarDays size={13} /> Day-wise Itinerary ({previewPackage.dayWiseItinerary.length} Days)
                  </h4>
                  <div className="space-y-2">
                    {previewPackage.dayWiseItinerary.map((d, i) => (
                      <div key={i} className="rounded-md border border-slate-800 bg-[#161d27] p-3 text-xs space-y-1">
                        <span className="font-bold text-amber-300">Day {d.day || i + 1}: {d.title}</span>
                        {d.description && <p className="text-[11px] text-slate-400">{d.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inclusions & Exclusions */}
              {(previewPackage.inclusions || previewPackage.exclusions) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {previewPackage.inclusions && (
                    <div className="rounded-md border border-slate-800 bg-[#161d27] p-3">
                      <span className="text-[11px] font-bold text-emerald-400 block mb-1">Inclusions</span>
                      <p className="text-xs text-slate-300 whitespace-pre-line">{previewPackage.inclusions}</p>
                    </div>
                  )}
                  {previewPackage.exclusions && (
                    <div className="rounded-md border border-slate-800 bg-[#161d27] p-3">
                      <span className="text-[11px] font-bold text-rose-400 block mb-1">Exclusions</span>
                      <p className="text-xs text-slate-300 whitespace-pre-line">{previewPackage.exclusions}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Bank Details (Matching Dark UI) */}
              <div className="rounded-lg border border-slate-800 bg-[#161d27] overflow-hidden">
                <div className="bg-[#101722] border-b border-slate-800 px-4 py-2.5 flex items-center gap-2">
                  <Landmark size={15} className="text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Bank Details
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <tbody className="divide-y divide-slate-800">
                      {(previewPackage.sellerBankDetails?.length > 0
                        ? previewPackage.sellerBankDetails
                        : DEFAULT_SELLER_BANK_DETAILS
                      ).map((b, idx) => (
                        <tr key={idx} className={idx % 2 === 1 ? "bg-[#0f141c]/50" : "bg-[#161d27]"}>
                          <td className="py-2.5 px-4 font-bold text-slate-400 w-1/3 border-r border-slate-800">
                            {b.label || b.name || "Detail"}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-100">
                            {b.value || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Terms and Conditions (Styled seamlessly matching Dark Modal UI) */}
              <div className="rounded-lg border border-slate-800 bg-[#161d27] overflow-hidden">
                <div className="bg-[#101722] border-b border-slate-800 px-4 py-2.5 flex items-center gap-2">
                  <FileText size={15} className="text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Terms & Conditions
                  </h4>
                </div>
                
                <div className="p-4 sm:p-5 text-xs sm:text-[13px] text-slate-300 leading-relaxed space-y-4">
                  <p className="text-slate-300">
                    Welcome to <strong className="text-amber-300 font-semibold">Holiday Circuit</strong>. These Terms and Conditions govern your use of the <strong className="text-amber-300 font-semibold">Holiday Circuit</strong> services. When You Make a booking or reservation, you agree to be bound by these Terms.
                  </p>

                  <div className="space-y-2">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1 mb-2">
                      Bookings and Reservations
                    </h5>
                    <ul className="list-disc pl-5 space-y-2 text-slate-300">
                      <li>
                        <strong className="text-slate-100">Booking Process:</strong> When you make a booking or reservation through <strong className="text-amber-300 font-semibold">Holiday Circuit</strong>, you agree to provide accurate and complete information. Any discrepancies or errors in the information you provide may result in the cancellation of your booking.
                      </li>
                    </ul>

                    <div className="mt-3 space-y-2 text-slate-300">
                      <p>
                        <strong className="text-slate-100">Payment:</strong> Payments for bookings are due as specified during the booking process. Failure to make payments on time may result in the cancellation of your booking.
                      </p>
                      <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                        <li><strong className="text-emerald-400 font-bold">Minimum 50%</strong> of the booking amount is required at the time of booking confirmation.</li>
                        <li>Remaining 50% in 2 parts i.e. 25% of total booking amount within 30 Days prior to departure and 25% within 20 days prior to departure.</li>
                        <li>In Case of Airline booking/Train Tickets, <strong className="text-rose-400 font-bold">100% ticket cost</strong> to be paid at the time of confirmation.</li>
                        <li>In Case a booking is under 100% cancellation period, then <strong className="text-rose-400 font-bold">100% booking amount</strong> is required at the time of booking confirmation.</li>
                      </ol>

                      <p className="pt-1">
                        <strong className="text-slate-100">Confirmation:</strong> Your booking is considered confirmed only upon receipt of payment and confirmation from <strong className="text-amber-300 font-semibold">Holiday Circuit</strong>. Please review all booking details carefully to ensure accuracy.
                      </p>

                      <div className="inline-block rounded border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-400 my-1">
                        ⚠️ Booking will be auto cancelled in case of non-payment within stipulated time
                      </div>

                      <p>
                        <strong className="text-slate-100">Credit Card:</strong> We accept payments through Credit Cards which may attract an additional charge from <strong className="text-amber-300 font-semibold">3% to 5%</strong> depends upon the card type. Card charges shall be over and above the actual service/package cost.
                      </p>

                      <p>
                        <strong className="text-slate-100">Confirmation Vouchers:</strong> The service will be confirmed once the advance payment is made. However, the confirmation vouchers will only be provided <strong className="text-sky-300 font-semibold">7 days before the arrival date</strong>.
                      </p>

                      <p>
                        <strong className="text-slate-100">Airport Transfers & Tour Pick Ups:</strong> The service includes <strong className="text-sky-300 font-semibold">60 minutes of waiting time</strong> for Airport pick-ups. If you are delayed at immigration or luggage claim, please call the emergency number to extend the waiting time. Additional parking and waiting time charges may apply. For all other pick-ups, the driver will wait for <strong className="text-sky-300 font-semibold">10 mins at the meeting point</strong> i.e. Hotel Lobby or Reception or any other fixed meeting point.
                      </p>

                      <p>
                        <strong className="text-slate-100">Taxes:</strong> In case of any changes in taxes (such as GST/Government Tax/TCS) at the time of confirmation, the price will be adjusted accordingly and shall be charged as per the prevailing law. This means that if there is an increase or decrease in applicable taxes between the time of booking confirmation and the actual provision of services, the final price will be adjusted to reflect these changes in accordance with the relevant tax regulations.
                      </p>

                      <p>
                        <strong className="text-slate-100">Changes and Cancellations:</strong> Changes to bookings or cancellations may be subject to fees or penalties, as determined by the service providers (e.g., airlines, hotels, tour operators) and <strong className="text-amber-300 font-semibold">Holiday Circuit</strong>. These fees and penalties may vary depending on the service and the timing of the change or cancellation.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1 mb-2">
                      Travel Documents and Requirements
                    </h5>
                    <ul className="list-disc pl-5 space-y-2 text-slate-300">
                      <li>
                        <strong className="text-slate-100">Valid Id Proof:</strong> It is your responsibility to ensure that you have a valid ID as per destination entry requirements and any required visas or travel documents for your trip. <strong className="text-amber-300 font-semibold">Holiday Circuit</strong> is not responsible for any issues arising from the lack of proper travel documents.
                        <div className="mt-1.5">
                          <span className="inline-block rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300">
                            (To Enter Nepal by Air- Valid Passport or Election Card is Mandatory. Aadhar Card is not valid for Travel)
                          </span>
                        </div>
                      </li>
                      <li>
                        <strong className="text-slate-100">Health and Vaccinations:</strong> You are responsible for ensuring that you meet all health and vaccination requirements for your travel destinations.
                      </li>
                      <li>
                        <strong className="text-slate-100">Travel Insurance:</strong> We strongly recommend that you purchase travel insurance to protect against unexpected events such as trip cancellations, delays, or emergencies during your travel. <strong className="text-amber-300 font-semibold">Holiday Circuit</strong> can assist you in obtaining travel insurance, but the decision to purchase it is ultimately yours.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1 mb-2">
                      Changes to Itineraries
                    </h5>
                    <ul className="list-disc pl-5 space-y-2 text-slate-300">
                      <li>
                        <strong className="text-slate-100">By Holiday Circuit:</strong> We reserve the right to make changes to your itinerary or accommodations due to unforeseen circumstances. We will make every effort to inform you of such changes as soon as possible.
                      </li>
                      <li>
                        <strong className="text-slate-100">By You:</strong> Any changes requested by you to your itinerary may be subject to fees or penalties, as determined by the service providers and <strong className="text-amber-300 font-semibold">Holiday Circuit</strong>.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1 mb-2">
                      Liability
                    </h5>
                    <ul className="list-disc pl-5 space-y-2 text-slate-300">
                      <li>
                        <strong className="text-slate-100">Service Providers:</strong> <strong className="text-amber-300 font-semibold">Holiday Circuit</strong> acts as an intermediary between you and service providers such as airlines, hotels, and tour operators. We are not liable for any actions, omissions, or negligence on the part of these service providers.
                      </li>
                      <li>
                        <strong className="text-slate-100">Force Majeure:</strong> <strong className="text-amber-300 font-semibold">Holiday Circuit</strong> is not liable for any disruptions, cancellations, or delays caused by circumstances beyond our control, including natural disasters, strikes, political unrest, or other force majeure events.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2 pt-1 text-slate-300">
                    <p>
                      <strong className="text-slate-100">Governing Law and Jurisdiction:</strong> These Terms and your use of <strong className="text-amber-300 font-semibold">Holiday Circuit</strong> services are governed by the laws of New Delhi Jurisdiction, and any disputes shall be resolved in the courts of New Delhi Jurisdiction.
                    </p>
                    <p>
                      <strong className="text-slate-100">Changes to Terms and Conditions:</strong> We reserve the right to update and modify these Terms and Conditions at any time. Please review them periodically for changes. Your continued use of our services after any modifications indicates your acceptance of the updated Terms.
                    </p>
                    <div className="rounded-md border border-slate-800 bg-[#0f141c] p-3 text-xs text-slate-400">
                      <strong className="text-slate-200">Contact Information:</strong> For any inquiries, please contact us at: <strong className="text-amber-300 font-semibold">Holiday Circuit</strong> KG 3/101, Ground Floor, Vikas Puri, New Delhi -110018, Email id - <span className="font-semibold text-sky-400">ops@holidaycircuit.com</span> <span className="font-semibold text-amber-300">+91 8851346665, +91 9971706003</span>
                    </div>
                  </div>

                  <p className="border-t border-slate-800 pt-3 text-center text-xs font-semibold italic text-amber-400/90">
                    By booking with Holiday Circuit, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-800 p-4 bg-[#161f2e] flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewPackage(null)}
                className="rounded-md bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. Embedded Create Package Modal */}
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

      {/* 7. Simple & Elegant Delete Confirmation Modal */}
      {deleteModalPackage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-[#121722] text-slate-100 shadow-2xl overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400">
                  <Trash2 size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-100">
                    Delete Package Template?
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Are you sure you want to delete <span className="font-semibold text-slate-200">"{deleteModalPackage.title}"</span>? This will permanently remove the package template.
                  </p>
                </div>
              </div>

              {deleteModalPackage.destination && (
                <div className="rounded-lg border border-slate-800 bg-[#161d27] p-2.5 text-[11px] text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <MapPin size={13} className="text-amber-400" />
                    {deleteModalPackage.destination}
                  </span>
                  {Number(deleteModalPackage.price) > 0 && (
                    <span className="font-bold text-emerald-400">
                      ₹ {Number(deleteModalPackage.price).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-800/80 bg-[#161f2e]/60 px-5 py-3.5">
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => setDeleteModalPackage(null)}
                className="rounded-md border border-slate-700 bg-[#1a2230] px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={confirmDeletePackage}
                className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-rose-950/40 transition cursor-pointer disabled:opacity-50"
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
          </div>
        </div>
      )}

    </div>
  );
}
