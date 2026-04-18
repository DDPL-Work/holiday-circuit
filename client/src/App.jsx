import AppRouter from "./routes";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
   <Toaster 
        position="top-right"
        reverseOrder={false}
        gutter={12}
        containerClassName="z-[999999]"
        toastOptions={{
        duration: 2000,

          style: {
            background: "#111827", // dark slate
            color: "#fff",
            padding: "9px 16px",
            borderRadius: "12px",
            fontSize: "14px",
            boxShadow:
              "0 10px 25px -5px rgba(0,0,0,0.25), 0 8px 10px -6px rgba(0,0,0,0.2)",
          },

          success: {
            iconTheme: {
              primary: "#22c55e", // green
              secondary: "#fff",
            },
          },

          error: {
            iconTheme: {
              primary: "#ef4444", // red
              secondary: "#fff",
            },
          },

          loading: {
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
