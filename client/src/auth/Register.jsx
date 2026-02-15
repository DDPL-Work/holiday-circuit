import { useState } from "react";
import { Link,} from "react-router-dom";
import image from "../assets/Image (Luxury Travel).svg";
import logo from "../assets/logo img.png";
import { ArrowRight } from "lucide-react";

export default function Register() {
  // const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  // ✅ After Successful Register → Go To Company Step
  //   useEffect(() => {
  //     if (user) {
  //       navigate("company");
  //     }
  //   }, [user, navigate]);

  return (
    <div className="h-screen flex">
      {/* LEFT SIDE IMAGE */}
      <div className="hidden lg:flex w-1/2 relative">
        <img src={image} alt="travel" className="w-full h-full object-cover" />

          <div className="absolute inset-0 bg-black/20"></div>

        <div className="absolute inset-0 bg-black/20 flex flex-col justify-end p-16 text-white">
          <h1 className="w-120 text-5xl font-bold leading-tight">
            One World. Countless Circuits.
          </h1>
          <p className="mt-6 text-lg opacity-90 max-w-lg">
            The premier B2B platform for travel professionals. Manage bookings,
            queries, and finance in one seamless experience.{" "}
          </p>
        </div>
      </div>

      {/* RIGHT SIDE FORM */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 relative">
        {/* LOGO */}
        <div className="flex justify-center mb-8 ">
          <img
            src={logo}
            alt="Company Logo"
            className="w-34 h-30 object-contain absolute top-20 left-31"
          />
        </div>
        <div className="w-full max-w-md bg-white p-8 rounded-2xl mt-20 ">
          <div className="text-left mb-1 ">
            <h2 className="text-3xl font-bold text-gray-800">
              Create an account
            </h2>
            <p className="text-gray-500 mt-2 mb-6 text-sm">
              Join our network of elite travel agents today
            </p>
          </div>

          {/* 🔴 Error */}
          {/* {error && <p className="text-red-500 text-sm mb-4">{error}</p>} */}

          <form className="space-y-5 ">
            <div>
              <label className="block text-md font-semibold mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-md font-semibold mb-1">Email</label>
              <input
                type="email"
                placeholder="client@agency.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-md font-semibold mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="*****************"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none"
                required
              />
            </div>
            <Link to="/">
            <button
              type="submit"
              className="w-full bg-[#0f172a] text-white py-3 rounded-2xl hover:bg-[#1e293b] transition cursor-pointer flex items-center justify-center gap-2"
            >
              Create Account <ArrowRight className="w-5 h-5 stroke-[1.8] "/>
            </button>
            </Link>

            <p className="text-center text-sm text-gray-500 mt-5 ">
              Already have an account?{" "}
              <Link to="/">
              <span
                className="text-blue-600 font-medium cursor-pointer"
              >
                Sign in
              </span>
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
