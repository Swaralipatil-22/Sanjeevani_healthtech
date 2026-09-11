"use client";

import dayjs from "dayjs";
import _ from "lodash";
import {
  ActivityIcon,
  ChartColumnIncreasingIcon,
  CalendarClockIcon,
  HospitalIcon,
  SirenIcon,
  TriangleAlertIcon,
  UsersRoundIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { AnalyticsDistribution, AnalyticsOverview, AnalyticsTrends } from "@/types";

import GlobalToolbar from "@/components/common/global-toolbar";
import { PageError } from "@/components/common/page-error";
import { StatTile, StatTileSkeleton } from "@/components/common/stat-tile";
import AgeBandChart from "@/components/dashboard/age-band-chart";
import CategoryDistributionChart from "@/components/dashboard/category-distribution-chart";
import EncounterTrendChart from "@/components/dashboard/encounter-trend-chart";
import FacilityLoadTable from "@/components/dashboard/facility-load-table";
import SeverityDonutChart from "@/components/dashboard/severity-donut-chart";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PERMISSION_MODULES,
  PERMISSION_SUB_MODULES,
  PERMISSIONS,
} from "@/constants/global/enums";
import { DATE_PRESETS } from "@/constants/global/labelvalues";
import {
  getAnalyticsDistribution,
  getAnalyticsOverview,
  getAnalyticsTrends,
} from "@/lib/apis/client";
import { AccessDenied, PermissionGate } from "@/lib/permissions/components";
import { useAppSelector } from "@/store/hooks";
import { getErrorMessage } from "@/store/setup-axios";
import { cn } from "@/lib/utils";

type Granularity = "day" | "month" | "week";

export default function DashboardView() {
  const facilities = useAppSelector((state) => state.masters.facilities);

  const [rangeInDays, setRangeInDays] = useState(90);
  const [facilityId, setFacilityId] = useState<string>("ALL");
  const [granularity, setGranularity] = useState<Granularity>("week");

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trends, setTrends] = useState<AnalyticsTrends | null>(null);
  const [distribution, setDistribution] =
    useState<AnalyticsDistribution | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parameters = useMemo(
    () => ({
      from: dayjs().subtract(rangeInDays, "day").format("YYYY-MM-DD"),
      to: dayjs().format("YYYY-MM-DD"),
      granularity,
      ...(facilityId === "ALL" ? {} : { facility_id: facilityId }),
    }),
    [rangeInDays, granularity, facilityId],
  );

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);

      const [overviewResponse, trendsResponse, distributionResponse] =
        await Promise.all([
          getAnalyticsOverview(parameters),
          getAnalyticsTrends(parameters),
          getAnalyticsDistribution(parameters),
        ]);

      setOverview(_.get(overviewResponse, "data.data"));
      setTrends(_.get(trendsResponse, "data.data"));
      setDistribution(_.get(distributionResponse, "data.data"));
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [parameters]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <PermissionGate
      module={PERMISSION_MODULES.ANALYTICS}
      subModule={PERMISSION_SUB_MODULES.DASHBOARD}
      permissions={[PERMISSIONS.READ_ALL]}
      fallback={<AccessDenied />}
    >
      <GlobalToolbar
        icon={ChartColumnIncreasingIcon}
        title="District Health Dashboard"
        subTitle={`${dayjs(parameters.from).format("DD MMM YYYY")} – ${dayjs(parameters.to).format("DD MMM YYYY")} · aggregated, no patient identifiers`}
        isRefreshing={isRefreshing}
        onRefresh={() => {
          setIsRefreshing(true);
          void fetchAnalytics();
        }}
      >
        {/* All filters sit in one row above the charts. */}
        <Select
          value={String(rangeInDays)}
          onValueChange={(value) => setRangeInDays(Number(value))}
        >
          <SelectTrigger className="h-8 min-h-8 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_PRESETS.map((preset) => (
              <SelectItem key={preset.days} value={String(preset.days)}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={facilityId} onValueChange={setFacilityId}>
          <SelectTrigger className="h-8 min-h-8 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All facilities</SelectItem>
            {facilities.map((facility) => (
              <SelectItem key={facility.id} value={facility.id}>
                {facility.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-x-0.5 rounded-md border p-0.5">
          {(["day", "week", "month"] as const).map((option) => (
            <Button
              key={option}
              variant={granularity === option ? "default" : "ghost"}
              size="xs"
              onClick={() => setGranularity(option)}
              className={cn("capitalize", granularity !== option && "text-muted-foreground")}
            >
              {option}
            </Button>
          ))}
        </div>
      </GlobalToolbar>

      {error ? (
        <PageError
          detail={error}
          onRetry={() => {
            setIsLoading(true);
            void fetchAnalytics();
          }}
        />
      ) : (
        <div className="flex flex-col gap-4 lg:gap-6">
          {/* KPI ROW STARTS */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {isLoading
              ? Array.from({ length: 5 }).map((_item, index) => (
                  <StatTileSkeleton key={index} />
                ))
              : [
                  <StatTile
                    key="encounters"
                    icon={ActivityIcon}
                    label="Total encounters"
                    value={overview?.total_encounters ?? 0}
                    changePercentage={overview?.encounter_change_percentage}
                    hint={`vs ${overview?.previous_total_encounters ?? 0} in the prior period`}
                  />,
                  <StatTile
                    key="patients"
                    icon={UsersRoundIcon}
                    label="Patients seen"
                    value={overview?.unique_patients ?? 0}
                    hint="Unique anonymised patients"
                  />,
                  <StatTile
                    key="critical"
                    icon={SirenIcon}
                    label="Critical cases"
                    value={overview?.critical_cases ?? 0}
                    emphasis="critical"
                    hint={`${overview?.referred_cases ?? 0} referred onward`}
                  />,
                  <StatTile
                    key="notifiable"
                    icon={TriangleAlertIcon}
                    label="Notifiable disease"
                    value={overview?.notifiable_cases ?? 0}
                    hint="Reportable to the district health office"
                  />,
                  <StatTile
                    key="followups"
                    icon={CalendarClockIcon}
                    label="Follow-ups due"
                    value={overview?.follow_ups_due ?? 0}
                    hint={`${overview?.facilities_reporting ?? 0} facilities reporting`}
                  />,
                ]}
          </div>
          {/* KPI ROW ENDS */}

          <EncounterTrendChart
            points={trends?.series ?? []}
            granularity={trends?.granularity ?? granularity}
            isLoading={isLoading}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
            <CategoryDistributionChart
              slices={distribution?.by_category ?? []}
              isLoading={isLoading}
            />
            <div className="flex flex-col gap-4 lg:gap-6">
              <SeverityDonutChart
                slices={distribution?.by_severity ?? []}
                isLoading={isLoading}
              />
              <AgeBandChart
                slices={distribution?.by_age_band ?? []}
                isLoading={isLoading}
              />
            </div>
            <FacilityLoadTable
              slices={distribution?.by_facility ?? []}
              isLoading={isLoading}
            />
          </div>

          <p className="text-muted-foreground flex items-center gap-1.5 text-[10px]">
            <HospitalIcon className="size-3" />
            Every figure on this page is an aggregate. No name, contact number
            or government identifier is stored by this system.
          </p>
        </div>
      )}
    </PermissionGate>
  );
}
