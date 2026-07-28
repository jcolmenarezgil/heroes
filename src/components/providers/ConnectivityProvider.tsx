"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

type ConnectivityContextValue = {
  isOnline: boolean;
  showBanner: boolean;
};

const ConnectivityContext = createContext<ConnectivityContextValue>({
  isOnline: true,
  showBanner: false,
});

export function useConnectivity() {
  return useContext(ConnectivityContext);
}

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

// During SSR and hydration we assume "online" so the server-rendered HTML
// always matches the first client render; React re-renders with the real
// value right after hydration.
function getServerSnapshot() {
  return true;
}

export function ConnectivityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isOnline = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const [onlineFlash, setOnlineFlash] = useState(false);

  // Brief "back online" flash, driven by the browser event only.
  useEffect(() => {
    const handleOnline = () => {
      setOnlineFlash(true);
      window.setTimeout(() => setOnlineFlash(false), 3000);
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const value = useMemo(
    () => ({
      isOnline,
      // banner is persistent while offline, transient when back online
      showBanner: !isOnline || onlineFlash,
    }),
    [isOnline, onlineFlash]
  );

  return (
    <ConnectivityContext.Provider value={value}>
      {children}
    </ConnectivityContext.Provider>
  );
}
