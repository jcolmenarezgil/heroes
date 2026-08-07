"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-2 max-w-md text-sm text-neutral-400">
            An unexpected error occurred while rendering this page.
          </p>
          <button
            onClick={reset}
            className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}