"use client";

import type { ApexOptions } from "apexcharts";

import dayjs from "dayjs";
import { TrendingUpIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo } from "react";

import type { TrendPoint } from "@/types";

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

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

interface EncounterTrendChartProps {
  points: TrendPoint[];
  granularity: "day" | "month" | "week";
  isLoading?: boolean;
  action?: React.ReactNode;
}

const BUCKET_FORMATS = {
  day: "DD MMM",
  week: "[W]W MMM",
  month: "MMM YYYY",
} as const;

export default function EncounterTrendChart(props: EncounterTrendChartProps) {
  const theme = useChartTheme();

  const { categories, totals, criticals } = useMemo(
    () => ({
      categories: props.points.map((point) =>
        dayjs(point.bucket).format(BUCKET_FORMATS[props.granularity]),
      ),
      totals: props.points.map((point) => Number(point.total)),
      criticals: props.points.map((point) => Number(point.critical)),
    }),
    [props.points, props.granularity],
  );

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "area",
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: theme.fontFamily,
        animations: { enabled: true, speed: 400 },
        background: "transparent",
      },
      // 2px lines, no per-point markers until hovered.
      stroke: { curve: "smooth", width: [2, 2] },
      colors: [theme.series, SEVERITY_COLORS.CRITICAL],
      fill: {
        type: ["gradient", "solid"],
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.28,
          opacityTo: 0.02,
          stops: [0, 100],
        },
        opacity: [1, 0],
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      grid: {
        borderColor: theme.ink.grid,
        strokeDashArray: 3,
        xaxis: { lines: { show: false } },
        padding: { left: 4, right: 8, top: 0 },
      },
      xaxis: {
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: false },
        labels: {
          rotate: 0,
          hideOverlappingLabels: true,
          style: { colors: theme.ink.muted, fontSize: "10px" },
        },
      },
      yaxis: {
        labels: {
          style: { colors: theme.ink.muted, fontSize: "10px" },
          formatter: (value) => String(Math.round(value)),
        },
      },
      markers: { size: 0, hover: { size: 5 } },
      tooltip: {
        shared: true,
        intersect: false,
        custom: ({ dataPointIndex }) =>
          renderTooltipCard(String(categories[dataPointIndex] ?? ""), [
            {
              label: "All encounters",
              value: totals[dataPointIndex] ?? 0,
              color: theme.series,
            },
            {
              label: "Critical",
              value: criticals[dataPointIndex] ?? 0,
              color: SEVERITY_COLORS.CRITICAL,
            },
          ]),
      },
      noData: { text: "No encounters in this period" },
    }),
    [categories, totals, criticals, theme],
  );

  return (
    <ChartCard
      icon={TrendingUpIcon}
      title="Encounter volume"
      description="Total encounters recorded over the selected period, with critical cases overlaid"
      action={props.action}
      legend={
        <ChartLegend
          items={[
            {
              label: "All encounters",
              color: theme.series,
              value: totals.reduce((sum, value) => sum + value, 0),
            },
            {
              label: "Critical",
              color: SEVERITY_COLORS.CRITICAL,
              value: criticals.reduce((sum, value) => sum + value, 0),
            },
          ]}
        />
      }
    >
      {props.isLoading || !theme.isMounted ? (
        <ChartSkeleton className="h-64" />
      ) : props.points.length === 0 ? (
        <ChartEmpty message="No encounters in this period" />
      ) : (
        <ReactApexChart
          type="area"
          height={260}
          options={options}
          series={[
            { name: "All encounters", data: totals },
            { name: "Critical", data: criticals },
          ]}
        />
      )}
    </ChartCard>
  );
}
