import React, { useState } from "react";
import AppRouter from "./routes";
import { Toaster, ToastBar, toast } from "react-hot-toast";
import CircuitLoader from "./components/CircuitLoader";
import "./App.css";

function App() {
  const [loading, setLoading] = useState(() => {
    const path = window.location.pathname.replace(/\/$/, "");
    return path === "" || path === "/register";
  });

  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={12}
        containerClassName="!z-[99999999]"
        containerStyle={{
          top: 24,
          right: 24,
          zIndex: 99999999,
        }}
        toastOptions={{
          duration: 3500,

          style: {
            background: "rgba(17, 24, 39, 0.90)", // dark glass
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            color: "#f9fafb",
            padding: "8px 14px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "500",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow:
              "0 20px 25px -5px rgba(0,0,0,0.35), 0 8px 10px -6px rgba(0,0,0,0.35)",
            maxWidth: "480px",
            textAlign: "left",
            display: "inline-flex",
            alignItems: "center",
            zIndex: 99999999,
          },

          success: {
            style: {
              background: "rgba(6, 78, 59, 0.85)", // green glass
              border: "1px solid rgba(34, 197, 94, 0.25)",
            },
            iconTheme: {
              primary: "#10b981", // emerald green
              secondary: "#fff",
            },
          },

          error: {
            style: {
              background: "rgba(127, 29, 29, 0.85)", // red glass
              border: "1px solid rgba(239, 68, 68, 0.25)",
            },
            iconTheme: {
              primary: "#f43f5e", // rose red
              secondary: "#fff",
            },
          },

          loading: {
            style: {
              background: "rgba(30, 41, 59, 0.85)", // slate blue glass
              border: "1px solid rgba(59, 130, 246, 0.25)",
            },
            iconTheme: {
              primary: "#3b82f6", // blue
              secondary: "#fff",
            },
          },
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {icon}
                  {message}
                </div>
                {t.type !== "loading" && (
                  <button
                    type="button"
                    onClick={() => toast.dismiss(t.id)}
                    className="ml-2 -mr-1 rounded-lg p-1 text-white/60 hover:text-white hover:bg-white/15 transition cursor-pointer flex items-center justify-center shrink-0"
                    title="Cancel / Close notification"
                    aria-label="Cancel notification"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </ToastBar>
        )}
      </Toaster>
      <AppRouter />
      {loading && <CircuitLoader onFinished={() => setLoading(false)} />}
    </>
  );
}

export default App;

