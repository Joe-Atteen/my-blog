"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
}

export function Pagination({ totalPages, currentPage }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Create a new URLSearchParams object to manipulate the parameters
  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  // Generate page numbers to display (current, +/- 1 page, and first/last)
  const getPageNumbers = (): number[] => {
    const pageNumbers: number[] = [];

    // Always include first page
    pageNumbers.push(1);

    // Add pages around current page
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pageNumbers.push(i);
    }

    // Always include last page if more than 1 page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    // Remove duplicates and sort
    return [...new Set(pageNumbers)].sort((a, b) => a - b);
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex justify-center items-center mt-10"
    >
      <ul className="flex items-center gap-1">
        {/* Previous page button */}
        <li>
          <Button
            variant="outline"
            size="icon"
            asChild
            disabled={currentPage <= 1}
          >
            <Link
              href={createPageURL(currentPage - 1)}
              aria-label="Go to previous page"
              className={
                currentPage <= 1 ? "pointer-events-none opacity-50" : ""
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
        </li>

        {/* Page number buttons */}
        {pageNumbers.map((page, index) => {
          // Add ellipsis indicators if there are gaps in the page numbers
          const showEllipsisBefore =
            index > 0 && pageNumbers[index] - pageNumbers[index - 1] > 1;

          return (
            <React.Fragment key={page}>
              {showEllipsisBefore && (
                <li className="px-2">
                  <span className="text-sm text-muted-foreground">
                    &hellip;
                  </span>
                </li>
              )}

              <li>
                <Button
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  asChild={page !== currentPage}
                  className="min-w-[2.5rem]"
                >
                  {page !== currentPage ? (
                    <Link
                      href={createPageURL(page)}
                      aria-label={`Go to page ${page}`}
                      aria-current={page === currentPage ? "page" : undefined}
                    >
                      {page}
                    </Link>
                  ) : (
                    page
                  )}
                </Button>
              </li>
            </React.Fragment>
          );
        })}

        {/* Next page button */}
        <li>
          <Button
            variant="outline"
            size="icon"
            asChild
            disabled={currentPage >= totalPages}
          >
            <Link
              href={createPageURL(currentPage + 1)}
              aria-label="Go to next page"
              className={
                currentPage >= totalPages
                  ? "pointer-events-none opacity-50"
                  : ""
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </li>
      </ul>
    </nav>
  );
}
