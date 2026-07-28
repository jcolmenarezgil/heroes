import React from "react";
import Skeleton from "@/components/ui/Skeleton";

export default function ProfileDetailSkeleton() {
  return (
    <div className="mx-auto max-w-lg lg:max-w-4xl">
      {/* Top nav actions */}
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-11 w-11 rounded-lg" />
        <Skeleton className="h-11 w-28 rounded-lg" />
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-8">
        {/* Left column */}
        <div className="space-y-6">
          <Skeleton className="aspect-[3/4] w-full rounded-lg" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>

        {/* Right column */}
        <div className="mt-6 space-y-0 lg:mt-0">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`py-4 ${i > 1 ? "border-t border-neutral-900" : ""}`}
            >
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="mt-1 h-5 w-3/4" />
            </div>
          ))}
          <div className="border-t border-neutral-900 py-6">
            <Skeleton className="mx-auto h-48 w-48 rounded-lg" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
