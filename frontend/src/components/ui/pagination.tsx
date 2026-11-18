"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  totalResults?: number;
  pageSize?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  totalResults,
  pageSize = 10,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const resolvedTotalItems = totalResults ?? totalItems;

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = resolvedTotalItems ? Math.min(currentPage * pageSize, resolvedTotalItems) : currentPage * pageSize;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 py-3 text-sm",
        className
      )}
    >
      {resolvedTotalItems !== undefined && (
        <p className="text-xs text-zinc-400 light:text-slate-600">
          Showing <span className="font-semibold text-white light:text-slate-900">{startItem}</span> to{" "}
          <span className="font-semibold text-white light:text-slate-900">{endItem}</span> of{" "}
          <span className="font-semibold text-white light:text-slate-900">{resolvedTotalItems}</span> results
        </p>
      )}

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous Page"
          className="h-9 w-9 p-0 rounded-lg"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((page, index) => {
          if (page === "ellipsis") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex h-9 w-9 items-center justify-center text-zinc-500"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            );
          }

          const isCurrent = page === currentPage;
          return (
            <Button
              key={`page-${page}`}
              variant={isCurrent ? "primary" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              aria-label={`Page ${page}`}
              aria-current={isCurrent ? "page" : undefined}
              className={cn(
                "h-9 w-9 p-0 rounded-lg text-xs font-semibold",
                isCurrent
                  ? "bg-[#D4AF37] text-black font-bold shadow-md shadow-[#D4AF37]/20 border-transparent"
                  : "text-zinc-300 light:text-slate-700 hover:border-[#D4AF37]"
              )}
            >
              {page}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next Page"
          className="h-9 w-9 p-0 rounded-lg"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
