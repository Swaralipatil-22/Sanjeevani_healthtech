import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

export const getInitials = (
  firstName?: string | null,
  lastName?: string | null,
): string =>
  `${(firstName ?? "").charAt(0)}${(lastName ?? "").charAt(0)}`.toUpperCase() ||
  "?";

export const humanise = (value?: string | null): string =>
  (value ?? "")
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");

export const formatNumber = (value?: number | null): string =>
  new Intl.NumberFormat("en-IN").format(value ?? 0);
