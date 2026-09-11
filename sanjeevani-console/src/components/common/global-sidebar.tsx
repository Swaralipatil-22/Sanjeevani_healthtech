"use client";

import _ from "lodash";
import {
  ActivityIcon,
  ChevronsLeftIcon,
  LogOutIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ROLE_LABELS } from "@/constants/global/labelvalues";
import { ROUTES } from "@/constants/global/routes";
import { SIDEBAR_CATEGORIES } from "@/constants/global/sidebar";
import { hasPermission } from "@/lib/permissions/hooks";
import { cn, getInitials } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

interface GlobalSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
}

export default function GlobalSidebar(props: GlobalSidebarProps) {
  const pathname = usePathname();
  const profile = useAppSelector((state) => state.profile.data);
  const permissions = _.get(profile, "permissions", []) ?? [];

  const { isDrawerOpen, onCloseDrawer } = props;

  // Navigating should dismiss the drawer, otherwise it stays over the page
  // the user just asked for.
  useEffect(() => {
    onCloseDrawer();
  }, [pathname, onCloseDrawer]);

  // Escape closes it, matching every other overlay in the console.
  useEffect(() => {
    if (!isDrawerOpen) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onCloseDrawer();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen, onCloseDrawer]);

  // Categories whose every item is unauthorised disappear entirely, so two
  // roles genuinely see different navigation rather than greyed-out links.
  const categories = SIDEBAR_CATEGORIES.map((category) => ({
    ...category,
    items: category.items.filter((item) =>
      hasPermission(permissions, item.module, item.sub_module, [
        "READ_ALL",
        "READ_OWNED",
      ]),
    ),
  })).filter((category) => category.items.length > 0);

  // Icon-only mode is a desktop affordance; the drawer is always full width.
  const isIconOnly = props.isCollapsed;

  return (
    <>
      {/* BACKDROP STARTS - mobile only */}
      {isDrawerOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onCloseDrawer}
          className="animate-in fade-in-0 fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}
      {/* BACKDROP ENDS */}

      <aside
        aria-label="Main navigation"
        className={cn(
          "bg-sidebar flex shrink-0 flex-col",
          // Below lg: an overlay that occupies no layout space.
          "fixed inset-y-0 left-0 z-50 w-72 border-r shadow-xl transition-transform duration-200 ease-out",
          isDrawerOpen ? "translate-x-0" : "-translate-x-full",
          // From lg up: a permanent column, no overlay chrome.
          "lg:static lg:z-auto lg:translate-x-0 lg:border-r-0 lg:shadow-none lg:transition-[width]",
          isIconOnly ? "lg:w-16" : "lg:w-72",
        )}
      >
        {/* BRAND STARTS */}
        <div
          className={cn(
            "flex h-16 items-center gap-2.5 px-4",
            isIconOnly && "lg:justify-center lg:px-0",
          )}
        >
          <div className="text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded bg-[linear-gradient(135deg,var(--primary-strong),var(--primary-deep))]">
            <ActivityIcon className="size-4.5" />
          </div>

          <div className={cn("flex min-w-0 flex-col", isIconOnly && "lg:hidden")}>
            <span className="truncate text-sm leading-tight font-semibold tracking-tight">
              Sanjeevani
            </span>
            <span className="text-muted-foreground truncate text-[10px] leading-tight">
              Rural Health Outreach
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onCloseDrawer}
            aria-label="Close navigation"
            className="text-muted-foreground ml-auto lg:hidden"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
        {/* BRAND ENDS */}

        {/* NAVIGATION STARTS */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {categories.map((category) => (
            <div key={category.label} className="mb-5">
              <div
                className={cn(
                  "text-muted-foreground mb-1.5 px-2 text-[10px] font-bold tracking-wider uppercase",
                  isIconOnly && "lg:hidden",
                )}
              >
                {category.label}
              </div>

              <div
                className={cn(
                  "flex flex-col gap-0.5",
                  "border-primary/35 border-l-2 border-dotted pl-2",
                  isIconOnly && "lg:border-l-0 lg:pl-0",
                )}
              >
                {category.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  const link = (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative flex h-9 items-center gap-2.5 rounded px-2 text-xs font-medium transition-colors lg:h-8",
                        isIconOnly && "lg:justify-center lg:px-0",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-foreground/75 hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "size-4 shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground",
                        )}
                      />

                      <span className={cn("truncate", isIconOnly && "lg:hidden")}>
                        {item.label}
                      </span>

                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-primary bg-primary/10 ml-auto h-4 px-1.5 text-[9px] font-bold",
                            isIconOnly && "lg:hidden",
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );

                  if (!isIconOnly) return link;

                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right" className="hidden lg:block">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        {/* NAVIGATION ENDS */}

        {/* USER STARTS */}
        <div className="p-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={props.onToggleCollapse}
            className="text-muted-foreground mb-2 hidden w-full justify-center lg:inline-flex"
            aria-label={isIconOnly ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronsLeftIcon
              className={cn(
                "size-4 transition-transform",
                isIconOnly && "rotate-180",
              )}
            />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "hover:bg-muted flex w-full items-center gap-2.5 rounded border p-2 text-left transition-colors",
                  isIconOnly && "lg:justify-center lg:border-0 lg:p-1",
                )}
              >
                <Avatar className="size-8 rounded">
                  <AvatarFallback className="rounded text-[10px]">
                    {getInitials(profile?.first_name, profile?.last_name)}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={cn(
                    "flex min-w-0 flex-col",
                    isIconOnly && "lg:hidden",
                  )}
                >
                  <span className="truncate text-xs font-medium">
                    {profile?.first_name} {profile?.last_name}
                  </span>
                  <span className="text-muted-foreground truncate text-[10px]">
                    {profile?.role ? ROLE_LABELS[profile.role] : "—"}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
              <div className="px-2 pb-1.5">
                <div className="truncate text-xs font-medium">
                  {profile?.email}
                </div>
                <div className="text-muted-foreground truncate text-[10px]">
                  {profile?.employee_id}
                  {profile?.facility_details
                    ? ` · ${profile.facility_details.name}`
                    : ""}
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem disabled>
                <UserIcon />
                Account settings
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem variant="destructive" asChild>
                <Link href={ROUTES.AUTH.LOGOUT}>
                  <LogOutIcon />
                  Sign out
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* USER ENDS */}
      </aside>
    </>
  );
}
