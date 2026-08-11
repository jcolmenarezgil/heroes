"use client";

import React from "react";
import NavBar from "@/components/layout/NavBar";
import BottomNav from "@/components/layout/BottomNav";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import ConnectivityBanner from "@/components/ConnectivityBanner";
import { useConnectivity } from "@/components/providers/ConnectivityProvider";
import { useSession } from "next-auth/react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { showBanner } = useConnectivity();
  const { status } = useSession();
  // Hide the bottom nav for signed-out users; its links redirect to /login.
  const hideBottomNav = status === "unauthenticated";

  return (
    <div className="flex min-h-screen flex-col bg-black text-white selection:bg-neutral-800">
      <NavBar />

      <div className="h-14 shrink-0" />
      <ConnectivityBanner />
      {showBanner && <div className="h-10 shrink-0" />}

      <main
        className={`mx-auto w-full max-w-7xl flex-1 px-4 pt-4 ${
          hideBottomNav ? "pb-12" : "pb-28"
        } md:pb-12`}
      >
        <Breadcrumbs />
        {children}
      </main>

      {!hideBottomNav && (
        <div className="md:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  );
}