"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useConnectivity } from "@/components/providers/ConnectivityProvider";

export default function ConnectivityBanner() {
  const t = useTranslations("connectivity");
  const { isOnline, showBanner } = useConnectivity();

  if (!showBanner) return null;

  const isOnlineState = isOnline;
  const bg = isOnlineState ? "bg-green-950" : "bg-yellow-950";
  const text = isOnlineState ? "text-green-400" : "text-yellow-400";
  const message = isOnlineState ? t("online") : t("offline");

  return (
    <div
      className={`fixed inset-x-0 top-14 z-30 flex h-10 items-center justify-center text-sm font-medium ${bg} ${text}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
