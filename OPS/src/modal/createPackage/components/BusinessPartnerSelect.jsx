import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

export const BusinessPartnerSelect = ({ value, onChange, businessPartners, placeholderName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedPartner = businessPartners?.find((bp) => (bp._id || bp.id) === value);

  const filteredPartners = businessPartners?.filter((bp) => {
    const search = searchTerm.toLowerCase();
    const name = (bp.name || "").toLowerCase();
    const company = (bp.companyName || "").toLowerCase();
    return name.includes(search) || company.includes(search);
  }) || [];

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        className="flex items-center justify-between w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-slate-800 cursor-pointer hover:border-[#3E63DD] hover:ring-1 hover:ring-[#3E63DD]/30 shadow-2xs transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate pr-2 font-medium">
          {selectedPartner 
            ? <>{selectedPartner.name} {selectedPartner.companyName && <span className="text-gray-500 text-[10px] ml-1">({selectedPartner.companyName})</span>}</>
            : (placeholderName ? <span className="text-slate-800">{placeholderName}</span> : <span className="text-gray-400">-- Select Business Partner --</span>)}
        </span>
        <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-1.5 w-full rounded-xl border border-gray-200 bg-white shadow-xl max-h-60 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-gray-100 shrink-0">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search partners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-gray-50 pl-8 pr-3 py-1.5 text-[11px] text-slate-800 focus:border-[#3E63DD] focus:ring-1 focus:ring-[#3E63DD] outline-none transition"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="overflow-y-auto p-1.5 [scrollbar-width:thin] flex-1">
            {filteredPartners.length === 0 ? (
              <div className="p-3 text-[11px] text-gray-500 italic text-center">
                No business partners found.
              </div>
            ) : (
              filteredPartners.map((bp) => (
                <div
                  key={bp._id || bp.id}
                  className={`px-3 py-2 text-xs rounded-md cursor-pointer transition flex items-center justify-between ${
                    value === (bp._id || bp.id) ? "bg-blue-50 text-[#3E63DD] font-semibold" : "hover:bg-gray-50 text-slate-700"
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(bp._id || bp.id);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(bp._id || bp.id);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  <span className="truncate pr-2">
                    {bp.name} {bp.companyName && <span className={`text-[10px] font-normal ml-1 ${value === (bp._id || bp.id) ? "text-[#3E63DD]/70" : "text-gray-500"}`}>({bp.companyName})</span>}
                  </span>
                  {value === (bp._id || bp.id) && <span className="text-[10px] font-bold">✓</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
