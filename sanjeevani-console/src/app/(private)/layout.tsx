"use client";

import { useState } from "react";

import GlobalHeader from "@/components/common/global-header";
import GlobalSidebar from "@/components/common/global-sidebar";
import SessionProvider from "@/components/providers/session-provider";

export default function PrivateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SessionProvider>
      <div className="bg-background flex h-screen w-full overflow-hidden">
        <GlobalSidebar
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed((previous) => !previous)}
        />

        {/* The content area floats as an inset card, leaving a gutter of page
            background around it. */}
        <main className="bg-card m-3 ml-0 flex min-w-0 flex-1 flex-col overflow-hidden rounded border">
          <GlobalHeader
            onToggle={() => setIsCollapsed((previous) => !previous)}
          />

          <div className="flex-1 overflow-x-hidden overflow-y-auto">
            <div className="px-4 py-4 lg:px-6">{children}</div>
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
