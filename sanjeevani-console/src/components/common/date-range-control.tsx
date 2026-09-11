"use client";

import dayjs from "dayjs";
import { CalendarIcon, CheckIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: string;
  to: string;
}

interface DateRangeControlProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

const today = (): string => dayjs().format("YYYY-MM-DD");

const PRESETS: { label: string; resolve: () => DateRange }[] = [
  {
    label: "Last 7 days",
    resolve: () => ({ from: dayjs().subtract(7, "day").format("YYYY-MM-DD"), to: today() }),
  },
  {
    label: "Last 30 days",
    resolve: () => ({ from: dayjs().subtract(30, "day").format("YYYY-MM-DD"), to: today() }),
  },
  {
    label: "Last 90 days",
    resolve: () => ({ from: dayjs().subtract(90, "day").format("YYYY-MM-DD"), to: today() }),
  },
  {
    label: "Last 180 days",
    resolve: () => ({ from: dayjs().subtract(180, "day").format("YYYY-MM-DD"), to: today() }),
  },
  {
    label: "Month to date",
    resolve: () => ({ from: dayjs().startOf("month").format("YYYY-MM-DD"), to: today() }),
  },
];

const matchPreset = (value: DateRange): string | undefined =>
  PRESETS.find((preset) => {
    const resolved = preset.resolve();
    return resolved.from === value.from && resolved.to === value.to;
  })?.label;

/**
 * Presets cover the common asks; the custom range below the hairline is what
 * makes an arbitrary reporting window - a quarter, a monsoon season - possible.
 */
export default function DateRangeControl(props: DateRangeControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange>(props.value);

  const activePreset = matchPreset(props.value);
  const isDraftValid = Boolean(draft.from && draft.to && draft.from <= draft.to);

  const label = activePreset
    ? activePreset
    : `${dayjs(props.value.from).format("DD MMM")} – ${dayjs(props.value.to).format("DD MMM YYYY")}`;

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) setDraft(props.value);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="justify-start gap-1.5 font-normal"
          aria-label="Change date range"
        >
          <CalendarIcon className="size-3.5 shrink-0 opacity-60" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-64 p-0">
        <div className="flex flex-col p-1">
          {PRESETS.map((preset) => {
            const isActive = activePreset === preset.label;

            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  props.onChange(preset.resolve());
                  setIsOpen(false);
                }}
                className={cn(
                  "hover:bg-muted flex items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs transition-colors",
                  isActive && "text-primary font-medium",
                )}
              >
                {preset.label}
                {isActive && <CheckIcon className="size-4" strokeWidth={3} />}
              </button>
            );
          })}
        </div>

        <div className="border-t p-3">
          <div className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-wider uppercase">
            Custom range
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="range-from" className="text-[10px]">
                From
              </Label>
              <Input
                id="range-from"
                type="date"
                max={draft.to || today()}
                value={draft.from}
                onChange={(event) =>
                  setDraft({ ...draft, from: event.target.value })
                }
                className="h-8 min-h-8"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="range-to" className="text-[10px]">
                To
              </Label>
              <Input
                id="range-to"
                type="date"
                min={draft.from}
                max={today()}
                value={draft.to}
                onChange={(event) =>
                  setDraft({ ...draft, to: event.target.value })
                }
                className="h-8 min-h-8"
              />
            </div>
          </div>

          {!isDraftValid && draft.from && draft.to && (
            <p className="text-destructive mt-2 text-[10px]">
              The start date must fall on or before the end date.
            </p>
          )}

          <Button
            size="lg"
            disabled={!isDraftValid}
            onClick={() => {
              props.onChange(draft);
              setIsOpen(false);
            }}
            className="mt-3 w-full"
          >
            Apply range
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
