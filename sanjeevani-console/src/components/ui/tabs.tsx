"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("flex items-center gap-x-1", className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "text-muted-foreground relative inline-flex h-7 items-center justify-center gap-1.5 border-b-2 border-transparent px-2.5 text-xs font-medium transition-colors outline-none",
        "hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary",
        "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5",
        className,
      )}
      {...props}
    />
  );
}

const TabsContent = TabsPrimitive.Content;

export { Tabs, TabsContent, TabsList, TabsTrigger };
