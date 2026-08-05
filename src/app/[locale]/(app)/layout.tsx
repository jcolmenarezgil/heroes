"use client";

import React from "react";
import NavBar from "@/components/layout/NavBar";
import BottomNav from "@/components/layout/BottomNav";
import ConnectivityBanner from "@/components/ConnectivityBanner";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-black text-neutral-50 selection:bg-neutral-800">
      <ConnectivityBanner />

      <NavBar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-4 pb-24 md:pb-8">
        {children}
      </main>

      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}