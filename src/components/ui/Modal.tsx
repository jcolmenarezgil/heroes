"use client";

import React, { useEffect, useRef } from "react";
import { XMarkIcon } from "@/components/icons";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
}: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={ref}
        className="w-full max-w-sm rounded-lg border border-neutral-700 bg-neutral-950 p-6 shadow-lg shadow-black/50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="modal-title" className="text-lg font-medium text-white">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-neutral-400">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-900 hover:text-white"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">{children}</div>

        {footer && <div className="mt-6 space-y-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ModalFooter({
  onCancel,
  onConfirm,
  cancelText,
  confirmText,
  isLoading,
  variant = "destructive",
}: {
  onCancel: () => void;
  onConfirm: () => void;
  cancelText: string;
  confirmText: string;
  isLoading?: boolean;
  variant?: "destructive" | "primary";
}) {
  return (
    <>
      <Button
        variant={variant}
        onClick={onConfirm}
        isLoading={isLoading}
      >
        {confirmText}
      </Button>
      <Button variant="secondary" onClick={onCancel}>
        {cancelText}
      </Button>
    </>
  );
}
