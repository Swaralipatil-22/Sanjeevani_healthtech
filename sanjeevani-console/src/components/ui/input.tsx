import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-input bg-background placeholder:text-muted-foreground/70 flex min-h-9 w-full rounded-md border px-3 py-1 text-xs transition-colors outline-none",
        "focus-visible:border-ring focus-visible:ring-ring/25 focus-visible:ring-2",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "file:text-foreground file:border-0 file:bg-transparent file:text-xs file:font-medium",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
