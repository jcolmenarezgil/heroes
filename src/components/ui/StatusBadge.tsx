import React from "react";
import { useTranslations } from "next-intl";

type ProfileStatus = "active" | "found" | "deceased";

interface StatusBadgeProps {
  status: ProfileStatus;
}

const statusStyles: Record<
  ProfileStatus,
  { container: string; key: string }
> = {
  active: {
    container: "rounded-md bg-green-700 px-2 py-1 text-sm font-medium text-white",
    key: "active",
  },
  found: {
    container: "rounded-md bg-yellow-600 px-2 py-1 text-sm font-medium text-white",
    key: "found",
  },
  deceased: {
    container: "rounded-md bg-red-700 px-2 py-1 text-sm font-medium text-white",
    key: "deceased",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations("profile.status");
  const style = statusStyles[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${style.container}`}
      title={t(style.key)}
    >
      <span
        className="h-2 w-2 rounded-full bg-current"
        aria-hidden="true"
      />
      {t(style.key)}
    </span>
  );
}
