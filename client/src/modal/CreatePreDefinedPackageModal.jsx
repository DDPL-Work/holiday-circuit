import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  BedDouble,
  Car,
  Landmark,
  Sparkles,
  Package,
  CalendarDays,
  Building2,
  Star,
  Check,
  Search,
  ChevronDown,
  IndianRupee,
  Coins,
} from "lucide-react";
import API from "../utils/Api.js";
import toast from "react-hot-toast";

const POPULAR_DESTINATIONS = [
  "Goa",
  "Dubai",
  "Kashmir",
  "Kerala",
  "Mussoorie",
  "Himachal",
  "Thailand",
  "Bali",
  "Andaman",
  "Rajasthan",
  "Singapore",
];

const initialHotel = () => ({
  serviceName: "",
  hotelName: "",
  name: "",
  roomType: "Standard Room",
  roomCategory: "Double",
  rooms: 1,
  nights: 1,
  day: "1",
  bedType: "Queen Bed",
  extraBedType: "None",
  maxAdults: 2,
  maxChildren: 1,
  mealPlan: "EP",
  basePrice: 0,
  price: 0,
  unit: "night",
  quantity: 1,
  supplier: "",
  supplierName: "",
  starCategory: "5 Star",
  description: "",
  extraAdult: false,
  childWithBed: false,
  childWithoutBed: false,
  awebRate: 0,
  cwebRate: 0,
  cwoebRate: 0,
  hotelsList: [],
  selectedHotelIdx: 0,
});

const initialTransfer = () => ({
  serviceName: "",
  name: "",
  title: "",
  vehicleType: "Sedan / Dzire (4 Pax)",
  passengerCapacity: 4,
  luggageCapacity: 2,
  day: "1",
  days: 1,
  usage: "one-way-airport-transfer",
  usagePrices: {
    "one-way-airport-transfer": 0,
    "inter-hotel-transfer": 0,
    "full-day": 0,
    "half-day": 0,
  },
  basePrice: 0,
  price: "",
  unit: "trip",
  quantity: 1,
  supplier: "",
  supplierName: "",
  vehiclesList: [],
  selectedVehicleIdx: 0,
  description: "",
  fullDayNote: "",
  halfDayNote: "",
  fullDayExtraPerKmRate: 0,
  halfDayExtraPerKmRate: 0,
});

const initialActivity = () => ({
  serviceName: "",
  name: "",
  day: 1,
  tourTypesList: [],
  selectedTourIdx: 0,
  tourType: "Group Tour",
  pricingBasis: "Per Pax",
  maxPax: "N/A (Shared Group)",
  basePrice: 0,
  pax: 1,
  price: 0,
  unit: "person",
  quantity: 1,
  supplier: "",
  supplierName: "",
  description: "",
});

const initialSightseeing = () => ({
  serviceName: "",
  name: "",
  day: 1,
  tourTypesList: [],
  selectedTourIdx: 0,
  tourType: "Group Tour",
  pricingBasis: "Per Pax",
  maxPax: "N/A (Shared Group)",
  basePrice: 0,
  pax: 1,
  price: 0,
  unit: "person",
  quantity: 1,
  supplier: "",
  supplierName: "",
  description: "",
});

const initialItineraryDay = (dayNum = 1) => ({
  day: dayNum,
  title: `Day ${dayNum}: Sightseeing & Tour`,
  description: "",
});

export default function CreatePreDefinedPackageModal({ isOpen, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("Mussoorie");
  const [country, setCountry] = useState("India");
  const [duration, setDuration] = useState("5 Nights / 6 Days");
  const [days, setDays] = useState("6");
  const [price, setPrice] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [gstChecked, setGstChecked] = useState(true);
  const [gstPercent, setGstPercent] = useState(5);
  const [tcsChecked, setTcsChecked] = useState(false);
  const [tcsPercent, setTcsPercent] = useState(5);
  const [tourismChecked, setTourismChecked] = useState(false);
  const [tourismAmount, setTourismAmount] = useState("");
  const [description, setDescription] = useState("");
  const [inclusions, setInclusions] = useState("Daily breakfast, Airport pickup & drop, Sightseeing transfers as per itinerary");
  const [exclusions, setExclusions] = useState("Airfare/Train fare, Personal expenses, Entry tickets not mentioned");

  // Services Lists
  const [hotels, setHotels] = useState([initialHotel()]);
  const [transfers, setTransfers] = useState([initialTransfer()]);
  const [activities, setActivities] = useState([]);
  const [sightseeing, setSightseeing] = useState([]);

  // Day-wise Itinerary (Default 2 Days)
  const [itinerary, setItinerary] = useState([
    { day: 1, title: "Day 1: Arrival & Leisure", description: "Pickup from airport/station, transfer to hotel. Check-in and relax for the evening." },
    { day: 2, title: "Day 2: Sightseeing Tour & Departure", description: "Explore major landmarks, scenic spots, and transfer with wonderful memories." },
  ]);

  // Live DMC-uploaded Services (Complete Catalogue + Destination Filtered)
  const [allDmcServices, setAllDmcServices] = useState({
    hotels: [],
    transfers: [],
    activities: [],
    sightseeing: [],
  });
  const [servicesLoading, setServicesLoading] = useState(false);

  // Active Dropdown States for autocomplete
  const [activeHotelDropdownIdx, setActiveHotelDropdownIdx] = useState(null);
  const [activeTransferDropdownIdx, setActiveTransferDropdownIdx] = useState(null);
  const [activeActivityDropdownIdx, setActiveActivityDropdownIdx] = useState(null);
  const [activeSightseeingDropdownIdx, setActiveSightseeingDropdownIdx] = useState(null);

  // Fetch complete DMC uploaded inventory library & destination-specific services
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        // Fetch all DMC services in database
        const res = await API.get("/ops/dmcAllGetServices", {
          params: { destination: "" },
          skipGlobalLoader: true,
        });

        if (isMounted && res.data) {
          const rawList = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data?.data?.hotels)
            ? [
                ...(res.data.data.hotels || []),
                ...(res.data.data.transfers || []),
                ...(res.data.data.activities || []),
                ...(res.data.data.sightseeing || []),
              ]
            : Array.isArray(res.data?.services)
            ? res.data.services
            : [];

          const hotelList = rawList.filter((s) => s.type === "hotel" || s.serviceCategory === "hotel" || s.hotelName || s.roomType);
          const transferList = rawList.filter((s) => s.type === "transfer" || s.vehicleType || s.serviceCategory === "transfer");
          const activityList = rawList.filter((s) => s.type === "activity" || s.serviceCategory === "activity");
          const sightList = rawList.filter((s) => s.type === "sightseeing" || s.serviceCategory === "sightseeing");

          setAllDmcServices({
            hotels: hotelList,
            transfers: transferList,
            activities: activityList,
            sightseeing: sightList,
          });
        }
      } catch (err) {
        console.error("Failed to load DMC services:", err);
      } finally {
        if (isMounted) setServicesLoading(false);
      }
    };

    fetchServices();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Close dropdowns on global click
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest(".dmc-autocomplete-container")) {
        setActiveHotelDropdownIdx(null);
        setActiveTransferDropdownIdx(null);
        setActiveActivityDropdownIdx(null);
        setActiveSightseeingDropdownIdx(null);
      }
    };
    document.addEventListener("mousedown", handleGlobalClick);
    return () => document.removeEventListener("mousedown", handleGlobalClick);
  }, []);

  if (!isOpen) return null;

  // Helpers to get sorted & filtered list for destination and search terms
  const normalizeComparisonText = (val = "") => String(val || "").trim().toLowerCase();

  const isMatchingPackageDestination = (item = {}, dest = "") => {
    const destClean = normalizeComparisonText(dest);
    if (!destClean) return true;

    const city = normalizeComparisonText(item.city);
    const itemDest = normalizeComparisonText(item.destination);
    const title = normalizeComparisonText(item.title || item.hotelName || item.serviceName || item.name);

    if (city && (city.includes(destClean) || destClean.includes(city))) return true;
    if (itemDest && (itemDest.includes(destClean) || destClean.includes(itemDest))) return true;
    if (title && title.includes(destClean)) return true;

    return false;
  };

  const getFilteredHotels = (searchQuery = "", currentHotelObj = null) => {
    const term = normalizeComparisonText(searchQuery);
    const destTerm = normalizeComparisonText(destination);

    // Strictly filter by package destination first
    let list = destTerm
      ? allDmcServices.hotels.filter((h) => isMatchingPackageDestination(h, destTerm))
      : allDmcServices.hotels;

    const currentTitle = normalizeComparisonText(
      currentHotelObj?.serviceName || currentHotelObj?.name || currentHotelObj?.hotelName
    );
    const isExactCurrentSelection = Boolean(currentTitle && currentTitle === term);

    if (!term || isExactCurrentSelection) {
      return list;
    }

    return list.filter((h) => {
      const serviceStr = normalizeComparisonText(h.serviceName || h.title || h.name || h.hotelName);
      const hotelStr = normalizeComparisonText(h.hotelName);
      const cityStr = normalizeComparisonText(h.city || h.destination);
      const supplierStr = normalizeComparisonText(h.supplierName || h.dmcName);
      const roomStr = normalizeComparisonText(h.roomType || h.roomCategory);
      return (
        serviceStr.includes(term) ||
        hotelStr.includes(term) ||
        cityStr.includes(term) ||
        supplierStr.includes(term) ||
        roomStr.includes(term)
      );
    });
  };

  const getFilteredTransfers = (searchQuery = "", currentTransferObj = null) => {
    const destTerm = normalizeComparisonText(destination);
    const term = normalizeComparisonText(searchQuery);

    let list = destTerm
      ? allDmcServices.transfers.filter((t) => isMatchingPackageDestination(t, destTerm))
      : allDmcServices.transfers;

    const currentName = normalizeComparisonText(currentTransferObj?.name);
    const isExactCurrentSelection = Boolean(currentName && currentName === term);

    if (!term || isExactCurrentSelection) {
      return list;
    }

    return list.filter((t) => {
      const nameStr = normalizeComparisonText(t.serviceName || t.name || t.title);
      const vehicleStr = normalizeComparisonText(t.vehicleType);
      const cityStr = normalizeComparisonText(t.city || t.destination);
      const supplierStr = normalizeComparisonText(t.supplierName || t.dmcName);
      return nameStr.includes(term) || vehicleStr.includes(term) || cityStr.includes(term) || supplierStr.includes(term);
    });
  };

  const getFilteredActivities = (searchQuery = "", currentActObj = null) => {
    const destTerm = normalizeComparisonText(destination);
    const term = normalizeComparisonText(searchQuery);

    let list = destTerm
      ? allDmcServices.activities.filter((a) => isMatchingPackageDestination(a, destTerm))
      : allDmcServices.activities;

    const currentName = normalizeComparisonText(currentActObj?.name);
    const isExactCurrentSelection = Boolean(currentName && currentName === term);

    if (!term || isExactCurrentSelection) {
      return list;
    }

    return list.filter((a) => {
      const nameStr = normalizeComparisonText(a.name || a.title);
      const cityStr = normalizeComparisonText(a.city || a.destination);
      const supplierStr = normalizeComparisonText(a.supplierName || a.dmcName);
      return nameStr.includes(term) || cityStr.includes(term) || supplierStr.includes(term);
    });
  };

  const getFilteredSightseeing = (searchQuery = "", currentSightObj = null) => {
    const destTerm = normalizeComparisonText(destination);
    const term = normalizeComparisonText(searchQuery);

    let list = destTerm
      ? allDmcServices.sightseeing.filter((s) => isMatchingPackageDestination(s, destTerm))
      : allDmcServices.sightseeing;

    const currentName = normalizeComparisonText(currentSightObj?.name);
    const isExactCurrentSelection = Boolean(currentName && currentName === term);

    if (!term || isExactCurrentSelection) {
      return list;
    }

    return list.filter((s) => {
      const nameStr = normalizeComparisonText(s.name || s.title);
      const cityStr = normalizeComparisonText(s.city || s.destination);
      const supplierStr = normalizeComparisonText(s.supplierName || s.dmcName);
      return nameStr.includes(term) || cityStr.includes(term) || supplierStr.includes(term);
    });
  };

  // Helper to recalculate hotel total price based on basePrice, nights, rooms, and add-ons
  const recalculateHotelPrice = (hotel) => {
    const base = Number(hotel.basePrice || 0);
    const aweb = hotel.extraAdult ? Number(hotel.awebRate || 0) : 0;
    const cweb = hotel.childWithBed ? Number(hotel.cwebRate || 0) : 0;
    const cwoeb = hotel.childWithoutBed ? Number(hotel.cwoebRate || 0) : 0;
    const perNightPerRoom = base + aweb + cweb + cwoeb;
    const n = Math.max(1, Number(hotel.nights || 1));
    const r = Math.max(1, Number(hotel.rooms || 1));
    return perNightPerRoom * n * r;
  };

  const normalizeBedType = (bed = "") => {
    const norm = String(bed || "").toLowerCase().trim();
    if (norm.includes("king")) return "King Bed";
    if (norm.includes("queen")) return "Queen Bed";
    if (norm.includes("twin")) return "Twin Bed";
    if (norm.includes("double")) return "Double Bed";
    if (norm.includes("single")) return "Single Bed";
    return "Queen Bed";
  };

  const normalizeExtraBedType = (extra = "") => {
    const norm = String(extra || "").toLowerCase().trim();
    if (norm === "" || norm === "none" || norm === "no") return "None";
    if (norm.includes("single")) return "Single Bed";
    if (norm.includes("rollaway")) return "Rollaway Bed";
    if (norm.includes("sofa")) return "Sofa Bed";
    if (norm.includes("mattress")) return "Mattress";
    return "None";
  };

  // Helper to map room occupancy category to bedType, extraBedType, maxAdults and maxChildren
  const getOccupancyDefaultsForRoomCategory = (category = "", currentBedType = "") => {
    const norm = String(category || "").toLowerCase().trim();
    if (norm.includes("single")) {
      return {
        maxAdults: 1,
        maxChildren: 1,
        bedType: "Single Bed",
        extraBedType: "None",
      };
    }
    if (norm.includes("triple")) {
      const isKing = String(currentBedType || "").toLowerCase().includes("king");
      return {
        maxAdults: 3,
        maxChildren: 1,
        bedType: isKing ? "King Bed" : "Twin Bed",
        extraBedType: "Single Bed",
      };
    }
    if (norm.includes("quad")) {
      return {
        maxAdults: 4,
        maxChildren: 2,
        bedType: "King Bed",
        extraBedType: "Single Bed",
      };
    }
    if (norm.includes("family")) {
      return {
        maxAdults: 4,
        maxChildren: 2,
        bedType: "King Bed",
        extraBedType: "Single Bed",
      };
    }
    if (norm.includes("twin")) {
      return {
        maxAdults: 2,
        maxChildren: 1,
        bedType: "Twin Bed",
        extraBedType: "None",
      };
    }
    // Double (default)
    const isKing = String(currentBedType || "").toLowerCase().includes("king");
    return {
      maxAdults: 2,
      maxChildren: 1,
      bedType: isKing ? "King Bed" : "Queen Bed",
      extraBedType: "None",
    };
  };

  // Add Row Helpers
  const addHotel = () => setHotels([...hotels, initialHotel()]);
  const removeHotel = (index) => setHotels(hotels.filter((_, i) => i !== index));
  const updateHotel = (index, field, value) => {
    const updated = [...hotels];
    updated[index][field] = value;

    if (field === "hotelName" || field === "serviceName") {
      updated[index].name = value;
    }

    if (field === "roomCategory") {
      const defaults = getOccupancyDefaultsForRoomCategory(value, updated[index].bedType);
      updated[index].maxAdults = defaults.maxAdults;
      updated[index].maxChildren = defaults.maxChildren;
      updated[index].bedType = defaults.bedType;
      updated[index].extraBedType = defaults.extraBedType;
    }

    if (
      field === "basePrice" ||
      field === "nights" ||
      field === "rooms" ||
      field === "extraAdult" ||
      field === "childWithBed" ||
      field === "childWithoutBed"
    ) {
      updated[index].price = recalculateHotelPrice(updated[index]);
    }

    if (field === "price") {
      const n = Math.max(1, Number(updated[index].nights || 1));
      const r = Math.max(1, Number(updated[index].rooms || 1));
      updated[index].basePrice = Math.round(Number(value || 0) / (n * r));
    }

    setHotels(updated);
  };

  // Switch between hotel properties if DMC service has multiple hotels
  const handleHotelPropertyChange = (hotelIdx, propertyIdx) => {
    const updated = [...hotels];
    const hotelItem = updated[hotelIdx];
    const hotelsList = hotelItem.hotelsList || [];
    const selectedHotel = hotelsList[propertyIdx];
    if (!selectedHotel) return;

    const roomsList = Array.isArray(selectedHotel.rooms) && selectedHotel.rooms.length > 0 ? selectedHotel.rooms : [];
    const primaryRoom = roomsList[0] || {};
    const baseRate = Number(primaryRoom.price || 0);

    hotelItem.selectedHotelIdx = propertyIdx;
    hotelItem.hotelName = selectedHotel.hotelName || hotelItem.hotelName;
    hotelItem.starCategory = selectedHotel.hotelCategory || hotelItem.starCategory;
    hotelItem.supplierName = selectedHotel.supplierName || hotelItem.supplierName;
    hotelItem.roomType = primaryRoom.roomType || hotelItem.roomType;
    hotelItem.roomCategory = primaryRoom.roomCategory || hotelItem.roomCategory;
    hotelItem.bedType = normalizeBedType(primaryRoom.bedType || hotelItem.bedType);
    hotelItem.extraBedType = normalizeExtraBedType(primaryRoom.extraBedType || hotelItem.extraBedType);
    hotelItem.maxAdults = primaryRoom.maxAdults !== undefined ? primaryRoom.maxAdults : 2;
    hotelItem.maxChildren = primaryRoom.maxChildren !== undefined ? primaryRoom.maxChildren : 1;
    hotelItem.mealPlan = primaryRoom.mealPlan || hotelItem.mealPlan;
    hotelItem.basePrice = baseRate;
    hotelItem.awebRate = Number(primaryRoom.awebRate || 0);
    hotelItem.cwebRate = Number(primaryRoom.cwebRate || 0);
    hotelItem.cwoebRate = Number(primaryRoom.cwoebRate || 0);
    hotelItem.price = recalculateHotelPrice(hotelItem);

    setHotels(updated);
  };

  // Switch Room Category (Standard Room, Deluxe Room, Suite, etc.)
  const handleRoomCategoryChange = (hotelIdx, roomTypeName) => {
    const updated = [...hotels];
    const hotelItem = updated[hotelIdx];
    const hotelsList = hotelItem.hotelsList || [];
    const selectedHotel = hotelsList[hotelItem.selectedHotelIdx || 0] || {};
    const roomsList = Array.isArray(selectedHotel.rooms) ? selectedHotel.rooms : [];
    const foundRoom = roomsList.find((r) => r.roomType === roomTypeName);

    hotelItem.roomType = roomTypeName;
    if (foundRoom) {
      hotelItem.roomCategory = foundRoom.roomCategory || hotelItem.roomCategory;
      hotelItem.bedType = normalizeBedType(foundRoom.bedType || hotelItem.bedType);
      hotelItem.extraBedType = normalizeExtraBedType(foundRoom.extraBedType || hotelItem.extraBedType);
      hotelItem.maxAdults = foundRoom.maxAdults !== undefined ? foundRoom.maxAdults : hotelItem.maxAdults;
      hotelItem.maxChildren = foundRoom.maxChildren !== undefined ? foundRoom.maxChildren : hotelItem.maxChildren;
      hotelItem.mealPlan = foundRoom.mealPlan || hotelItem.mealPlan;
      hotelItem.basePrice = Number(foundRoom.price || 0);
      hotelItem.awebRate = Number(foundRoom.awebRate || 0);
      hotelItem.cwebRate = Number(foundRoom.cwebRate || 0);
      hotelItem.cwoebRate = Number(foundRoom.cwoebRate || 0);
    }
    hotelItem.price = recalculateHotelPrice(hotelItem);
    setHotels(updated);
  };

  // Switch Room Occupancy (Single, Double, Twin, Triple, Quad, Family)
  const handleRoomOccupancyChange = (hotelIdx, occupancyCategory) => {
    const updated = [...hotels];
    const hotelItem = updated[hotelIdx];
    hotelItem.roomCategory = occupancyCategory;

    const hotelsList = hotelItem.hotelsList || [];
    const selectedHotel = hotelsList[hotelItem.selectedHotelIdx || 0] || {};
    const roomsList = Array.isArray(selectedHotel.rooms) ? selectedHotel.rooms : [];
    const matchingRoom = roomsList.find(
      (r) =>
        (r.roomType === hotelItem.roomType && String(r.roomCategory || "").toLowerCase() === String(occupancyCategory || "").toLowerCase()) ||
        String(r.roomCategory || "").toLowerCase() === String(occupancyCategory || "").toLowerCase()
    );

    const defaults = getOccupancyDefaultsForRoomCategory(occupancyCategory, hotelItem.bedType);

    if (matchingRoom) {
      hotelItem.maxAdults = matchingRoom.maxAdults !== undefined ? matchingRoom.maxAdults : defaults.maxAdults;
      hotelItem.maxChildren = matchingRoom.maxChildren !== undefined ? matchingRoom.maxChildren : defaults.maxChildren;
      hotelItem.bedType = matchingRoom.bedType ? normalizeBedType(matchingRoom.bedType) : defaults.bedType;
      hotelItem.extraBedType = matchingRoom.extraBedType ? normalizeExtraBedType(matchingRoom.extraBedType) : defaults.extraBedType;
      if (matchingRoom.price) {
        hotelItem.basePrice = Number(matchingRoom.price);
      }
      if (matchingRoom.awebRate !== undefined) hotelItem.awebRate = Number(matchingRoom.awebRate || 0);
      if (matchingRoom.cwebRate !== undefined) hotelItem.cwebRate = Number(matchingRoom.cwebRate || 0);
      if (matchingRoom.cwoebRate !== undefined) hotelItem.cwoebRate = Number(matchingRoom.cwoebRate || 0);
    } else {
      hotelItem.maxAdults = defaults.maxAdults;
      hotelItem.maxChildren = defaults.maxChildren;
      hotelItem.bedType = defaults.bedType;
      hotelItem.extraBedType = defaults.extraBedType;
    }

    hotelItem.price = recalculateHotelPrice(hotelItem);
    setHotels(updated);
  };

  // Select DMC Hotel from Dropdown
  const selectDmcHotel = (index, dmcHotel) => {
    const updated = [...hotels];
    const serviceTitle = dmcHotel.serviceName || dmcHotel.title || dmcHotel.hotelName || dmcHotel.name || "";

    const hotelsList = Array.isArray(dmcHotel.hotels) && dmcHotel.hotels.length > 0
      ? dmcHotel.hotels
      : [
          {
            hotelName: dmcHotel.hotelName || serviceTitle,
            hotelCategory: dmcHotel.starCategory || dmcHotel.hotelCategory || "5 Star",
            supplierName: dmcHotel.supplierName || dmcHotel.dmcName || "",
            rooms: [
              {
                roomType: dmcHotel.roomType || "Standard Room",
                roomCategory: dmcHotel.roomCategory || "Double",
                bedType: dmcHotel.bedType || "Queen Bed",
                extraBedType: dmcHotel.extraBedType || "None",
                maxAdults: dmcHotel.maxAdults !== undefined ? dmcHotel.maxAdults : 2,
                maxChildren: dmcHotel.maxChildren !== undefined ? dmcHotel.maxChildren : 1,
                mealPlan: dmcHotel.mealPlan || "EP",
                price: Number(dmcHotel.price || dmcHotel.total || dmcHotel.rate || 0),
                awebRate: Number(dmcHotel.awebRate || 0),
                cwebRate: Number(dmcHotel.cwebRate || 0),
                cwoebRate: Number(dmcHotel.cwoebRate || 0),
              },
            ],
          },
        ];

    const primaryHotel = hotelsList[0] || {};
    const roomsList = Array.isArray(primaryHotel.rooms) && primaryHotel.rooms.length > 0 ? primaryHotel.rooms : [];
    const primaryRoom = roomsList[0] || {};

    const baseRate = Number(primaryRoom.price !== undefined ? primaryRoom.price : (dmcHotel.price || dmcHotel.total || dmcHotel.rate || 0));
    const aweb = Number(primaryRoom.awebRate !== undefined ? primaryRoom.awebRate : (dmcHotel.awebRate || 0));
    const cweb = Number(primaryRoom.cwebRate !== undefined ? primaryRoom.cwebRate : (dmcHotel.cwebRate || 0));
    const cwoeb = Number(primaryRoom.cwoebRate !== undefined ? primaryRoom.cwoebRate : (dmcHotel.cwoebRate || 0));

    const n = Math.max(1, Number(updated[index].nights || 1));
    const r = Math.max(1, Number(updated[index].rooms || 1));

    updated[index] = {
      ...updated[index],
      serviceName: serviceTitle,
      hotelName: primaryHotel.hotelName || dmcHotel.hotelName || serviceTitle,
      name: serviceTitle,
      title: serviceTitle,
      hotelsList: hotelsList,
      selectedHotelIdx: 0,
      roomType: primaryRoom.roomType || dmcHotel.roomType || "Standard Room",
      roomCategory: primaryRoom.roomCategory || dmcHotel.roomCategory || "Double",
      rooms: r,
      nights: n,
      bedType: primaryRoom.bedType || dmcHotel.bedType || "Queen Bed",
      extraBedType: primaryRoom.extraBedType || dmcHotel.extraBedType || "None",
      maxAdults: primaryRoom.maxAdults !== undefined ? primaryRoom.maxAdults : (dmcHotel.maxAdults || 2),
      maxChildren: primaryRoom.maxChildren !== undefined ? primaryRoom.maxChildren : (dmcHotel.maxChildren || 1),
      mealPlan: primaryRoom.mealPlan || dmcHotel.mealPlan || "EP",
      basePrice: baseRate,
      awebRate: aweb,
      cwebRate: cweb,
      cwoebRate: cwoeb,
      price: baseRate * n * r,
      supplier: dmcHotel.supplier || dmcHotel.supplierId || dmcHotel.dmcId || dmcHotel._id || "",
      supplierName: primaryHotel.supplierName || dmcHotel.supplierName || dmcHotel.dmcName || "",
      starCategory: primaryHotel.hotelCategory || dmcHotel.starCategory || dmcHotel.hotelCategory || "5 Star",
      description: dmcHotel.description || updated[index].description || "",
    };
    setHotels(updated);
    setActiveHotelDropdownIdx(null);
    toast.success(`DMC Service linked: ${serviceTitle}`);
  };

  const TRANSPORT_USAGE_OPTIONS = [
    { value: "one-way-airport-transfer", label: "One Way / Airport Transfer" },
    { value: "inter-hotel-transfer", label: "Inter Hotel Transfer" },
    { value: "full-day", label: "Full Day (80 km / 8 hrs)" },
    { value: "half-day", label: "Half Day (40 km / 4 hrs)" },
  ];

  const getTransportVehicleUsagePrices = (vehicle = {}, dmcTransfer = {}) => {
    const pointToPoint = vehicle?.usageTypes?.pointToPoint || [];
    const hourly = vehicle?.usageTypes?.hourly || [];

    const oneWay =
      pointToPoint.find((p) =>
        String(p.name || p.usageType || "").toLowerCase().includes("one way") ||
        String(p.name || "").toLowerCase().includes("airport")
      ) || pointToPoint[0];

    const interHotel =
      pointToPoint.find((p) =>
        String(p.name || p.usageType || "").toLowerCase().includes("inter hotel") ||
        String(p.name || "").toLowerCase().includes("inter-hotel")
      ) || pointToPoint[1];

    const fullDay =
      hourly.find((h) =>
        String(h.name || h.usageType || "").toLowerCase().includes("full")
      ) || hourly[0];

    const halfDay =
      hourly.find((h) =>
        String(h.name || h.usageType || "").toLowerCase().includes("half")
      ) || hourly[1];

    const defaultPrice = Number(dmcTransfer?.price || dmcTransfer?.total || dmcTransfer?.rate || 0);

    const oneWayPrice = Number(oneWay?.price !== undefined ? oneWay.price : defaultPrice);
    const interHotelPrice = Number(interHotel?.price !== undefined ? interHotel.price : defaultPrice);
    const fullDayPrice = Number(fullDay?.price !== undefined ? fullDay.price : defaultPrice);
    const halfDayPrice = Number(halfDay?.price !== undefined ? halfDay.price : defaultPrice);

    const fullDayExtraPerKmRate = Number(
      fullDay?.extraPerKmRate !== undefined
        ? fullDay.extraPerKmRate
        : dmcTransfer?.fullDayExtraPerKmRate || 0
    );
    const halfDayExtraPerKmRate = Number(
      halfDay?.extraPerKmRate !== undefined
        ? halfDay.extraPerKmRate
        : dmcTransfer?.halfDayExtraPerKmRate || 0
    );

    return {
      "one-way-airport-transfer": oneWayPrice,
      "inter-hotel-transfer": interHotelPrice,
      "full-day": fullDayPrice,
      "half-day": halfDayPrice,
      fullDayExtraPerKmRate,
      halfDayExtraPerKmRate,
    };
  };

  const addTransfer = () => setTransfers([...transfers, initialTransfer()]);
  const removeTransfer = (index) => setTransfers(transfers.filter((_, i) => i !== index));
  const updateTransfer = (index, field, value) => {
    const updated = [...transfers];
    updated[index][field] = value;

    if (field === "name" || field === "serviceName") {
      updated[index].name = value;
      updated[index].serviceName = value;
    }

    if (field === "days") {
      const d = Math.max(1, Number(value || 1));
      const base = Number(updated[index].basePrice || 0);
      if (base > 0) {
        updated[index].price = base * d;
      }
    }

    if (field === "basePrice") {
      const d = Math.max(1, Number(updated[index].days || 1));
      updated[index].price = Number(value || 0) * d;
    }

    if (field === "price") {
      const d = Math.max(1, Number(updated[index].days || 1));
      updated[index].basePrice = Math.round(Number(value || 0) / d);
    }

    setTransfers(updated);
  };

  const handleVehicleTypeChange = (transferIdx, value) => {
    const updated = [...transfers];
    const item = updated[transferIdx];
    const vList = item.vehiclesList || [];
    const matched = vList.find((v) => v.vehicleType === value);

    item.vehicleType = value;
    if (matched) {
      item.passengerCapacity = Number(matched.passengerCapacity || 4);
      item.luggageCapacity = Number(matched.luggageCapacity || 2);
      if (matched.description) item.description = matched.description;
      const prices = getTransportVehicleUsagePrices(matched, item);
      item.usagePrices = prices;
      const currentUsage = item.usage || "one-way-airport-transfer";
      const rate = prices[currentUsage] !== undefined ? prices[currentUsage] : item.basePrice || 0;
      item.basePrice = rate;
      const d = Math.max(1, Number(item.days || 1));
      item.price = rate * d;
    } else {
      if (value.includes("Sedan")) {
        item.passengerCapacity = 4;
        item.luggageCapacity = 2;
      } else if (value.includes("SUV") || value.includes("Innova") || value.includes("Ertiga")) {
        item.passengerCapacity = 6;
        item.luggageCapacity = 4;
      } else if (value.includes("Tempo")) {
        item.passengerCapacity = 12;
        item.luggageCapacity = 8;
      }
    }
    setTransfers(updated);
  };

  const handleUsageChange = (transferIdx, usageKey) => {
    const updated = [...transfers];
    const item = updated[transferIdx];
    item.usage = usageKey;
    const usagePrices = item.usagePrices || {};
    const rate = usagePrices[usageKey] !== undefined ? Number(usagePrices[usageKey]) : Number(item.basePrice || 0);
    item.basePrice = rate;
    const d = Math.max(1, Number(item.days || 1));
    item.price = rate * d;
    setTransfers(updated);
  };

  // Select DMC Transfer from Dropdown
  const selectDmcTransfer = (index, dmcTransfer) => {
    const updated = [...transfers];
    const routeTitle = dmcTransfer.serviceName || dmcTransfer.name || dmcTransfer.title || "";

    const vehiclesList = Array.isArray(dmcTransfer.vehicles) && dmcTransfer.vehicles.length > 0
      ? dmcTransfer.vehicles
      : [
          {
            vehicleType: dmcTransfer.vehicleType || "Sedan / Dzire (4 Pax)",
            passengerCapacity: Number(dmcTransfer.passengerCapacity || 4),
            luggageCapacity: Number(dmcTransfer.luggageCapacity || 2),
            description: dmcTransfer.description || "",
            usageTypes: dmcTransfer.usageTypes || {},
          },
        ];

    const primaryVehicle = vehiclesList[0] || {};
    const usagePrices = getTransportVehicleUsagePrices(primaryVehicle, dmcTransfer);
    const selectedUsage = updated[index].usage || "one-way-airport-transfer";
    const selectedUsageRate = usagePrices[selectedUsage] !== undefined ? usagePrices[selectedUsage] : Number(dmcTransfer.price || dmcTransfer.rate || 0);
    const d = Math.max(1, Number(updated[index].days || 1));

    updated[index] = {
      ...updated[index],
      serviceName: routeTitle,
      name: routeTitle,
      title: routeTitle,
      vehiclesList: vehiclesList,
      selectedVehicleIdx: 0,
      vehicleType: primaryVehicle.vehicleType || dmcTransfer.vehicleType || "Sedan / Dzire (4 Pax)",
      passengerCapacity: Number(primaryVehicle.passengerCapacity || dmcTransfer.passengerCapacity || 4),
      luggageCapacity: Number(primaryVehicle.luggageCapacity || dmcTransfer.luggageCapacity || 2),
      usage: selectedUsage,
      usagePrices: usagePrices,
      basePrice: selectedUsageRate,
      price: selectedUsageRate * d,
      fullDayNote: dmcTransfer.fullDayNote || "",
      halfDayNote: dmcTransfer.halfDayNote || "",
      fullDayExtraPerKmRate: usagePrices.fullDayExtraPerKmRate || 0,
      halfDayExtraPerKmRate: usagePrices.halfDayExtraPerKmRate || 0,
      supplier: dmcTransfer.supplier || dmcTransfer.supplierId || dmcTransfer.dmcId || dmcTransfer._id || "",
      supplierName: dmcTransfer.supplierName || dmcTransfer.dmcName || "",
      description: primaryVehicle.description || dmcTransfer.description || updated[index].description || "",
    };
    setTransfers(updated);
    setActiveTransferDropdownIdx(null);
    toast.success(`DMC Transport linked: ${routeTitle}`);
  };

  const addActivity = () => setActivities([...activities, initialActivity()]);
  const removeActivity = (index) => setActivities(activities.filter((_, i) => i !== index));

  const handleActivityTourTypeChange = (index, selectedTourType) => {
    const updated = [...activities];
    const item = updated[index];
    const tList = item.tourTypesList || [];
    const matched = tList.find((t) => t.tourType === selectedTourType) || {};

    const rate = Number(matched.price !== undefined ? matched.price : item.basePrice || 0);
    const basis = matched.pricingBasis || (selectedTourType.toLowerCase().includes("group") && !selectedTourType.toLowerCase().includes("per group") ? "Per Pax" : "Per Group");
    const maxPaxVal = matched.maxPax !== undefined ? matched.maxPax : (selectedTourType.toLowerCase().includes("group") && !selectedTourType.toLowerCase().includes("per group") ? "N/A (Shared Group)" : selectedTourType.toLowerCase().includes("vip") ? "Up to 6 Pax" : "Up to 4 Pax");
    const paxNum = Math.max(1, Number(item.pax || 1));
    const isPerGroup = basis.toLowerCase().includes("group") && !basis.toLowerCase().includes("pax");

    item.tourType = selectedTourType;
    item.basePrice = rate;
    item.pricingBasis = basis;
    item.maxPax = maxPaxVal;
    if (matched.description) item.description = matched.description;
    item.price = isPerGroup ? rate : rate * paxNum;

    setActivities(updated);
  };

  const updateActivity = (index, field, value) => {
    const updated = [...activities];
    updated[index][field] = value;

    if (field === "name" || field === "serviceName") {
      updated[index].name = value;
      updated[index].serviceName = value;
    }

    if (field === "pax" || field === "basePrice") {
      const paxNum = Math.max(1, Number(field === "pax" ? value : updated[index].pax || 1));
      const base = Number(field === "basePrice" ? value : updated[index].basePrice || 0);
      const basis = String(updated[index].pricingBasis || "").toLowerCase();
      const isPerGroup = basis.includes("group") && !basis.includes("pax");
      updated[index].price = isPerGroup ? base : base * paxNum;
    }

    if (field === "price") {
      const paxNum = Math.max(1, Number(updated[index].pax || 1));
      const basis = String(updated[index].pricingBasis || "").toLowerCase();
      const isPerGroup = basis.includes("group") && !basis.includes("pax");
      if (isPerGroup) {
        updated[index].basePrice = Number(value || 0);
      } else {
        updated[index].basePrice = Math.round(Number(value || 0) / paxNum);
      }
    }

    setActivities(updated);
  };

  // Select DMC Activity from Dropdown
  const selectDmcActivity = (index, dmcAct) => {
    const updated = [...activities];
    const actTitle = dmcAct.serviceName || dmcAct.name || dmcAct.title || "";
    const tourTypesList = Array.isArray(dmcAct.tourTypes) && dmcAct.tourTypes.length > 0
      ? dmcAct.tourTypes
      : [
          {
            tourType: dmcAct.tourType || "Group Tour",
            price: Number(dmcAct.price || dmcAct.rate || 0),
            pricingBasis: dmcAct.pricingBasis || "Per Pax",
            maxPax: dmcAct.maxPax || "N/A (Shared Group)",
            description: dmcAct.description || "",
          },
        ];

    const defaultTour = tourTypesList[0] || {};
    const defaultTourType = defaultTour.tourType || dmcAct.tourType || "Group Tour";
    const defaultPricingBasis = defaultTour.pricingBasis || (defaultTourType.toLowerCase().includes("group") && !defaultTourType.toLowerCase().includes("per group") ? "Per Pax" : "Per Group");
    const defaultMaxPax = defaultTour.maxPax || (defaultTourType.toLowerCase().includes("group") && !defaultTourType.toLowerCase().includes("per group") ? "N/A (Shared Group)" : defaultTourType.toLowerCase().includes("vip") ? "Up to 6 Pax" : "Up to 4 Pax");
    const baseRate = Number(defaultTour.price !== undefined ? defaultTour.price : (dmcAct.price || dmcAct.rate || 0));
    const paxNum = Math.max(1, Number(updated[index].pax || 1));
    const isPerGroup = defaultPricingBasis.toLowerCase().includes("group") && !defaultPricingBasis.toLowerCase().includes("pax");
    const calculatedTotal = isPerGroup ? baseRate : baseRate * paxNum;

    updated[index] = {
      ...updated[index],
      serviceName: actTitle,
      name: actTitle,
      tourTypesList: tourTypesList,
      selectedTourIdx: 0,
      tourType: defaultTourType,
      pricingBasis: defaultPricingBasis,
      maxPax: defaultMaxPax,
      basePrice: baseRate,
      pax: paxNum,
      price: calculatedTotal,
      supplier: dmcAct.supplier || dmcAct.supplierId || dmcAct.dmcId || dmcAct._id || "",
      supplierName: dmcAct.supplierName || dmcAct.dmcName || "",
      description: defaultTour.description || dmcAct.description || updated[index].description || "",
    };
    setActivities(updated);
    setActiveActivityDropdownIdx(null);
    toast.success(`DMC Activity linked: ${actTitle}`);
  };

  const addSightseeing = () => setSightseeing([...sightseeing, initialSightseeing()]);
  const removeSightseeing = (index) => setSightseeing(sightseeing.filter((_, i) => i !== index));

  const handleSightseeingTourTypeChange = (index, selectedTourType) => {
    const updated = [...sightseeing];
    const item = updated[index];
    const tList = item.tourTypesList || [];
    const matched = tList.find((t) => t.tourType === selectedTourType) || {};

    const rate = Number(matched.price !== undefined ? matched.price : item.basePrice || 0);
    const basis = matched.pricingBasis || (selectedTourType.toLowerCase().includes("group") && !selectedTourType.toLowerCase().includes("per group") ? "Per Pax" : "Per Group");
    const maxPaxVal = matched.maxPax !== undefined ? matched.maxPax : (selectedTourType.toLowerCase().includes("group") && !selectedTourType.toLowerCase().includes("per group") ? "N/A (Shared Group)" : selectedTourType.toLowerCase().includes("vip") ? "Up to 6 Pax" : "Up to 4 Pax");
    const paxNum = Math.max(1, Number(item.pax || 1));
    const isPerGroup = basis.toLowerCase().includes("group") && !basis.toLowerCase().includes("pax");

    item.tourType = selectedTourType;
    item.basePrice = rate;
    item.pricingBasis = basis;
    item.maxPax = maxPaxVal;
    if (matched.description) item.description = matched.description;
    item.price = isPerGroup ? rate : rate * paxNum;

    setSightseeing(updated);
  };

  const updateSightseeing = (index, field, value) => {
    const updated = [...sightseeing];
    updated[index][field] = value;

    if (field === "name" || field === "serviceName") {
      updated[index].name = value;
      updated[index].serviceName = value;
    }

    if (field === "pax" || field === "basePrice") {
      const paxNum = Math.max(1, Number(field === "pax" ? value : updated[index].pax || 1));
      const base = Number(field === "basePrice" ? value : updated[index].basePrice || 0);
      const basis = String(updated[index].pricingBasis || "").toLowerCase();
      const isPerGroup = basis.includes("group") && !basis.includes("pax");
      updated[index].price = isPerGroup ? base : base * paxNum;
    }

    if (field === "price") {
      const paxNum = Math.max(1, Number(updated[index].pax || 1));
      const basis = String(updated[index].pricingBasis || "").toLowerCase();
      const isPerGroup = basis.includes("group") && !basis.includes("pax");
      if (isPerGroup) {
        updated[index].basePrice = Number(value || 0);
      } else {
        updated[index].basePrice = Math.round(Number(value || 0) / paxNum);
      }
    }

    setSightseeing(updated);
  };

  // Select DMC Sightseeing from Dropdown
  const selectDmcSightseeing = (index, dmcSight) => {
    const updated = [...sightseeing];
    const sightTitle = dmcSight.serviceName || dmcSight.name || dmcSight.title || "";
    const tourTypesList = Array.isArray(dmcSight.tourTypes) && dmcSight.tourTypes.length > 0
      ? dmcSight.tourTypes
      : [
          {
            tourType: dmcSight.tourType || "Group Tour",
            price: Number(dmcSight.price || dmcSight.rate || 0),
            pricingBasis: dmcSight.pricingBasis || "Per Pax",
            maxPax: dmcSight.maxPax || "N/A (Shared Group)",
            description: dmcSight.description || "",
          },
        ];

    const defaultTour = tourTypesList[0] || {};
    const defaultTourType = defaultTour.tourType || dmcSight.tourType || "Group Tour";
    const defaultPricingBasis = defaultTour.pricingBasis || (defaultTourType.toLowerCase().includes("group") && !defaultTourType.toLowerCase().includes("per group") ? "Per Pax" : "Per Group");
    const defaultMaxPax = defaultTour.maxPax || (defaultTourType.toLowerCase().includes("group") && !defaultTourType.toLowerCase().includes("per group") ? "N/A (Shared Group)" : defaultTourType.toLowerCase().includes("vip") ? "Up to 6 Pax" : "Up to 4 Pax");
    const baseRate = Number(defaultTour.price !== undefined ? defaultTour.price : (dmcSight.price || dmcSight.rate || 0));
    const paxNum = Math.max(1, Number(updated[index].pax || 1));
    const isPerGroup = defaultPricingBasis.toLowerCase().includes("group") && !defaultPricingBasis.toLowerCase().includes("pax");
    const calculatedTotal = isPerGroup ? baseRate : baseRate * paxNum;

    updated[index] = {
      ...updated[index],
      serviceName: sightTitle,
      name: sightTitle,
      tourTypesList: tourTypesList,
      selectedTourIdx: 0,
      tourType: defaultTourType,
      pricingBasis: defaultPricingBasis,
      maxPax: defaultMaxPax,
      basePrice: baseRate,
      pax: paxNum,
      price: calculatedTotal,
      supplier: dmcSight.supplier || dmcSight.supplierId || dmcSight.dmcId || dmcSight._id || "",
      supplierName: dmcSight.supplierName || dmcSight.dmcName || "",
      description: defaultTour.description || dmcSight.description || updated[index].description || "",
    };
    setSightseeing(updated);
    setActiveSightseeingDropdownIdx(null);
    toast.success(`DMC Sightseeing linked: ${sightTitle}`);
  };

  const addItineraryDay = () => setItinerary([...itinerary, initialItineraryDay(itinerary.length + 1)]);
  const removeItineraryDay = (index) => setItinerary(itinerary.filter((_, i) => i !== index));
  const updateItinerary = (index, field, value) => {
    const updated = [...itinerary];
    updated[index][field] = value;
    setItinerary(updated);
  };

  const totalDaysCount = Math.max(1, Number(days) || (duration ? Number(duration.match(/\d+/g)?.[1] || duration.match(/\d+/g)?.[0]) : 1) || 1);
  const numBaseCost = Number(basePrice || (price && !basePrice ? price : 0) || 0);
  const gstAmt = gstChecked && numBaseCost > 0 ? Math.round((numBaseCost * Number(gstPercent || 0)) / 100) : 0;
  const tcsAmt = tcsChecked && numBaseCost > 0 ? Math.round((numBaseCost * Number(tcsPercent || 0)) / 100) : 0;
  const tourismAmt = tourismChecked && Number(tourismAmount) > 0 ? Math.round(Number(tourismAmount)) : 0;
  const totalTaxAmt = gstAmt + tcsAmt + tourismAmt;
  const finalCalculatedPrice = numBaseCost + totalTaxAmt;

  const linkedHotelsCost = hotels.reduce((sum, h) => sum + Number(h.price || 0), 0);
  const linkedTransfersCost = transfers.reduce((sum, t) => sum + Number(t.price || 0), 0);
  const linkedActivitiesCost = activities.reduce((sum, a) => sum + Number(a.price || 0), 0);
  const linkedSightseeingCost = sightseeing.reduce((sum, s) => sum + Number(s.price || 0), 0);
  const totalLinkedServicesCost = linkedHotelsCost + linkedTransfersCost + linkedActivitiesCost + linkedSightseeingCost;

  const validHotelsCount = hotels.filter((h) => h.hotelName?.trim() || h.name?.trim() || Number(h.price) > 0).length;
  const validTransfersCount = transfers.filter((t) => t.name?.trim() || Number(t.price) > 0).length;
  const validActivitiesCount = activities.filter((a) => a.name?.trim() || Number(a.price) > 0).length;
  const validSightseeingCount = sightseeing.filter((s) => s.name?.trim() || Number(s.price) > 0).length;

  const selectedHotelsList = hotels.filter((h) => h.hotelName?.trim() || h.name?.trim() || Number(h.price) > 0);
  const selectedTransfersList = transfers.filter((t) => t.name?.trim() || Number(t.price) > 0);
  const selectedActivitiesList = activities.filter((a) => a.name?.trim() || Number(a.price) > 0);
  const selectedSightseeingList = sightseeing.filter((s) => s.name?.trim() || Number(s.price) > 0);

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      return toast.error("Please enter a package title");
    }
    if (!destination.trim()) {
      return toast.error("Please enter a destination (e.g. Goa, Dubai, Mussoorie)");
    }
    const finalPrice = finalCalculatedPrice > 0 ? finalCalculatedPrice : Number(price || 0);
    if (!finalPrice || finalPrice <= 0) {
      return toast.error("Please enter a valid base package price");
    }

    // Validation for Max Pax in Activities & Sightseeing
    for (const act of activities) {
      if (!act.name?.trim()) continue;
      const paxNum = Number(act.pax || 1);
      const maxPaxStr = String(act.maxPax || "").toLowerCase();
      const match = maxPaxStr.match(/\d+/);
      if (match) {
        const maxLimit = Number(match[0]);
        if (maxLimit > 0 && paxNum > maxLimit) {
          return toast.error(`${act.name}: Maximum ${maxLimit} Pax allowed for ${act.tourType || "this tour"}.`);
        }
      } else {
        const tourType = String(act.tourType || "").toLowerCase();
        if (/private/i.test(tourType) && paxNum > 4) {
          return toast.error(`${act.name}: Maximum 4 Pax allowed for Private Tour.`);
        }
        if (/premium|vip/i.test(tourType) && paxNum > 6) {
          return toast.error(`${act.name}: Maximum 6 Pax allowed for Premium/VIP Tour.`);
        }
      }
    }

    for (const sight of sightseeing) {
      if (!sight.name?.trim()) continue;
      const paxNum = Number(sight.pax || 1);
      const maxPaxStr = String(sight.maxPax || "").toLowerCase();
      const match = maxPaxStr.match(/\d+/);
      if (match) {
        const maxLimit = Number(match[0]);
        if (maxLimit > 0 && paxNum > maxLimit) {
          return toast.error(`${sight.name}: Maximum ${maxLimit} Pax allowed for ${sight.tourType || "this tour"}.`);
        }
      } else {
        const tourType = String(sight.tourType || "").toLowerCase();
        if (/private/i.test(tourType) && paxNum > 4) {
          return toast.error(`${sight.name}: Maximum 4 Pax allowed for Private Tour.`);
        }
        if (/premium|vip/i.test(tourType) && paxNum > 6) {
          return toast.error(`${sight.name}: Maximum 6 Pax allowed for Premium/VIP Tour.`);
        }
      }
    }

    try {
      setLoading(true);
      const payload = {
        title: title.trim(),
        destination: destination.trim(),
        country: country.trim(),
        duration: duration.trim(),
        days: Number(days) || 1,
        basePrice: numBaseCost > 0 ? numBaseCost : finalPrice,
        tax: {
          gstPercent: gstChecked ? Number(gstPercent || 0) : 0,
          gstAmount: gstAmt,
          tcsPercent: tcsChecked ? Number(tcsPercent || 0) : 0,
          tcsAmount: tcsAmt,
          tourismAmount: tourismAmt,
          totalTax: totalTaxAmt,
        },
        price: finalPrice,
        description: description.trim(),
        inclusions: inclusions.trim(),
        exclusions: exclusions.trim(),
        dayWiseItinerary: itinerary.filter((it) => it.title?.trim() || it.description?.trim()),
        hotels: hotels.filter((h) => h.hotelName?.trim() || h.name?.trim()),
        transfers: transfers.filter((t) => t.name?.trim()),
        activities: activities.filter((a) => a.name?.trim()),
        sightseeing: sightseeing.filter((s) => s.name?.trim()),
      };

      const res = await API.post("/dmc/package", payload);
      toast.success("Pre-defined package template created successfully!");
      onSuccess?.(res.data?.data || payload);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to create package template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg border border-slate-700 bg-[#0f141c] text-slate-200 shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#161c26] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Package size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Create Pre-defined Package Template
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30">
                  DMC Connected
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Configure reusable packages with live DMC-uploaded hotels, cabs, sightseeing & itinerary
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-800 bg-[#121720] px-5 pt-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: "basic", label: "1. Basic Details" },
            { id: "hotels", label: `2. Hotels (${hotels.length})` },
            { id: "transfers", label: `3. Transports (${transfers.length})` },
            { id: "activities", label: `4. Activities & Tours (${activities.length + sightseeing.length})` },
            { id: "pricing", label: "5. Pricing & Taxes" },
            { id: "inclusions", label: "6. Inclusions & Notes" },
            { id: "itinerary", label: `7. Day-wise Itinerary (${itinerary.length} Days)` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-md px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#1c2432] text-amber-400 border-t-2 border-t-amber-400 border-x border-x-slate-700"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#161c26]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-4 [scrollbar-width:thin] [scrollbar-color:#334155_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/60 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          
          {/* TAB 1: BASIC DETAILS */}
          {activeTab === "basic" && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div>
                  <p className="text-xs text-slate-200 font-semibold flex items-center gap-1.5">
                    <Package size={14} className="text-amber-400" />
                    1. Basic Package Information
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select destination to automatically link DMC contracted rates and services.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Package Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5N/6D Mussoorie & Dhanaulti Hills Delight"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-[#161d27] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Destination <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mussoorie, Goa, Dubai, Kashmir, Kerala"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-[#161d27] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                  {/* Quick destination suggestion pills */}
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-medium">Quick Select:</span>
                    {POPULAR_DESTINATIONS.map((dest) => (
                      <button
                        key={dest}
                        type="button"
                        onClick={() => setDestination(dest)}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
                          destination.toLowerCase() === dest.toLowerCase()
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-slate-800/80 text-slate-400 border border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        {dest}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. India, UAE, Thailand"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-[#161d27] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Duration Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5 Nights / 6 Days"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-[#161d27] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Total Days (Number)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 6"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-[#161d27] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Package Description / Overview
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Short overview of the holiday package, experience highlights, and key destination appeal..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-[#161d27] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HOTELS (WITH LIVE DMC AUTOCOMPLETE DROPDOWN & FULL ROOM/ADDON CONFIGURATION) */}
          {activeTab === "hotels" && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div>
                  <p className="text-xs text-slate-200 font-semibold flex items-center gap-1.5">
                    <BedDouble size={14} className="text-amber-400" />
                    Hotel Stays & Accommodations
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select from DMC-uploaded contracted hotels in <strong>{destination}</strong> or pick from catalogue / type custom properties.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addHotel}
                  className="flex items-center gap-1.5 rounded-md bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer"
                >
                  <Plus size={13} /> Add Hotel
                </button>
              </div>

              <div className="space-y-4 pt-1">
                {hotels.map((hotel, index) => {
                  const filteredHotels = getFilteredHotels(hotel.serviceName || hotel.name, hotel);
                  const selectedHotelObj = (hotel.hotelsList && hotel.hotelsList[hotel.selectedHotelIdx || 0]) || {};
                  const availableRooms = Array.isArray(selectedHotelObj.rooms) && selectedHotelObj.rooms.length > 0
                    ? selectedHotelObj.rooms
                    : [];

                  return (
                    <div key={index} className={`rounded-xl border border-slate-800 bg-[#161d27] p-4 space-y-3.5 relative ${activeHotelDropdownIdx === index ? "z-50 ring-1 ring-amber-500/50 overflow-visible" : "z-10 overflow-visible"}`}>
                      
                      {/* Hotel Card Header with Hotel Dropdown & Badges */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800/60">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                            <BedDouble size={14} /> Hotel #{index + 1}
                          </span>

                          {/* Hotel Dropdown (if multiple properties in DMC service) */}
                          {hotel.hotelsList && hotel.hotelsList.length > 1 ? (
                            <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#0f141c] px-2 py-0.5 text-xs text-slate-300">
                              <span className="text-slate-400 font-medium text-[11px]">Hotel:</span>
                              <select
                                value={hotel.selectedHotelIdx || 0}
                                onChange={(e) => handleHotelPropertyChange(index, Number(e.target.value))}
                                className="bg-transparent text-amber-300 font-semibold focus:outline-none cursor-pointer text-xs"
                              >
                                {hotel.hotelsList.map((hProp, pIdx) => (
                                  <option key={pIdx} value={pIdx} className="bg-[#161d27] text-slate-200">
                                    {hProp.hotelName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : hotel.hotelName ? (
                            <span className="rounded-lg border border-slate-700/80 bg-[#0f141c] px-2.5 py-0.5 text-[11px] text-amber-300 font-semibold">
                              Hotel: {hotel.hotelName}
                            </span>
                          ) : null}

                          <span className="text-[11px] text-amber-400 font-semibold">
                            ⭐ {hotel.starCategory || "5 Star"}
                          </span>

                          {hotel.supplierName && (
                            <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-400 font-medium">
                              DMC: {hotel.supplierName}
                            </span>
                          )}
                        </div>

                        {hotels.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeHotel(index)}
                            className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Main Service Autocomplete Row + Meal Plan + Nights + Price */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                        
                        {/* Service Name with DMC Live Autocomplete */}
                        <div className={`sm:col-span-2 relative dmc-autocomplete-container ${activeHotelDropdownIdx === index ? "z-40" : "z-10"}`}>
                          <label className="block text-[11px] text-slate-400 mb-0.5 flex items-center justify-between">
                            <span>Service Name (Select DMC Service or Type)</span>
                            {servicesLoading ? (
                              <span className="text-[10px] text-amber-400">Loading DMCs...</span>
                            ) : (
                              <span className="text-[10px] text-emerald-400 font-medium">
                                {getFilteredHotels("").length} DMC Services in {destination || "Selected Destination"}
                              </span>
                            )}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="e.g. Mussoorie Queen of Hills Luxury, Luxury Resort Stay..."
                              value={hotel.serviceName || hotel.name || ""}
                              onFocus={() => setActiveHotelDropdownIdx(index)}
                              onChange={(e) => {
                                updateHotel(index, "serviceName", e.target.value);
                                setActiveHotelDropdownIdx(index);
                              }}
                              className="w-full rounded-md border border-slate-700 bg-[#0f141c] pl-2.5 pr-8 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setActiveHotelDropdownIdx(activeHotelDropdownIdx === index ? null : index)}
                              className="absolute right-2 top-2 text-slate-400 hover:text-amber-400 p-0.5 cursor-pointer transition-colors"
                            >
                              <ChevronDown size={14} />
                            </button>
                          </div>

                          {/* Autocomplete Dropdown List */}
                          {activeHotelDropdownIdx === index && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-lg border border-slate-700 bg-[#0d121a] shadow-[0_20px_60px_rgba(0,0,0,0.95)] z-[100] divide-y divide-slate-800/90 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
                              {filteredHotels.length === 0 ? (
                                <div className="p-3 text-[11px] text-slate-400 italic text-center">
                                  No DMC service found matching "{hotel.serviceName || hotel.name || ""}". You can freely type custom service name.
                                </div>
                              ) : (
                                filteredHotels.map((dmcHotel, hIdx) => {
                                  const serviceTitle = dmcHotel.serviceName || dmcHotel.title || dmcHotel.name || dmcHotel.hotelName;
                                  const isSelected = Boolean(
                                    (hotel.serviceName && serviceTitle.toLowerCase() === hotel.serviceName.trim().toLowerCase()) ||
                                    (hotel.name && serviceTitle.toLowerCase() === hotel.name.trim().toLowerCase())
                                  );
                                  const matchesDest = destination && (dmcHotel.city || dmcHotel.destination || "").toLowerCase().includes(destination.toLowerCase());

                                  return (
                                    <div
                                      key={dmcHotel._id || dmcHotel.id || hIdx}
                                      onClick={() => selectDmcHotel(index, dmcHotel)}
                                      className={`p-2.5 hover:bg-amber-500/15 cursor-pointer transition flex items-center justify-between gap-2 ${
                                        isSelected ? "bg-amber-500/20 border-l-2 border-l-amber-400" : matchesDest ? "bg-amber-500/5" : ""
                                      }`}
                                    >
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-slate-100 flex items-center gap-1.5 truncate">
                                          <Building2 size={13} className="text-amber-400 shrink-0" />
                                          <span>{serviceTitle}</span>
                                          {isSelected && (
                                            <span className="rounded bg-emerald-500/20 text-emerald-300 text-[9px] px-1 py-0.2 font-bold">
                                              ✓ Selected
                                            </span>
                                          )}
                                          <span className="text-[10px] font-normal text-amber-300">
                                            ⭐ {dmcHotel.starCategory || dmcHotel.hotelCategory || "4 Star"}
                                          </span>
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                          📍 <span className="text-slate-300 font-medium">{dmcHotel.city || dmcHotel.destination || "Verified Location"}</span>
                                          {dmcHotel.hotelName && dmcHotel.hotelName !== serviceTitle && (
                                            <> • Hotel: <span className="text-slate-300 font-medium">{dmcHotel.hotelName}</span></>
                                          )}
                                          • {dmcHotel.roomType || "Deluxe Room"} • {dmcHotel.mealPlan || "CP Plan"}
                                        </p>
                                        <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                                          DMC: {dmcHotel.supplierName || dmcHotel.dmcName || "Contracted Supplier"}
                                        </p>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="text-xs font-bold text-amber-400">
                                          ₹{Number(dmcHotel.price || dmcHotel.total || dmcHotel.rate || 0).toLocaleString("en-IN")}
                                        </span>
                                        <span className="block text-[10px] text-slate-500">/ night</span>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-0.5">Meal Plan</label>
                          <select
                            value={hotel.mealPlan || "EP"}
                            onChange={(e) => updateHotel(index, "mealPlan", e.target.value)}
                            className="w-full rounded-md border border-slate-700 bg-[#0f141c] px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                          >
                            <option value="EP">EP (Room Only)</option>
                            <option value="CP">CP (Breakfast Included)</option>
                            <option value="MAP">MAP (Breakfast & Dinner)</option>
                            <option value="AP">AP (All Meals Included)</option>
                            <option value="AI">AI (All Inclusive)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-0.5">
                            Total Hotel Cost (₹)
                            {Number(hotel.basePrice) > 0 && (
                              <span className="text-[10px] text-amber-400 ml-1 font-normal">
                                (₹{Number(hotel.basePrice).toLocaleString("en-IN")}/nt)
                              </span>
                            )}
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 48900"
                            value={hotel.price || ""}
                            onChange={(e) => updateHotel(index, "price", Number(e.target.value))}
                            className="w-full rounded-md border border-slate-700 bg-[#0f141c] px-2.5 py-1.5 text-xs font-semibold text-amber-400 focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Room Configuration Grid (Matching Image 2) */}
                      <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-800/90 bg-[#101620] p-3 md:grid-cols-3 lg:grid-cols-6">
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Room Category
                          </label>
                          <select
                            value={hotel.roomType || "Standard Room"}
                            onChange={(e) => handleRoomCategoryChange(index, e.target.value)}
                            className="w-full rounded-md border border-slate-700 bg-[#0a0f16] px-2 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                          >
                            {availableRooms.length > 0 ? (
                              availableRooms.map((r, rIdx) => (
                                <option key={rIdx} value={r.roomType}>
                                  {r.roomType}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="Standard Room">Standard Room</option>
                                <option value="Deluxe Room">Deluxe Room</option>
                                <option value="Premium Room">Premium Room</option>
                                <option value="Family Room">Family Room</option>
                                <option value="Luxury Room">Luxury Room</option>
                                <option value="Suite">Suite</option>
                              </>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Room Type (Occupancy)
                          </label>
                          <select
                            value={hotel.roomCategory || "Double"}
                            onChange={(e) => handleRoomOccupancyChange(index, e.target.value)}
                            className="w-full rounded-md border border-slate-700 bg-[#0a0f16] px-2 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                          >
                            <option value="Double">Double (2 persons)</option>
                            <option value="Triple">Triple (3 persons)</option>
                            <option value="Single">Single (1 person)</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Nights
                          </label>
                          <select
                            value={Number(hotel.nights || 1)}
                            onChange={(e) => updateHotel(index, "nights", Math.max(1, Number(e.target.value || 1)))}
                            className="w-full rounded-md border border-slate-700 bg-[#0a0f16] px-2 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                          >
                            {[...Array(15)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1} Night{i === 0 ? "" : "s"}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Rooms
                          </label>
                          <select
                            value={Number(hotel.rooms || 1)}
                            onChange={(e) => updateHotel(index, "rooms", Math.max(1, Number(e.target.value || 1)))}
                            className="w-full rounded-md border border-slate-700 bg-[#0a0f16] px-2 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                          >
                            {[...Array(8)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1} Room{i === 0 ? "" : "s"}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Bed Type
                          </label>
                          <select
                            value={hotel.bedType || "Queen Bed"}
                            onChange={(e) => updateHotel(index, "bedType", e.target.value)}
                            className="w-full rounded-md border border-slate-700 bg-[#0a0f16] px-2 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                          >
                            <option value="Queen Bed">Queen Bed</option>
                            <option value="King Bed">King Bed</option>
                            <option value="Twin Bed">Twin Bed</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Extra Bed Type
                          </label>
                          <select
                            value={hotel.extraBedType || "None"}
                            onChange={(e) => updateHotel(index, "extraBedType", e.target.value)}
                            className="w-full rounded-md border border-slate-700 bg-[#0a0f16] px-2 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                          >
                            <option value="None">None</option>
                            <option value="Single Bed">Single Bed</option>
                          </select>
                        </div>
                      </div>

                      {/* Max Occupancy Display Pill */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-slate-400 font-medium">MAX OCCUPANCY:</span>
                        <div className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-[#0d121a] px-2.5 py-1 text-xs text-slate-300">
                          <span className="text-emerald-400 font-semibold">{hotel.maxAdults || 2} Adult{Number(hotel.maxAdults || 2) === 1 ? "" : "s"}</span>
                          <span className="text-slate-600">|</span>
                          <span className="text-sky-400 font-semibold">{hotel.maxChildren !== undefined ? hotel.maxChildren : 1} Child{Number(hotel.maxChildren !== undefined ? hotel.maxChildren : 1) === 1 ? "" : "ren"}</span>
                        </div>
                      </div>

                      {/* Optional Add-ons Row (Matching Image 2) */}
                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Optional Add-ons
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          
                          {/* A.W.E.B */}
                          <label className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#0f141c] p-2.5 hover:border-amber-500/40 cursor-pointer transition">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={hotel.extraAdult || false}
                                onChange={(e) => updateHotel(index, "extraAdult", e.target.checked)}
                                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 cursor-pointer"
                              />
                              <div>
                                <p className="text-xs font-semibold text-amber-300">A.W.E.B</p>
                                <p className="text-[10px] text-slate-400">Extra adult with extra bed</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-amber-400">
                              ₹{Number(hotel.awebRate || 0).toLocaleString("en-IN")}
                            </span>
                          </label>

                          {/* C.W.E.B */}
                          <label className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#0f141c] p-2.5 hover:border-emerald-500/40 cursor-pointer transition">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={hotel.childWithBed || false}
                                onChange={(e) => updateHotel(index, "childWithBed", e.target.checked)}
                                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                              />
                              <div>
                                <p className="text-xs font-semibold text-emerald-300">C.W.E.B</p>
                                <p className="text-[10px] text-slate-400">Child with extra bed</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-emerald-400">
                              ₹{Number(hotel.cwebRate || 0).toLocaleString("en-IN")}
                            </span>
                          </label>

                          {/* C.Wo.E.B */}
                          <label className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#0f141c] p-2.5 hover:border-sky-500/40 cursor-pointer transition">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={hotel.childWithoutBed || false}
                                onChange={(e) => updateHotel(index, "childWithoutBed", e.target.checked)}
                                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 cursor-pointer"
                              />
                              <div>
                                <p className="text-xs font-semibold text-sky-300">C.Wo.E.B</p>
                                <p className="text-[10px] text-slate-400">Child without extra bed</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-sky-400">
                              ₹{Number(hotel.cwoebRate || 0).toLocaleString("en-IN")}
                            </span>
                          </label>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: TRANSPORTS (WITH LIVE DMC ROUTE AUTOCOMPLETE) */}
          {activeTab === "transfers" && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div>
                  <p className="text-xs text-slate-200 font-semibold flex items-center gap-1.5">
                    <Car size={14} className="text-amber-400" />
                    Airport Transfers & Cabs
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select from DMC-uploaded transfer routes in <strong>{destination}</strong> or customize vehicles.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addTransfer}
                  className="flex items-center gap-1.5 rounded-md bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer"
                >
                  <Plus size={13} /> Add Transfer
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {transfers.map((transfer, index) => {
                  const filteredTransfers = getFilteredTransfers(transfer.name, transfer);
                  const availableVehicles = Array.isArray(transfer.vehiclesList) && transfer.vehiclesList.length > 0
                    ? transfer.vehiclesList
                    : [];

                  return (
                    <div key={index} className={`rounded-xl border border-slate-800 bg-[#161d27] p-4 space-y-3 relative ${activeTransferDropdownIdx === index ? "z-30 ring-1 ring-amber-500/40" : "z-10"}`}>
                      
                      {/* Transfer Header with Badges */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800/60">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                            <Car size={14} /> Transfer #{index + 1}
                          </span>

                          {transfer.vehicleType && (
                            <span className="rounded-lg border border-slate-700/80 bg-[#0f141c] px-2.5 py-0.5 text-[11px] text-amber-300 font-semibold">
                              {transfer.vehicleType}
                            </span>
                          )}

                          <span className="rounded bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[10px] text-sky-300 font-medium">
                            👤 {transfer.passengerCapacity || 4} Pax
                          </span>

                          <span className="rounded bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] text-indigo-300 font-medium">
                            🧳 {transfer.luggageCapacity !== undefined ? transfer.luggageCapacity : 2} Bags
                          </span>

                          {transfer.supplierName && (
                            <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-400 font-medium">
                              DMC: {transfer.supplierName}
                            </span>
                          )}
                        </div>

                        {transfers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTransfer(index)}
                            className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Top Row: Service Name Autocomplete + Vehicle Type */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        
                        {/* Route / Name with DMC Autocomplete */}
                        <div className={`sm:col-span-2 relative dmc-autocomplete-container ${activeTransferDropdownIdx === index ? "z-40" : "z-10"}`}>
                          <label className="block text-[11px] text-slate-400 mb-0.5 flex items-center justify-between">
                            <span>Route / Service Name (Select DMC Route or Type)</span>
                            {servicesLoading ? (
                              <span className="text-[10px] text-amber-400">Loading DMCs...</span>
                            ) : (
                              <span className="text-[10px] text-emerald-400 font-medium">
                                {getFilteredTransfers("").length} DMC Routes in {destination || "Selected Destination"}
                              </span>
                            )}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="e.g. Airport to Hotel Pickup, Sightseeing Cab, Station Drop..."
                              value={transfer.name}
                              onFocus={() => setActiveTransferDropdownIdx(index)}
                              onChange={(e) => {
                                updateTransfer(index, "name", e.target.value);
                                setActiveTransferDropdownIdx(index);
                              }}
                              className="w-full rounded-md border border-slate-700 bg-[#0f141c] pl-2.5 pr-8 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setActiveTransferDropdownIdx(activeTransferDropdownIdx === index ? null : index)}
                              className="absolute right-2 top-2 text-slate-400 hover:text-amber-400 p-0.5 cursor-pointer transition-colors"
                            >
                              <ChevronDown size={14} />
                            </button>
                          </div>

                          {/* Autocomplete Dropdown List */}
                          {activeTransferDropdownIdx === index && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-lg border border-slate-700 bg-[#0d121a] shadow-[0_20px_60px_rgba(0,0,0,0.95)] z-[100] divide-y divide-slate-800/90 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
                              {filteredTransfers.length === 0 ? (
                                <div className="p-3 text-[11px] text-slate-400 italic text-center">
                                  No DMC route found matching "{transfer.name}". You can freely type custom transfer route.
                                </div>
                              ) : (
                                filteredTransfers.map((dmcTransfer, tIdx) => {
                                  const routeTitle = dmcTransfer.serviceName || dmcTransfer.name || dmcTransfer.title;
                                  const isSelected = Boolean(transfer.name && routeTitle.toLowerCase() === transfer.name.trim().toLowerCase());
                                  const matchesDest = destination && (dmcTransfer.city || dmcTransfer.destination || "").toLowerCase().includes(destination.toLowerCase());

                                  return (
                                    <div
                                      key={dmcTransfer._id || dmcTransfer.id || tIdx}
                                      onClick={() => selectDmcTransfer(index, dmcTransfer)}
                                      className={`p-2.5 hover:bg-amber-500/15 cursor-pointer transition flex items-center justify-between gap-2 ${
                                        isSelected ? "bg-amber-500/20 border-l-2 border-l-amber-400" : matchesDest ? "bg-amber-500/5" : ""
                                      }`}
                                    >
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-slate-100 flex items-center gap-1.5 truncate">
                                          <Car size={13} className="text-amber-400 shrink-0" />
                                          <span>{routeTitle}</span>
                                          {isSelected && (
                                            <span className="rounded bg-emerald-500/20 text-emerald-300 text-[9px] px-1 py-0.2 font-bold">
                                              ✓ Selected
                                            </span>
                                          )}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                          📍 <span className="text-slate-300 font-medium">{dmcTransfer.city || dmcTransfer.destination || destination}</span> • Vehicle: <span className="text-slate-300 font-medium">{dmcTransfer.vehicleType || "Sedan / Car"}</span> • Capacity: {dmcTransfer.passengerCapacity || 4} Pax
                                        </p>
                                        <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                                          DMC: {dmcTransfer.supplierName || dmcTransfer.dmcName || "Contracted Supplier"}
                                        </p>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="text-xs font-bold text-amber-400">
                                          ₹{Number(dmcTransfer.price || dmcTransfer.total || dmcTransfer.rate || 0).toLocaleString("en-IN")}
                                        </span>
                                        <span className="block text-[10px] text-slate-500">/ trip</span>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>

                        {/* Vehicle Type Dropdown */}
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-0.5">Vehicle Type</label>
                          <select
                            value={transfer.vehicleType}
                            onChange={(e) => handleVehicleTypeChange(index, e.target.value)}
                            className="w-full rounded-md border border-slate-700 bg-[#0f141c] px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                          >
                            {availableVehicles.length > 0 ? (
                              availableVehicles.map((v, vIdx) => (
                                <option key={vIdx} value={v.vehicleType}>
                                  {v.vehicleType} ({v.passengerCapacity || 4} Pax)
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="Sedan / Dzire (4 Pax)">Sedan / Dzire (4 Pax)</option>
                                <option value="SUV / Ertiga (6 Pax)">SUV / Ertiga (6 Pax)</option>
                                <option value="Innova Crysta (6-7 Pax)">Innova Crysta (6-7 Pax)</option>
                                <option value="Tempo Traveller (12-16 Pax)">Tempo Traveller (12-16 Pax)</option>
                                <option value="Luxury Coach / Bus">Luxury Coach / Bus</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Second Row: Usage + Passenger Capacity + Luggage Capacity + Days + Rate */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                        
                        {/* Usage Dropdown matching Quotation side */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-slate-400 mb-0.5">Usage</label>
                          <select
                            value={transfer.usage || "one-way-airport-transfer"}
                            onChange={(e) => handleUsageChange(index, e.target.value)}
                            className="w-full rounded-md border border-slate-700 bg-[#0f141c] px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                          >
                            {TRANSPORT_USAGE_OPTIONS.map((opt) => {
                              const optPrice = transfer.usagePrices && transfer.usagePrices[opt.value] !== undefined
                                ? Number(transfer.usagePrices[opt.value])
                                : Number(transfer.basePrice || 0);
                              return (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label} (₹{optPrice.toLocaleString("en-IN")})
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Passenger Capacity */}
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-0.5">Pax Capacity</label>
                          <input
                            type="number"
                            min="1"
                            value={transfer.passengerCapacity || 4}
                            onChange={(e) => updateTransfer(index, "passengerCapacity", Number(e.target.value))}
                            className="w-full rounded-md border border-slate-700 bg-[#0f141c] px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                          />
                        </div>

                        {/* Luggage Capacity */}
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-0.5">Luggage (Bags)</label>
                          <input
                            type="number"
                            min="0"
                            value={transfer.luggageCapacity !== undefined ? transfer.luggageCapacity : 2}
                            onChange={(e) => updateTransfer(index, "luggageCapacity", Number(e.target.value))}
                            className="w-full rounded-md border border-slate-700 bg-[#0f141c] px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                          />
                        </div>

                        {/* Days Dropdown */}
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-0.5">Days</label>
                          <select
                            value={Number(transfer.days || 1)}
                            onChange={(e) => updateTransfer(index, "days", Math.max(1, Number(e.target.value || 1)))}
                            className="w-full rounded-md border border-slate-700 bg-[#0f141c] px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                          >
                            {[...Array(10)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1} Day{i === 0 ? "" : "s"}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Third Row: Rate & Usage Notes */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800/40">
                        <div className="text-[11px] text-amber-300/90 space-y-0.5">
                          {transfer.usage === "full-day" && transfer.fullDayNote && (
                            <p className="italic">Note (Full Day): {transfer.fullDayNote}</p>
                          )}
                          {transfer.usage === "half-day" && transfer.halfDayNote && (
                            <p className="italic">Note (Half Day): {transfer.halfDayNote}</p>
                          )}
                          {transfer.fullDayExtraPerKmRate > 0 && (
                            <p className="italic text-yellow-400">Extra km rate: ₹{transfer.fullDayExtraPerKmRate}/km where applicable.</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                          <label className="text-[11px] text-slate-400">Total Price (₹):</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 4500"
                            value={transfer.price || ""}
                            onChange={(e) => updateTransfer(index, "price", Number(e.target.value))}
                            className="w-32 rounded-md border border-slate-700 bg-[#0f141c] px-2.5 py-1 text-xs font-bold text-amber-400 focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: SIGHTSEEING & ACTIVITIES (WITH LIVE DMC AUTOCOMPLETE) */}
          {activeTab === "activities" && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div>
                  <p className="text-xs text-slate-200 font-semibold flex items-center gap-1.5">
                    <Landmark size={14} className="text-amber-400" />
                    Sightseeing Tours & Activities
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select from DMC-uploaded activities & sightseeing in <strong>{destination}</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addActivity}
                    className="flex items-center gap-1.5 rounded-md bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer"
                  >
                    <Plus size={13} /> Add Activity
                  </button>
                  <button
                    type="button"
                    onClick={addSightseeing}
                    className="flex items-center gap-1.5 rounded-md bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer"
                  >
                    <Plus size={13} /> Add Tour
                  </button>
                </div>
              </div>

              {/* Activities Section */}
              <div className="space-y-3 pt-1">
                <p className="text-xs font-bold text-slate-300">Activities & Experiences ({activities.length})</p>
                {activities.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No specific activities added yet. Click "+ Add Activity" to add.</p>
                ) : (
                  activities.map((act, index) => {
                    const filteredActs = getFilteredActivities(act.name, act);
                    const paxNum = Number(act.pax || 1);
                    const maxPaxStr = String(act.maxPax || "").toLowerCase();
                    const match = maxPaxStr.match(/\d+/);
                    let hasPaxValidationError = false;
                    let validationErrorMessage = "";
                    if (match) {
                      const maxLimit = Number(match[0]);
                      if (maxLimit > 0 && paxNum > maxLimit) {
                        hasPaxValidationError = true;
                        validationErrorMessage = `Maximum ${maxLimit} Pax allowed for ${act.tourType || "this tour"}.`;
                      }
                    } else {
                      const tourType = String(act.tourType || "").toLowerCase();
                      if (/private/i.test(tourType) && paxNum > 4) {
                        hasPaxValidationError = true;
                        validationErrorMessage = "Maximum 4 Pax allowed for Private Tour.";
                      } else if (/premium|vip/i.test(tourType) && paxNum > 6) {
                        hasPaxValidationError = true;
                        validationErrorMessage = "Maximum 6 Pax allowed for Premium/VIP Tour.";
                      }
                    }

                    const tourTypesList = Array.isArray(act.tourTypesList) && act.tourTypesList.length > 0
                      ? act.tourTypesList
                      : [
                          { tourType: "Group Tour", price: act.basePrice || act.price || 0 },
                          { tourType: "Private Tour", price: act.basePrice || act.price || 0 },
                          { tourType: "Premium/VIP Tour", price: act.basePrice || act.price || 0 }
                        ];

                    return (
                      <div key={index} className={`rounded-md border border-slate-800 bg-[#161d27] p-3 space-y-2.5 relative ${activeActivityDropdownIdx === index ? "z-30 ring-1 ring-amber-500/40" : "z-10"}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                            Activity #{index + 1}
                            {act.supplierName && (
                              <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[10px] text-emerald-400 font-normal">
                                DMC: {act.supplierName}
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeActivity(index)}
                            className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* First Row: Search Input + Tour Type Selector + Day Dropdown */}
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                          <div className={`sm:col-span-6 relative dmc-autocomplete-container ${activeActivityDropdownIdx === index ? "z-40" : "z-10"}`}>
                            <label className="block text-[11px] text-slate-400 mb-0.5">Activity / Experience</label>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="e.g. Scuba Diving, Adventure Tour, Desert Safari..."
                                value={act.name}
                                onFocus={() => setActiveActivityDropdownIdx(index)}
                                onChange={(e) => {
                                  updateActivity(index, "name", e.target.value);
                                  setActiveActivityDropdownIdx(index);
                                }}
                                className="w-full rounded-md border border-slate-700 bg-[#0f141c] pl-2.5 pr-8 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => setActiveActivityDropdownIdx(activeActivityDropdownIdx === index ? null : index)}
                                className="absolute right-2 top-2 text-slate-400 hover:text-amber-400 p-0.5 cursor-pointer transition-colors"
                              >
                                <ChevronDown size={14} />
                              </button>
                            </div>

                            {/* Dropdown */}
                            {activeActivityDropdownIdx === index && (
                              <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-lg border border-slate-700 bg-[#0d121a] shadow-[0_20px_60px_rgba(0,0,0,0.95)] z-[100] divide-y divide-slate-800/90 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
                                {filteredActs.length === 0 ? (
                                  <div className="p-3 text-[11px] text-slate-400 italic text-center">
                                    No DMC activity currently uploaded. You can freely type custom activity name.
                                  </div>
                                ) : (
                                  filteredActs.map((dmcAct, aIdx) => {
                                    const actTitle = dmcAct.serviceName || dmcAct.name || dmcAct.title;
                                    const isSelected = Boolean(act.name && actTitle.toLowerCase() === act.name.trim().toLowerCase());

                                    return (
                                      <div
                                        key={dmcAct._id || dmcAct.id || aIdx}
                                        onClick={() => selectDmcActivity(index, dmcAct)}
                                        className={`p-2.5 hover:bg-amber-500/15 cursor-pointer transition flex items-center justify-between gap-2 ${
                                          isSelected ? "bg-amber-500/20 border-l-2 border-l-amber-400" : ""
                                        }`}
                                      >
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-semibold text-slate-100 flex items-center gap-1.5 truncate">
                                            <span>{actTitle}</span>
                                            {isSelected && (
                                              <span className="rounded bg-emerald-500/20 text-emerald-300 text-[9px] px-1 py-0.2 font-bold">
                                                ✓ Selected
                                              </span>
                                            )}
                                          </p>
                                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                            📍 <span className="text-slate-300 font-medium">{dmcAct.city || dmcAct.destination || destination}</span> • {dmcAct.category || "Experience"}
                                          </p>
                                          <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                                            DMC: {dmcAct.supplierName || dmcAct.dmcName || "Contracted Supplier"}
                                          </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <span className="text-xs font-bold text-amber-400">
                                            ₹{Number(dmcAct.price || dmcAct.total || 0).toLocaleString("en-IN")}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>

                          {/* Tour Type Selector */}
                          <div className="sm:col-span-4">
                            <label className="block text-[11px] text-slate-400 mb-0.5">Tour Type</label>
                            <select
                              value={act.tourType || "Group Tour"}
                              onChange={(e) => handleActivityTourTypeChange(index, e.target.value)}
                              className="w-full rounded-md border border-slate-700 bg-[#0f141c] px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                            >
                              {tourTypesList.map((t, tIdx) => (
                                <option key={tIdx} value={t.tourType}>
                                  {t.tourType} (₹{Number(t.price !== undefined ? t.price : (act.basePrice || 0)).toLocaleString("en-IN")})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Day Dropdown */}
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] text-slate-400 mb-0.5">Day</label>
                            <select
                              value={act.day || 1}
                              onChange={(e) => updateActivity(index, "day", Number(e.target.value))}
                              className="w-full rounded-md border border-slate-700 bg-[#0f141c] px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                            >
                              {Array.from({ length: totalDaysCount }, (_, i) => i + 1).map((d) => (
                                <option key={d} value={d}>
                                  Day {d}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Second Row: Configuration Grid: Base Rate | Pricing Basis | Pax | Max Pax | Total Price */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1 border-t border-slate-800/40">
                          {/* 1. Base Rate */}
                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Base Rate</label>
                            <input
                              type="number"
                              min="0"
                              value={act.basePrice || ""}
                              onChange={(e) => updateActivity(index, "basePrice", Number(e.target.value))}
                              className="w-full rounded-md border border-slate-700 bg-[#0f141c] px-2 py-1 text-xs font-semibold text-slate-200 focus:border-amber-500 focus:outline-none"
                            />
                          </div>

                          {/* 2. Pricing Basis (Read-Only) */}
                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Pricing Basis</label>
                            <div className="flex h-7.5 w-full items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[10px] font-bold text-emerald-300 select-none">
                              {act.pricingBasis || "Per Pax"}
                            </div>
                          </div>

                          {/* 3. Pax */}
                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Pax</label>
                            <input
                              type="number"
                              min="1"
                              value={act.pax || 1}
                              onChange={(e) => updateActivity(index, "pax", Math.max(1, Number(e.target.value) || 1))}
                              className={`w-full rounded-md border bg-[#0f141c] px-2 py-1 text-xs font-semibold text-slate-200 focus:outline-none ${hasPaxValidationError ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-700 focus:border-amber-500"}`}
                            />
                          </div>

                          {/* 4. Max Pax (Read-Only) */}
                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Max Pax</label>
                            <div className="flex h-7.5 w-full items-center justify-center rounded-md border border-purple-500/30 bg-purple-500/10 px-1.5 text-[10px] font-semibold text-purple-300 whitespace-nowrap overflow-hidden text-ellipsis select-none">
                              {act.maxPax || "N/A (Shared Group)"}
                            </div>
                          </div>

                          {/* 5. Total Price (₹) */}
                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Total Price (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={act.price || ""}
                              onChange={(e) => updateActivity(index, "price", Number(e.target.value))}
                              className="w-full rounded-md border border-slate-700 bg-[#0f141c] px-2 py-1 text-xs font-bold text-amber-400 focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Description */}
                        {act.description && (
                          <p className="text-[10px] text-slate-400 italic pt-0.5">
                            {act.description}
                          </p>
                        )}

                        {/* Validation Error Alert */}
                        {hasPaxValidationError && (
                          <div className="flex items-center gap-1.5 rounded-md border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-rose-300">
                            <span>⚠️ {validationErrorMessage}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sightseeing Section */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <p className="text-xs font-bold text-slate-300">Sightseeing Tours ({sightseeing.length})</p>
                {sightseeing.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No sightseeing tours added yet. Click "+ Add Tour" to add.</p>
                ) : (
                  sightseeing.map((sight, index) => {
                    const filteredSight = getFilteredSightseeing(sight.name, sight);
                    const paxNum = Number(sight.pax || 1);
                    const maxPaxStr = String(sight.maxPax || "").toLowerCase();
                    const match = maxPaxStr.match(/\d+/);
                    let hasPaxValidationError = false;
                    let validationErrorMessage = "";
                    if (match) {
                      const maxLimit = Number(match[0]);
                      if (maxLimit > 0 && paxNum > maxLimit) {
                        hasPaxValidationError = true;
                        validationErrorMessage = `Maximum ${maxLimit} Pax allowed for ${sight.tourType || "this tour"}.`;
                      }
                    } else {
                      const tourType = String(sight.tourType || "").toLowerCase();
                      if (/private/i.test(tourType) && paxNum > 4) {
                        hasPaxValidationError = true;
                        validationErrorMessage = "Maximum 4 Pax allowed for Private Tour.";
                      } else if (/premium|vip/i.test(tourType) && paxNum > 6) {
                        hasPaxValidationError = true;
                        validationErrorMessage = "Maximum 6 Pax allowed for Premium/VIP Tour.";
                      }
                    }

                    const tourTypesList = Array.isArray(sight.tourTypesList) && sight.tourTypesList.length > 0
                      ? sight.tourTypesList
                      : [
                          { tourType: "Group Tour", price: sight.basePrice || sight.price || 0 },
                          { tourType: "Private Tour", price: sight.basePrice || sight.price || 0 },
                          { tourType: "Premium/VIP Tour", price: sight.basePrice || sight.price || 0 }
                        ];

                    return (
                      <div key={index} className={`rounded-md border border-slate-800 bg-[#161d27] p-3 space-y-2.5 relative ${activeSightseeingDropdownIdx === index ? "z-30 ring-1 ring-amber-500/40" : "z-10"}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                            Sightseeing #{index + 1}
                            {sight.supplierName && (
                              <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[10px] text-emerald-400 font-normal">
                                DMC: {sight.supplierName}
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSightseeing(index)}
                            className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* First Row: Search Input + Tour Type Selector + Day Dropdown */}
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                          <div className={`sm:col-span-6 relative dmc-autocomplete-container ${activeSightseeingDropdownIdx === index ? "z-40" : "z-10"}`}>
                            <label className="block text-[11px] text-slate-400 mb-0.5">Sightseeing Tour</label>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="e.g. Kempty Falls Tour, Mall Road Sightseeing, Fort Tour..."
                                value={sight.name}
                                onFocus={() => setActiveSightseeingDropdownIdx(index)}
                                onChange={(e) => {
                                  updateSightseeing(index, "name", e.target.value);
                                  setActiveSightseeingDropdownIdx(index);
                                }}
                                className="w-full rounded-md border border-slate-700 bg-[#0f141c] pl-2.5 pr-8 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => setActiveSightseeingDropdownIdx(activeSightseeingDropdownIdx === index ? null : index)}
                                className="absolute right-2 top-2 text-slate-400 hover:text-amber-400 p-0.5 cursor-pointer transition-colors"
                              >
                                <ChevronDown size={14} />
                              </button>
                            </div>

                            {/* Dropdown */}
                            {activeSightseeingDropdownIdx === index && (
                              <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-lg border border-slate-700 bg-[#0d121a] shadow-[0_20px_60px_rgba(0,0,0,0.95)] z-[100] divide-y divide-slate-800/90 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
                                {filteredSight.length === 0 ? (
                                  <div className="p-3 text-[11px] text-slate-400 italic text-center">
                                    No DMC sightseeing tour found. You can freely type custom tour name.
                                  </div>
                                ) : (
                                  filteredSight.map((dmcSight, sIdx) => {
                                    const sightTitle = dmcSight.serviceName || dmcSight.name || dmcSight.title;
                                    const isSelected = Boolean(sight.name && sightTitle.toLowerCase() === sight.name.trim().toLowerCase());

                                    return (
                                      <div
                                        key={dmcSight._id || dmcSight.id || sIdx}
                                        onClick={() => selectDmcSightseeing(index, dmcSight)}
                                        className={`p-2.5 hover:bg-amber-500/15 cursor-pointer transition flex items-center justify-between gap-2 ${
                                          isSelected ? "bg-amber-500/20 border-l-2 border-l-amber-400" : ""
                                        }`}
                                      >
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-semibold text-slate-100 flex items-center gap-1.5 truncate">
                                            <span>{sightTitle}</span>
                                            {isSelected && (
                                              <span className="rounded bg-emerald-500/20 text-emerald-300 text-[9px] px-1 py-0.2 font-bold">
                                                ✓ Selected
                                              </span>
                                            )}
                                          </p>
                                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                            📍 <span className="text-slate-300 font-medium">{dmcSight.city || dmcSight.destination || destination}</span>
                                          </p>
                                          <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                                            DMC: {dmcSight.supplierName || dmcSight.dmcName || "Contracted Supplier"}
                                          </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <span className="text-xs font-bold text-amber-400">
                                            ₹{Number(dmcSight.price || dmcSight.total || 0).toLocaleString("en-IN")}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>

                          {/* Tour Type Selector */}
                          <div className="sm:col-span-4">
                            <label className="block text-[11px] text-slate-400 mb-0.5">Tour Type</label>
                            <select
                              value={sight.tourType || "Group Tour"}
                              onChange={(e) => handleSightseeingTourTypeChange(index, e.target.value)}
                              className="w-full rounded-md border border-slate-700 bg-[#0f141c] px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                            >
                              {tourTypesList.map((t, tIdx) => (
                                <option key={tIdx} value={t.tourType}>
                                  {t.tourType} (₹{Number(t.price !== undefined ? t.price : (sight.basePrice || 0)).toLocaleString("en-IN")})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Day Dropdown */}
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] text-slate-400 mb-0.5">Day</label>
                            <select
                              value={sight.day || 1}
                              onChange={(e) => updateSightseeing(index, "day", Number(e.target.value))}
                              className="w-full rounded-md border border-slate-700 bg-[#0f141c] px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                            >
                              {Array.from({ length: totalDaysCount }, (_, i) => i + 1).map((d) => (
                                <option key={d} value={d}>
                                  Day {d}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Second Row: Configuration Grid: Base Rate | Pricing Basis | Pax | Max Pax | Total Price */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1 border-t border-slate-800/40">
                          {/* 1. Base Rate */}
                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Base Rate</label>
                            <input
                              type="number"
                              min="0"
                              value={sight.basePrice || ""}
                              onChange={(e) => updateSightseeing(index, "basePrice", Number(e.target.value))}
                              className="w-full rounded-md border border-slate-700 bg-[#0f141c] px-2 py-1 text-xs font-semibold text-slate-200 focus:border-amber-500 focus:outline-none"
                            />
                          </div>

                          {/* 2. Pricing Basis (Read-Only) */}
                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Pricing Basis</label>
                            <div className="flex h-7.5 w-full items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[10px] font-bold text-emerald-300 select-none">
                              {sight.pricingBasis || "Per Pax"}
                            </div>
                          </div>

                          {/* 3. Pax */}
                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Pax</label>
                            <input
                              type="number"
                              min="1"
                              value={sight.pax || 1}
                              onChange={(e) => updateSightseeing(index, "pax", Math.max(1, Number(e.target.value) || 1))}
                              className={`w-full rounded-md border bg-[#0f141c] px-2 py-1 text-xs font-semibold text-slate-200 focus:outline-none ${hasPaxValidationError ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-700 focus:border-amber-500"}`}
                            />
                          </div>

                          {/* 4. Max Pax (Read-Only) */}
                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Max Pax</label>
                            <div className="flex h-7.5 w-full items-center justify-center rounded-md border border-purple-500/30 bg-purple-500/10 px-1.5 text-[10px] font-semibold text-purple-300 whitespace-nowrap overflow-hidden text-ellipsis select-none">
                              {sight.maxPax || "N/A (Shared Group)"}
                            </div>
                          </div>

                          {/* 5. Total Price (₹) */}
                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Total Price (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={sight.price || ""}
                              onChange={(e) => updateSightseeing(index, "price", Number(e.target.value))}
                              className="w-full rounded-md border border-slate-700 bg-[#0f141c] px-2 py-1 text-xs font-bold text-amber-400 focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Description */}
                        {sight.description && (
                          <p className="text-[10px] text-slate-400 italic pt-0.5">
                            {sight.description}
                          </p>
                        )}

                        {/* Validation Error Alert */}
                        {hasPaxValidationError && (
                          <div className="flex items-center gap-1.5 rounded-md border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-rose-300">
                            <span>⚠️ {validationErrorMessage}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PRICING & TAXES CONFIGURATION */}
          {activeTab === "pricing" && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div>
                  <p className="text-xs text-slate-200 font-semibold flex items-center gap-1.5">
                    <IndianRupee size={14} className="text-amber-400" />
                    5. Pricing & Taxes Configuration
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Configure base net cost, view linked services subtotal, and apply GST, TCS & Tourism taxes.
                  </p>
                </div>
                <span className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300 shrink-0">
                  Auto-Tax Engine
                </span>
              </div>

              {/* Linked Services Auto-Sum helper banner */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-amber-400" />
                      Linked Services Subtotal: ₹ {totalLinkedServicesCost.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Calculated from {validHotelsCount} Hotel(s), {validTransfersCount} Transport(s), {validActivitiesCount} Activity(s), and {validSightseeingCount} Sightseeing(s) added in previous tabs.
                    </p>
                  </div>
                  {totalLinkedServicesCost > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setBasePrice(String(totalLinkedServicesCost));
                        setPrice(String(totalLinkedServicesCost));
                        toast.success(`Total Services Cost set to ₹ ${totalLinkedServicesCost.toLocaleString("en-IN")}`);
                      }}
                      className="flex items-center gap-1.5 rounded-md bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition cursor-pointer shadow-xs"
                    >
                      <Sparkles size={12} />
                      <span>Select Services Base Cost</span>
                    </button>
                  )}
                </div>

                {/* Selected Services Itemized List with Name & Price */}
                {(selectedHotelsList.length > 0 || selectedTransfersList.length > 0 || selectedActivitiesList.length > 0 || selectedSightseeingList.length > 0) && (
                  <div className="border-t border-amber-500/20 pt-2.5 space-y-2">
                    <p className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider">
                      Selected Services Breakdown ({selectedHotelsList.length + selectedTransfersList.length + selectedActivitiesList.length + selectedSightseeingList.length} Items):
                    </p>
                    <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
                      
                      {/* Hotels List */}
                      {selectedHotelsList.map((h, idx) => {
                        const hNights = Number(h.nights) || 1;
                        // `price` is already recalculated as the complete hotel amount
                        // (nightly room rate × nights × rooms, including selected add-ons).
                        // Do not multiply by nights again here.
                        const hTotal = Number(h.price || 0);
                        const hNightlyRate = Number(h.basePrice || 0);
                        return (
                          <div
                            key={`hotel-item-${idx}`}
                            className="flex items-center justify-between rounded-md border border-slate-800 bg-[#0f141c]/90 px-3 py-2 text-xs transition-colors hover:border-amber-500/30"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <span className="flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 shrink-0">
                                <BedDouble size={11} /> Hotel
                              </span>
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-200 block truncate">
                                  {h.hotelName || h.name || `Hotel ${idx + 1}`}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {h.roomType || "Standard Room"} • {hNights} Night{hNights > 1 ? "s" : ""} {h.mealPlan ? `• ${h.mealPlan}` : ""}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-extrabold text-amber-300">
                                ₹ {hTotal.toLocaleString("en-IN")}
                              </span>
                              {hNights > 1 && hNightlyRate > 0 && (
                                <p className="text-[9px] text-slate-400">
                                  (₹{hNightlyRate.toLocaleString("en-IN")} / night)
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Transports List */}
                      {selectedTransfersList.map((t, idx) => {
                        const tCost = Number(t.price || 0);
                        return (
                          <div
                            key={`transfer-item-${idx}`}
                            className="flex items-center justify-between rounded-md border border-slate-800 bg-[#0f141c]/90 px-3 py-2 text-xs transition-colors hover:border-sky-500/30"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <span className="flex items-center gap-1 rounded bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.5 text-[10px] font-bold text-sky-400 shrink-0">
                                <Car size={11} /> Transport
                              </span>
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-200 block truncate">
                                  {t.name || t.vehicleType || `Transport ${idx + 1}`}
                                </span>
                                {t.vehicleType && t.name && (
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    {t.vehicleType}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="font-extrabold text-sky-300 shrink-0">
                              ₹ {tCost.toLocaleString("en-IN")}
                            </span>
                          </div>
                        );
                      })}

                      {/* Activities List */}
                      {selectedActivitiesList.map((a, idx) => {
                        const aCost = Number(a.price || 0);
                        const aBase = Number(a.basePrice || 0);
                        const aPax = Number(a.pax || 1);
                        const aTourType = a.tourType || "Group Tour";
                        const aBasis = a.pricingBasis || "Per Pax";
                        const isPerGroup = aBasis.toLowerCase().includes("group") && !aBasis.toLowerCase().includes("pax");

                        const details = [
                          a.day ? `Day ${a.day}` : null,
                          aTourType,
                          aBasis,
                          `${aPax} Pax`,
                          a.maxPax && a.maxPax !== "N/A (Shared Group)" ? `Max: ${a.maxPax}` : null,
                          aBase > 0 ? `Base: ₹${aBase.toLocaleString("en-IN")}` : null,
                          a.supplierName ? `DMC: ${a.supplierName}` : null,
                        ].filter(Boolean).join(" • ");

                        return (
                          <div
                            key={`activity-item-${idx}`}
                            className="flex flex-col gap-1 rounded-md border border-slate-800 bg-[#0f141c]/90 px-3 py-2 text-xs transition-colors hover:border-emerald-500/30"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <span className="flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 shrink-0">
                                  <Sparkles size={11} /> Activity
                                </span>
                                <div className="min-w-0">
                                  <span className="font-semibold text-slate-200 block truncate">
                                    {a.name || a.serviceName || `Activity ${idx + 1}`}
                                  </span>
                                  <span className="text-[10.5px] text-slate-400 block truncate">
                                    {details}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-extrabold text-emerald-300">
                                  ₹ {aCost.toLocaleString("en-IN")}
                                </span>
                                {aBase > 0 && !isPerGroup && aPax > 1 && (
                                  <p className="text-[9px] text-slate-400">
                                    (₹{aBase.toLocaleString("en-IN")} × {aPax} Pax)
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Description */}
                            {a.description && (
                              <p className="text-[10px] text-slate-400 italic mt-0.5 truncate">
                                {a.description}
                              </p>
                            )}
                          </div>
                        );
                      })}

                      {/* Sightseeing List */}
                      {selectedSightseeingList.map((s, idx) => {
                        const sCost = Number(s.price || 0);
                        const sBase = Number(s.basePrice || 0);
                        const sPax = Number(s.pax || 1);
                        const sTourType = s.tourType || "Group Tour";
                        const sBasis = s.pricingBasis || "Per Pax";
                        const isPerGroup = sBasis.toLowerCase().includes("group") && !sBasis.toLowerCase().includes("pax");

                        const details = [
                          s.day ? `Day ${s.day}` : null,
                          sTourType,
                          sBasis,
                          `${sPax} Pax`,
                          s.maxPax && s.maxPax !== "N/A (Shared Group)" ? `Max: ${s.maxPax}` : null,
                          sBase > 0 ? `Base: ₹${sBase.toLocaleString("en-IN")}` : null,
                          s.supplierName ? `DMC: ${s.supplierName}` : null,
                        ].filter(Boolean).join(" • ");

                        return (
                          <div
                            key={`sightseeing-item-${idx}`}
                            className="flex flex-col gap-1 rounded-md border border-slate-800 bg-[#0f141c]/90 px-3 py-2 text-xs transition-colors hover:border-purple-500/30"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <span className="flex items-center gap-1 rounded bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 text-[10px] font-bold text-purple-400 shrink-0">
                                  <Landmark size={11} /> Sightseeing
                                </span>
                                <div className="min-w-0">
                                  <span className="font-semibold text-slate-200 block truncate">
                                    {s.name || s.serviceName || `Sightseeing ${idx + 1}`}
                                  </span>
                                  <span className="text-[10.5px] text-slate-400 block truncate">
                                    {details}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-extrabold text-purple-300">
                                  ₹ {sCost.toLocaleString("en-IN")}
                                </span>
                                {sBase > 0 && !isPerGroup && sPax > 1 && (
                                  <p className="text-[9px] text-slate-400">
                                    (₹{sBase.toLocaleString("en-IN")} × {sPax} Pax)
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Description */}
                            {s.description && (
                              <p className="text-[10px] text-slate-400 italic mt-0.5 truncate">
                                {s.description}
                              </p>
                            )}
                          </div>
                        );
                      })}

                    </div>
                  </div>
                )}
              </div>

              {/* PRICING & TAXES CONFIGURATION DESK */}
              <div className="rounded-lg border border-slate-700/80 bg-[#131922] p-4 space-y-4 shadow-sm">
                
                {/* 1. Total Services Cost Input */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Total Services Cost (₹ INR) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 60000"
                      value={basePrice || price}
                      onChange={(e) => {
                        setBasePrice(e.target.value);
                        setPrice(e.target.value);
                      }}
                      className="w-full rounded-md border border-slate-700 bg-[#161d27] pl-7 pr-3 py-2 text-xs font-semibold text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Base net cost of all included services before government and local taxes.
                  </p>
                </div>

                {/* 2. Three Taxes Configuration Row (GST, TCS, Tourism Fee) */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-0.5">
                  
                  {/* A. GST Block */}
                  <div className={`rounded-md border p-3 transition-all ${gstChecked ? "border-amber-500/40 bg-amber-500/5" : "border-slate-800 bg-[#0f141c]/60 opacity-70"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-200">
                        <input
                          type="checkbox"
                          checked={gstChecked}
                          onChange={(e) => setGstChecked(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                        />
                        <span>GST (Tax)</span>
                      </label>
                      <span className={`text-xs font-bold ${gstChecked ? "text-amber-400" : "text-slate-500"}`}>
                        + ₹ {gstAmt.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        disabled={!gstChecked}
                        value={gstPercent}
                        onChange={(e) => setGstPercent(e.target.value)}
                        className="w-16 rounded border border-slate-700 bg-[#0f141c] px-2 py-1 text-center text-xs font-bold text-slate-100 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                      />
                      <span className="text-[11px] font-medium text-slate-400">% Rate</span>
                    </div>
                  </div>

                  {/* B. TCS Block */}
                  <div className={`rounded-md border p-3 transition-all ${tcsChecked ? "border-amber-500/40 bg-amber-500/5" : "border-slate-800 bg-[#0f141c]/60 opacity-70"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-200">
                        <input
                          type="checkbox"
                          checked={tcsChecked}
                          onChange={(e) => setTcsChecked(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                        />
                        <span>TCS</span>
                      </label>
                      <span className={`text-xs font-bold ${tcsChecked ? "text-amber-400" : "text-slate-500"}`}>
                        + ₹ {tcsAmt.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        disabled={!tcsChecked}
                        value={tcsPercent}
                        onChange={(e) => setTcsPercent(e.target.value)}
                        className="w-16 rounded border border-slate-700 bg-[#0f141c] px-2 py-1 text-center text-xs font-bold text-slate-100 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                      />
                      <span className="text-[11px] font-medium text-slate-400">% Rate</span>
                    </div>
                  </div>

                  {/* C. Tourism Fee / Other Tax Block */}
                  <div className={`rounded-md border p-3 transition-all ${tourismChecked ? "border-amber-500/40 bg-amber-500/5" : "border-slate-800 bg-[#0f141c]/60 opacity-70"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-200">
                        <input
                          type="checkbox"
                          checked={tourismChecked}
                          onChange={(e) => setTourismChecked(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                        />
                        <span>Tourism Fee</span>
                      </label>
                      <span className={`text-xs font-bold ${tourismChecked ? "text-amber-400" : "text-slate-500"}`}>
                        + ₹ {tourismAmt.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        disabled={!tourismChecked}
                        placeholder="e.g. 1000"
                        value={tourismAmount}
                        onChange={(e) => setTourismAmount(e.target.value)}
                        className="w-full rounded border border-slate-700 bg-[#0f141c] px-2 py-1 text-xs font-bold text-slate-100 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                </div>

                {/* 3. Live Summary Pill Card */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="rounded-md border border-slate-800 bg-[#0f141c] p-2.5 text-center flex flex-col justify-center">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Services Cost</p>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">₹ {numBaseCost.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-center flex flex-col justify-center">
                    <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wide">
                      Total Taxes (GST + TCS + Tourism)
                    </p>
                    <p className="text-sm font-bold text-amber-400 mt-0.5">+ ₹ {totalTaxAmt.toLocaleString("en-IN")}</p>
                    <div className="mt-0.5 flex items-center justify-center gap-1 flex-wrap">
                      {gstChecked && gstAmt > 0 && (
                        <span className="text-[9px] font-semibold text-amber-300 bg-amber-500/20 rounded px-1 py-0.5">
                          GST: +₹{gstAmt.toLocaleString("en-IN")}
                        </span>
                      )}
                      {tcsChecked && tcsAmt > 0 && (
                        <span className="text-[9px] font-semibold text-amber-300 bg-amber-500/20 rounded px-1 py-0.5">
                          TCS: +₹{tcsAmt.toLocaleString("en-IN")}
                        </span>
                      )}
                      {tourismChecked && tourismAmt > 0 && (
                        <span className="text-[9px] font-semibold text-amber-300 bg-amber-500/20 rounded px-1 py-0.5">
                          Tourism: +₹{tourismAmt.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-center flex flex-col justify-center">
                    <p className="text-[10px] uppercase font-bold text-emerald-400/80 tracking-wide">Final Price</p>
                    <p className="text-sm font-extrabold text-emerald-400 mt-0.5">₹ {finalCalculatedPrice.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>

              {/* FINAL TOTAL PACKAGE SELLING PRICE INPUT */}
              <div className="rounded-lg border border-slate-800 bg-[#161d27] p-4 space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  Final Package Price (₹ INR) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-base font-bold text-amber-400">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 68000"
                    value={finalCalculatedPrice > 0 ? finalCalculatedPrice : price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      if (!basePrice) setBasePrice(e.target.value);
                    }}
                    className="w-full rounded-md border border-amber-500/50 bg-[#0f141c] pl-8 pr-3 py-2.5 text-base font-extrabold text-amber-400 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Standard package selling price (inclusive of taxes) applied when loaded in quotation builder and displayed to agents.
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: INCLUSIONS & NOTES */}
          {activeTab === "inclusions" && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div>
                  <p className="text-xs text-slate-200 font-semibold flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-400" />
                    6. Inclusions, Exclusions & Notes
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Terms, inclusions and exclusions shown to client in quotation.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Package Inclusions
                  </label>
                  <textarea
                    rows="3"
                    placeholder="e.g. Daily breakfast, Hotel stay, Private airport transfers, Sightseeing as per itinerary"
                    value={inclusions}
                    onChange={(e) => setInclusions(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-[#161d27] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Package Exclusions
                  </label>
                  <textarea
                    rows="3"
                    placeholder="e.g. Flight tickets, Personal expenses, Alcoholic drinks, Entry monument tickets"
                    value={exclusions}
                    onChange={(e) => setExclusions(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-[#161d27] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DAY-WISE ITINERARY (PLACED AT THE END) */}
          {activeTab === "itinerary" && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div>
                  <p className="text-xs text-slate-200 font-semibold flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-amber-400" />
                    7. Day-by-Day Tour Itinerary Schedule
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Define day-wise route, highlights & activities that will auto-fill in WhatsApp/PDF quotation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addItineraryDay}
                  className="flex items-center gap-1.5 rounded-md bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer"
                >
                  <Plus size={13} /> Add Day
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {itinerary.map((item, index) => (
                  <div key={index} className="rounded-md border border-slate-800 bg-[#161d27] p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-bold text-amber-400 shrink-0">
                          Day {item.day || index + 1}
                        </span>
                        <input
                          type="text"
                          placeholder={`e.g. Day ${index + 1}: Sightseeing Tour & Excursion`}
                          value={item.title}
                          onChange={(e) => updateItinerary(index, "title", e.target.value)}
                          className="w-full rounded-md border border-slate-700 bg-[#0f141c] px-2.5 py-1.5 text-xs font-semibold text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      {itinerary.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItineraryDay(index)}
                          className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Itinerary Description / Activities</label>
                      <textarea
                        rows="2"
                        placeholder="Detail pickup times, monuments visited, meals included, and evening plans..."
                        value={item.description}
                        onChange={(e) => updateItinerary(index, "description", e.target.value)}
                        className="w-full rounded-md border border-slate-700 bg-[#0f141c] px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-700 bg-[#161c26] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-md bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Saving Template..." : "Save Pre-defined Package"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
