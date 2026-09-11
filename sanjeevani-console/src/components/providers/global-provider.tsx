"use client";

import { ThemeProvider } from "next-themes";
import { useRef, type ReactNode } from "react";
import { Provider } from "react-redux";
import { Toaster } from "sonner";

import { TooltipProvider } from "@/components/ui/tooltip";
import { makeStore, type AppStore } from "@/store";
import { setupAxios } from "@/store/setup-axios";

setupAxios();

export default function GlobalProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) storeRef.current = makeStore();

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <Provider store={storeRef.current}>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast:
                "!bg-card !border-border !text-foreground !rounded !text-xs",
            },
          }}
        />
      </Provider>
    </ThemeProvider>
  );
}
