"use client";

import { HospitalIcon } from "lucide-react";

import type { DistributionSlice } from "@/types";

import {
  ChartCard,
  ChartEmpty,
  ChartSkeleton,
} from "@/components/common/charts/chart-card";
import { useChartTheme } from "@/components/common/charts/use-chart-theme";
import { humanise } from "@/lib/utils";

/**
 * A ranked table rather than a chart: the reader wants exact counts per
 * facility and a critical-case comparison, which bars would only approximate.
 */
export default function FacilityLoadTable({
  slices,
  isLoading,
}: {
  slices: DistributionSlice[];
  isLoading?: boolean;
}) {
  const theme = useChartTheme();
  const maximum = Math.max(...slices.map((slice) => slice.value), 1);

  return (
    <ChartCard
      icon={HospitalIcon}
      title="Facility load"
      description="Encounters recorded per outreach facility, ranked by volume"
    >
      {isLoading ? (
        <ChartSkeleton className="h-56" />
      ) : slices.length === 0 ? (
        <ChartEmpty message="No encounters in this period" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <caption className="sr-only">
              Encounters per facility with critical case counts
            </caption>
            <thead>
              <tr className="text-muted-foreground border-b text-[10px] tracking-wide uppercase">
                <th scope="col" className="py-2 pr-3 text-left font-semibold">
                  Facility
                </th>
                <th scope="col" className="py-2 pr-3 text-left font-semibold">
                  District
                </th>
                <th scope="col" className="w-1/3 py-2 pr-3 text-left font-semibold">
                  Encounters
                </th>
                <th scope="col" className="py-2 text-right font-semibold">
                  Critical
                </th>
              </tr>
            </thead>
            <tbody>
              {slices.map((slice) => (
                <tr key={slice.label} className="border-b last:border-0">
                  <td className="py-2.5 pr-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{slice.label}</span>
                      <span className="text-muted-foreground text-[10px]">
                        {humanise(slice.facility_type)}
                      </span>
                    </div>
                  </td>
                  <td className="text-muted-foreground py-2.5 pr-3">
                    {slice.district}
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-muted h-1.5 w-full max-w-32 overflow-hidden rounded-full">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(slice.value / maximum) * 100}%`,
                            background: theme.series,
                          }}
                        />
                      </div>
                      <span className="font-semibold tabular-nums">
                        {slice.value}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-semibold tabular-nums">
                    {slice.critical ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ChartCard>
  );
}
