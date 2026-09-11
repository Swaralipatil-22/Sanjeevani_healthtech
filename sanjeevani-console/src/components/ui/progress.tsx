import * as React from "react";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value = 0,
  ...props
}: React.ComponentProps<"div"> & { value?: number }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "bg-muted relative h-1.5 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <div
        className="bg-primary h-full rounded-full transition-[width] duration-300 ease-out"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

export { Progress };
