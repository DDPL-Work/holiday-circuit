import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../Redux/Thunks/authThunk";

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const { loading, error, user } = useSelector((state) => state.auth);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(registerUser(form));
  };

  // ✅ After Successful Register → Go To Company Step
  useEffect(() => {
    if (user) {
      navigate("company"); 

    }
  }, [user, navigate]);

  return (
    <div className="h-screen flex">

      {/* LEFT SIDE IMAGE */}
      <div className="hidden lg:flex w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
          alt="travel"
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-16 text-white">
          <h1 className="text-4xl font-bold mb-4">
            One World. Countless Circuits.
          </h1>
          <p className="text-lg opacity-90">
            The premier B2B platform for travel professionals.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE FORM */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">Create Account</h2>
            <p className="text-gray-500 mt-2">
              Register to access your dashboard
            </p>
          </div>

          {/* 🔴 Error */}
          {error && (
            <p className="text-red-500 text-sm mb-4">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm mb-1">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                placeholder="agent@agency.com"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0f172a] text-white py-3 rounded-xl hover:bg-[#1e293b] transition"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{" "}
              <span
                onClick={() => navigate("/")}
                className="text-blue-600 cursor-pointer"
              >
                Sign in
              </span>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}
