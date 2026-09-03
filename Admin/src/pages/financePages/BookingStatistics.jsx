import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../utils/Api";
import { X, Search, Briefcase, Eye, Calendar, MapPin, Users, Plane, Hotel, Car, RotateCcw, ChevronLeft, ChevronRight, BarChart2, List, ChevronDown } from "lucide-react";
import ReportSummaryCard from "./AdvancedAnalyticsComponents/Cards/ReportSummaryCard";
import BookingChart from "./AdvancedAnalyticsComponents/Charts/BookingChart";


const CustomDropdown = ({ value, onChange, options, defaultLabel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = value || defaultLabel;

  return (
    <div className="relative w-full" ref={ref}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[38px] px-3 text-sm bg-white border rounded-lg flex items-center justify-between cursor-pointer transition-all shadow-sm ${
          isOpen ? "border-indigo-300 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
        }`}
      >
        <span className="truncate text-slate-700">{selectedLabel}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-slate-100 bg-white shadow-xl max-h-56 overflow-y-auto thin-scrollbar"
          >
            <div
              onClick={() => { onChange(""); setIsOpen(false); }}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                value === "" ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {defaultLabel}
            </div>
            {options.map((opt, idx) => (
              <div
                key={idx}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  value === opt ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {opt}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


export default function BookingStatistics() {
  const [searchTerm, setSearchTerm] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [opsFilter, setOpsFilter] = useState("");
  const [dmcFilter, setDmcFilter] = useState("");
  const [bookingFromDate, setBookingFromDate] = useState("");
  const [bookingToDate, setBookingToDate] = useState("");
  const [travelFromDate, setTravelFromDate] = useState("");
  const [travelToDate, setTravelToDate] = useState("");
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // "table" | "chart"
  
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;
  
  const [bookingData, setBookingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);

  const resetFilters = () => {
    setSearchTerm("");
    setDestinationFilter("");
    setAgentFilter("");
    setOpsFilter("");
    setDmcFilter("");
    setBookingFromDate("");
    setBookingToDate("");
    setTravelFromDate("");
    setTravelToDate("");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await API.get("/admin/booking-statistics/vouchered");
        if (res.data.success) {
          setBookingData(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching vouchered queries:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleViewDetails = async (row) => {
    try {
      setModalLoading(true);
      setSelectedQuery({ ...row }); // Optimistic UI
      const res = await API.get(`/admin/booking-statistics/query/${row._id}`);
      if (res.data.success) {
        setSelectedQuery(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching query details:", err);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return bookingData.filter((row) => {
      let matches = true;
      if (destinationFilter && row.destination !== destinationFilter) matches = false;
      if (agentFilter && row.agent !== agentFilter) matches = false;
      if (opsFilter && row.ops !== opsFilter) matches = false;
      if (dmcFilter && !row.dmc.includes(dmcFilter)) matches = false;
      
      if (bookingFromDate && new Date(row.bookingDate) < new Date(bookingFromDate)) matches = false;
      if (bookingToDate && new Date(row.bookingDate) > new Date(bookingToDate)) matches = false;

      if (travelFromDate && new Date(row.travelDate) < new Date(travelFromDate)) matches = false;
      if (travelToDate && new Date(row.travelDate) > new Date(travelToDate)) matches = false;

      if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        const searchString = `${row.id} ${row.city} ${row.hotels} ${row.bookingType}`.toLowerCase();
        if (!searchString.includes(lowerTerm)) matches = false;
      }
      return matches;
    });
  }, [bookingData, searchTerm, destinationFilter, agentFilter, opsFilter, dmcFilter, bookingFromDate, bookingToDate, travelFromDate, travelToDate]);

  const dynamicStats = useMemo(() => {
    const totalBookings = filteredData.length;
    const totalPassengers = filteredData.reduce((acc, row) => acc + (row.pax || 0), 0);
    const activeDestinations = new Set(filteredData.map(r => r.destination)).size;
    
    const agentCounts = {};
    const dmcCounts = new Set();
    const opsCounts = {};

    filteredData.forEach(row => {
      if (row.agent && row.agent !== "Unassigned") agentCounts[row.agent] = (agentCounts[row.agent] || 0) + 1;
      if (row.ops && row.ops !== "Unassigned") opsCounts[row.ops] = (opsCounts[row.ops] || 0) + 1;
      if (row.dmc && row.dmc !== "N/A") {
        row.dmc.split(',').forEach(d => dmcCounts.add(d.trim()));
      }
    });

    const totalAgents = Object.keys(agentCounts).length;
    const totalDMCs = dmcCounts.size;
    const totalOPS = Object.keys(opsCounts).length;

    const agentCard = agentFilter 
      ? { label: "AGENT", value: agentFilter.length > 15 ? `${agentFilter.substring(0, 15)}...` : agentFilter, sub: `${totalBookings} Bookings`, styleKey: "VERIFIED PAYMENT REVENUE" }
      : { label: "ALL AGENTS", value: `${totalAgents} Agents`, sub: `Total ${totalBookings} Bookings`, styleKey: "VERIFIED PAYMENT REVENUE" };

    const dmcCard = dmcFilter 
      ? { label: "DMC PARTNER", value: dmcFilter.length > 15 ? `${dmcFilter.substring(0, 15)}...` : dmcFilter, sub: `${totalBookings} Bookings`, styleKey: "CONFIRMED BOOKINGS" }
      : { label: "ALL DMCs", value: `${totalDMCs} DMCs`, sub: `Total ${totalBookings} Bookings`, styleKey: "CONFIRMED BOOKINGS" };

    const opsCard = opsFilter 
      ? { label: "OPS MEMBER", value: opsFilter.length > 15 ? `${opsFilter.substring(0, 15)}...` : opsFilter, sub: `${totalBookings} Bookings`, styleKey: "PENDING REVENUE" }
      : { label: "ALL OPS", value: `${totalOPS} Members`, sub: `Total ${totalBookings} Bookings`, styleKey: "PENDING REVENUE" };

    return [
      { label: "Total Bookings", value: totalBookings, sub: "Filtered records", styleKey: "MONTHLY BOOKINGS" },
      { label: "Total Passengers", value: totalPassengers, sub: "Adults & Children", styleKey: "CONFIRMED QUERIES" },
      { label: "Active Destinations", value: activeDestinations, sub: "Global regions", styleKey: "CONVERSION %" },
      agentCard,
      dmcCard,
      opsCard,
    ];
  }, [filteredData, agentFilter, dmcFilter, opsFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / entriesPerPage) || 1;
  const currentEntries = useMemo(() => {
    return filteredData.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);
  }, [filteredData, currentPage]);

  // Dynamic dropdown options
  const uniqueDestinations = useMemo(() => {
    return [...new Set(bookingData.map(item => item.destination).filter(Boolean))].sort();
  }, [bookingData]);

  const uniqueAgents = useMemo(() => {
    return [...new Set(bookingData.map(item => item.agent).filter(Boolean))].sort();
  }, [bookingData]);

  const uniqueOps = useMemo(() => {
    return [...new Set(bookingData.map(item => item.ops).filter(Boolean))].sort();
  }, [bookingData]);

  const uniqueDmcs = useMemo(() => {
    const dmcSet = new Set();
    bookingData.forEach(item => {
      if (item.dmc && item.dmc !== "N/A") {
        item.dmc.split(',').forEach(d => dmcSet.add(d.trim()));
      }
    });
    return [...dmcSet].sort();
  }, [bookingData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col gap-6 w-full  mx-auto px-6 text-slate-800 pb-1 bg-slate-50 min-h-screen"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Booking Statistics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailed overview of all bookings and operations
          </p>
        </div>
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "table"
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <List size={14} />
            Table View
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "chart"
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <BarChart2 size={14} />
            Chart View
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {dynamicStats.map((stat, idx) => (
              <ReportSummaryCard 
                key={idx}
                item={stat}
                loading={false}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {viewMode === "table" ? (
              <motion.div
                key="table-view"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex flex-col gap-6"
              >
          <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 shadow-sm">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search Query ID, City, Hotel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            
            <CustomDropdown
              value={destinationFilter}
              onChange={setDestinationFilter}
              options={uniqueDestinations}
              defaultLabel="All Destinations"
            />

            <CustomDropdown
              value={agentFilter}
              onChange={setAgentFilter}
              options={uniqueAgents}
              defaultLabel="All Agents"
            />

            <CustomDropdown
              value={opsFilter}
              onChange={setOpsFilter}
              options={uniqueOps}
              defaultLabel="All OPS"
            />

            <CustomDropdown
              value={dmcFilter}
              onChange={setDmcFilter}
              options={uniqueDmcs}
              defaultLabel="All DMCs"
            />

            <div className="flex flex-col gap-2 sm:col-span-2 xl:col-span-6">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Booking Dates</label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      type="date"
                      value={bookingFromDate}
                      onChange={(e) => setBookingFromDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer text-slate-600"
                    />
                    <span className="text-slate-400 text-sm font-medium hidden sm:block">to</span>
                    <input
                      type="date"
                      value={bookingToDate}
                      onChange={(e) => setBookingToDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer text-slate-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Travel Dates</label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      type="date"
                      value={travelFromDate}
                      onChange={(e) => setTravelFromDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer text-slate-600"
                    />
                    <span className="text-slate-400 text-sm font-medium hidden sm:block">to</span>
                    <input
                      type="date"
                      value={travelToDate}
                      onChange={(e) => setTravelToDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer text-slate-600"
                    />
                  </div>
                </div>
                <div className="flex h-[38px] w-full lg:w-auto mt-1 lg:mt-0">
                  <button 
                    onClick={resetFilters}
                    className="w-full px-4 h-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-lg transition-colors flex items-center justify-center border border-slate-200 shadow-sm"
                    title="Reset All Filters"
                  >
                    <RotateCcw size={18} />
                    <span className="ml-2 lg:hidden text-sm font-semibold">Reset Filters</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex-1">
            <div className="overflow-x-auto h-full">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3">Query ID</th>
                    <th className="px-4 py-3">Booking Type</th>
                    <th className="px-4 py-3">Destination</th>
                    <th className="px-4 py-3">OPS</th>
                    <th className="px-4 py-3">Agent</th>
                    <th className="px-4 py-3">DMC</th>
                    <th className="px-4 py-3">Booking Date</th>
                    <th className="px-4 py-3">Travel Date</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Hotels</th>
                    <th className="px-4 py-3 text-center">Pax</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {currentEntries.length > 0 ? currentEntries.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td 
                        className="px-4 py-3 font-semibold text-indigo-600 cursor-pointer hover:text-indigo-800 hover:underline transition-colors"
                        onClick={() => handleViewDetails(row)}
                        title="View Details"
                      >
                        {row.id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-bold">
                          {row.bookingType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{row.destination}</td>
                      <td className="px-4 py-3">{row.ops}</td>
                      <td className="px-4 py-3 text-slate-600">{row.agent}</td>
                      <td className="px-4 py-3 text-slate-600">{row.dmc}</td>
                      <td className="px-4 py-3 text-slate-500">{row.bookingDate}</td>
                      <td className="px-4 py-3 text-slate-500">{row.travelDate}</td>
                      <td className="px-4 py-3">{row.duration} Nights</td>
                      <td className="px-4 py-3">{row.country}</td>
                      <td className="px-4 py-3">{row.city}</td>
                      <td className="px-4 py-3 max-w-[150px] truncate text-slate-500" title={row.hotels}>{row.hotels}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-600">{row.pax}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleViewDetails(row)}
                          className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="14" className="px-4 py-8 text-center text-slate-400">
                        {loading ? "Loading bookings..." : "No bookings found matching the selected filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {filteredData.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
                <div className="text-sm text-slate-500">
                  Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * entriesPerPage + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(currentPage * entriesPerPage, filteredData.length)}</span> of <span className="font-semibold text-slate-700">{filteredData.length}</span> entries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      // Simple logic to show limited pages if total is high
                      if (totalPages > 7) {
                        if (i !== 0 && i !== totalPages - 1 && Math.abs(currentPage - 1 - i) > 1) {
                          if (i === 1 || i === totalPages - 2) return <span key={i} className="px-1 text-slate-400">...</span>;
                          return null;
                        }
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${currentPage === i + 1 ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
              </motion.div>
            ) : (
              <motion.div
                key="chart-view"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <BookingChart bookingData={bookingData} />
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      {/* Query Details Modal */}
      <AnimatePresence>
        {selectedQuery && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      Query Details: {selectedQuery.id}
                      {modalLoading && (
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedQuery.bookingType} • {selectedQuery.agent}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedQuery(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5">
                {/* Meta Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><MapPin size={12}/> Destination</div>
                    <div className="text-sm font-semibold text-slate-800">{selectedQuery.destination}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Calendar size={12}/> Travel Date</div>
                    <div className="text-sm font-semibold text-slate-800">{selectedQuery.travelDate}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Users size={12}/> Passengers</div>
                    <div className="text-sm font-semibold text-slate-800">{selectedQuery.pax} Pax</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Value</div>
                    <div className="text-sm font-bold text-emerald-600">{selectedQuery.amount || "N/A"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">Operation Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">OPS Member:</span> <span className="font-medium text-slate-700">{selectedQuery.ops}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">DMC Partner:</span> <span className="font-medium text-slate-700">{selectedQuery.dmc}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Booking Date:</span> <span className="font-medium text-slate-700">{selectedQuery.bookingDate}</span></div>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">Location Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Country:</span> <span className="font-medium text-slate-700">{selectedQuery.country}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">City:</span> <span className="font-medium text-slate-700">{selectedQuery.city}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Duration:</span> <span className="font-medium text-slate-700">{selectedQuery.duration} Nights</span></div>
                    </div>
                  </div>
                </div>

                {/* Services List */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3">Included Services</h4>
                  <div className="space-y-3">
                    {selectedQuery.services && selectedQuery.services.length > 0 ? (
                      selectedQuery.services.map((service, idx) => (
                        <div key={idx} className="flex gap-4 items-start p-3 rounded-lg border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <div className="h-8 w-8 shrink-0 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                            {service.type === "Flight" && <Plane size={16} />}
                            {service.type === "Hotel" && <Hotel size={16} />}
                            {service.type === "Transfer" && <Car size={16} />}
                            {service.type === "Activity" && <Users size={16} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                                {service.type}
                              </span>
                              <h5 className="text-sm font-bold text-slate-800">{service.name}</h5>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{service.details}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-sm">
                        No detailed services listed for this query.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}