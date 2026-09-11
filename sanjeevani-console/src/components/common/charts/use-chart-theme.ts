"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import {
  CATEGORICAL_COLORS,
  CHART_INK,
  CHART_SURFACES,
  SERIES_COLOR,
} from "@/constants/global/charts";

export interface ChartTheme {
  isMounted: boolean;
  isDark: boolean;
  series: string;
  categorical: readonly string[];
  surface: string;
  ink: { muted: string; grid: string; axis: string };
  fontFamily: string;
}

/**
 * Canvas cannot read CSS custom properties, so chart colours are resolved in
 * JS. Rendering is gated on `isMounted` to avoid a hydration mismatch between
 * the server's assumed theme and the viewer's actual one.
 */
export const useChartTheme = (): ChartTheme => {
  const { resolvedTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return {
    isMounted,
    isDark,
    series: isDark ? SERIES_COLOR.DARK : SERIES_COLOR.LIGHT,
    categorical: isDark ? CATEGORICAL_COLORS.DARK : CATEGORICAL_COLORS.LIGHT,
    surface: isDark ? CHART_SURFACES.DARK : CHART_SURFACES.LIGHT,
    ink: isDark ? CHART_INK.DARK : CHART_INK.LIGHT,
    fontFamily: "var(--font-manrope)",
  };
};

/** Shared tooltip shell so every chart's hover card looks identical. */
export const renderTooltipCard = (
  title: string,
  rows: { label: string; value: number | string; color: string }[],
): string => `
  <div class="apexcharts-tooltip-card">
    <div class="apexcharts-tooltip-title">${title}</div>
    ${rows
      .map(
        (row) => `
      <div class="apexcharts-tooltip-row">
        <span class="apexcharts-tooltip-swatch" style="background:${row.color}"></span>
        <span>${row.label}</span>
        <span class="apexcharts-tooltip-value">${row.value}</span>
      </div>`,
      )
      .join("")}
  </div>`;
