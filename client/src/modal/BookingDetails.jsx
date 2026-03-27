import {
  X,
  Calendar,
  MapPin,
  Users,
  CircleCheck,
  CircleX,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BookingDecisionModal from "./BookingDecisionModal";

export default function BookingDetailsModal({refresh, booking, onClose }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState("accept");

  const handleClose = () => {
  setOpen(false);

  setTimeout(() => {
    onClose(); 
  }, 200); 
};

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const getDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate - startDate;
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const days = nights + 1;
    return `${days}D / ${nights}N`;
  };

  const totalPax =
    (booking.numberOfAdults || 0) + (booking.numberOfChildren || 0);

  /* animations */
  const backdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modal = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.25, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: { duration: 0.2 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  };

  const status = booking?.opsStatus?.replace("_", " ") || "New Query";

  return (
    <AnimatePresence>
      {open && booking && (
        <>
          {/* BACKDROP */}
          <motion.div
            variants={backdrop}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 z-40
            bg-linear-to-br from-black/70 via-black/60 to-black/80
            backdrop-blur-md"
            onClick={handleClose}
          />

          {/* MODAL WRAPPER */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* MODAL */}
            <motion.div
              variants={modal}
              className="relative bg-white w-130 rounded-2xl shadow-2xl p-6"
            >
              {/* CLOSE */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            

              {/* HEADER */}
              <motion.h2
                variants={item}
                className="text-sm font-semibold text-slate-900 mb-2"
              >
                Booking Details - {booking.queryId}
              </motion.h2>

              <motion.div
                variants={item}
                className="flex gap-2 mb-3"
              >
                <span className="flex items-center border gap-1 px-2 py-1.5 rounded-full bg-purple-100 text-purple-600 text-xs">
                  <Clock className="w-3 h-3 mt-0.5" />
                  {status}
                </span>
                <p className="text-xs text-[#62748E] mt-1">
                  Created : {formatDate(booking.createdAt)}
                </p>
              </motion.div>

              {/* DETAILS GRID */}
              <motion.div
                className="grid grid-cols-2 gap-4 text-sm text-slate-700"
                initial="hidden"
                animate="visible"
                transition={{ staggerChildren: 0.08 }}
              >
                <motion.div variants={item}>
                  <p className="text-xs text-gray-400">Agent Name</p>
                  <p>{booking.agent.name}</p>
                </motion.div>

                <motion.div variants={item}>
                  <p className="text-xs text-gray-400">Destination</p>
                  <p className="flex items-center gap-1">
                    <MapPin size={14} /> {booking.destination}
                  </p>
                </motion.div>

                <motion.div variants={item}>
                  <p className="text-xs text-gray-400">Travel Date</p>
                  <p className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(booking.startDate)} –{" "}
                    {formatDate(booking.endDate)}
                  </p>
                </motion.div>

                <motion.div variants={item}>
                  <p className="text-xs text-gray-400">Duration</p>
                  <p>
                    {getDuration(
                      booking.startDate,
                      booking.endDate
                    )}
                  </p>
                </motion.div>

                <motion.div variants={item}>
                  <p className="text-xs text-gray-400">
                    Number of Passengers
                  </p>
                  <p className="flex items-center gap-1">
                    <Users size={14} /> {totalPax} PAX
                  </p>
                </motion.div>

                <motion.div variants={item}>
                  <p className="text-xs text-gray-400">
                    Estimated Value
                  </p>
                  <p className="text-green-600 font-semibold">
                    ₹ {booking.customerBudget}
                  </p>
                </motion.div>
              </motion.div>

              {/* ACTIONS */}
              <motion.div
                variants={item}
                className="flex justify-end gap-3 mt-6"
              >
                <button
                  onClick={() => {
                    setMode("reject");
                    setIsModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl flex items-center gap-1 border
                  text-sm text-red-600 hover:bg-red-50 transition cursor-pointer"
                >
                  <CircleX className="w-4 h-4" />
                  Reject
                </button>

                <button
                  onClick={() => {setMode("accept"); setIsModalOpen(true);}}
                  className="px-3 py-1.5 rounded-xl flex items-center gap-1
                  bg-green-600 text-white text-sm hover:bg-green-700
                  transition hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                >
                  <CircleCheck className="w-4 h-4" />
                  Accept
                </button>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* ACCEPT / REJECT MODAL */}
          <BookingDecisionModal 
  isOpen={isModalOpen} 
  mode={mode}    
  refresh={async () => {
    await refresh();   // parent refresh
  }}  
  queryId={booking._id}  
  onClose={() => {
    setIsModalOpen(false);
    handleClose();
  }}
/>
        </>
      )}
    </AnimatePresence>
  );
}