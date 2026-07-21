"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@/components/icons";

export type ToastType = "success" | "warning" | "error";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

function toastBorder(type: ToastType) {
  switch (type) {
    case "success":
      return "border-green-700";
    case "warning":
      return "border-yellow-700";
    case "error":
      return "border-red-700";
  }
}

function toastIcon(type: ToastType) {
  switch (type) {
    case "success":
      return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
    case "warning":
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
    case "error":
      return <XMarkIcon className="h-5 w-5 text-red-400" />;
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({ toasts, addToast, removeToast }),
    [toasts, addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-6 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 space-y-2 px-4"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`flex items-center gap-3 rounded-lg border bg-neutral-900 px-4 py-3 text-sm text-white shadow-lg shadow-black/50 ${toastBorder(toast.type)}`}
          >
            {toastIcon(toast.type)}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white"
              aria-label="Dismiss"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
