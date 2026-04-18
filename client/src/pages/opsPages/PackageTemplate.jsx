import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, MapPin, Package, X, Sparkles } from "lucide-react";
import { LuPackageSearch } from "react-icons/lu";
import { FaHotel, FaCar, FaUtensils, FaSpa, FaMapMarkedAlt } from "react-icons/fa";
import API from "../../utils/Api.js";

const getServiceIcon = (service = "") => {
  const text = service.toLowerCase();
  if (text.includes("hotel") || text.includes("villa")) {
    return <FaHotel className="text-yellow-400 text-xs" />;
  }
  if (text.includes("transfer") || text.includes("car")) {
    return <FaCar className="text-yellow-400 text-xs" />;
  }
  if (text.includes("dinner") || text.includes("lunch")) {
    return <FaUtensils className="text-yellow-400 text-xs" />;
  }
  if (text.includes("spa")) {
    return <FaSpa className="text-yellow-400 text-xs" />;
  }
  return <FaMapMarkedAlt className="text-yellow-400 text-xs" />;
};

const getPackagePreviewQuantity = (service = {}) => {
  const explicitQuantity = Number(
    service.quantity || service.qty || service.nights || service.pax || 0,
  );

  if (Number.isFinite(explicitQuantity) && explicitQuantity > 0) {
    return explicitQuantity;
  }

  const parsedDay = Number(service.days || 0);
  if (Number.isFinite(parsedDay) && parsedDay > 0 && service.day) {
    return 1;
  }

  return Number(service.days || 1) || 1;
};

const getPackagePreviewQuantityLabel = (service = {}) => {
  const quantity = getPackagePreviewQuantity(service);
  const unit = String(service.unit || "").toLowerCase().trim();
  const serviceType = String(service.packageType || "").toLowerCase().trim();

  if (serviceType === "hotel" || unit.includes("night")) {
    return `${quantity} night${quantity > 1 ? "s" : ""}`;
  }

  if (serviceType === "transfer" || serviceType === "transport") {
    return `${quantity} transfer${quantity > 1 ? "s" : ""}`;
  }

  if (
    unit.includes("pax") ||
    unit.includes("person") ||
    unit.includes("adult") ||
    unit.includes("ticket")
  ) {
    return `${quantity} pax`;
  }

  if (serviceType === "activity" || serviceType === "sightseeing") {
    return `${quantity} pax`;
  }

  return `x${quantity}`;
};

const PackageTemplate = ({ onApply }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packages, setPackages] = useState([]);
  const [search, setSearch] = useState("");
  const [isApplied, setIsApplied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await API.get("/dmc/package");
        setPackages(res.data.data || []);
      } catch (error) {
        console.log(error);
      }
    };

    fetchPackages();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dropdownData = useMemo(() => {
    if (!search.trim()) {
      return packages;
    }

    const term = search.toLowerCase().trim();

    return packages.filter((pkg) => {
      const nestedLocations = [
        ...(pkg.hotels || []),
        ...(pkg.activities || []),
        ...(pkg.sightseeing || []),
        ...(pkg.transfers || []),
      ]
        .flatMap((service) => [
          service.city,
          service.country,
          service.name,
          service.hotelName,
          service.serviceName,
        ])
        .filter(Boolean);

      return [
        pkg.title,
        pkg.destination,
        pkg.city,
        pkg.country,
        pkg.category,
        pkg.duration,
        ...nestedLocations,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [packages, search]);

  const handleSelect = (pkg) => {
    setSelectedPackage(pkg);
    setSearch(pkg.title || "");
    setShowDropdown(false);
    setIsApplied(false);
    onApply?.(null);
  };

  const getAllServices = (pkg) => {
    if (!pkg) {
      return [];
    }

    return [
      ...(pkg.hotels || []).map((service) => ({ ...service, packageType: "hotel" })),
      ...(pkg.activities || []).map((service) => ({ ...service, packageType: "activity" })),
      ...(pkg.sightseeing || []).map((service) => ({ ...service, packageType: "sightseeing" })),
      ...(pkg.transfers || []).map((service) => ({ ...service, packageType: "transfer" })),
    ];
  };

  return (
    <div
      ref={ref}
      className="border border-yellow-500 rounded-xl p-4 bg-[#1a1600] transform transition-all duration-600 ease-out"
    >
      <div className="flex flex-col gap- mb-3 ">
        <div className="flex items-center gap-2.5">
          <Package size={20} className="text-yellow-400" />
          <h2 className="text-sm font-semibold">Package Template</h2>
        </div>
        <p className="text-[10px] pl-7 text-gray-400">
          Apply pre-configured packages to quickly build quotations
        </p>
      </div>

      <button className="text-xs text-yellow-400 flex items-center gap-2 mb-3 hover:underline">
        <Sparkles size={14} />
        Apply Fixed Package Template
      </button>

      <div className="relative w-full">
        <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />

        <input
          type="text"
          placeholder="Search by city, country, package name or category..."
          value={search}
          onClick={() => setShowDropdown(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
          }}
          className="w-full bg-black border border-gray-700 rounded-xl pl-9 py-2 text-xs outline-none"
        />

        {showDropdown && (
          <div className="absolute left-0 top-full mt-2 w-full border border-gray-700 rounded-sm bg-black max-h-65 overflow-y-auto z-50 animate-fadeIn custom-scroll">
            {dropdownData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-xs">
                <div className="border border-gray-700 p-3 rounded-xl mb-3">
                  <Package size={18} />
                </div>
                <p>No package found matching</p>
                <span className="text-gray-500">"{search}"</span>
              </div>
            ) : (
              dropdownData.map((pkg) => (
                <div
                  key={pkg._id}
                  onClick={() => handleSelect(pkg)}
                  className="p-4 border-b border-gray-700 hover:bg-[#eeedeb17] cursor-pointer"
                >
                  <div className="flex justify-between">
                    <div>
                      <span className="flex items-center gap-1">
                        <LuPackageSearch className="text-xs text-yellow-400" />
                        <p className="text-sm font-semibold">{pkg.title}</p>
                      </span>

                      <p className="text-xs text-gray-400 flex items-center gap-5 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-yellow-900" />
                          {pkg.destination} • {pkg.country}
                        </span>
                        <span>{pkg.duration} Stay</span>
                        <span className="text-xs text-green-800 mt-1 font-semibold">
                          {(
                            (pkg.hotels?.length || 0) +
                            (pkg.activities?.length || 0) +
                            (pkg.transfers?.length || 0) +
                            (pkg.sightseeing?.length || 0)
                          )} Services Included
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-400">Base Value</span>
                      <span className="text-yellow-400 font-semibold text-sm">
                        Rs {pkg.price?.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div
        className={`mt-4 border border-yellow-500 rounded-xl p-3 bg-[#111] transform transition-all duration-600 ease-out ${
          selectedPackage
            ? "opacity-100 translate-y-0 max-h-120"
            : "opacity-0 -translate-y-3 max-h-0 overflow-hidden pointer-events-none"
        }`}
      >
        <div className="flex justify-between items-center">
          <p className="text-sm font-semibold">
            Selected: {selectedPackage?.title}
          </p>

          <button
            onClick={() => {
              setSelectedPackage(null);
              setSearch("");
              setIsApplied(false);
              onApply?.(null);
            }}
            className="text-gray-400 hover:text-red-400 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-[10px] text-gray-400 mb-2 flex items-center gap-1">
          {selectedPackage?.destination} • {selectedPackage?.country} •{" "}
          <span>{selectedPackage?.duration}</span>
        </p>

        <p className="text-xs text-gray-400 mb-2">Included Services:</p>

        <ul className="space-y-2">
          {getAllServices(selectedPackage).map((service, i) => (
            <li
              key={i}
              className="flex items-center justify-between text-xs text-gray-300"
            >
              <div className="flex items-center gap-2">
                {getServiceIcon(service.name || service.hotelName || service.serviceName)}
                {service.name || service.hotelName || service.serviceName}
              </div>

              <span className="text-gray-400">
                {getPackagePreviewQuantityLabel(service)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex justify-between border-t border-gray-700 pt-2 mt-3 text-sm">
          <span className="text-gray-400">Price</span>
          <span className="text-yellow-400 font-semibold">
            Rs {selectedPackage?.price?.toLocaleString("en-IN")}
          </span>
        </div>

        <label className="mt-3 flex items-center gap-2 text-xs text-gray-300 bg-[#171717] border border-gray-700 rounded-lg px-3 py-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isApplied}
            onChange={(e) => {
              const checked = e.target.checked;
              setIsApplied(checked);
              onApply?.(checked ? selectedPackage : null);
            }}
            className="accent-yellow-400 w-3.5 h-3.5 cursor-pointer"
          />
          Add package base value to quotation total
        </label>
      </div>
    </div>
  );
};

export default PackageTemplate;
