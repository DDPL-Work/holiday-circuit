import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import API from "../../utils/Api.js";

export default function RegisterFlow() {
  const navigate = useNavigate();

  const [onboardingData, setOnboardingData] = useState({
    basic: {},
    company: {},
    kyc: {},
  });

  const updateStepData = (step, data) => {
    setOnboardingData((prev) => ({
      ...prev,
      [step]: data,
    }));
  };

  const submitRegistration = async () => {
    const payload = {
      ...onboardingData.basic,
      ...onboardingData.company,
      ...onboardingData.kyc,
    };

    console.log("FINAL PAYLOAD", payload);

    try {
      await API.post("/auth/register", payload);
      navigate("/login");
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  return (
    <Outlet
      context={{
        updateStepData,
        submitRegistration,
      }}
    />
  );
}
