"use client";

import type { ApexOptions } from "apexcharts";

import { HeartPulseIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo } from "react";

import type { DistributionSlice } from "@/types";

import {
  ChartCard,
  ChartEmpty,
  ChartLegend,
  ChartSkeleton,
} from "@/components/common/charts/chart-card";
import {
  renderTooltipCard,
  useChartTheme,
} from "@/components/common/charts/use-chart-theme";
import { SEVERITY_COLORS } from "@/constants/global/charts";
import { ENCOUNTER_SEVERITY } from "@/constants/global/enums";
import { SEVERITY_LABELS } from "@/constants/global/labelvalues";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

/** Fixed clinical order - never sorted by value, so the ramp reads mild → critical. */
const SEVERITY_ORDER = [
  ENCOUNTER_SEVERITY.MILD,
  ENCOUNTER_SEVERITY.MODERATE,
  ENCOUNTER_SEVERITY.SEVERE,
  ENCOUNTER_SEVERITY.CRITICAL,
];

export default function SeverityDonutChart({
  slices,
  isLoading,
}: {
  slices: DistributionSlice[];
  isLoading?: boolean;
}) {
  const theme = useChartTheme();

  const rows = useMemo(
    () =>
      SEVERITY_ORDER.map((severity) => ({
        key: severity,
        label: SEVERITY_LABELS[severity],
        color: SEVERITY_COLORS[severity],
        value:
          slices.find((slice) => slice.label === severity)?.value ?? 0,
      })),
    [slices],
  );

  const total = rows.reduce((sum, row) => sum + row.value, 0);

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "donut",
        fontFamily: theme.fontFamily,
        animations: { enabled: true, speed: 400 },
        background: "transparent",
      },
      labels: rows.map((row) => row.label),
      colors: rows.map((row) => row.color),
      // A 2px surface-coloured gap keeps adjacent arcs separable.
      stroke: { width: 2, colors: [theme.surface] },
      dataLabels: { enabled: false },
      legend: { show: false },
      plotOptions: {
        pie: {
          donut: {
            size: "68%",
            labels: {
              show: true,
              value: {
                fontSize: "26px",
                fontWeight: 700,
                color: theme.isDark ? "#ffffff" : "#0b0b0b",
                offsetY: 2,
              },
              total: {
                show: true,
                label: "Encounters",
                fontSize: "10px",
                color: theme.ink.muted,
                formatter: () => String(total),
              },
            },
          },
        },
      },
      tooltip: {
        custom: ({ seriesIndex }) =>
          renderTooltipCard(rows[seriesIndex]?.label ?? "", [
            {
              label: "Encounters",
              value: rows[seriesIndex]?.value ?? 0,
              color: rows[seriesIndex]?.color ?? theme.series,
            },
          ]),
      },
      noData: { text: "No encounters in this period" },
    }),
    [rows, theme, total],
  );

  return (
    <ChartCard
      icon={HeartPulseIcon}
      title="Acuity mix"
      description="Distribution of encounters by clinical severity"
      legend={
        <ChartLegend
          items={rows.map((row) => ({
            label: row.label,
            color: row.color,
            value: row.value,
          }))}
        />
      }
    >
      {isLoading || !theme.isMounted ? (
        <ChartSkeleton className="h-56" />
      ) : total === 0 ? (
        <ChartEmpty message="No encounters in this period" />
      ) : (
        <ReactApexChart
          type="donut"
          height={230}
          options={options}
          series={rows.map((row) => row.value)}
        />
      )}
    </ChartCard>
  );
}
