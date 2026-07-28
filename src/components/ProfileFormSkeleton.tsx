import React from "react";
import Skeleton from "@/components/ui/Skeleton";

export default function ProfileFormSkeleton() {
  return (
    <div className="mx-auto max-w-3xl">
      <Skeleton className="mb-6 h-8 w-1/3" />
      <div className="mx-auto max-w-lg space-y-6 lg:grid lg:max-w-3xl lg:grid-cols-2 lg:gap-8 lg:space-y-0">
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="col-span-full space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
