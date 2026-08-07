"use client";

import React from "react";
import NavBar from "@/components/layout/NavBar";
import BottomNav from "@/components/layout/BottomNav";
import ConnectivityBanner from "@/components/ConnectivityBanner";
import { useConnectivity } from "@/components/providers/ConnectivityProvider";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { showBanner } = useConnectivity();

  return (
    <div className="flex min-h-screen flex-col bg-black text-white selection:bg-neutral-800">
      <NavBar />

      {/* Spacers para elementos fijos y evitar superposición en mobile/desktop */}
      <div className="h-14 shrink-0" />
      <ConnectivityBanner />
      {showBanner && <div className="h-10 shrink-0" />}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-4 pb-28 md:pb-12">
        {children}
      </main>

      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}