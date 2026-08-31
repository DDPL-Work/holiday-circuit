import React, { useState, useEffect, useMemo } from "react";
import { X, Package, AlertTriangle } from "lucide-react";
import API from "../utils/Api.js";
import toast from "react-hot-toast";

import {
  initialHotel,
  initialTransfer,
  initialActivity,
  initialSightseeing,
  initialItineraryDay,
  recalculateHotelPrice,
  normalizeBedType,
  normalizeExtraBedType,
  getOccupancyDefaultsForRoomCategory,
  isTripleAllowedCategory,
  getTransportVehicleUsagePrices,
  resolveSlotOptions,
  detectScheduleConflicts,
  getDayLoadSummary,
  checkSlotAvailability,
} from "./createPackage/utils/packageUtils.js";

import { useDmcServices } from "./createPackage/hooks/useDmcServices.js";
import { BasicDetailsTab } from "./createPackage/tabs/BasicDetailsTab.jsx";
import { HotelsTab } from "./createPackage/tabs/HotelsTab.jsx";
import { TransportsTab } from "./createPackage/tabs/TransportsTab.jsx";
import { ActivitiesTab } from "./createPackage/tabs/ActivitiesTab.jsx";
import { PricingTaxesTab } from "./createPackage/tabs/PricingTaxesTab.jsx";
import { InclusionsNotesTab } from "./createPackage/tabs/InclusionsNotesTab.jsx";
import { DayItineraryTab } from "./createPackage/tabs/DayItineraryTab.jsx";

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

  // Day-wise Itinerary
  const [itinerary, setItinerary] = useState([
    { day: 1, title: "Day 1: Arrival & Leisure", description: "Pickup from airport/station, transfer to hotel. Check-in and relax for the evening." },
    { day: 2, title: "Day 2: Sightseeing Tour & Departure", description: "Explore major landmarks, scenic spots, and transfer with wonderful memories." },
  ]);

  // DMC Services Hook
  const {
    allDmcServices,
    servicesLoading,
    getFilteredHotels,
    getFilteredTransfers,
    getFilteredActivities,
    getFilteredSightseeing,
  } = useDmcServices(isOpen, destination);

  // Active Dropdown States for autocomplete
  const [activeHotelDropdownIdx, setActiveHotelDropdownIdx] = useState(null);
  const [activeTransferDropdownIdx, setActiveTransferDropdownIdx] = useState(null);
  const [activeActivityDropdownIdx, setActiveActivityDropdownIdx] = useState(null);
  const [activeSightseeingDropdownIdx, setActiveSightseeingDropdownIdx] = useState(null);

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

  // Add & Update Handlers for Hotels
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

  const handleRoomCategoryChange = (hotelIdx, roomTypeName) => {
    const updated = [...hotels];
    const hotelItem = updated[hotelIdx];
    const hotelsList = hotelItem.hotelsList || [];
    const selectedHotel = hotelsList[hotelItem.selectedHotelIdx || 0] || {};
    const roomsList = Array.isArray(selectedHotel.rooms) ? selectedHotel.rooms : [];
    const foundRoom = roomsList.find((r) => r.roomType === roomTypeName);

    hotelItem.roomType = roomTypeName;

    if (!isTripleAllowedCategory(roomTypeName) && String(hotelItem.roomCategory || "").toLowerCase() === "triple") {
      hotelItem.roomCategory = "Double";
      hotelItem.maxAdults = 2;
      toast.info(`Triple occupancy is only allowed for Family Room, Luxury Room, or Suite. Reset to Double (2 persons) for ${roomTypeName}.`);
    }

    if (foundRoom) {
      if (isTripleAllowedCategory(roomTypeName) || String(foundRoom.roomCategory || "").toLowerCase() !== "triple") {
        hotelItem.roomCategory = foundRoom.roomCategory || hotelItem.roomCategory;
      }
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

  const handleRoomOccupancyChange = (hotelIdx, occupancyCategory) => {
    const updated = [...hotels];
    const hotelItem = updated[hotelIdx];

    if (String(occupancyCategory).toLowerCase() === "triple" && !isTripleAllowedCategory(hotelItem.roomType)) {
      toast.warning("Triple Occupancy (3 persons) requires Family Room, Luxury Room, or Suite. Switched category to Family Room.");
      hotelItem.roomType = "Family Room";
      hotelItem.roomCategory = "Triple";
    } else {
      hotelItem.roomCategory = occupancyCategory;
    }

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
    toast.success(`Service linked: ${serviceTitle}`);
  };

  const totalDaysCount = Math.max(
    1,
    Number(days) || (duration ? Number(duration.match(/\d+/g)?.[1] || duration.match(/\d+/g)?.[0]) : 1) || 1
  );

  // Add & Update Handlers for Transfers
  const addTransfer = () => {
    const newIdx = transfers.length;
    const assignedDay = newIdx === 0 ? 1 : newIdx === 1 ? totalDaysCount : Math.min(newIdx + 1, totalDaysCount);
    setTransfers([...transfers, { ...initialTransfer(), day: assignedDay }]);
  };
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
    toast.success(`Transport linked: ${routeTitle}`);
  };

  // Add & Update Handlers for Activities
  const addActivity = () => setActivities([...activities, initialActivity()]);
  const removeActivity = (index) => setActivities(activities.filter((_, i) => i !== index));

  const handleActivityTourTypeChange = (index, selectedTourType) => {
    const updated = [...activities];
    const item = updated[index];
    const tList = item.tourTypesList || [];
    const matched = tList.find((t) => String(t.tourType || "").trim().toLowerCase() === String(selectedTourType || "").trim().toLowerCase()) || {};

    const adultRate = Number(matched.adultPrice !== undefined ? matched.adultPrice : (matched.price !== undefined ? matched.price : (item.adultPrice || 0)));
    const childRate = Number(matched.childPrice !== undefined ? matched.childPrice : (matched.childRate !== undefined ? matched.childRate : (item.childPrice || 0)));
    const adultsNum = Math.max(1, Number(item.adults !== undefined ? item.adults : (item.pax || 2)));
    const childrenNum = Math.max(0, Number(item.children || 0));

    item.tourType = selectedTourType;
    if (selectedTourType) {
      item.adultPrice = adultRate;
      item.childPrice = childRate;
      item.basePrice = adultRate;
      if (matched.description) item.description = matched.description;
      item.price = (adultRate * adultsNum) + (childRate * childrenNum);
    }

    setActivities(updated);
  };

  const updateActivity = (index, field, value) => {
    const updated = [...activities];
    updated[index][field] = value;

    if (field === "name" || field === "serviceName") {
      const valNorm = String(value || "").trim().toLowerCase();
      if (valNorm) {
        const isDupAct = activities.some((a, i) => i !== index && String(a.name || a.serviceName || "").trim().toLowerCase() === valNorm);
        const isDupSight = sightseeing.some((s) => String(s.name || s.serviceName || "").trim().toLowerCase() === valNorm);
        if (isDupAct || isDupSight) {
          toast.error(`Already selected: "${value}"`);
          updated[index] = {
            ...initialActivity(),
            day: updated[index].day || 1,
          };
          setActivities(updated);
          return;
        }
      }
      updated[index].name = value;
      updated[index].serviceName = value;
    }

    if (field === "adults" || field === "children" || field === "adultPrice" || field === "childPrice") {
      const aCount = Math.max(1, Number(field === "adults" ? value : (updated[index].adults !== undefined ? updated[index].adults : 1)));
      const cCount = Math.max(0, Number(field === "children" ? value : (updated[index].children !== undefined ? updated[index].children : 0)));
      const aRate = Number(field === "adultPrice" ? value : (updated[index].adultPrice !== undefined ? updated[index].adultPrice : 0));
      const cRate = Number(field === "childPrice" ? value : (updated[index].childPrice !== undefined ? updated[index].childPrice : 0));
      
      updated[index].adults = aCount;
      updated[index].children = cCount;
      updated[index].pax = aCount + cCount;
      updated[index].adultPrice = aRate;
      updated[index].childPrice = cRate;
      updated[index].basePrice = aRate;
      updated[index].price = (aRate * aCount) + (cRate * cCount);
    }

    if (field === "selectedSlot") {
      updated[index].selectedSlot = value;
      updated[index].time = value;
    }

    if (field === "price") {
      updated[index].price = Number(value || 0);
    }

    setActivities(updated);
  };

  const selectDmcActivity = (index, dmcAct) => {
    const actTitle = dmcAct.serviceName || dmcAct.name || dmcAct.title || "";
    const titleNorm = String(actTitle || "").trim().toLowerCase();

    const isDuplicateActivity = activities.some(
      (a, i) => i !== index && String(a.name || a.serviceName || "").trim().toLowerCase() === titleNorm
    );
    const isDuplicateSightseeing = sightseeing.some(
      (s) => String(s.name || s.serviceName || "").trim().toLowerCase() === titleNorm
    );

    if (isDuplicateActivity || isDuplicateSightseeing) {
      const updated = [...activities];
      updated[index] = {
        ...initialActivity(),
        day: updated[index].day || 1,
      };
      setActivities(updated);
      setActiveActivityDropdownIdx(null);
      return toast.error(`Already selected: "${actTitle}"`);
    }

    const updated = [...activities];
    const tourTypesList = Array.isArray(dmcAct.tourTypes) && dmcAct.tourTypes.length > 0
      ? dmcAct.tourTypes.map((t) => ({
          ...t,
          adultPrice: Number(t.adultPrice !== undefined ? t.adultPrice : (t.price || dmcAct.adultPrice || dmcAct.price || 0)),
          childPrice: Number(t.childPrice !== undefined ? t.childPrice : (t.childRate || dmcAct.childPrice || dmcAct.childRate || 0)),
        }))
      : [
          {
            tourType: dmcAct.tourType || "Sharing Tour",
            adultPrice: Number(dmcAct.adultPrice !== undefined ? dmcAct.adultPrice : (dmcAct.price || dmcAct.rate || 0)),
            childPrice: Number(dmcAct.childPrice !== undefined ? dmcAct.childPrice : (dmcAct.childRate || dmcAct.cwebRate || 0)),
            description: dmcAct.description || "",
          },
          {
            tourType: "Private Tour",
            adultPrice: Number(dmcAct.adultPrice !== undefined ? dmcAct.adultPrice : (dmcAct.price || dmcAct.rate || 0)),
            childPrice: Number(dmcAct.childPrice !== undefined ? dmcAct.childPrice : (dmcAct.childRate || dmcAct.cwebRate || 0)),
            description: dmcAct.description || "",
          },
          {
            tourType: "Ticket Tour",
            adultPrice: Number(dmcAct.adultPrice !== undefined ? dmcAct.adultPrice : (dmcAct.price || dmcAct.rate || 0)),
            childPrice: Number(dmcAct.childPrice !== undefined ? dmcAct.childPrice : (dmcAct.childRate || dmcAct.cwebRate || 0)),
            description: dmcAct.description || "",
          },
        ];

    const defaultTour = tourTypesList[0] || {};
    const defaultTourType = defaultTour.tourType || dmcAct.tourType || "Sharing Tour";
    const adultRate = Number(
      defaultTour.adultPrice !== undefined
        ? defaultTour.adultPrice
        : dmcAct.adultPrice !== undefined
        ? dmcAct.adultPrice
        : defaultTour.price || dmcAct.price || dmcAct.rate || 0
    );
    const childRate = Number(
      defaultTour.childPrice !== undefined
        ? defaultTour.childPrice
        : dmcAct.childPrice !== undefined
        ? dmcAct.childPrice
        : dmcAct.childRate !== undefined
        ? dmcAct.childRate
        : dmcAct.cwebRate !== undefined
        ? dmcAct.cwebRate
        : 0
    );
    
    const adultsNum = Math.max(1, Number(updated[index].adults || 2));
    const childrenNum = Math.max(0, Number(updated[index].children || 0));
    const calculatedTotal = (adultRate * adultsNum) + (childRate * childrenNum);

    const availableSlots = resolveSlotOptions(dmcAct);
    const selectedSlot = updated[index].selectedSlot || availableSlots[0] || "08:00";

    updated[index] = {
      ...updated[index],
      serviceName: actTitle,
      name: actTitle,
      tourTypesList: tourTypesList,
      selectedTourIdx: 0,
      tourType: defaultTourType,
      adultPrice: adultRate,
      childPrice: childRate,
      basePrice: adultRate,
      adults: adultsNum,
      children: childrenNum,
      pax: adultsNum + childrenNum,
      selectedSlot: selectedSlot,
      time: selectedSlot,
      operatingDays: dmcAct.operatingDays || dmcAct.days || "Mon-Sun",
      openingTime: dmcAct.openingTime || "08:00",
      closingTime: dmcAct.closingTime || "18:00",
      duration: dmcAct.duration || "120 Mins",
      slots: dmcAct.slots || "",
      price: calculatedTotal,
      supplier: dmcAct.supplier || dmcAct.supplierId || dmcAct.dmcId || dmcAct._id || "",
      supplierName: dmcAct.supplierName || dmcAct.dmcName || "",
      description: defaultTour.description || dmcAct.description || updated[index].description || "",
    };
    setActivities(updated);
    setActiveActivityDropdownIdx(null);
    toast.success(`Activity linked: ${actTitle}`);
  };

  // Add & Update Handlers for Sightseeing
  const addSightseeing = () => setSightseeing([...sightseeing, initialSightseeing()]);
  const removeSightseeing = (index) => setSightseeing(sightseeing.filter((_, i) => i !== index));

  const handleSightseeingTourTypeChange = (index, selectedTourType) => {
    const updated = [...sightseeing];
    const item = updated[index];
    const tList = item.tourTypesList || [];
    const matched = tList.find((t) => String(t.tourType || "").trim().toLowerCase() === String(selectedTourType || "").trim().toLowerCase()) || {};

    const adultRate = Number(matched.adultPrice !== undefined ? matched.adultPrice : (matched.price !== undefined ? matched.price : (item.adultPrice || 0)));
    const childRate = Number(matched.childPrice !== undefined ? matched.childPrice : (matched.childRate !== undefined ? matched.childRate : (item.childPrice || 0)));
    const adultsNum = Math.max(1, Number(item.adults !== undefined ? item.adults : (item.pax || 2)));
    const childrenNum = Math.max(0, Number(item.children || 0));

    item.tourType = selectedTourType;
    if (selectedTourType) {
      item.adultPrice = adultRate;
      item.childPrice = childRate;
      item.basePrice = adultRate;
      if (matched.description) item.description = matched.description;
      item.price = (adultRate * adultsNum) + (childRate * childrenNum);
    }

    setSightseeing(updated);
  };

  const updateSightseeing = (index, field, value) => {
    const updated = [...sightseeing];
    updated[index][field] = value;

    if (field === "name" || field === "serviceName") {
      const valNorm = String(value || "").trim().toLowerCase();
      if (valNorm) {
        const isDupSight = sightseeing.some((s, i) => i !== index && String(s.name || s.serviceName || "").trim().toLowerCase() === valNorm);
        const isDupAct = activities.some((a) => String(a.name || a.serviceName || "").trim().toLowerCase() === valNorm);
        if (isDupSight || isDupAct) {
          toast.error(`Already selected: "${value}"`);
          updated[index] = {
            ...initialSightseeing(),
            day: updated[index].day || 1,
          };
          setSightseeing(updated);
          return;
        }
      }
      updated[index].name = value;
      updated[index].serviceName = value;
    }

    if (field === "adults" || field === "children" || field === "adultPrice" || field === "childPrice") {
      const aCount = Math.max(1, Number(field === "adults" ? value : (updated[index].adults !== undefined ? updated[index].adults : 1)));
      const cCount = Math.max(0, Number(field === "children" ? value : (updated[index].children !== undefined ? updated[index].children : 0)));
      const aRate = Number(field === "adultPrice" ? value : (updated[index].adultPrice !== undefined ? updated[index].adultPrice : 0));
      const cRate = Number(field === "childPrice" ? value : (updated[index].childPrice !== undefined ? updated[index].childPrice : 0));
      
      updated[index].adults = aCount;
      updated[index].children = cCount;
      updated[index].pax = aCount + cCount;
      updated[index].adultPrice = aRate;
      updated[index].childPrice = cRate;
      updated[index].basePrice = aRate;
      updated[index].price = (aRate * aCount) + (cRate * cCount);
    }

    if (field === "selectedSlot") {
      updated[index].selectedSlot = value;
      updated[index].time = value;
    }

    if (field === "price") {
      updated[index].price = Number(value || 0);
    }

    setSightseeing(updated);
  };

  const selectDmcSightseeing = (index, dmcSight) => {
    const sightTitle = dmcSight.serviceName || dmcSight.name || dmcSight.title || "";
    const titleNorm = String(sightTitle || "").trim().toLowerCase();

    const isDuplicateSightseeing = sightseeing.some(
      (s, i) => i !== index && String(s.name || s.serviceName || "").trim().toLowerCase() === titleNorm
    );
    const isDuplicateActivity = activities.some(
      (a) => String(a.name || a.serviceName || "").trim().toLowerCase() === titleNorm
    );

    if (isDuplicateSightseeing || isDuplicateActivity) {
      const updated = [...sightseeing];
      updated[index] = {
        ...initialSightseeing(),
        day: updated[index].day || 1,
      };
      setSightseeing(updated);
      setActiveSightseeingDropdownIdx(null);
      return toast.error(`Already selected: "${sightTitle}"`);
    }

    const updated = [...sightseeing];
    const tourTypesList = Array.isArray(dmcSight.tourTypes) && dmcSight.tourTypes.length > 0
      ? dmcSight.tourTypes.map((t) => ({
          ...t,
          adultPrice: Number(t.adultPrice !== undefined ? t.adultPrice : (t.price || dmcSight.adultPrice || dmcSight.price || 0)),
          childPrice: Number(t.childPrice !== undefined ? t.childPrice : (t.childRate || dmcSight.childPrice || dmcSight.childRate || 0)),
        }))
      : [
          {
            tourType: dmcSight.tourType || "Sharing Tour",
            adultPrice: Number(dmcSight.adultPrice !== undefined ? dmcSight.adultPrice : (dmcSight.price || dmcSight.rate || 0)),
            childPrice: Number(dmcSight.childPrice !== undefined ? dmcSight.childPrice : (dmcSight.childRate || dmcSight.cwebRate || 0)),
            description: dmcSight.description || "",
          },
          {
            tourType: "Private Tour",
            adultPrice: Number(dmcSight.adultPrice !== undefined ? dmcSight.adultPrice : (dmcSight.price || dmcSight.rate || 0)),
            childPrice: Number(dmcSight.childPrice !== undefined ? dmcSight.childPrice : (dmcSight.childRate || dmcSight.cwebRate || 0)),
            description: dmcSight.description || "",
          },
          {
            tourType: "Ticket Tour",
            adultPrice: Number(dmcSight.adultPrice !== undefined ? dmcSight.adultPrice : (dmcSight.price || dmcSight.rate || 0)),
            childPrice: Number(dmcSight.childPrice !== undefined ? dmcSight.childPrice : (dmcSight.childRate || dmcSight.cwebRate || 0)),
            description: dmcSight.description || "",
          },
        ];

    const defaultTour = tourTypesList[0] || {};
    const defaultTourType = defaultTour.tourType || dmcSight.tourType || "Sharing Tour";
    const adultRate = Number(
      defaultTour.adultPrice !== undefined
        ? defaultTour.adultPrice
        : dmcSight.adultPrice !== undefined
        ? dmcSight.adultPrice
        : defaultTour.price || dmcSight.price || dmcSight.rate || 0
    );
    const childRate = Number(
      defaultTour.childPrice !== undefined
        ? defaultTour.childPrice
        : dmcSight.childPrice !== undefined
        ? dmcSight.childPrice
        : dmcSight.childRate !== undefined
        ? dmcSight.childRate
        : dmcSight.cwebRate !== undefined
        ? dmcSight.cwebRate
        : 0
    );
    
    const adultsNum = Math.max(1, Number(updated[index].adults || 2));
    const childrenNum = Math.max(0, Number(updated[index].children || 0));
    const calculatedTotal = (adultRate * adultsNum) + (childRate * childrenNum);

    const availableSlots = resolveSlotOptions(dmcSight);
    const selectedSlot = updated[index].selectedSlot || availableSlots[0] || "08:00";

    updated[index] = {
      ...updated[index],
      serviceName: sightTitle,
      name: sightTitle,
      tourTypesList: tourTypesList,
      selectedTourIdx: 0,
      tourType: defaultTourType,
      adultPrice: adultRate,
      childPrice: childRate,
      basePrice: adultRate,
      adults: adultsNum,
      children: childrenNum,
      pax: adultsNum + childrenNum,
      selectedSlot: selectedSlot,
      time: selectedSlot,
      operatingDays: dmcSight.operatingDays || dmcSight.days || "Mon-Sun",
      openingTime: dmcSight.openingTime || "08:00",
      closingTime: dmcSight.closingTime || "18:00",
      duration: dmcSight.duration || "60 Mins",
      slots: dmcSight.slots || "",
      price: calculatedTotal,
      supplier: dmcSight.supplier || dmcSight.supplierId || dmcSight.dmcId || dmcSight._id || "",
      supplierName: dmcSight.supplierName || dmcSight.dmcName || "",
      description: defaultTour.description || dmcSight.description || updated[index].description || "",
    };
    setSightseeing(updated);
    setActiveSightseeingDropdownIdx(null);
    toast.success(`Sightseeing linked: ${sightTitle}`);
  };

  // Add & Update Handlers for Itinerary
  const addItineraryDay = () => setItinerary([...itinerary, initialItineraryDay(itinerary.length + 1)]);
  const removeItineraryDay = (index) => setItinerary(itinerary.filter((_, i) => i !== index));
  const updateItinerary = (index, field, value) => {
    const updated = [...itinerary];
    updated[index][field] = value;
    setItinerary(updated);
  };

  // Cost & Tax Calculations
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

    const chosenTitles = new Set();
    for (const act of activities) {
      const name = String(act.name || "").trim().toLowerCase();
      if (name) {
        if (chosenTitles.has(name)) {
          return toast.error(`Already selected: "${act.name}"`);
        }
        chosenTitles.add(name);
      }
    }
    for (const sight of sightseeing) {
      const name = String(sight.name || "").trim().toLowerCase();
      if (name) {
        if (chosenTitles.has(name)) {
          return toast.error(`Already selected: "${sight.name}"`);
        }
        chosenTitles.add(name);
      }
    }

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
        activities: activities
          .filter((a) => a.name?.trim())
          .map((a) => {
            const dNum = Number(a.day) || 1;
            const dHrs = dayLoadSummary[dNum]?.label || "";
            const dLabel = `Day ${dNum}${dHrs ? ` (${dHrs})` : ""}`;
            return {
              ...a,
              day: dNum,
              dayHours: dHrs,
              dayLabel: dLabel,
              adults: Number(a.adults !== undefined ? a.adults : (a.pax || 2)),
              children: Number(a.children !== undefined ? a.children : 0),
              adultPrice: Number(a.adultPrice !== undefined ? a.adultPrice : (a.basePrice || a.price || 0)),
              childPrice: Number(a.childPrice !== undefined ? a.childPrice : 0),
              pax: Number(a.pax || ((a.adults !== undefined ? Number(a.adults) : 2) + (a.children !== undefined ? Number(a.children) : 0))),
              duration: String(a.duration || ""),
              operatingDays: String(a.operatingDays || a.days || ""),
              openingTime: String(a.openingTime || ""),
              closingTime: String(a.closingTime || ""),
              selectedSlot: String(a.selectedSlot || a.time || ""),
              time: String(a.time || a.selectedSlot || ""),
            };
          }),
        sightseeing: sightseeing
          .filter((s) => s.name?.trim())
          .map((s) => {
            const dNum = Number(s.day) || 1;
            const dHrs = dayLoadSummary[dNum]?.label || "";
            const dLabel = `Day ${dNum}${dHrs ? ` (${dHrs})` : ""}`;
            return {
              ...s,
              day: dNum,
              dayHours: dHrs,
              dayLabel: dLabel,
              adults: Number(s.adults !== undefined ? s.adults : (s.pax || 2)),
              children: Number(s.children !== undefined ? s.children : 0),
              adultPrice: Number(s.adultPrice !== undefined ? s.adultPrice : (s.basePrice || s.price || 0)),
              childPrice: Number(s.childPrice !== undefined ? s.childPrice : 0),
              pax: Number(s.pax || ((s.adults !== undefined ? Number(s.adults) : 2) + (s.children !== undefined ? Number(s.children) : 0))),
              duration: String(s.duration || ""),
              operatingDays: String(s.operatingDays || s.days || ""),
              openingTime: String(s.openingTime || ""),
              closingTime: String(s.closingTime || ""),
              selectedSlot: String(s.selectedSlot || s.time || ""),
              time: String(s.time || s.selectedSlot || ""),
            };
          }),
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

  // Schedule Conflicts & Timeline Intelligence Detection
  const { conflicts: scheduleConflicts, scheduledItems: allScheduledItems } = useMemo(() => {
    return detectScheduleConflicts(transfers, activities, sightseeing, totalDaysCount);
  }, [transfers, activities, sightseeing, totalDaysCount]);

  const dayLoadSummary = useMemo(() => {
    return getDayLoadSummary(allScheduledItems, totalDaysCount);
  }, [allScheduledItems, totalDaysCount]);

  const conflictingDays = useMemo(() => {
    const daysSet = new Set(scheduleConflicts.map((c) => c.day));
    return Array.from(daysSet).sort((a, b) => a - b);
  }, [scheduleConflicts]);

  const transferConflicts = useMemo(() => {
    return scheduleConflicts.filter((c) => c.itemA.type === "transfer" || c.itemB.type === "transfer");
  }, [scheduleConflicts]);

  const activityOrSightConflicts = useMemo(() => {
    return scheduleConflicts.filter((c) => c.itemA.type !== "transfer" || c.itemB.type !== "transfer");
  }, [scheduleConflicts]);

  const getServiceConflicts = (type, index) => {
    return scheduleConflicts.filter(
      (c) => (c.itemA.type === type && c.itemA.index === index) || (c.itemB.type === type && c.itemB.index === index)
    );
  };

  const handleShiftItemDay = (item, newDay) => {
    if (!item) return;
    const targetDay = Number(newDay);
    if (item.type === "activity") {
      updateActivity(item.index, "day", targetDay);
      toast.success(`Moved "${item.name}" to Day ${targetDay}`);
    } else if (item.type === "sightseeing") {
      updateSightseeing(item.index, "day", targetDay);
      toast.success(`Moved "${item.name}" to Day ${targetDay}`);
    } else if (item.type === "transfer") {
      updateTransfer(item.index, "day", targetDay);
      toast.success(`Moved "${item.name}" to Day ${targetDay}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-5 animate-fadeIn">
      <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col rounded-xl border border-gray-200 bg-white text-slate-800 shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-[#3E63DD] shrink-0">
              <Package size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Create Pre-defined Package Template
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure reusable packages with live uploaded hotels, cabs, sightseeing & itinerary
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50/80 px-4 sm:px-6 pt-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
          {[
            { id: "basic", label: "1. Basic Details", count: null, hasWarning: false },
            { id: "hotels", label: "2. Hotels", count: hotels.length, hasWarning: false },
            { id: "transfers", label: "3. Transports", count: transfers.length, hasWarning: transferConflicts.length > 0 },
            { id: "activities", label: "4. Activities & Tours", count: activities.length + sightseeing.length, hasWarning: activityOrSightConflicts.length > 0 },
            { id: "pricing", label: "5. Pricing & Taxes", count: null, hasWarning: false },
            { id: "inclusions", label: "6. Inclusions & Notes", count: null, hasWarning: false },
            { id: "itinerary", label: "7. Day-wise Itinerary", count: itinerary.length > 0 ? `${itinerary.length} Days` : null, hasWarning: false },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative -mb-px rounded-t-lg px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer inline-flex items-center gap-1.5 leading-normal ${
                activeTab === tab.id
                  ? "bg-white text-[#3E63DD] border-t-2 border-t-[#3E63DD] border-x border-x-gray-200 border-b border-b-white shadow-2xs font-bold z-10"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 border-t-2 border-t-transparent border-x border-x-transparent border-b border-b-transparent font-medium"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && tab.count !== undefined && (
                <span className={`text-[11px] ${activeTab === tab.id ? "text-[#3E63DD] font-bold" : "text-gray-500 font-medium"}`}>
                  ({tab.count})
                </span>
              )}
              {tab.hasWarning && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 leading-none shrink-0 shadow-2xs">
                  <AlertTriangle size={10} className="text-amber-600 shrink-0" />
                  <span>Overlap</span>
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5 bg-white [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {activeTab === "basic" && (
            <BasicDetailsTab
              title={title}
              setTitle={setTitle}
              destination={destination}
              setDestination={setDestination}
              country={country}
              setCountry={setCountry}
              duration={duration}
              setDuration={setDuration}
              days={days}
              setDays={setDays}
              description={description}
              setDescription={setDescription}
            />
          )}

          {activeTab === "hotels" && (
            <HotelsTab
              hotels={hotels}
              addHotel={addHotel}
              removeHotel={removeHotel}
              updateHotel={updateHotel}
              handleHotelPropertyChange={handleHotelPropertyChange}
              handleRoomCategoryChange={handleRoomCategoryChange}
              handleRoomOccupancyChange={handleRoomOccupancyChange}
              selectDmcHotel={selectDmcHotel}
              getFilteredHotels={getFilteredHotels}
              destination={destination}
              servicesLoading={servicesLoading}
              activeHotelDropdownIdx={activeHotelDropdownIdx}
              setActiveHotelDropdownIdx={setActiveHotelDropdownIdx}
              isTripleAllowedCategory={isTripleAllowedCategory}
            />
          )}

          {activeTab === "transfers" && (
            <TransportsTab
              transfers={transfers}
              addTransfer={addTransfer}
              removeTransfer={removeTransfer}
              updateTransfer={updateTransfer}
              handleVehicleTypeChange={handleVehicleTypeChange}
              handleUsageChange={handleUsageChange}
              selectDmcTransfer={selectDmcTransfer}
              getFilteredTransfers={getFilteredTransfers}
              destination={destination}
              servicesLoading={servicesLoading}
              activeTransferDropdownIdx={activeTransferDropdownIdx}
              setActiveTransferDropdownIdx={setActiveTransferDropdownIdx}
              transferConflicts={transferConflicts}
              conflictingDays={conflictingDays}
              allScheduledItems={allScheduledItems}
              scheduleConflicts={scheduleConflicts}
              handleShiftItemDay={handleShiftItemDay}
              totalDaysCount={totalDaysCount}
              getServiceConflicts={getServiceConflicts}
            />
          )}

          {activeTab === "activities" && (
            <ActivitiesTab
              activities={activities}
              addActivity={addActivity}
              removeActivity={removeActivity}
              updateActivity={updateActivity}
              handleActivityTourTypeChange={handleActivityTourTypeChange}
              selectDmcActivity={selectDmcActivity}
              getFilteredActivities={getFilteredActivities}
              sightseeing={sightseeing}
              addSightseeing={addSightseeing}
              removeSightseeing={removeSightseeing}
              updateSightseeing={updateSightseeing}
              handleSightseeingTourTypeChange={handleSightseeingTourTypeChange}
              selectDmcSightseeing={selectDmcSightseeing}
              getFilteredSightseeing={getFilteredSightseeing}
              destination={destination}
              servicesLoading={servicesLoading}
              activeActivityDropdownIdx={activeActivityDropdownIdx}
              setActiveActivityDropdownIdx={setActiveActivityDropdownIdx}
              activeSightseeingDropdownIdx={activeSightseeingDropdownIdx}
              setActiveSightseeingDropdownIdx={setActiveSightseeingDropdownIdx}
              activityOrSightConflicts={activityOrSightConflicts}
              conflictingDays={conflictingDays}
              allScheduledItems={allScheduledItems}
              scheduleConflicts={scheduleConflicts}
              handleShiftItemDay={handleShiftItemDay}
              totalDaysCount={totalDaysCount}
              getServiceConflicts={getServiceConflicts}
              dayLoadSummary={dayLoadSummary}
              checkSlotAvailability={checkSlotAvailability}
            />
          )}

          {activeTab === "pricing" && (
            <PricingTaxesTab
              basePrice={basePrice}
              setBasePrice={setBasePrice}
              price={price}
              setPrice={setPrice}
              gstChecked={gstChecked}
              setGstChecked={setGstChecked}
              gstPercent={gstPercent}
              setGstPercent={setGstPercent}
              tcsChecked={tcsChecked}
              setTcsChecked={setTcsChecked}
              tcsPercent={tcsPercent}
              setTcsPercent={setTcsPercent}
              tourismChecked={tourismChecked}
              setTourismChecked={setTourismChecked}
              tourismAmount={tourismAmount}
              setTourismAmount={setTourismAmount}
              numBaseCost={numBaseCost}
              gstAmt={gstAmt}
              tcsAmt={tcsAmt}
              tourismAmt={tourismAmt}
              totalTaxAmt={totalTaxAmt}
              finalCalculatedPrice={finalCalculatedPrice}
              totalLinkedServicesCost={totalLinkedServicesCost}
              validHotelsCount={validHotelsCount}
              validTransfersCount={validTransfersCount}
              validActivitiesCount={validActivitiesCount}
              validSightseeingCount={validSightseeingCount}
            />
          )}

          {activeTab === "inclusions" && (
            <InclusionsNotesTab
              inclusions={inclusions}
              setInclusions={setInclusions}
              exclusions={exclusions}
              setExclusions={setExclusions}
            />
          )}

          {activeTab === "itinerary" && (
            <DayItineraryTab
              itinerary={itinerary}
              addItineraryDay={addItineraryDay}
              removeItineraryDay={removeItineraryDay}
              updateItinerary={updateItinerary}
            />
          )}

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#3E63DD] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Creating Template..." : "Save Pre-defined Package"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
