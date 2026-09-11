import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatNumber } from "@/lib/utils";

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: number;
  hint?: string;
  changePercentage?: number | null;
  /** Higher is worse for clinical counts like critical cases. */
  invertChangeSentiment?: boolean;
  emphasis?: "default" | "critical";
}

export function StatTile(props: StatTileProps) {
  const Icon = props.icon;
  const change = props.changePercentage;
  const hasChange = typeof change === "number" && Number.isFinite(change);
  const isUp = hasChange && change > 0;

  // A rise in encounters is neutral-good; a rise in critical cases is not.
  const isPositiveSentiment = props.invertChangeSentiment ? !isUp : isUp;

  return (
    <div className="bg-card flex flex-col justify-between rounded border p-4">
      <div className="mb-4 flex items-start justify-between">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded",
            props.emphasis === "critical"
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-foreground",
          )}
        >
          <Icon className="size-4" />
        </div>

        {hasChange && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[11px] font-medium",
              isPositiveSentiment ? "text-emerald-600" : "text-destructive",
            )}
          >
            {isUp ? (
              <TrendingUpIcon className="size-3" />
            ) : (
              <TrendingDownIcon className="size-3" />
            )}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>

      <div className="flex flex-col">
        <span className="font-[family-name:var(--font-manrope)] text-[20px] leading-tight font-bold">
          {formatNumber(props.value)}
        </span>
        <span className="text-muted-foreground mt-0.5 text-[11px]">
          {props.label}
        </span>
        {props.hint && (
          <span className="text-muted-foreground/70 mt-1 text-[10px]">
            {props.hint}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatTileSkeleton() {
  return <Skeleton className="h-[7.5rem] rounded" />;
}
