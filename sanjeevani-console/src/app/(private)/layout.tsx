"use client";

import { useCallback, useState } from "react";

import GlobalHeader from "@/components/common/global-header";
import GlobalSidebar from "@/components/common/global-sidebar";
import SessionProvider from "@/components/providers/session-provider";

export default function PrivateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Two independent states: below `lg` the sidebar is an overlay drawer that
  // takes no layout space, and from `lg` up it is a permanent column that can
  // be narrowed to icons. Collapsing on desktop must not affect the drawer.
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // These identities have to be stable. The sidebar closes the drawer from an
  // effect keyed on the close handler, so an inline arrow would be a new
  // function every render - re-firing that effect and slamming the drawer
  // shut in the same frame it was opened.
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleCollapse = useCallback(
    () => setIsCollapsed((previous) => !previous),
    [],
  );

  return (
    <SessionProvider>
      <div className="bg-background flex h-screen w-full overflow-hidden">
        <GlobalSidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          isDrawerOpen={isDrawerOpen}
          onCloseDrawer={closeDrawer}
        />

        {/* The content area floats as an inset card, leaving a gutter of page
            background around it. */}
        <main className="bg-card m-3 flex min-w-0 flex-1 flex-col overflow-hidden rounded border lg:ml-0">
          <GlobalHeader onOpenDrawer={openDrawer} />

          <div className="flex-1 overflow-x-hidden overflow-y-auto">
            <div className="px-4 py-4 lg:px-6">{children}</div>
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
