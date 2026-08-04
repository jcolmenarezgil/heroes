import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { TrashIcon, StarIcon } from "@/components/icons";
import type { UserPhoneConfigInput } from "@/lib/validations/user";

interface PhoneNumbersEditorProps {
  value: UserPhoneConfigInput[];
  onChange: (phones: UserPhoneConfigInput[]) => void;
  error?: string;
}

const LABELS: UserPhoneConfigInput["label"][] = [
  "personal",
  "work",
  "emergency",
  "other",
];

export default function PhoneNumbersEditor({
  value,
  onChange,
  error,
}: PhoneNumbersEditorProps) {
  const t = useTranslations("myProfile");

  const handleAdd = () => {
    const next = value.length === 0;
    onChange([
      ...value,
      { phoneNumber: "", label: "personal", isPreferred: next },
    ]);
  };

  const handleRemove = (index: number) => {
    const removed = value[index];
    const updated = value.filter((_, i) => i !== index);
    if (removed.isPreferred && updated.length > 0) {
      updated[0].isPreferred = true;
    }
    onChange(updated);
  };

  const handleChange = (
    index: number,
    field: keyof UserPhoneConfigInput,
    newValue: string | boolean
  ) => {
    onChange(
      value.map((phone, i) => {
        if (i !== index) return phone;
        if (field === "isPreferred") {
          return { ...phone, isPreferred: newValue as boolean };
        }
        if (field === "label") {
          return { ...phone, label: newValue as UserPhoneConfigInput["label"] };
        }
        return { ...phone, phoneNumber: newValue as string };
      })
    );
  };

  return (
    <div className="space-y-3">
      {value.map((phone, index) => (
        <div
          key={index}
          className="grid grid-cols-1 gap-3 rounded-md border border-neutral-900 p-3 sm:grid-cols-[1fr_auto_auto_auto]"
        >
          <Input
            type="tel"
            value={phone.phoneNumber}
            onChange={(e) =>
              handleChange(index, "phoneNumber", e.target.value)
            }
            placeholder={t("placeholders.phone")}
            aria-label={t("fields.phoneNumber")}
          />
          <Select
            value={phone.label}
            onChange={(e) =>
              handleChange(
                index,
                "label",
                e.target.value as UserPhoneConfigInput["label"]
              )
            }
            options={LABELS.map((label) => ({
              value: label,
              label: t(`phoneLabels.${label}`),
            }))}
            aria-label={t("fields.phoneLabel")}
          />
          <label className="flex items-center gap-2 text-sm text-white">
            <input
              type="radio"
              name="preferred-phone"
              checked={phone.isPreferred}
              onChange={() => {
                onChange(
                  value.map((p, i) => ({
                    ...p,
                    isPreferred: i === index,
                  }))
                );
              }}
              className="h-4 w-4 accent-white"
              aria-label={t("fields.preferredPhone")}
            />
            <StarIcon className="h-4 w-4 text-yellow-500" />
          </label>
          <button
            type="button"
            onClick={() => handleRemove(index)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-red-500 hover:bg-red-950"
            aria-label={t("actions.removePhone")}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        onClick={handleAdd}
        className="w-auto"
      >
        {t("actions.addPhone")}
      </Button>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
