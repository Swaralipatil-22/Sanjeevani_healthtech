"use client";

import type { ApexOptions } from "apexcharts";

import { ActivitySquareIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo } from "react";

import type { DistributionSlice } from "@/types";

import {
  ChartCard,
  ChartEmpty,
  ChartSkeleton,
} from "@/components/common/charts/chart-card";
import {
  renderTooltipCard,
  useChartTheme,
} from "@/components/common/charts/use-chart-theme";
import { MAX_CATEGORICAL_SLOTS } from "@/constants/global/charts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export default function CategoryDistributionChart({
  slices,
  isLoading,
}: {
  slices: DistributionSlice[];
  isLoading?: boolean;
}) {
  const theme = useChartTheme();

  /**
   * Past eight categories the tail is folded into "Other" rather than cycling
   * hues - a ninth generated colour would not be separable for colour-blind
   * readers.
   */
  const rows = useMemo(() => {
    const sorted = [...slices].sort((a, b) => b.value - a.value);
    if (sorted.length <= MAX_CATEGORICAL_SLOTS) return sorted;

    const head = sorted.slice(0, MAX_CATEGORICAL_SLOTS - 1);
    const tail = sorted.slice(MAX_CATEGORICAL_SLOTS - 1);

    return [
      ...head,
      {
        label: `Other (${tail.length})`,
        value: tail.reduce((sum, item) => sum + item.value, 0),
      },
    ];
  }, [slices]);

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        toolbar: { show: false },
        fontFamily: theme.fontFamily,
        animations: { enabled: true, speed: 400 },
        background: "transparent",
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: "62%",
          borderRadius: 4,
          borderRadiusApplication: "end",
          distributed: true,
          dataLabels: { position: "top" },
        },
      },
      colors: [...theme.categorical],
      // Direct value labels are mandatory here: three light-mode slots sit
      // below 3:1 contrast against the card surface.
      dataLabels: {
        enabled: true,
        offsetX: 26,
        style: { fontSize: "10px", fontWeight: 600, colors: [theme.ink.muted] },
        formatter: (value) => String(value),
      },
      legend: { show: false },
      grid: {
        borderColor: theme.ink.grid,
        strokeDashArray: 3,
        yaxis: { lines: { show: false } },
        padding: { left: 4, right: 24 },
      },
      xaxis: {
        categories: rows.map((row) => row.label),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: theme.ink.muted, fontSize: "10px" } },
      },
      yaxis: {
        labels: {
          style: { colors: theme.ink.muted, fontSize: "10px" },
          maxWidth: 160,
        },
      },
      tooltip: {
        custom: ({ dataPointIndex }) =>
          renderTooltipCard(rows[dataPointIndex]?.label ?? "", [
            {
              label: "Encounters",
              value: rows[dataPointIndex]?.value ?? 0,
              color: theme.categorical[dataPointIndex] ?? theme.series,
            },
          ]),
      },
      noData: { text: "No encounters in this period" },
    }),
    [rows, theme],
  );

  return (
    <ChartCard
      icon={ActivitySquareIcon}
      title="Diagnosis categories"
      description="Encounter count by clinical category across the selected period"
    >
      {isLoading || !theme.isMounted ? (
        <ChartSkeleton className="h-80" />
      ) : rows.length === 0 ? (
        <ChartEmpty message="No encounters in this period" />
      ) : (
        <ReactApexChart
          type="bar"
          height={Math.max(rows.length * 34, 200)}
          options={options}
          series={[{ name: "Encounters", data: rows.map((row) => row.value) }]}
        />
      )}
    </ChartCard>
  );
}
