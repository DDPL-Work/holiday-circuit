// import React, { useState, useRef, useEffect } from "react";
// import { Search, MapPin, Package, X, Sparkles } from "lucide-react";
// import { FaHotel, FaCar, FaUtensils, FaSpa, FaMapMarkedAlt } from "react-icons/fa";

// const packages = [
//   {
//     id: 1,
//     title: "Bali Romantic Escape",
//     location: "Bali, Indonesia",
//     nights: "7 Nights",
//     services: [
//       { name: "Private Pool Villa - Ubud", qty: 1 },
//       { name: "Airport Transfer - Private Car", qty: 1 },
//       { name: "Romantic Dinner by the Beach", qty: 2 },
//       { name: "Couple Spa Package", qty: 2 },
//       { name: "Ubud Temples & Rice Terrace Tour", qty: 1 },
//     ],
//     price: 185000,
//   },
//    {
//     id: 1,
//     title: "Bali Romantic Escape",
//     location: "Bali, Indonesia",
//     nights: "7 Nights",
//     services: [
//       { name: "Private Pool Villa - Ubud", qty: 1 },
//       { name: "Airport Transfer - Private Car", qty: 1 },
//       { name: "Romantic Dinner by the Beach", qty: 2 },
//       { name: "Couple Spa Package", qty: 2 },
//       { name: "Ubud Temples & Rice Terrace Tour", qty: 1 },
//     ],
//     price: 185000,
//   },
//    {
//     id: 1,
//     title: "Bali Romantic Escape",
//     location: "Bali, Indonesia",
//     nights: "7 Nights",
//     services: [
//       { name: "Private Pool Villa - Ubud", qty: 1 },
//       { name: "Airport Transfer - Private Car", qty: 1 },
//       { name: "Romantic Dinner by the Beach", qty: 2 },
//       { name: "Couple Spa Package", qty: 2 },
//       { name: "Ubud Temples & Rice Terrace Tour", qty: 1 },
//     ],
//     price: 185000,
//   },
//    {
//     id: 1,
//     title: "Bali Romantic Escape",
//     location: "Bali, Indonesia",
//     nights: "7 Nights",
//     services: [
//       { name: "Private Pool Villa - Ubud", qty: 1 },
//       { name: "Airport Transfer - Private Car", qty: 1 },
//       { name: "Romantic Dinner by the Beach", qty: 2 },
//       { name: "Couple Spa Package", qty: 2 },
//       { name: "Ubud Temples & Rice Terrace Tour", qty: 1 },
//     ],
//     price: 185000,
//   },
//    {
//     id: 1,
//     title: "Bali Romantic Escape",
//     location: "Bali, Indonesia",
//     nights: "7 Nights",
//     services: [
//       { name: "Private Pool Villa - Ubud", qty: 1 },
//       { name: "Airport Transfer - Private Car", qty: 1 },
//       { name: "Romantic Dinner by the Beach", qty: 2 },
//       { name: "Couple Spa Package", qty: 2 },
//       { name: "Ubud Temples & Rice Terrace Tour", qty: 1 },
//     ],
//     price: 185000,
//   },
//    {
//     id: 1,
//     title: "Bali Romantic Escape",
//     location: "Bali, Indonesia",
//     nights: "7 Nights",
//     services: [
//       { name: "Private Pool Villa - Ubud", qty: 1 },
//       { name: "Airport Transfer - Private Car", qty: 1 },
//       { name: "Romantic Dinner by the Beach", qty: 2 },
//       { name: "Couple Spa Package", qty: 2 },
//       { name: "Ubud Temples & Rice Terrace Tour", qty: 1 },
//     ],
//     price: 185000,
//   },
//    {
//     id: 1,
//     title: "Bali Romantic Escape",
//     location: "Bali, Indonesia",
//     nights: "7 Nights",
//     services: [
//       { name: "Private Pool Villa - Ubud", qty: 1 },
//       { name: "Airport Transfer - Private Car", qty: 1 },
//       { name: "Romantic Dinner by the Beach", qty: 2 },
//       { name: "Couple Spa Package", qty: 2 },
//       { name: "Ubud Temples & Rice Terrace Tour", qty: 1 },
//     ],
//     price: 185000,
//   },
//    {
//     id: 1,
//     title: "Bali Romantic Escape",
//     location: "Bali, Indonesia",
//     nights: "7 Nights",
//     services: [
//       { name: "Private Pool Villa - Ubud", qty: 1 },
//       { name: "Airport Transfer - Private Car", qty: 1 },
//       { name: "Romantic Dinner by the Beach", qty: 2 },
//       { name: "Couple Spa Package", qty: 2 },
//       { name: "Ubud Temples & Rice Terrace Tour", qty: 1 },
//     ],
//     price: 185000,
//   },
// ];

// const getServiceIcon = (service) => {
//   const text = service.toLowerCase();

//   if (text.includes("hotel") || text.includes("villa"))
//     return <FaHotel className="text-yellow-400 text-xs" />;

//   if (text.includes("transfer") || text.includes("car"))
//     return <FaCar className="text-yellow-400 text-xs" />;

//   if (text.includes("dinner") || text.includes("lunch"))
//     return <FaUtensils className="text-yellow-400 text-xs" />;

//   if (text.includes("spa"))
//     return <FaSpa className="text-yellow-400 text-xs" />;

//   return <FaMapMarkedAlt className="text-yellow-400 text-xs" />;
// };

// const PackageTemplate = () => {
//   const [search, setSearch] = useState("");
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [selectedPackage, setSelectedPackage] = useState(null);
//   const ref = useRef();

//   const filteredPackages = packages.filter((pkg) =>
//     pkg.title.toLowerCase().includes(search.toLowerCase())
//   );

//   useEffect(() => {
//     const handler = (e) => {
//       if (!ref.current.contains(e.target)) {
//         setShowDropdown(false);
//       }
//     };

//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, []);

//   const handleSelect = (pkg) => {
//     setSelectedPackage(pkg);
//     setSearch(pkg.title);
//     setShowDropdown(false);
//   };

//   return (
//     <div ref={ref} className="border border-yellow-500 rounded-xl p-4 bg-[#1a1600] transform transition-all duration-600 ease-out">

//       {/* HEADER */}
//       <div className="flex flex-col gap- mb-3 ">
//         <div className="flex items-center gap-2.5">
//         <Package size={20} className="text-yellow-400" />
//         <h2 className="text-sm font-semibold">Package Template</h2>
//         </div>
//         <p className="text-[10px] pl-7 text-gray-400">Apply pre-configured packages to quickly build quotations</p>
//       </div>

//       {/* APPLY TEMPLATE BUTTON */}
//       <button className="text-xs text-yellow-400 flex items-center gap-2 mb-3 ">
//         <Sparkles size={14} />
//         Apply Fixed Package Template
//       </button>

// {/* SEARCH */}
// <div className="relative w-full">
//   <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />

//   <input
//     type="text"
//     placeholder="Search packages by destination or name..."
//     value={search}
//     onClick={() => setShowDropdown(true)}
//     onChange={(e) => {
//       setSearch(e.target.value);
//       setShowDropdown(true);
//     }}
//     className="w-full bg-black border border-gray-700 rounded-xl pl-9 py-2 text-sm outline-none"
//   />

//   {/* DROPDOWN */}
//  {showDropdown && (
//   <div
//     className="absolute left-0 top-full mt-2 w-full border border-gray-700 rounded-xl bg-black max-h-65 overflow-y-auto z-50 animate-fadeIn "
//   >
//     {(search ? filteredPackages : packages).length === 0 ? (
//       <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-xs">
//         <div className="border border-gray-700 p-3 rounded-xl mb-3">
//           <Package size={18} />
//         </div>
//         <p>No packages found matching</p>
//         <span className="text-gray-500">"{search}"</span>
//       </div>
//     ) : (
//       (search ? filteredPackages : packages).map((pkg) => (
//         <div
//           key={pkg.id}
//           onClick={() => handleSelect(pkg)}
//           className="p-3 border-b border-gray-700 hover:bg-[#1a1600] cursor-pointer"
//         >
//           <div className="flex justify-between">
//             <div>
//               <p className="text-sm font-semibold">{pkg.title}</p>

//               <p className="text-xs text-gray-400 flex items-center gap-1">
//                 <MapPin size={12} />
//                 {pkg.location} • {pkg.nights}
//               </p>
//             </div>

//             <span className="text-yellow-400 font-semibold text-sm">
//               ₹{pkg.price.toLocaleString("en-IN")}
//             </span>
//           </div>
//         </div>
//       ))
//     )}
//   </div>
//   )}

// </div>

// {/* SELECTED PACKAGE CARD */}
// <div
// className={`mt-4 border border-yellow-500 rounded-xl p-3 bg-[#111]
// transform transition-all duration-600 ease-out
// ${selectedPackage ? "opacity-100 translate-y-0 max-h-120" : "opacity-0 -translate-y-3 max-h-0 overflow-hidden pointer-events-none"}
// `}
// >
//           {/* HEADER */}
//           <div className="flex justify-between items-center mb-2">
//             <p className="text-sm font-semibold">
//               Package Selected: {selectedPackage?.title}
//             </p>

//             <button
//               onClick={() => {
//                 setSelectedPackage(null);
//                 setSearch("");
//               }}
//               className="text-gray-400 hover:text-red-400 cursor-pointer"
//             >
//               <X size={16}/>
//             </button>
//           </div>

//           {/* INCLUDED SERVICES */}
//           <p className="text-xs text-gray-400 mb-2">
//             Included Services:
//           </p>

//           <ul className="space-y-2">
//             {selectedPackage?.services?.map((s, i) => (
//               <li key={i} className="flex items-center justify-between text-xs text-gray-300">

//                 <div className="flex items-center gap-2">
//                   {getServiceIcon(s.name)}
//                   {s.name}
//                 </div>

//                 <span className="text-gray-400">
//                   x{s.qty}
//                 </span>

//               </li>
//             ))}
//           </ul>

//           {/* TOTAL */}
//           <div className="flex justify-between border-t border-gray-700 pt-2 mt-3 text-sm">
//             <span className="text-gray-400">Total Base Value</span>
//             <span className="text-yellow-400 font-semibold">
//             ₹{selectedPackage?.price?.toLocaleString("en-IN")}
//             </span>
//           </div>

//         </div>

//     </div>
//   );
// };

// export default PackageTemplate;

import React, { useState, useRef, useEffect } from "react";
import { Search, MapPin, Package, X, Sparkles, Import } from "lucide-react";
import { LuPackageSearch } from "react-icons/lu";
import {
  FaHotel,
  FaCar,
  FaUtensils,
  FaSpa,
  FaMapMarkedAlt,
} from "react-icons/fa";
import API from "../../utils/Api.js";

const getServiceIcon = (service) => {
  const text = service.toLowerCase();

  if (text.includes("hotel") || text.includes("villa"))
    return <FaHotel className="text-yellow-400 text-xs" />;

  if (text.includes("transfer") || text.includes("car"))
    return <FaCar className="text-yellow-400 text-xs" />;

  if (text.includes("dinner") || text.includes("lunch"))
    return <FaUtensils className="text-yellow-400 text-xs" />;

  if (text.includes("spa"))
    return <FaSpa className="text-yellow-400 text-xs" />;

  return <FaMapMarkedAlt className="text-yellow-400 text-xs" />;
};

const PackageTemplate = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packages, setPackages] = useState([]);
  const [search, setSearch] = useState("");
  const [services, setServices] = useState([]);
  const ref = useRef();

  // Fetch packages from API as user types (live search)
  useEffect(() => {
    if (!search) {
      setServices([]);
      return;
    }

    const fetchServices = async () => {
      try {
        const res = await API.post("/ops/search", { query: search });

        const data = res.data.data;

        const combined = [
          ...(data.activities || []),
          ...(data.hotels || []),
          ...(data.sightseeing || []),
          ...(data.transfers || []),
        ];

        setServices(combined);
      } catch (err) {
        console.error(err);
        setServices([]);
      }
    };

    const debounce = setTimeout(fetchServices, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  useEffect(() => {
    const fetchServicesPackages = async () => {
      try {
        const res = await API.get("/dmc/package");
        console.log("data", res);
        setPackages(res.data.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchServicesPackages();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!ref.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (pkg) => {
    setSelectedPackage(pkg);
    setSearch(pkg.title || pkg.serviceName || pkg.hotelName || pkg.name);
    setShowDropdown(false);
  };

  const getAllServices = (pkg) => {
    if (!pkg) return [];

    return [
      ...(pkg.hotels || []),
      ...(pkg.activities || []),
      ...(pkg.sightseeing || []),
      ...(pkg.transfers || []),
    ];
  };

const dropdownData = search ? services.filter(s => s.type === "package") : packages;

  return (
    <div
      ref={ref}
      className="border border-yellow-500 rounded-xl p-4 bg-[#1a1600] transform transition-all duration-600 ease-out"
    >
      {/* HEADER */}
      <div className="flex flex-col gap- mb-3 ">
        <div className="flex items-center gap-2.5">
          <Package size={20} className="text-yellow-400" />
          <h2 className="text-sm font-semibold">Package Template</h2>
        </div>
        <p className="text-[10px] pl-7 text-gray-400">
          Apply pre-configured packages to quickly build quotations
        </p>
      </div>

      {/* APPLY TEMPLATE BUTTON */}
      <button className="text-xs text-yellow-400 flex items-center gap-2 mb-3 hover:underline">
        <Sparkles size={14} />
        Apply Fixed Package Template
      </button>

      {/* SEARCH */}
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

        {/* DROPDOWN */}
        {showDropdown && (
          <div className="absolute left-0 top-full mt-2 w-full border border-gray-700 rounded-sm bg-black max-h-65 overflow-y-auto z-50 animate-fadeIn custom-scroll">
            {dropdownData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-xs">
                <div className="border border-gray-700 p-3 rounded-xl mb-3">
                  <Package size={18} />
                </div>
                <p>No services found matching</p>
                <span className="text-gray-500">"{search}"</span>
              </div>
            ) : (
              dropdownData.map((pkg) => (
                <div
                  key={pkg._id}
                  onClick={() => handleSelect(pkg)}
                  className="p-4 border-b border-gray-700 hover:bg-[#eeedeb17] cursor-pointer "
                >
                  <div className="flex justify-between">
                    <div>
                      <span className="flex items-center gap-1"><LuPackageSearch className="text-xs text text-yellow-400"/>
                      <p className="text-sm font-semibold">{pkg.title}</p></span>
                     

                      <p className="text-xs text-gray-400 flex items-center gap-5 mt-1">
                        <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-yellow-900"/>
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
                    <div className="flex flex-col items-end ">
                      <span className="text-[10px] text-gray-400">Base Value</span>
                      <span className="text-yellow-400 font-semibold text-sm">
                      ₹{pkg.price?.toLocaleString("en-IN")}
                    </span>
                    </div>
                      
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* SELECTED PACKAGE CARD */}
      <div
        className={`mt-4 border border-yellow-500 rounded-xl p-3 bg-[#111] 
        transform transition-all duration-600 ease-out
        ${selectedPackage ? "opacity-100 translate-y-0 max-h-120" : "opacity-0 -translate-y-3 max-h-0 overflow-hidden pointer-events-none"}
        `}
      >
        <div className="flex justify-between items-center mb- ">
          <p className="text-sm font-semibold">
            Selected: {selectedPackage?.title}
          </p>

          <button
            onClick={() => {
              setSelectedPackage(null);
              setSearch("");
            }}
            className="text-gray-400 hover:text-red-400 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* DETAILS */}
        <p className="text-[10px] text-gray-400 mb-2 flex items-center gap-1">
          {selectedPackage?.destination} • {selectedPackage?.country} • <span>{selectedPackage?.duration}</span>
        </p>

        <p className="text-xs text-gray-400 mb-2">Included Services:</p>

        <ul className="space-y-2">
          {getAllServices(selectedPackage)?.map((service, i) => (
            <li
              key={i}
              className="flex items-center justify-between text-xs text-gray-300"
            >
              <div className="flex items-center gap-2">
                {getServiceIcon(
                  service.name || service.hotelName || service.serviceName,
                )}

                {service.name || service.hotelName || service.serviceName}
              </div>

              {service.roomType && (
                <span className="text-gray-400">{service.roomType}</span>
              )}
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-gray-700 pt-2 mt-3 text-sm">
          <span className="text-gray-400">Price</span>
          <span className="text-yellow-400 font-semibold">
            ₹{selectedPackage?.price?.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PackageTemplate;
