"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import PhoneNumbersEditor from "@/components/ui/PhoneNumbersEditor";
import type { UserDTO } from "@/types/user";
import type { UpdateUserInput } from "@/lib/validations/user";

interface UserFormProps {
  initialData: UserDTO;
  onSubmit: (data: UpdateUserInput) => Promise<void>;
  submitLabel: string;
  cancelHref?: string;
}

const GENDERS = ["male", "female"] as const;

export default function UserForm({
  initialData,
  onSubmit,
  submitLabel,
  cancelHref = "/me",
}: UserFormProps) {
  const t = useTranslations("myProfile");

  const [fullName, setFullName] = useState(initialData.fullName);
  const [name, setName] = useState(initialData.name ?? "");
  const [dob, setDob] = useState(initialData.dob ?? "");
  const [gender, setGender] = useState<"male" | "female" | "">(
    initialData.gender ?? ""
  );
  const [phoneNumbers, setPhoneNumbers] = useState(initialData.phoneNumbers);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const genderOptions = [
    { value: "", label: t("gender.unspecified") },
    ...GENDERS.map((value) => ({
      value,
      label: t(`gender.${value}`),
    })),
  ];

  const validate = () => {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = t("validation.fullNameRequired");
    if (!name.trim()) next.name = t("validation.nameRequired");

    const invalidPhone = phoneNumbers.some(
      (p) => !p.phoneNumber.trim()
    );
    if (invalidPhone) next.phoneNumbers = t("validation.phoneNumberRequired");

    const preferredCount = phoneNumbers.filter((p) => p.isPreferred).length;
    if (preferredCount > 1) next.phoneNumbers = t("validation.onePreferred");

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        fullName,
        name,
        dob: dob || null,
        gender: gender || null,
        phoneNumbers,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-lg space-y-6 lg:grid lg:max-w-3xl lg:grid-cols-2 lg:gap-8 lg:space-y-0"
    >
      {/* Left column — avatar from Google */}
      <div className="space-y-3">
        <div className="flex aspect-square h-40 w-40 items-center justify-center overflow-hidden rounded-full bg-neutral-900">
          {initialData.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={initialData.image}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-4xl font-medium text-neutral-500">
              {(initialData.fullName || initialData.name || "?").slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500">
          {t("googlePhotoCaption")}
        </p>
      </div>

      {/* Right column — fields */}
      <div className="space-y-6">
        <Field
          id="fullName"
          label={t("fields.fullName")}
          required
          error={errors.fullName}
        >
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t("placeholders.fullName")}
            aria-invalid={!!errors.fullName}
          />
        </Field>

        <Field
          id="name"
          label={t("fields.name")}
          required
          error={errors.name}
        >
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("placeholders.name")}
            aria-invalid={!!errors.name}
          />
        </Field>

        <Field id="email" label={t("fields.email")}>
          <div className="rounded-lg border border-neutral-900 bg-neutral-950 px-4 py-3 text-base text-neutral-400">
            {initialData.email}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {t("emailReadOnly")}
          </p>
        </Field>

        <Field id="dob" label={t("fields.dob")}>
          <Input
            id="dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </Field>

        <Field id="gender" label={t("fields.gender")}>
          <Select
            id="gender"
            value={gender}
            onChange={(e) =>
              setGender(e.target.value as "male" | "female" | "")
            }
            options={genderOptions}
          />
        </Field>

        <Field
          id="phones"
          label={t("fields.phones")}
          error={errors.phoneNumbers}
        >
          <PhoneNumbersEditor
            value={phoneNumbers}
            onChange={setPhoneNumbers}
            error={errors.phoneNumbers}
          />
        </Field>
      </div>

      <div className="col-span-full space-y-3">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
        <Link
          href={cancelHref}
          className="btn-secondary block text-center"
        >
          {t("actions.cancel")}
        </Link>
      </div>
    </form>
  );
}
