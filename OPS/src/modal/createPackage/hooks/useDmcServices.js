import { useState, useEffect, useCallback } from "react";
import API from "../../../utils/Api.js";
import {
  normalizeComparisonText,
  isMatchingPackageDestination,
} from "../utils/packageUtils.js";

export const useDmcServices = (isOpen, destination) => {
  const [allDmcServices, setAllDmcServices] = useState({
    hotels: [],
    transfers: [],
    activities: [],
    sightseeing: [],
  });
  const [servicesLoading, setServicesLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchServices = async () => {
      try {
        setServicesLoading(true);
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

  const getFilteredHotels = useCallback(
    (searchQuery = "", currentHotelObj = null) => {
      const term = normalizeComparisonText(searchQuery);
      const destTerm = normalizeComparisonText(destination);

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
    },
    [allDmcServices.hotels, destination]
  );

  const getFilteredTransfers = useCallback(
    (searchQuery = "", currentTransferObj = null) => {
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
    },
    [allDmcServices.transfers, destination]
  );

  const getFilteredActivities = useCallback(
    (searchQuery = "", currentActObj = null) => {
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
    },
    [allDmcServices.activities, destination]
  );

  const getFilteredSightseeing = useCallback(
    (searchQuery = "", currentSightObj = null) => {
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
    },
    [allDmcServices.sightseeing, destination]
  );

  return {
    allDmcServices,
    servicesLoading,
    getFilteredHotels,
    getFilteredTransfers,
    getFilteredActivities,
    getFilteredSightseeing,
  };
};
