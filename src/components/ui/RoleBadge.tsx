import React from "react";
import { useTranslations } from "next-intl";

type Role = "viewer" | "rescuer" | "admin";

interface RoleBadgeProps {
  role: Role;
}

const roleStyles: Record<Role, { container: string; key: string }> = {
  viewer: {
    container:
      "rounded-md bg-neutral-700 px-2 py-1 text-sm font-medium text-white",
    key: "viewer",
  },
  rescuer: {
    container:
      "rounded-md bg-blue-700 px-2 py-1 text-sm font-medium text-white",
    key: "rescuer",
  },
  admin: {
    container:
      "rounded-md bg-amber-600 px-2 py-1 text-sm font-medium text-white",
    key: "admin",
  },
};

export default function RoleBadge({ role }: RoleBadgeProps) {
  const t = useTranslations("admin.roles");
  const style = roleStyles[role];

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
