import logo from "../../assets/logo img.png";

const Header = () => {
  return (
    <header className="h-16 bg-gray-900 border-b-gray-300 flex items-center px-10 ">
      {/* Left Logo */}
      <div className="flex items-center gap-3 border bg-[white] rounded-[15%] cursor-pointer" >
        <img src={logo} alt="Logo" className="w-18 h-13 rounded-[15%]"/>
      </div>

    </header>
  );
};

export default Header;