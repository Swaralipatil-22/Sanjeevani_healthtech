"use client";

import {
  DownloadIcon,
  RefreshCwIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { EXPORT_FORMATS } from "@/constants/global/enums";
import { cn } from "@/lib/utils";

interface GlobalToolbarProps {
  icon: LucideIcon;
  title: string;
  subTitle: string;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onExport?: (format: EXPORT_FORMATS) => void;
  isFilterOpen?: boolean;
  onFilterToggle?: () => void;
  cta?: ReactNode;
  children?: ReactNode;
}

/**
 * Every listing and dashboard page opens with this bar, so the console reads
 * as one product rather than a set of screens.
 */
export default function GlobalToolbar(props: GlobalToolbarProps) {
  const Icon = props.icon;

  return (
    <div className="bg-card mb-4 flex flex-col gap-3 rounded border px-4 py-3 text-[12px] lg:mb-6 lg:flex-row lg:items-center">
      {/* IDENTITY STARTS */}
      <div className="flex min-w-0 items-center gap-x-3">
        <div className="text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded bg-[linear-gradient(135deg,var(--primary-strong),var(--primary-deep))]">
          <Icon className="size-4.5" />
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="truncate text-sm font-medium">{props.title}</div>
          <div className="text-muted-foreground truncate text-[10px]">
            {props.subTitle}
          </div>
        </div>
      </div>
      {/* IDENTITY ENDS */}

      {/* ACTIONS STARTS */}
      <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
        {props.children}

        {props.onSearchChange && (
          <div className="relative min-w-0 flex-1 lg:w-56 lg:flex-none">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              value={props.searchValue ?? ""}
              onChange={(event) => props.onSearchChange?.(event.target.value)}
              placeholder={props.searchPlaceholder ?? "Search"}
              className="h-8 min-h-8 pl-8"
            />
          </div>
        )}

        {props.onFilterToggle && (
          <Button
            variant={props.isFilterOpen ? "default" : "outline"}
            size="icon-lg"
            onClick={props.onFilterToggle}
            aria-label="Toggle filters"
            aria-pressed={props.isFilterOpen}
          >
            <SlidersHorizontalIcon className="size-3.5" />
          </Button>
        )}

        {props.onRefresh && (
          <Button
            variant="outline"
            size="icon-lg"
            onClick={props.onRefresh}
            disabled={props.isRefreshing}
            aria-label="Refresh"
          >
            <RefreshCwIcon
              className={cn("size-3.5", props.isRefreshing && "animate-spin")}
            />
          </Button>
        )}

        {props.onExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-lg" aria-label="Export">
                <DownloadIcon className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Choose format</DropdownMenuLabel>
              {Object.values(EXPORT_FORMATS).map((format) => (
                <DropdownMenuItem
                  key={format}
                  onClick={() => props.onExport?.(format)}
                >
                  {format}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {props.cta}
      </div>
      {/* ACTIONS ENDS */}
    </div>
  );
}
