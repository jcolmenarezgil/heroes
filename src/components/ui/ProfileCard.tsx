import React from "react";
import { useTranslations } from "next-intl";
import StatusBadge from "./StatusBadge";
import AvatarPlaceholder from "./AvatarPlaceholder";

type ProfileStatus = "active" | "found" | "deceased";

interface ProfileCardProps {
  id: string;
  name: string;
  location: string;
  updatedAt: string;
  status: ProfileStatus;
  photoUrl?: string | null;
  onClick?: () => void;
}

export default function ProfileCard({
  name,
  location,
  updatedAt,
  status,
  photoUrl,
  onClick,
}: ProfileCardProps) {
  const t = useTranslations("home");

  return (
    <button
      onClick={onClick}
      className="grid w-full grid-cols-[56px_1fr_auto] items-center gap-3 p-4 text-left transition active:bg-neutral-900"
      aria-label={t("resultAria", { name })}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={name}
          className="aspect-square h-14 w-14 rounded-md bg-neutral-900 object-cover"
        />
      ) : (
        <AvatarPlaceholder size="sm" />
      )}

      <div className="flex min-w-0 flex-col">
        <span className="truncate text-base font-medium text-white">
          {name}
        </span>
        <span className="truncate text-sm text-neutral-400">
          {location} · {updatedAt}
        </span>
      </div>

      <div className="flex-shrink-0 justify-self-end">
        <StatusBadge status={status} />
      </div>
    </button>
  );
}
