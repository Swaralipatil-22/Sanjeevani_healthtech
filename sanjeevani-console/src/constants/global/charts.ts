/**
 * Chart colour system.
 *
 * ApexCharts draws to canvas/SVG and cannot read CSS custom properties, so
 * every value here is a literal hex resolved from the same OKLCH ladder as
 * `styles/global.css`.
 *
 * Three separate jobs, three separate palettes - never mixed:
 *
 *  - SERIES_*      single-series magnitude (the brand teal)
 *  - CATEGORICAL_* identity across diagnosis categories, fixed order, never
 *                  cycled; validated for colour-vision deficiency separation
 *                  against both surfaces
 *  - SEVERITY_*    reserved clinical status, never reused as a series colour
 */

export const CHART_SURFACES = {
  LIGHT: "#ffffff",
  DARK: "#262626",
} as const;

export const SERIES_COLOR = {
  LIGHT: "#006f6d",
  DARK: "#39bab4",
} as const;

/**
 * Fixed slot order. Assign by index and never reorder on filter changes - a
 * category keeps its colour even when other categories drop out of the view.
 *
 * Validated with the data-viz palette checker against #ffffff and #262626:
 * worst adjacent CVD deltaE 9.1 (light) / 8.4 (dark), worst adjacent
 * normal-vision deltaE 19.6 / 19.3. Three light-mode slots fall below 3:1
 * contrast, so charts using this palette carry direct value labels.
 */
export const CATEGORICAL_COLORS = {
  LIGHT: [
    "#2a78d6",
    "#eb6834",
    "#1baf7a",
    "#eda100",
    "#e87ba4",
    "#008300",
    "#4a3aa7",
    "#e34948",
  ],
  DARK: [
    "#3987e5",
    "#d95926",
    "#199e70",
    "#c98500",
    "#d55181",
    "#008300",
    "#9085e9",
    "#e66767",
  ],
} as const;

/** Reserved status steps - identical in both themes. */
export const SEVERITY_COLORS = {
  MILD: "#0ca30c",
  MODERATE: "#fab219",
  SEVERE: "#ec835a",
  CRITICAL: "#d03b3b",
} as const;

export const CHART_INK = {
  LIGHT: {
    muted: "#898781",
    grid: "#e6e6e3",
    axis: "#c3c2b7",
  },
  DARK: {
    muted: "#8f8f8a",
    grid: "#333333",
    axis: "#3d3d3d",
  },
} as const;

/** Past eight categories the tail folds into "Other" rather than cycling hues. */
export const MAX_CATEGORICAL_SLOTS = 8;
