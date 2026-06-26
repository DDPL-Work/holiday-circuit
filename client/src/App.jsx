import AppRouter from "./routes";
import { Toaster } from "react-hot-toast";
import "./App.css";

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={12}
        containerClassName="z-[999999]"
        containerStyle={{
          top: 80,
          right: 24,
        }}
        toastOptions={{
          duration: 3500,

          style: {
            background: "rgba(17, 24, 39, 0.85)", // dark glass
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
            maxWidth: "360px",
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
      />
      <AppRouter />
    </>
  );
}

export default App;
