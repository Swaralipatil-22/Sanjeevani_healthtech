"use client";

import type { ApexOptions } from "apexcharts";

import { UsersRoundIcon } from "lucide-react";
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

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

/**
 * One series, one colour. The age band is carried by the axis, so colouring
 * each bar differently would imply a categorical distinction that isn't there.
 */
export default function AgeBandChart({
  slices,
  isLoading,
}: {
  slices: DistributionSlice[];
  isLoading?: boolean;
}) {
  const theme = useChartTheme();

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
          columnWidth: "52%",
          borderRadius: 4,
          borderRadiusApplication: "end",
        },
      },
      colors: [theme.series],
      dataLabels: { enabled: false },
      legend: { show: false },
      grid: {
        borderColor: theme.ink.grid,
        strokeDashArray: 3,
        xaxis: { lines: { show: false } },
        padding: { left: 4, right: 8 },
      },
      xaxis: {
        categories: slices.map((slice) => slice.label),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: theme.ink.muted, fontSize: "10px" } },
        title: {
          text: "Age band (years)",
          style: { color: theme.ink.muted, fontSize: "9px", fontWeight: 500 },
        },
      },
      yaxis: {
        labels: {
          style: { colors: theme.ink.muted, fontSize: "10px" },
          formatter: (value) => String(Math.round(value)),
        },
      },
      tooltip: {
        custom: ({ dataPointIndex }) =>
          renderTooltipCard(`${slices[dataPointIndex]?.label ?? ""} years`, [
            {
              label: "Encounters",
              value: slices[dataPointIndex]?.value ?? 0,
              color: theme.series,
            },
          ]),
      },
      noData: { text: "No encounters in this period" },
    }),
    [slices, theme],
  );

  return (
    <ChartCard
      icon={UsersRoundIcon}
      title="Age distribution"
      description="Which age groups the outreach network is actually reaching"
    >
      {isLoading || !theme.isMounted ? (
        <ChartSkeleton className="h-56" />
      ) : slices.length === 0 ? (
        <ChartEmpty message="No encounters in this period" />
      ) : (
        <ReactApexChart
          type="bar"
          height={230}
          options={options}
          series={[
            { name: "Encounters", data: slices.map((slice) => slice.value) },
          ]}
        />
      )}
    </ChartCard>
  );
}
