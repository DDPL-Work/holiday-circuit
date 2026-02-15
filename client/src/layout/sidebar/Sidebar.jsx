import { Link, NavLink } from "react-router-dom";
 import { FileQuestionMark, LayoutGrid,  CircleCheckBig , Wallet, ArrowDownToLine,  FileText,  LogOut} from "lucide-react";

const Sidebar = () => {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors duration-200 ${ isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800" }`;

  return (
    <aside className="w-64 bg-gray-900 flex flex-col justify-between border-t border-gray-800">
      {/* TOP MENU */}
      <nav className="p-4 space-y-2 ">
        <NavLink to="/agent/dashboard" className={linkClass}>
          <LayoutGrid size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/agent/queries" className={linkClass}>
          <FileQuestionMark size={18} />
          Queries
        </NavLink>

        <NavLink to="/agent/bookings" className={linkClass}>
          <CircleCheckBig size={18} />
          Active Bookings
        </NavLink>

        <NavLink to="/agent/documents" className={linkClass}>
          <FileText size={18} />
          Document Portal
        </NavLink>

        <NavLink to="/agent/finance" className={linkClass}>
          <Wallet size={18} />
          Finance
        </NavLink>

        <NavLink to="/agent/assets" className={linkClass}>
          <ArrowDownToLine size={18} />
          Asset Library
        </NavLink>
      </nav>

      {/* BOTTOM PROFILE (SAME AS SCREENSHOT) */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-4 cursor-pointer">
          <div className="h-9 w-9 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm">
            R
          </div>
          <div>
            <p className="text-sm text-white font-medium">
              Rahul Agent
            </p>
            <p className="text-xs text-gray-400">
              Travel World Pvt Ltd
            </p>
          </div>
        </div>
        <Link to="/">
        <button className="flex items-start cursor-pointer gap-1 px-15 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800">
          < LogOut size={16} />
          Log Out
        </button>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
