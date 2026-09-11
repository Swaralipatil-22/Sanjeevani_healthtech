import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input bg-background placeholder:text-muted-foreground/70 field-sizing-content flex min-h-16 w-full rounded-md border px-3 py-2 text-xs transition-colors outline-none",
        "focus-visible:border-ring focus-visible:ring-ring/25 focus-visible:ring-2",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
