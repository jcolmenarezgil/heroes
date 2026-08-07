import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import StatusBadge from "./StatusBadge";
import VerifiedBadge from "./VerifiedBadge";
import AvatarPlaceholder from "./AvatarPlaceholder";

type ProfileStatus = "active" | "found" | "deceased";

interface ProfileCardProps {
  id: string;
  name: string;
  location: string;
  status: ProfileStatus;
  createdByName: string;
  updatedByName: string;
  createdAt: string;
  updatedAt: string;
  photoUrl?: string | null;
  verified?: string | null;
  onClick?: () => void;
}

export default function ProfileCard({
  name,
  location,
  status,
  createdByName,
  updatedByName,
  createdAt,
  updatedAt,
  photoUrl,
  verified,
  onClick,
}: ProfileCardProps) {
  const t = useTranslations("profile");

  return (
    <button
      onClick={onClick}
      className="grid w-full grid-cols-[56px_1fr_auto] items-start gap-3 p-4 text-left transition active:bg-neutral-900"
      aria-label={t("resultAria", { name })}
    >
      {photoUrl ? (
        <div className="relative aspect-square h-14 w-14 overflow-hidden rounded-md bg-neutral-900">
          <Image
            src={photoUrl}
            alt={name}
            fill
            sizes="56px"
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <AvatarPlaceholder size="sm" />
      )}

      <div className="flex min-w-0 flex-col">
        <span className="truncate text-base font-medium text-white">
          {name}
          {verified && (
            <span className="ml-1 align-middle">
              <VerifiedBadge verified={verified} />
            </span>
          )}
        </span>
        <span className="truncate text-sm text-neutral-400">{location}</span>
        <span className="truncate text-xs text-neutral-500">
          {t("createdBy", { name: createdByName, date: createdAt })}
        </span>
        <span className="truncate text-xs text-neutral-500">
          {t("updatedBy", { name: updatedByName, date: updatedAt })}
        </span>
      </div>

      <div className="flex-shrink-0 justify-self-end">
        <StatusBadge status={status} />
      </div>
    </button>
  );
}
