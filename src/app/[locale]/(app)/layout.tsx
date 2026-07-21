"use client";

import React from "react";
import NavBar from "@/components/layout/NavBar";
import ConnectivityBanner from "@/components/ConnectivityBanner";
import { useConnectivity } from "@/components/providers/ConnectivityProvider";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { showBanner } = useConnectivity();

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <NavBar />
      <ConnectivityBanner />
      <main
        className={`mx-auto w-full max-w-7xl flex-1 px-4 pb-24 transition-all ${
          showBanner ? "pt-32" : "pt-20"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
