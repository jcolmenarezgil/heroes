"use client";

import React, { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CameraIcon } from "@/components/icons";

interface FileDropzoneProps {
  id?: string;
  value?: string | null;
  onChange: (file: File | null, previewUrl: string | null) => void;
  error?: string;
}

export default function FileDropzone({
  id,
  value,
  onChange,
  error,
}: FileDropzoneProps) {
  const t = useTranslations("profile");
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);

  const handleFile = (file: File | null) => {
    if (!file) {
      setPreview(null);
      onChange(null, null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(file, url);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    handleFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] ?? null;
    handleFile(file);
  };

  return (
    <div className="space-y-2">
      {!preview ? (
        <label
          htmlFor={id}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`block w-full cursor-pointer rounded-lg border-2 border-dashed border-neutral-700 py-10 text-center text-neutral-400 transition hover:border-neutral-500 min-h-32 ${
            error ? "border-red-600" : ""
          }`}
        >
          <CameraIcon className="mx-auto h-10 w-10 text-neutral-500" />
          <p className="mt-2 text-sm font-medium">{t("dropzone")}</p>
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="sr-only"
            aria-label={t("dropzone")}
          />
        </label>
      ) : (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={t("photoPreview")}
            className="aspect-square max-h-48 w-auto rounded-lg object-cover"
          />
          <button
            type="button"
            onClick={() => {
              if (inputRef.current) inputRef.current.value = "";
              handleFile(null);
            }}
            className="text-sm font-medium text-white hover:text-neutral-300"
          >
            {t("changePhoto")}
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
