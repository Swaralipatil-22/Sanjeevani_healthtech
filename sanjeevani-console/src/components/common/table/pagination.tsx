"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROWS_PER_PAGE_OPTIONS } from "@/constants/global/labelvalues";
import { formatNumber } from "@/lib/utils";

interface TablePaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function TablePagination(props: TablePaginationProps) {
  const totalPages = Math.max(Math.ceil(props.total / props.limit), 1);
  const first = props.total === 0 ? 0 : (props.page - 1) * props.limit + 1;
  const last = Math.min(props.page * props.limit, props.total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-3 py-2.5 sm:flex-row">
      <div className="text-muted-foreground text-[11px]">
        Showing <span className="text-foreground font-medium">{first}</span>–
        <span className="text-foreground font-medium">{last}</span> of{" "}
        <span className="text-foreground font-medium">
          {formatNumber(props.total)}
        </span>
      </div>

      <div className="flex items-center gap-x-3">
        <div className="flex items-center gap-x-2">
          <span className="text-muted-foreground text-[11px]">Rows</span>
          <Select
            value={String(props.limit)}
            onValueChange={(value) => props.onLimitChange(Number(value))}
          >
            <SelectTrigger className="h-7 min-h-7 w-[4.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROWS_PER_PAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-muted-foreground text-[11px] tabular-nums">
          Page {props.page} of {totalPages}
        </div>

        <div className="flex items-center gap-x-1">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={props.page <= 1}
            onClick={() => props.onPageChange(1)}
            aria-label="First page"
          >
            <ChevronsLeftIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={props.page <= 1}
            onClick={() => props.onPageChange(props.page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={props.page >= totalPages}
            onClick={() => props.onPageChange(props.page + 1)}
            aria-label="Next page"
          >
            <ChevronRightIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={props.page >= totalPages}
            onClick={() => props.onPageChange(totalPages)}
            aria-label="Last page"
          >
            <ChevronsRightIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
