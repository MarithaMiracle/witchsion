import { Link } from "@tanstack/react-router";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  searchParams?: Record<string, string | number | undefined>;
  basePath?: string;
}

function pageNumbers(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: Array<number | "ellipsis"> = [];
  const delta = 1;
  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis");
    }
  }
  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = pageNumbers(currentPage, totalPages);

  return (
    <nav
      className="mt-12 flex flex-wrap items-center justify-center gap-2 px-2"
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="touch-target shrink-0 border border-border px-3 py-2.5 text-[10px] uppercase tracking-widest transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
      >
        Prev
      </button>

      <div className="flex max-w-full items-center gap-1 overflow-x-auto scrollbar-none sm:gap-2">
        {pages.map((page, i) =>
          page === "ellipsis" ? (
            <span key={`e-${i}`} className="px-1 text-muted-foreground sm:px-2">
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`touch-target flex h-10 w-10 shrink-0 items-center justify-center border text-sm transition-colors sm:h-10 sm:w-10 ${
                currentPage === page
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground"
              }`}
            >
              {page}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="touch-target shrink-0 border border-border px-3 py-2.5 text-[10px] uppercase tracking-widest transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
      >
        Next
      </button>
    </nav>
  );
}
