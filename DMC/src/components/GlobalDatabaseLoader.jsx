import { useSyncExternalStore } from "react";
import RingLoader from "react-spinners/RingLoader";
import {
  getRequestLoaderSnapshot,
  subscribeToRequestLoader,
} from "../utils/requestLoader.js";

export default function GlobalDatabaseLoader({
  visible,
  scoped = false,
  label = "Loading",
}) {
  const globalVisible = useSyncExternalStore(
    subscribeToRequestLoader,
    getRequestLoaderSnapshot,
    getRequestLoaderSnapshot,
  );
  const isVisible = typeof visible === "boolean" ? visible : globalVisible;

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`hc-loader-backdrop ${scoped ? "hc-loader-backdrop--scoped" : ""}`}
    >
      <div className="hc-loader-shell">
        <div className="hc-loader-content">
          <RingLoader color="#dc2626" size={52} speedMultiplier={0.95} />

          <div className="hc-loader-copy">
            <h3>{label}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
