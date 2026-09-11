import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  legend?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function ChartCard(props: ChartCardProps) {
  const Icon = props.icon;

  return (
    <section
      className={cn("bg-card flex flex-col rounded border p-5", props.className)}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <div className="flex flex-col">
            <h2 className="text-xs font-semibold">{props.title}</h2>
            {props.description && (
              <p className="text-muted-foreground mt-0.5 text-[10px] leading-snug">
                {props.description}
              </p>
            )}
          </div>
        </div>
        {props.action}
      </header>

      <div className="min-h-0 flex-1">{props.children}</div>

      {props.legend && (
        <footer className="mt-4 border-t pt-3">{props.legend}</footer>
      )}
    </section>
  );
}

/**
 * Identity is never carried by colour alone - every legend entry pairs its
 * swatch with a written label.
 */
export function ChartLegend({
  items,
}: {
  items: { label: string; color: string; value?: number | string }[];
}) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-[11px]">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-[2px]"
            style={{ background: item.color }}
          />
          <span className="text-muted-foreground">{item.label}</span>
          {item.value !== undefined && (
            <span className="text-foreground font-semibold tabular-nums">
              {item.value}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-72 rounded", className)} />;
}

export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="text-muted-foreground flex h-full min-h-48 items-center justify-center text-[11px]">
      {message}
    </div>
  );
}
