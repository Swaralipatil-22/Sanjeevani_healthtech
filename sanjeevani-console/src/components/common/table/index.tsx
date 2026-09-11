"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { InboxIcon } from "lucide-react";
import type { ReactNode } from "react";

import TablePagination from "@/components/common/table/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Extra column-def fields the console relies on beyond TanStack's own. */
export type DataTableColumn<T> = ColumnDef<T> & {
  enable_sorting?: boolean;
  header_clx?: string;
  cell_clx?: string;
};

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  totalCount: number;
  page: number;
  limit: number;
  isLoading?: boolean;
  sorting?: SortingState;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  onSortingChange?: (sorting: SortingState) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function DataTable<T>(props: DataTableProps<T>) {
  const table = useReactTable({
    data: props.data,
    columns: props.columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    state: { sorting: props.sorting ?? [] },
  });

  const columnCount = props.columns.length;

  return (
    <div className="bg-card overflow-hidden rounded border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header, index) => {
                  const column = header.column.columnDef as DataTableColumn<T>;
                  const isSortable = column.enable_sorting;
                  const currentSort = props.sorting?.find(
                    (item) => item.id === header.column.id,
                  );

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        index === 0 && "sticky left-0 z-10",
                        index === headerGroup.headers.length - 1 &&
                          "sticky right-0 z-10",
                        isSortable &&
                          "hover:bg-muted/50 cursor-pointer transition-colors",
                        column.header_clx,
                      )}
                      onClick={
                        isSortable
                          ? () =>
                              props.onSortingChange?.([
                                {
                                  id: header.column.id,
                                  desc: currentSort ? !currentSort.desc : true,
                                },
                              ])
                          : undefined
                      }
                      {...(isSortable
                        ? {
                            "aria-sort": currentSort
                              ? currentSort.desc
                                ? "descending"
                                : "ascending"
                              : "none",
                          }
                        : {})}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {isSortable && (
                          <span className="text-muted-foreground inline-block w-3 text-[10px]">
                            {currentSort ? (currentSort.desc ? "↓" : "↑") : ""}
                          </span>
                        )}
                      </span>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {props.isLoading &&
              Array.from({ length: 6 }).map((_item, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  <TableCell colSpan={columnCount}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!props.isLoading && props.data.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount}>
                  <div className="text-muted-foreground flex flex-col items-center gap-2 p-8 text-center">
                    <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                      <InboxIcon className="size-4" />
                    </div>
                    <div className="text-foreground text-xs font-medium">
                      {props.emptyTitle ?? "Nothing to show yet"}
                    </div>
                    {props.emptyDescription && (
                      <p className="max-w-xs text-[11px] leading-relaxed">
                        {props.emptyDescription}
                      </p>
                    )}
                    {props.emptyAction}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!props.isLoading &&
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell, index) => {
                    const column = cell.column.columnDef as DataTableColumn<T>;

                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          index === 0 && "sticky left-0 z-10 font-medium",
                          index === row.getVisibleCells().length - 1 &&
                            "sticky right-0 z-10",
                          column.cell_clx,
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={props.page}
        limit={props.limit}
        total={props.totalCount}
        onPageChange={props.onPageChange}
        onLimitChange={props.onLimitChange}
      />
    </div>
  );
}
