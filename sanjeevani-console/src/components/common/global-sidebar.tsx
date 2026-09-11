"use client";

import _ from "lodash";
import { ActivityIcon, ChevronsLeftIcon, LogOutIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  onToggle: () => void;
}

export default function GlobalSidebar(props: GlobalSidebarProps) {
  const pathname = usePathname();
  const profile = useAppSelector((state) => state.profile.data);
  const permissions = _.get(profile, "permissions", []) ?? [];

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

  return (
    <aside
      className={cn(
        "bg-sidebar flex shrink-0 flex-col transition-[width] duration-200 ease-out",
        props.isCollapsed ? "w-16" : "w-72",
      )}
    >
      {/* BRAND STARTS */}
      <div
        className={cn(
          "flex h-16 items-center gap-2.5 px-4",
          props.isCollapsed && "justify-center px-0",
        )}
      >
        <div className="text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded bg-[linear-gradient(135deg,var(--primary-strong),var(--primary-deep))]">
          <ActivityIcon className="size-4.5" />
        </div>

        {!props.isCollapsed && (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm leading-tight font-semibold tracking-tight">
              Sanjeevani
            </span>
            <span className="text-muted-foreground truncate text-[10px] leading-tight">
              Rural Health Outreach
            </span>
          </div>
        )}
      </div>
      {/* BRAND ENDS */}

      {/* NAVIGATION STARTS */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {categories.map((category) => (
          <div key={category.label} className="mb-5">
            {!props.isCollapsed && (
              <div className="text-muted-foreground mb-1.5 px-2 text-[10px] font-bold tracking-wider uppercase">
                {category.label}
              </div>
            )}

            <div
              className={cn(
                "flex flex-col gap-0.5",
                !props.isCollapsed && "border-primary/35 border-l-2 border-dotted pl-2",
              )}
            >
              {category.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex h-8 items-center gap-2.5 rounded px-2 text-xs font-medium transition-colors",
                      props.isCollapsed && "justify-center px-0",
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

                    {!props.isCollapsed && (
                      <>
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="text-primary bg-primary/10 ml-auto h-4 px-1.5 text-[9px] font-bold"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                );

                if (!props.isCollapsed) return link;

                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
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
          onClick={props.onToggle}
          className="text-muted-foreground mb-2 w-full justify-center"
          aria-label={props.isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronsLeftIcon
            className={cn(
              "size-4 transition-transform",
              props.isCollapsed && "rotate-180",
            )}
          />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "hover:bg-muted flex w-full items-center gap-2.5 rounded border p-2 text-left transition-colors",
                props.isCollapsed && "justify-center border-0 p-1",
              )}
            >
              <Avatar className="size-8 rounded">
                <AvatarFallback className="rounded text-[10px]">
                  {getInitials(profile?.first_name, profile?.last_name)}
                </AvatarFallback>
              </Avatar>

              {!props.isCollapsed && (
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs font-medium">
                    {profile?.first_name} {profile?.last_name}
                  </span>
                  <span className="text-muted-foreground truncate text-[10px]">
                    {profile?.role ? ROLE_LABELS[profile.role] : "—"}
                  </span>
                </div>
              )}
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
  );
}
