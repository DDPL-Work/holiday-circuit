import { Download, FileText, Image as ImageIcon, Search } from "lucide-react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
};

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
};

const AssetLibrary = () => {
  return (
    <motion.section
      className="space-y-5"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.header
        variants={item}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">Asset Library</h1>
          <p className="text-sm text-gray-500">
            Download vouchers, invoices, and marketing materials.
          </p>
        </div>

        <motion.div
          variants={item}
          className="relative"
        >
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search files..."
            className="pl-9 pr-4 py-2 text-sm outline-none border border-gray-300 rounded-2xl"
          />
        </motion.div>
      </motion.header>

      {/* Asset Grid */}
      <motion.div
        variants={container}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Card 1 */}
        <motion.article
          variants={item}
          whileHover={{ y: -6 }}
          className="shadow-sm rounded-xl p-5 flex flex-col items-center text-center gap-4 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <FileText size={22} className="text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-xs">Maldives_Marketing_Kit.zip</p>
            <p className="text-xs text-gray-500 mt-1">45 MB • 10 Feb 2026</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-sm flex items-center gap-2 text-gray-600"
          >
            <Download size={16} />
            Download
          </motion.button>
        </motion.article>

        {/* Card 2 */}
        <motion.article variants={item} whileHover={{ y: -6 }} className="shadow-sm rounded-xl p-5 flex flex-col items-center text-center gap-4 cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <FileText size={22} className="text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-xs">Dubai_Itinerary_Template.pdf</p>
            <p className="text-xs text-gray-500 mt-1">2.4 MB • 08 Feb 2026</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-sm flex items-center gap-2 text-gray-600">
            <Download size={16} />
            Download
          </motion.button>
        </motion.article>

        {/* Card 3 */}
        <motion.article variants={item} whileHover={{ y: -6 }} className="shadow-sm rounded-xl p-5 flex flex-col items-center text-center gap-4 cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <FileText size={22} className="text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-xs">Hotel_Voucher_Sample.pdf</p>
            <p className="text-xs text-gray-500 mt-1">1.1 MB • 01 Feb 2026</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-sm flex items-center gap-2 text-gray-600">
            <Download size={16} />
            Download
          </motion.button>
        </motion.article>

        {/* Card 4 */}
        <motion.article variants={item} whileHover={{ y: -6 }} className="shadow-sm rounded-xl p-5 flex flex-col items-center text-center gap-4 cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <FileText size={22} className="text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-xs">Agency_Agreement_2026.pdf</p>
            <p className="text-xs text-gray-500 mt-1">5.6 MB • 15 Jan 2026</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-sm flex items-center gap-2 text-gray-600">
            <Download size={16} />
            Download
          </motion.button>
        </motion.article>

        {/* Card 5 */}
        <motion.article variants={item} whileHover={{ y: -6 }} className="shadow-sm rounded-xl p-5 flex flex-col items-center text-center gap-4 cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <ImageIcon size={22} className="text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-xs">Promo_Banners_Summer.png</p>
            <p className="text-xs text-gray-500 mt-1">8.2 MB • 12 Jan 2026</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-sm flex items-center gap-2 text-gray-600">
            <Download size={16} />
            Download
          </motion.button>
        </motion.article>

        {/* Card 6 */}
        <motion.article variants={item} whileHover={{ y: -6 }} className="shadow-sm rounded-xl p-5 flex flex-col items-center text-center gap-4 cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <FileText size={22} className="text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-xs">Invoice_INV-2025-001.pdf</p>
            <p className="text-xs text-gray-500 mt-1">0.4 MB • 20 Dec 2025</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-sm flex items-center gap-2 text-gray-600">
            <Download size={16} />
            Download
          </motion.button>
        </motion.article>
      </motion.div>
    </motion.section>
  );
};

export default AssetLibrary;