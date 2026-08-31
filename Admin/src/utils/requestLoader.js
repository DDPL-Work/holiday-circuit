const SHOW_DELAY_MS = 180;
const MIN_VISIBLE_MS = 320;

let activeTrackedRequests = 0;
let isVisible = false;
let visibleSince = 0;
let showTimer = null;
let hideTimer = null;

const listeners = new Set();

const now = () =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();

const emit = () => {
  listeners.forEach((listener) => listener());
};

const setVisible = (nextVisible) => {
  if (isVisible === nextVisible) return;

  isVisible = nextVisible;
  visibleSince = nextVisible ? now() : 0;
  emit();
};

const clearTimers = () => {
  if (showTimer) {
    window.clearTimeout(showTimer);
    showTimer = null;
  }

  if (hideTimer) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
};

const shouldTrackRequest = (config = {}) => {
  if (config?.skipGlobalLoader) {
    return false;
  }

  if (config?.showGlobalLoader === true) {
    return true;
  }

  return false;
};

export const beginTrackedRequest = (config = {}) => {
  if (!shouldTrackRequest(config)) {
    return config;
  }

  config.__trackedByGlobalLoader = true;
  activeTrackedRequests += 1;

  if (hideTimer) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }

  if (!isVisible && !showTimer) {
    showTimer = window.setTimeout(() => {
      showTimer = null;
      if (activeTrackedRequests > 0) {
        setVisible(true);
      }
    }, SHOW_DELAY_MS);
  }

  emit();
  return config;
};

export const finishTrackedRequest = (config = {}) => {
  if (!config?.__trackedByGlobalLoader) {
    return;
  }

  config.__trackedByGlobalLoader = false;
  activeTrackedRequests = Math.max(0, activeTrackedRequests - 1);

  if (activeTrackedRequests > 0) {
    emit();
    return;
  }

  if (showTimer) {
    window.clearTimeout(showTimer);
    showTimer = null;
  }

  if (!isVisible) {
    emit();
    return;
  }

  const remainingVisibleTime = Math.max(
    0,
    MIN_VISIBLE_MS - Math.max(0, now() - visibleSince),
  );

  hideTimer = window.setTimeout(() => {
    hideTimer = null;
    if (activeTrackedRequests === 0) {
      setVisible(false);
    }
  }, remainingVisibleTime);
};

export const subscribeToRequestLoader = (listener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const getRequestLoaderSnapshot = () => isVisible;

export const getActiveTrackedRequestCount = () => activeTrackedRequests;

export const resetRequestLoader = () => {
  activeTrackedRequests = 0;
  clearTimers();
  setVisible(false);
};
