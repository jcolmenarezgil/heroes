"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
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

function getInitialOnlineState() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function ConnectivityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOnline, setIsOnline] = useState(getInitialOnlineState);
  const [showBanner, setShowBanner] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      window.setTimeout(() => {
        setShowBanner(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const value = useMemo(
    () => ({ isOnline, showBanner }),
    [isOnline, showBanner]
  );

  return (
    <ConnectivityContext.Provider value={value}>
      {children}
    </ConnectivityContext.Provider>
  );
}
