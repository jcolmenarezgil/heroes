import React from "react";
import Skeleton from "@/components/ui/Skeleton";

export default function UserDetailSkeleton() {
  return (
    <div className="mx-auto max-w-lg lg:max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-11 w-11 rounded-lg" />
        <Skeleton className="h-11 w-28 rounded-lg" />
      </div>

      <div className="space-y-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="space-y-6">
            <Skeleton className="h-40 w-40 rounded-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-6 w-24 rounded-md" />
            </div>
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>

          <div className="mt-6 space-y-0 lg:mt-0">
            {[1, 2].map((i) => (
              <div
                key={i}
                className={`py-4 ${i > 1 ? "border-t border-neutral-900" : ""}`}
              >
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="mt-1 h-5 w-2/3" />
              </div>
            ))}

            <div className="border-t border-neutral-900 py-4">
              <Skeleton className="h-4 w-1/4" />
              <div className="mt-2 space-y-2">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            </div>

            <div className="border-t border-neutral-900 py-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-900 pt-6">
          <Skeleton className="mb-4 h-6 w-1/4" />
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
