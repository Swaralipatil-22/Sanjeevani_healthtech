"use client";

import { ChevronDownIcon } from "lucide-react";
import _ from "lodash";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface MultiSelectFilterProps {
  label: string;
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function MultiSelectFilter(props: MultiSelectFilterProps) {
  const count = props.selected.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className={cn(
            "w-full justify-between font-normal",
            count > 0 && "border-primary/40 text-foreground",
          )}
        >
          <span className="truncate">
            {props.label}
            {count > 0 && (
              <span className="text-primary ml-1 font-medium">({count})</span>
            )}
          </span>
          <ChevronDownIcon className="size-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="max-h-72 w-56 overflow-y-auto">
        <DropdownMenuLabel>{props.label}</DropdownMenuLabel>

        {props.options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={_.includes(props.selected, option.value)}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) =>
              props.onChange(
                checked
                  ? [...props.selected, option.value]
                  : props.selected.filter((item) => item !== option.value),
              )
            }
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}

        {count > 0 && (
          <>
            <DropdownMenuSeparator />
            <button
              type="button"
              onClick={() => props.onChange([])}
              className="text-muted-foreground hover:text-foreground w-full px-2 py-1.5 text-left text-[11px]"
            >
              Clear selection
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
