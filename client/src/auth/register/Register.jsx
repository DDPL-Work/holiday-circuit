import { useState } from "react";
import { Link } from "react-router-dom";
import image from "../../../src/assets/Image (Luxury Travel).svg";
import logo from "../../assets/logo img.png";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import API from "../../utils/Api.js";
import CompanyDetails from "./CompanyDetails.jsx";
import KycVerification from "./KycVerification.jsx";
import VerificationOnline from "./VerificationOnline.jsx";
import toast from "react-hot-toast";

export default function Register() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

  // 🔒 FORM STATE (SAFE)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    gstNumber: "",
    phone: "",
    documents: [],
  });

  // 🔒 SUBMIT LOGIC (SAFE)
  const formSubmit = async () => {
    try {
      const fd = new FormData();

      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("password", form.password);
      fd.append("companyName", form.companyName);
      fd.append("gstNumber", form.gstNumber);
      fd.append("phone", form.phone);

      // 👇 MOST IMPORTANT
      form.documents.forEach((file) => {
        fd.append("documents", file);
      });

      console.log("FORMDATA PREVIEW:");

      for (let pair of fd.entries()) {
        console.log(pair[0], pair[1]);
      }

      //-------------------- Api Call----------------

      const res = await API.post("/auth/register", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Register Success:", res.data);
      toast.success("Agent Successfully Register!");
    } catch (error) {
      console.log("Register Error:", error.response?.data || error.message);
    }
  };

  const validateStep1 = () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return false;
    }

    if (!/^[A-Za-z ]{3,}$/.test(form.name)) {
      toast.error("Enter a valid name");
      return false;
    }

    if (!form.email.trim()) {
      toast.error("Email is required");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Invalid email address");
      return false;
    }

    if (!form.password || form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }
    return true;
  };
  return (
    <div className="max-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* ================= LEFT SIDE ================= */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src={image}
          alt="Travel"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />

        <div className="absolute inset-0 bg-black/20 flex flex-col justify-end p-16 text-white">
          <h1 className="w-80 text-4xl font-bold leading-tight">
            One World. Countless Circuits.
          </h1>
          <p className="mt-6 text-md opacity-90 max-w-lg">
            The premier B2B platform for travel professionals. Manage bookings,
            queries, and finance in one seamless experience.{" "}
          </p>
        </div>
      </div>

      {/* ================= RIGHT SIDE ================= */}
      <div className="w-full lg:w-1/2 flex items-start lg:items-center justify-center bg-white py-10 px-10 lg:py-0">
        <div className="w-full flex justify-center overflow-hidden">
          <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl px-4 sm:px-0">
            {/* ===== SLIDER ===== */}
            <div
              className="flex transition-transform duration-500 ease-in-out min-h-fit lg:min-h-screen"
              style={{
                width: "400%",
                transform: `translateX(-${(step - 1) * 25}%)`,
              }}
            >
              {/* ================= STEP 1 ================= */}
              <div className="w-1/4 shrink-0 flex justify-center px-2 sm:px-0">
                <div className="w-full ">
                  <div className=" flex justify-center mb-21">
                    <img
                      src={logo}
                      alt="Logo"
                      className="w-25 h-25 object-contain absolute top-5 left-3"
                    />
                  </div>

                  <div className="bg-white p-3 sm:p-7 rounded-2xl">
                    <h2 className="text-3xl font-bold text-gray-800">
                      Create an account
                    </h2>
                    <p className="text-gray-500 mt-1 mb-4">
                      Join our network of elite travel agents today
                    </p>

                    <form
                      className="space-y-4 relative"
                      onSubmit={(e) => {
                        e.preventDefault();

                        if (!validateStep1()) return;

                        toast.success("Step 1 completed");
                        setStep(2);
                      }}
                    >
                      <div className="">
                        <label className="text-md font-semibold">
                          Full Name <span className="text-red-700">*</span>
                        </label>
                        <div className="relative mt-1">
                          <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="John Doe"
                            onChange={(e) =>
                              setForm({ ...form, name: e.target.value })
                            }
                            className="w-full rounded-2xl border border-gray-300 py-2 pl-11 pr-4 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-md font-semibold">
                          Email <span className="text-red-700">*</span>
                        </label>
                        <div className="relative mt-1">
                          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            type="email"
                            placeholder="client@agency.com"
                            onChange={(e) =>
                              setForm({ ...form, email: e.target.value })
                            }
                            className="w-full rounded-2xl border border-gray-300 py-2 pl-11 pr-4 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="relative">
                        <label className="text-md font-semibold">
                          Password <span className="text-red-700">*</span>
                        </label>
                        <Lock className="pointer-events-none absolute left-4 top-[calc(50%+14px)] h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="************"
                          onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                          }
                          className="w-full mt-1 rounded-2xl border border-gray-300 py-2 pl-11 pr-11 focus:outline-none"
                        />
                        <span
                          className="absolute top-9 right-5 cursor-pointer"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <Eye className="w-5 h-5 stroke-[1.8] text-gray-500" />
                          ) : (
                            <EyeOff className="w-5 h-5 stroke-[1.8] text-gray-500" />
                          )}
                        </span>
                      </div>
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2 rounded-xl hover:bg-slate-800 transition cursor-pointer mt-4"
                      >
                        Create Account
                        <ArrowRight />
                      </button>

                      <p className="text-center text-sm text-gray-500">
                        Already have an account?{" "}
                        <Link to="/" className="text-blue-600 font-medium">
                          Sign in
                        </Link>
                      </p>
                    </form>
                  </div>
                </div>
              </div>


              {/* ================= STEP 2 ================= */}
              <div className="w-1/4 shrink-0 flex justify-center px-2 sm:px-0">
                <CompanyDetails
                  form={form}
                  setForm={setForm}
                  next={() => setStep(3)}
                  back={() => setStep(1)}
                />
              </div>

              {/* ================= STEP 3 ================= */}
              <div className="w-1/4 shrink-0 flex justify-center px-2 sm:px-0">
                <KycVerification
                  form={form}
                  setForm={setForm}
                  next={() => setStep(4)}
                  back={() => setStep(2)}
                  submit={formSubmit}
                />
              </div>

              {/* ================= STEP 4 ================= */}
              <div className="w-1/4 shrink-0 flex justify-center px-2 sm:px-0">
                <VerificationOnline
                  form={form}
                  setForm={setForm}
                  back={() => setStep(3)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


