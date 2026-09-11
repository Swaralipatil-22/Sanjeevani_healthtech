import { ActivityIcon } from "lucide-react";

export function SplashScreen() {
  return (
    <div className="bg-background flex h-screen w-full flex-col items-center justify-center gap-4">
      <div className="bg-[linear-gradient(135deg,var(--primary-strong),var(--primary-deep))] text-primary-foreground flex size-12 animate-pulse items-center justify-center rounded">
        <ActivityIcon className="size-6" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-semibold tracking-tight">Sanjeevani</span>
        <span className="text-muted-foreground text-[10px] tracking-wide uppercase">
          Preparing your console
        </span>
      </div>
    </div>
  );
}
