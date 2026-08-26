import React from "react";
import { BedDouble, Plus, Trash2, ChevronDown, Building2, MapPin } from "lucide-react";
import { formatLocationWithDestination } from "../utils/packageUtils.js";

export const HotelsTab = ({
  hotels,
  addHotel,
  removeHotel,
  updateHotel,
  handleHotelPropertyChange,
  handleRoomCategoryChange,
  handleRoomOccupancyChange,
  selectDmcHotel,
  getFilteredHotels,
  destination,
  servicesLoading,
  activeHotelDropdownIdx,
  setActiveHotelDropdownIdx,
  isTripleAllowedCategory,
}) => {
  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <p className="text-xs sm:text-sm text-slate-900 font-bold flex items-center gap-1.5">
            <BedDouble size={15} className="text-amber-600" />
            Hotel Stays & Accommodations
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Select from contracted hotels in <strong>{destination}</strong> or pick from catalogue / type custom properties.
          </p>
        </div>
        <button
          type="button"
          onClick={addHotel}
          className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 hover:border-amber-300 transition-colors cursor-pointer shadow-2xs"
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
            <div
              key={index}
              className={`rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3.5 relative shadow-2xs ${
                activeHotelDropdownIdx === index ? "z-50 ring-1 ring-blue-500/50 overflow-visible" : "z-10 overflow-visible"
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-gray-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <BedDouble size={14} className="text-amber-600" /> Hotel #{index + 1}
                  </span>

                  {hotel.hotelsList && hotel.hotelsList.length > 1 ? (
                    <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-0.5 text-xs text-slate-700 shadow-2xs">
                      <span className="text-gray-500 font-medium text-[11px]">Hotel:</span>
                      <select
                        value={hotel.selectedHotelIdx || 0}
                        onChange={(e) => handleHotelPropertyChange(index, Number(e.target.value))}
                        className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs"
                      >
                        {hotel.hotelsList.map((hProp, pIdx) => (
                          <option key={pIdx} value={pIdx} className="bg-white text-slate-800">
                            {hProp.hotelName}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : hotel.hotelName ? (
                    <span className="rounded-md border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] text-slate-800 font-semibold shadow-2xs">
                      Hotel: {hotel.hotelName}
                    </span>
                  ) : null}

                  <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    ★ {hotel.starCategory || "5 Star"}
                  </span>

                  {hotel.supplierName && (
                    <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] text-emerald-700 font-semibold">
                      Supplier: {hotel.supplierName}
                    </span>
                  )}
                </div>

                {hotels.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeHotel(index)}
                    className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                    title="Remove Hotel"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div className={`sm:col-span-2 relative dmc-autocomplete-container ${activeHotelDropdownIdx === index ? "z-40" : "z-10"}`}>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                    <span>Service Name (Select Service or Type)</span>
                    {servicesLoading ? (
                      <span className="text-[10px] text-blue-600 font-medium">Loading Services...</span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        {getFilteredHotels("").length} Services in {destination || "Selected Destination"}
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
                      className="w-full rounded-lg border border-gray-300 bg-white pl-3 pr-8 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setActiveHotelDropdownIdx(activeHotelDropdownIdx === index ? null : index)}
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer transition-colors"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {activeHotelDropdownIdx === index && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl z-[100] divide-y divide-gray-100 [scrollbar-width:thin]">
                      {filteredHotels.length === 0 ? (
                        <div className="p-3 text-[11px] text-gray-500 italic text-center">
                          No service found matching "{hotel.serviceName || hotel.name || ""}". You can freely type custom service name.
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
                              className={`p-3 hover:bg-blue-50/60 cursor-pointer transition flex items-center justify-between gap-2 ${
                                isSelected ? "bg-blue-50/90 border-l-3 border-l-blue-600" : matchesDest ? "bg-gray-50/60" : ""
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                  <Building2 size={13} className="text-blue-600 shrink-0" />
                                  <span>{serviceTitle}</span>
                                  {isSelected && (
                                    <span className="rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] px-1.5 py-0.2 font-bold">
                                      ✓ Selected
                                    </span>
                                  )}
                                  <span className="text-[10px] font-semibold text-amber-600">
                                    ★ {dmcHotel.starCategory || dmcHotel.hotelCategory || "4 Star"}
                                  </span>
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5 truncate flex items-center gap-1 flex-wrap">
                                  <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                    <MapPin size={11} className="text-rose-500 shrink-0" />
                                    {formatLocationWithDestination(dmcHotel.city, dmcHotel.destination, destination)}
                                  </span>
                                  {dmcHotel.hotelName && dmcHotel.hotelName !== serviceTitle && (
                                    <> • Hotel: <span className="text-slate-700 font-medium">{dmcHotel.hotelName}</span></>
                                  )}
                                  • {dmcHotel.roomType || "Deluxe Room"} • {dmcHotel.mealPlan || "CP Plan"}
                                </p>
                                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                                  Supplier: {dmcHotel.supplierName || dmcHotel.dmcName || "Contracted Supplier"}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-slate-900">
                                  ₹{Number(dmcHotel.price || dmcHotel.total || dmcHotel.rate || 0).toLocaleString("en-IN")}
                                </span>
                                <span className="block text-[10px] text-gray-500">/ night</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Meal Plan</label>
                  <select
                    value={hotel.mealPlan || "EP"}
                    onChange={(e) => updateHotel(index, "mealPlan", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                  >
                    <option value="EP">EP (Room Only)</option>
                    <option value="CP">CP (Breakfast Included)</option>
                    <option value="MAP">MAP (Breakfast & Dinner)</option>
                    <option value="AP">AP (All Meals Included)</option>
                    <option value="AI">AI (All Inclusive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Total Hotel Cost (₹)
                    {Number(hotel.basePrice) > 0 && (
                      <span className="text-[10px] text-blue-600 ml-1 font-normal">
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
                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-3.5 md:grid-cols-3 lg:grid-cols-6 shadow-2xs">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Room Category
                  </label>
                  <select
                    value={hotel.roomType || "Standard Room"}
                    onChange={(e) => handleRoomCategoryChange(index, e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-gray-50/50 px-2 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
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
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Room Type (Occupancy)
                  </label>
                  <select
                    value={hotel.roomCategory || "Double"}
                    onChange={(e) => handleRoomOccupancyChange(index, e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-gray-50/50 px-2 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                  >
                    <option value="Double">Double (2 persons)</option>
                    <option
                      value="Triple"
                      disabled={!isTripleAllowedCategory(hotel.roomType)}
                      className={!isTripleAllowedCategory(hotel.roomType) ? "text-gray-400 font-normal italic" : "text-slate-800 font-bold"}
                    >
                      Triple (3 persons) {!isTripleAllowedCategory(hotel.roomType) ? "— (Family/Luxury/Suite only)" : ""}
                    </option>
                    <option value="Single">Single (1 person)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Nights
                  </label>
                  <select
                    value={Number(hotel.nights || 1)}
                    onChange={(e) => updateHotel(index, "nights", Math.max(1, Number(e.target.value || 1)))}
                    className="w-full rounded-md border border-gray-300 bg-gray-50/50 px-2 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                  >
                    {[...Array(15)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} Night{i === 0 ? "" : "s"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Rooms
                  </label>
                  <select
                    value={Number(hotel.rooms || 1)}
                    onChange={(e) => updateHotel(index, "rooms", Math.max(1, Number(e.target.value || 1)))}
                    className="w-full rounded-md border border-gray-300 bg-gray-50/50 px-2 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                  >
                    {[...Array(8)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} Room{i === 0 ? "" : "s"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Bed Type
                  </label>
                  <select
                    value={hotel.bedType || "Queen Bed"}
                    onChange={(e) => updateHotel(index, "bedType", e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-gray-50/50 px-2 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                  >
                    <option value="Queen Bed">Queen Bed</option>
                    <option value="King Bed">King Bed</option>
                    <option value="Twin Bed">Twin Bed</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Extra Bed Type
                  </label>
                  <select
                    value={hotel.extraBedType || "None"}
                    onChange={(e) => updateHotel(index, "extraBedType", e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-gray-50/50 px-2 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                  >
                    <option value="None">None</option>
                    <option value="Single Bed">Single Bed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">MAX OCCUPANCY:</span>
                <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-2xs">
                  <span className="text-emerald-700 font-bold">{hotel.maxAdults || 2} Adult{Number(hotel.maxAdults || 2) === 1 ? "" : "s"}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-sky-700 font-bold">{hotel.maxChildren !== undefined ? hotel.maxChildren : 1} Child{Number(hotel.maxChildren !== undefined ? hotel.maxChildren : 1) === 1 ? "" : "ren"}</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Optional Add-ons
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <label className={`flex items-center justify-between gap-2 rounded-lg border p-3 cursor-pointer transition shadow-2xs ${hotel.extraAdult ? "border-amber-300 bg-amber-50/50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={hotel.extraAdult || false}
                        onChange={(e) => updateHotel(index, "extraAdult", e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">A.W.E.B</p>
                        <p className="text-[10px] text-gray-500">Extra adult with extra bed</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-amber-700">
                      ₹{Number(hotel.awebRate || 0).toLocaleString("en-IN")}
                    </span>
                  </label>

                  <label className={`flex items-center justify-between gap-2 rounded-lg border p-3 cursor-pointer transition shadow-2xs ${hotel.childWithBed ? "border-emerald-300 bg-emerald-50/50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={hotel.childWithBed || false}
                        onChange={(e) => updateHotel(index, "childWithBed", e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">C.W.E.B</p>
                        <p className="text-[10px] text-gray-500">Child with extra bed</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-700">
                      ₹{Number(hotel.cwebRate || 0).toLocaleString("en-IN")}
                    </span>
                  </label>

                  <label className={`flex items-center justify-between gap-2 rounded-lg border p-3 cursor-pointer transition shadow-2xs ${hotel.childWithoutBed ? "border-sky-300 bg-sky-50/50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={hotel.childWithoutBed || false}
                        onChange={(e) => updateHotel(index, "childWithoutBed", e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">C.Wo.E.B</p>
                        <p className="text-[10px] text-gray-500">Child without extra bed</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-sky-700">
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
  );
};

export default HotelsTab;
