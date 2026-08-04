import React from "react";
import { useTranslations } from "next-intl";
import type { UserPhoneConfigInput } from "@/lib/validations/user";
import { StarIcon } from "@/components/icons";

interface PhoneListProps {
  phones: UserPhoneConfigInput[];
}

const labelOrder = ["emergency", "work", "personal", "other"] as const;

export default function PhoneList({ phones }: PhoneListProps) {
  const t = useTranslations("myProfile");

  if (phones.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        {t("emptyStates.noPhones")}
      </p>
    );
  }

  const sorted = [...phones].sort(
    (a, b) =>
      labelOrder.indexOf(a.label) - labelOrder.indexOf(b.label)
  );

  return (
    <ul className="space-y-2">
      {sorted.map((phone, index) => (
        <li
          key={index}
          className="flex items-center justify-between rounded-md border border-neutral-900 px-3 py-2"
        >
          <span className="text-base text-white">{phone.phoneNumber}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">
              {t(`phoneLabels.${phone.label}`)}
            </span>
            {phone.isPreferred && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-500">
                <StarIcon className="h-3.5 w-3.5" />
                {t("preferredPhone")}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
