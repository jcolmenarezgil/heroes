import React from "react";
import { useTranslations } from "next-intl";

interface VerifiedBadgeProps {
  verified: string | null;
  className?: string;
}

export default function VerifiedBadge({ verified, className }: VerifiedBadgeProps) {
  const t = useTranslations("profile");
  if (!verified) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-blue-950 px-2 py-0.5 text-xs font-medium text-blue-200 ring-1 ring-inset ring-blue-800 ${className ?? ""}`}
      title={t("verifiedTooltip")}
    >
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {t("verified")}
    </span>
  );
}