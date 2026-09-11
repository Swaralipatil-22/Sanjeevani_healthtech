"use client";

import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface BaseProps {
  id: string;
  label: string;
  isRequired?: boolean;
  errorMessage?: string | false;
  hint?: string;
  className?: string;
}

function FieldShell(props: BaseProps & { children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", props.className)}>
      <Label htmlFor={props.id}>
        {props.label}
        {props.isRequired && <span className="text-destructive">*</span>}
      </Label>

      {props.children}

      {props.errorMessage ? (
        <span className="text-destructive text-[11px]">
          {props.errorMessage}
        </span>
      ) : (
        props.hint && (
          <span className="text-muted-foreground text-[10px]">{props.hint}</span>
        )
      )}
    </div>
  );
}

export function GlobalInput({
  type = "text",
  value,
  onChange,
  onBlur,
  name,
  placeholder,
  min,
  max,
  step,
  ...shell
}: BaseProps & {
  type?: string;
  name: string;
  value: number | string;
  placeholder?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}) {
  return (
    <FieldShell {...shell}>
      <Input
        id={shell.id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={Boolean(shell.errorMessage)}
      />
    </FieldShell>
  );
}

export function GlobalTextarea({
  value,
  onChange,
  onBlur,
  name,
  placeholder,
  rows,
  ...shell
}: BaseProps & {
  name: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
}) {
  return (
    <FieldShell {...shell}>
      <Textarea
        id={shell.id}
        name={name}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={Boolean(shell.errorMessage)}
      />
    </FieldShell>
  );
}

export function GlobalSelect({
  value,
  onValueChange,
  options,
  placeholder,
  ...shell
}: BaseProps & {
  value: string;
  placeholder?: string;
  options: { label: string; value: string }[];
  onValueChange: (value: string) => void;
}) {
  return (
    <FieldShell {...shell}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={shell.id} aria-invalid={Boolean(shell.errorMessage)}>
          <SelectValue placeholder={placeholder ?? "Select"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}
