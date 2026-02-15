import { Download, FileText, Image as ImageIcon, Search } from "lucide-react";

const AssetLibrary = () => {
  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asset Library</h1>
          <p className="text-sm text-gray-500">
            Download vouchers, invoices, and marketing materials.
          </p>
        </div>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search files..."
            className="pl-9 pr-4 py-2 text-sm outline-none border border-gray-300 rounded-2xl"
          />
        </div>
      </header>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card */}
        <article className="shadow-sm rounded-xl p-5 flex flex-col items-center text-center gap-4 cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center cursor-pointer ">
            <FileText
              size={22}
              className="text-gray-500 transition-colors duration-200 hover:text-blue-600 "
            />
          </div>
          <div>
            <p className="font-medium text-sm">Maldives_Marketing_Kit.zip</p>
            <p className="text-xs text-gray-500 mt-1">45 MB • 10 Feb 2026</p>
          </div>
          <button className="text-sm flex items-center gap-2 text-gray-600 cursor-pointer">
            <Download size={16} />
            Download
          </button>
        </article>

        <article className="shadow-sm rounded-xl p-5 flex flex-col items-center text-center gap-4 cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <FileText
              size={22}
              className="text-gray-500 transition-colors duration-200 hover:text-blue-600"
            />
          </div>
          <div>
            <p className="font-medium text-sm">Dubai_Itinerary_Template.pdf</p>
            <p className="text-xs text-gray-500 mt-1">2.4 MB • 08 Feb 2026</p>
          </div>
          <button className="text-sm flex items-center gap-2 text-gray-600 cursor-pointer">
            <Download size={16} />
            Download
          </button>
        </article>

        <article className="shadow-sm rounded-xl p-5 flex flex-col items-center text-center gap-4 cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <FileText
              size={22}
              className="text-gray-500 transition-colors duration-200 hover:text-blue-600"
            />
          </div>
          <div>
            <p className="font-medium text-sm">Hotel_Voucher_Sample.pdf</p>
            <p className="text-xs text-gray-500 mt-1">1.1 MB • 01 Feb 2026</p>
          </div>
          <button className="text-sm flex items-center gap-2 text-gray-600 cursor-pointer">
            <Download size={16} />
            Download
          </button>
        </article>

        <article className="shadow-sm rounded-xl p-5 flex flex-col items-center text-center gap-4 cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <FileText
              size={22}
              className="text-gray-500 transition-colors duration-200 hover:text-blue-600"
            />
          </div>
          <div>
            <p className="font-medium text-sm">Agency_Agreement_2026.pdf</p>
            <p className="text-xs text-gray-500 mt-1">5.6 MB • 15 Jan 2026</p>
          </div>
          <button className="text-sm flex items-center gap-2 text-gray-600 cursor-pointer">
            <Download size={16} />
            Download
          </button>
        </article>

        <article className="shadow-sm rounded-xl p-5 flex flex-col items-center text-center gap-4 cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <ImageIcon
              size={22}
              className="text-gray-500 transition-colors duration-200 hover:text-blue-600"
            />
          </div>
          <div>
            <p className="font-medium text-sm">Promo_Banners_Summer.png</p>
            <p className="text-xs text-gray-500 mt-1">8.2 MB • 12 Jan 2026</p>
          </div>
          <button className="text-sm flex items-center gap-2 text-gray-600 cursor-pointer">
            <Download size={16} />
            Download
          </button>
        </article>

        <article className="shadow-sm rounded-xl p-5 flex flex-col items-center text-center gap-4 cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <FileText
              size={22}
              className="text-gray-500 transition-colors duration-200 hover:text-blue-600"
            />
          </div>
          <div>
            <p className="font-medium text-sm">Invoice_INV-2025-001.pdf</p>
            <p className="text-xs text-gray-500 mt-1">0.4 MB • 20 Dec 2025</p>
          </div>
          <button className="text-sm flex items-center gap-2 text-gray-600 cursor-pointer">
            <Download size={16} />
            Download
          </button>
        </article>
      </div>
    </section>
  );
};

export default AssetLibrary;
