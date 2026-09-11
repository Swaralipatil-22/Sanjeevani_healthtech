"use client";

import { MoonIcon, PanelLeftIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BREADCRUMB_ROUTE_MAPPINGS } from "@/constants/global/routes";
import { cn } from "@/lib/utils";

/** Longest-prefix match, so `/patients/PATIENT-123` still resolves to Patients. */
const resolveBreadcrumbs = (pathname: string): string[] => {
  const match = Object.keys(BREADCRUMB_ROUTE_MAPPINGS)
    .filter((route) => pathname === route || pathname.startsWith(`${route}/`))
    .sort((a, b) => b.length - a.length)[0];

  return match ? BREADCRUMB_ROUTE_MAPPINGS[match]! : [];
};

export default function GlobalHeader({ onToggle }: { onToggle: () => void }) {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const crumbs = resolveBreadcrumbs(pathname);

  return (
    <header className="flex h-12 shrink-0 items-center gap-x-3 border-b px-4">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggle}
        className="text-muted-foreground lg:hidden"
        aria-label="Toggle navigation"
      >
        <PanelLeftIcon className="size-4" />
      </Button>

      <Separator orientation="vertical" className="hidden h-4 lg:block" />

      <nav aria-label="Breadcrumb" className="hidden md:block">
        <ol className="flex items-center gap-x-1.5 text-xs">
          {crumbs.map((crumb, index) => (
            <Fragment key={crumb}>
              {index > 0 && (
                <li className="text-muted-foreground/50" aria-hidden="true">
                  /
                </li>
              )}
              <li
                className={cn(
                  index === crumbs.length - 1
                    ? "text-foreground font-medium"
                    : "text-muted-foreground",
                )}
                {...(index === crumbs.length - 1 ? { "aria-current": "page" } : {})}
              >
                {crumb}
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>

      <div className="ml-auto flex items-center gap-x-2">
        <span className="text-muted-foreground hidden text-[10px] tracking-wide uppercase sm:block">
          Maharashtra District Health Network
        </span>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          className="text-muted-foreground"
        >
          <SunIcon className="size-4 dark:hidden" />
          <MoonIcon className="hidden size-4 dark:block" />
        </Button>
      </div>
    </header>
  );
}
