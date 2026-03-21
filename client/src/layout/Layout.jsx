import Header from "./header/Header";
import Sidebar from "./sidebar/Sidebar";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const Layout = () => {
    const { user, loading } = useSelector((state) => state.auth);
      if (loading) return null;

  return (
    <div className="flex-1 flex flex-col">
       <Header />
      <div className="flex h-128.5 overflow-hidden">
         {user && <Sidebar user={user} />}
          <main className="flex-1 overflow-y-auto bg-gray-50 p-1 custom-scroll">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
