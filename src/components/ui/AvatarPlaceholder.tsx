import React from "react";
import { UserIcon } from "@/components/icons";

interface AvatarPlaceholderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: {
    container: "h-14 w-14",
    icon: "h-7 w-7",
  },
  md: {
    container: "h-24 w-24",
    icon: "h-12 w-12",
  },
  lg: {
    container: "h-40 w-40",
    icon: "h-20 w-20",
  },
};

export default function AvatarPlaceholder({
  size = "md",
  className = "",
}: AvatarPlaceholderProps) {
  const { container, icon } = sizes[size];

  return (
    <div
      className={`flex items-center justify-center rounded-md bg-neutral-900 text-neutral-500 ${container} ${className}`}
      aria-hidden="true"
    >
      <UserIcon className={icon} />
    </div>
  );
}
