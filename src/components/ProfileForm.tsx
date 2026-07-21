"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import FileDropzone from "@/components/ui/FileDropzone";
import { useToast } from "@/components/providers/ToastProvider";

export type ProfileStatus = "active" | "found" | "deceased";

export interface ProfileFormData {
  id?: string;
  name: string;
  photoUrl: string | null;
  lastKnownLocation: string;
  status: ProfileStatus;
  contactPhone: string;
  notes: string;
}

interface ProfileFormProps {
  initialData: ProfileFormData;
  onSubmit: (data: ProfileFormData, file: File | null) => Promise<void>;
  submitLabel: string;
  cancelHref?: string;
}

export default function ProfileForm({
  initialData,
  onSubmit,
  submitLabel,
  cancelHref = "/",
}: ProfileFormProps) {
  const t = useTranslations("profile");
  const { addToast } = useToast();

  const [name, setName] = useState(initialData.name);
  const [lastKnownLocation, setLastKnownLocation] = useState(
    initialData.lastKnownLocation
  );
  const [status, setStatus] = useState<ProfileStatus>(initialData.status);
  const [contactPhone, setContactPhone] = useState(initialData.contactPhone);
  const [notes, setNotes] = useState(initialData.notes);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initialData.photoUrl
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions = [
    { value: "active", label: t("status.active") },
    { value: "found", label: t("status.found") },
    { value: "deceased", label: t("status.deceased") },
  ];

  const handlePhotoChange = (file: File | null, preview: string | null) => {
    setPhotoFile(file);
    setPhotoPreview(preview);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = t("validation.nameRequired");
    if (!lastKnownLocation.trim())
      next.lastKnownLocation = t("validation.locationRequired");
    if (!photoPreview) next.photo = t("validation.photoRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          ...initialData,
          name,
          lastKnownLocation,
          status,
          contactPhone,
          notes,
          photoUrl: photoPreview,
        },
        photoFile
      );
      addToast(t("saveSuccess"), "success");
    } catch {
      addToast(t("saveError"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-lg space-y-6 lg:grid lg:max-w-3xl lg:grid-cols-2 lg:gap-8 lg:space-y-0"
    >
      <div className="space-y-6">
        <Field id="photo" label={t("fields.photo")} required error={errors.photo}>
          <FileDropzone
            id="photo"
            value={photoPreview}
            onChange={handlePhotoChange}
            error={errors.photo}
          />
        </Field>
      </div>

      <div className="space-y-6">
        <Field id="name" label={t("fields.name")} required error={errors.name}>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("placeholders.name")}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
        </Field>

        <Field
          id="location"
          label={t("fields.location")}
          required
          error={errors.lastKnownLocation}
        >
          <Input
            id="location"
            value={lastKnownLocation}
            onChange={(e) => setLastKnownLocation(e.target.value)}
            placeholder={t("placeholders.location")}
            aria-invalid={!!errors.lastKnownLocation}
            aria-describedby={
              errors.lastKnownLocation ? "location-error" : undefined
            }
          />
        </Field>

        <Field id="status" label={t("fields.status")}>
          <Select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProfileStatus)}
            options={statusOptions}
          />
        </Field>

        <Field id="contact" label={t("fields.contact")}>
          <Input
            id="contact"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder={t("placeholders.contact")}
            type="tel"
          />
        </Field>

        <Field id="notes" label={t("fields.notes")}>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("placeholders.notes")}
          />
        </Field>
      </div>

      <div className="col-span-full space-y-3">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
        <Link href={cancelHref} className="btn-secondary block text-center">
          {t("actions.cancel")}
        </Link>
      </div>
    </form>
  );
}
