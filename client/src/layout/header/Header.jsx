import logo from "../../assets/logo img.png";

const Header = () => {
  return (
    <header className="h-20 bg-gray-900  border-b-gray-300 flex items-center px-8">
      {/* Left Logo */}
      <div className="flex items-center gap-3 border bg-white rounded-[50%] cursor-pointer" >
        <img src={logo} alt="Logo" className="h-14" />
      </div>

    </header>
  );
};

export default Header;
