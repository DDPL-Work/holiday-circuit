import { useSyncExternalStore } from "react";
import RingLoader from "react-spinners/RingLoader";
import {
  getRequestLoaderSnapshot,
  subscribeToRequestLoader,
} from "../utils/requestLoader.js";

export default function GlobalDatabaseLoader() {
  const isVisible = useSyncExternalStore(
    subscribeToRequestLoader,
    getRequestLoaderSnapshot,
    getRequestLoaderSnapshot,
  );

  if (!isVisible) {
    return null;
  }

  return (
    <div className="hc-loader-backdrop">
      <div className="hc-loader-shell">
        <div className="hc-loader-content">
          <RingLoader color="#5eead4" size={52} speedMultiplier={0.95} />

          <div className="hc-loader-copy">
            <h3>Loading</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
