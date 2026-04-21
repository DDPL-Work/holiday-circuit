import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import toast from "react-hot-toast";
import image from "../../../src/assets/Image (Luxury Travel).svg";
import logo from "../../assets/logo img.png";
import API from "../../utils/Api.js";
import CompanyDetails from "./CompanyDetails.jsx";
import KycVerification from "./KycVerification.jsx";
import RegisterStepper from "./RegisterStepper.jsx";
import VerificationOnline from "./VerificationOnline.jsx";

const TOTAL_STEPS = 3;

export default function Register() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationScreen, setShowVerificationScreen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    gstNumber: "",
    phone: "",
  });

  const formSubmit = async (documents = []) => {
    try {
      const fd = new FormData();

      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("password", form.password);
      fd.append("companyName", form.companyName);
      fd.append("gstNumber", form.gstNumber);
      fd.append("phone", form.phone);

      documents.forEach((file) => {
        fd.append("documents", file);
      });

      const res = await API.post("/auth/register", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Register Success:", res.data);
      toast.success("Agent successfully registered!");
      setShowVerificationScreen(true);
      return true;
    } catch (error) {
      console.log("Register Error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Registration failed");
      return false;
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
    <div className="max-h-screen flex flex-col overflow-hidden lg:flex-row">
      <div className="relative hidden lg:block lg:w-1/2">
        <img
          src={image}
          alt="Travel"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />

        <div className="absolute inset-0 flex flex-col justify-end bg-black/20 p-16 text-white">
          <h1 className="w-80 text-4xl font-bold leading-tight">
            One World. Countless Circuits.
          </h1>
          <p className="mt-6 max-w-lg text-md opacity-90">
            The premier B2B platform for travel professionals. Manage bookings,
            queries, and finance in one seamless experience.
          </p>
        </div>
      </div>

      <div className="flex w-full items-start justify-center bg-white px-10 py-10 lg:w-1/2 lg:items-center lg:py-0">
        <div className="flex w-full justify-center overflow-hidden">
          <div className="w-full max-w-md px-4 sm:max-w-lg sm:px-0 lg:max-w-xl">
            {showVerificationScreen ? (
              <VerificationOnline />
            ) : (
              <div
                className="flex min-h-fit transition-transform duration-500 ease-in-out lg:min-h-screen"
                style={{
                  width: `${TOTAL_STEPS * 100}%`,
                  transform: `translateX(-${((step - 1) * 100) / TOTAL_STEPS}%)`,
                }}
              >
                <div className="flex w-1/3 shrink-0 justify-center px-2 sm:px-0">
                  <div className="w-full">
                    <div className="mb-21 flex justify-center">
                      <img
                        src={logo}
                        alt="Logo"
                        className="absolute top-5 left-3 h-25 w-25 object-contain"
                      />
                    </div>

                    <div className="rounded-2xl bg-white p-3 sm:p-7">
                      <RegisterStepper currentStep={1} isActive={step === 1} />

                      <h2 className="text-3xl font-bold text-gray-800">
                        Create an account
                      </h2>
                      <p className="mt-1 mb-4 text-gray-500">
                        Join our network of elite travel agents today
                      </p>

                      <form
                        className="relative space-y-4"
                        onSubmit={(e) => {
                          e.preventDefault();

                          if (!validateStep1()) return;

                          toast.success("Step 1 completed");
                          setStep(2);
                        }}
                      >
                        <div>
                          <label className="text-md font-semibold">
                            Full Name <span className="text-red-700">*</span>
                          </label>
                          <div className="relative mt-1">
                            <User className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={form.name}
                              placeholder="John Doe"
                              onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                              }
                              className="w-full rounded-2xl border border-gray-300 py-2 pr-4 pl-11 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-md font-semibold">
                            Email <span className="text-red-700">*</span>
                          </label>
                          <div className="relative mt-1">
                            <Mail className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                              type="email"
                              value={form.email}
                              placeholder="client@agency.com"
                              onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                              }
                              className="w-full rounded-2xl border border-gray-300 py-2 pr-4 pl-11 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="relative">
                          <label className="text-md font-semibold">
                            Password <span className="text-red-700">*</span>
                          </label>
                          <Lock className="pointer-events-none absolute top-[calc(50%+14px)] left-4 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={form.password}
                            placeholder="************"
                            onChange={(e) =>
                              setForm({ ...form, password: e.target.value })
                            }
                            className="mt-1 w-full rounded-2xl border border-gray-300 py-2 pr-11 pl-11 focus:outline-none"
                          />
                          <span
                            className="absolute top-9 right-5 cursor-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <Eye className="h-5 w-5 stroke-[1.8] text-gray-500" />
                            ) : (
                              <EyeOff className="h-5 w-5 stroke-[1.8] text-gray-500" />
                            )}
                          </span>
                        </div>

                        <button
                          type="submit"
                          className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 py-2 text-white transition hover:bg-slate-800"
                        >
                          Create Account
                          <ArrowRight />
                        </button>

                        <p className="text-center text-sm text-gray-500">
                          Already have an account?{" "}
                          <Link to="/" className="font-medium text-blue-600">
                            Sign in
                          </Link>
                        </p>
                      </form>
                    </div>
                  </div>
                </div>

                <div className="flex w-1/3 shrink-0 justify-center px-2 sm:px-0">
                  <CompanyDetails
                    form={form}
                    setForm={setForm}
                    next={() => setStep(3)}
                    back={() => setStep(1)}
                    isActive={step === 2}
                  />
                </div>

                <div className="flex w-1/3 shrink-0 justify-center px-2 sm:px-0">
                  <KycVerification
                    back={() => setStep(2)}
                    submit={formSubmit}
                    isActive={step === 3}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
