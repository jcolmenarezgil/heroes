"use client";

import React, { useEffect, useState } from "react";
import QRCodeLib from "qrcode";

interface QRCodeProps {
  value: string;
  alt: string;
  className?: string;
}

export default function QRCode({ value, alt, className = "" }: QRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCodeLib.toDataURL(value, {
      width: 160,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!dataUrl) {
    return (
      <div
        className={`h-40 w-40 animate-pulse rounded-lg bg-neutral-900 ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt={alt}
      className={`h-40 w-40 rounded-lg bg-white p-2 ${className}`}
    />
  );
}
