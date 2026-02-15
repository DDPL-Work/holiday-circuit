import Header from "./header/Header";
import Sidebar from "./sidebar/Sidebar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-white p-8 overflow-y-auto ">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
