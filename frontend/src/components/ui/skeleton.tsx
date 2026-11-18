import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-zinc-800/60 dark:bg-zinc-800/60",
        className
      )}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="pt-4 border-t border-[#262626] flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function WorkerCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="flex gap-2 py-2">
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-20 rounded-md" />
        <Skeleton className="h-5 w-14 rounded-md" />
      </div>
      <div className="pt-3 border-t border-[#262626] flex items-center justify-between">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] overflow-hidden">
      <div className="border-b border-[#262626] bg-[#1F1F1F] p-4 flex gap-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <div className="divide-y divide-[#262626]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex gap-4 items-center">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

