import { TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PageError({
  detail,
  onRetry,
}: {
  detail: string;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-card flex min-h-60 flex-col items-center justify-center gap-3 rounded border p-10 text-center">
      <div className="bg-destructive/10 text-destructive flex size-10 items-center justify-center rounded-full">
        <TriangleAlertIcon className="size-4" />
      </div>
      <div className="text-sm font-medium">Could not load this view</div>
      <p className="text-muted-foreground max-w-sm text-xs/relaxed">{detail}</p>
      {onRetry && (
        <Button variant="outline" size="lg" onClick={onRetry} className="mt-1">
          Try again
        </Button>
      )}
    </div>
  );
}
