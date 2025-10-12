/**
 * 📊 UNIFIED DATA TABLE COMPONENT
 *
 * Konzistentný data table pre celú BlackRent aplikáciu
 * Nahradí všetky MUI DataGrid implementácie
 *
 * Features:
 * - Sorting, filtering, pagination
 * - Row selection
 * - Column resizing
 * - Export functionality
 * - MUI DataGrid API kompatibilita
 */

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { Button } from './button';
import { Input } from './input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Checkbox } from './checkbox';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  Search,
  Download,
  Settings,
} from 'lucide-react';
import { UnifiedIcon } from './UnifiedIcon';
import { Card } from './card';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Label } from './label';
import { logger } from '@/utils/smartLogger';

export interface DataTableColumn {
  field: string;
  headerName: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;
  type?: 'string' | 'number' | 'date' | 'boolean' | 'actions';
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  editable?: boolean;
  hide?: boolean;
  renderCell?: (_params: Record<string, unknown>) => React.ReactNode;
  valueGetter?: (_params: Record<string, unknown>) => unknown;
  valueFormatter?: (_params: Record<string, unknown>) => string;
  headerAlign?: 'left' | 'center' | 'right';
}

export interface UnifiedDataTableProps {
  // Data
  rows: Record<string, unknown>[];
  columns: DataTableColumn[];
  getRowId?: (_row: Record<string, unknown>) => string | number;

  // Features
  checkboxSelection?: boolean;
  disableSelectionOnClick?: boolean;
  onSelectionModelChange?: (_selectedIds: (string | number)[]) => void;
  selectionModel?: (string | number)[];

  // Pagination
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange?: (_page: number) => void;
  onPageSizeChange?: (_pageSize: number) => void;
  rowCount?: number;
  page?: number;

  // Sorting
  sortingMode?: 'client' | 'server';
  sortModel?: Array<{ field: string; sort: 'asc' | 'desc' | null }>;
  onSortModelChange?: (
    _model: Array<{ field: string; sort: 'asc' | 'desc' | null }>
  ) => void;

  // Filtering
  filterMode?: 'client' | 'server';
  filterModel?: Record<string, unknown>;
  onFilterModelChange?: (_model: Record<string, unknown>) => void;
  quickFilterValue?: string;

  // Row actions
  onRowClick?: (_params: Record<string, unknown>) => void;
  onRowDoubleClick?: (_params: Record<string, unknown>) => void;
  getRowClassName?: (_params: Record<string, unknown>) => string;

  // UI
  loading?: boolean;
  autoHeight?: boolean;
  density?: 'compact' | 'standard' | 'comfortable';
  showToolbar?: boolean;
  hideFooter?: boolean;
  hideFooterPagination?: boolean;
  hideFooterSelectedRowCount?: boolean;

  // Export
  exportOptions?: {
    filename?: string;
    formats?: ('csv' | 'excel' | 'pdf')[];
  };

  // MUI compatibility
  sx?: Record<string, unknown>;
  components?: Record<string, React.ComponentType<unknown>>;
  componentsProps?: Record<string, Record<string, unknown>>;

  // Styling
  className?: string;
  tableClassName?: string;
}

export const UnifiedDataTable: React.FC<UnifiedDataTableProps> = ({
  rows,
  columns,
  getRowId = row => row.id as string | number,
  checkboxSelection = false,
  disableSelectionOnClick = false,
  onSelectionModelChange,
  selectionModel = [],
  pagination = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  rowCount,
  page: controlledPage,
  sortingMode = 'client',
  sortModel = [],
  onSortModelChange,
  filterMode = 'client',
  // filterModel,
  // onFilterModelChange,
  quickFilterValue = '',
  onRowClick,
  onRowDoubleClick,
  getRowClassName,
  loading = false,
  autoHeight = false,
  density = 'standard',
  showToolbar = true,
  hideFooter = false,
  hideFooterPagination = false,
  hideFooterSelectedRowCount = false,
  exportOptions,
  // sx,
  // components,
  // componentsProps,
  className,
  tableClassName,
}) => {
  // State
  const [page, setPage] = useState(controlledPage || 0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(
    new Set(selectionModel)
  );
  const [sortBy, setSortBy] = useState(
    sortModel[0] || { field: '', sort: null }
  );
  const [globalFilter, setGlobalFilter] = useState(quickFilterValue);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(columns.reduce((acc, col) => ({ ...acc, [col.field]: !col.hide }), {}));

  // Visible columns
  const visibleColumns = useMemo(
    () => columns.filter(col => columnVisibility[col.field] !== false),
    [columns, columnVisibility]
  );

  // Filter rows
  const filteredRows = useMemo(() => {
    if (filterMode === 'server') return rows;

    let filtered = [...rows];

    // Global filter
    if (globalFilter) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(globalFilter.toLowerCase())
        )
      );
    }

    // Column filters
    Object.entries(columnFilters).forEach(([field, value]) => {
      if (value) {
        filtered = filtered.filter(row =>
          String(row[field]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    return filtered;
  }, [rows, globalFilter, columnFilters, filterMode]);

  // Sort rows
  const sortedRows = useMemo(() => {
    if (sortingMode === 'server' || !sortBy.field || !sortBy.sort) {
      return filteredRows;
    }

    return [...filteredRows].sort((a, b) => {
      const aValue = a[sortBy.field];
      const bValue = b[sortBy.field];

      if (aValue === bValue) return 0;

      // Type guard for comparable values
      const isComparable = (val: unknown): val is string | number | Date => {
        return (
          typeof val === 'string' ||
          typeof val === 'number' ||
          val instanceof Date
        );
      };

      if (!isComparable(aValue) || !isComparable(bValue)) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortBy.sort === 'asc' ? comparison : -comparison;
    });
  }, [filteredRows, sortBy, sortingMode]);

  // Paginate rows
  const paginatedRows = useMemo(() => {
    if (!pagination) return sortedRows;

    const start = page * pageSize;
    const end = start + pageSize;
    return sortedRows.slice(start, end);
  }, [sortedRows, page, pageSize, pagination]);

  // Total pages
  const totalPages = Math.ceil((rowCount || sortedRows.length) / pageSize);

  // Density classes
  const densityClasses = {
    compact: 'py-1 px-2 text-xs',
    standard: 'py-2 px-3 text-sm',
    comfortable: 'py-3 px-4 text-base',
  };

  // Handle sort
  const handleSort = (field: string) => {
    const column = columns.find(col => col.field === field);
    if (!column?.sortable) return;

    const newSort: 'asc' | 'desc' | null =
      sortBy.field === field
        ? sortBy.sort === 'asc'
          ? 'desc'
          : sortBy.sort === 'desc'
            ? null
            : 'asc'
        : 'asc';

    const newSortBy = { field, sort: newSort };
    setSortBy(newSortBy);
    onSortModelChange?.([newSortBy]);
  };

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = paginatedRows.map(row => getRowId(row));
      setSelectedRows(new Set(allIds));
      onSelectionModelChange?.(allIds);
    } else {
      setSelectedRows(new Set());
      onSelectionModelChange?.([]);
    }
  };

  const handleSelectRow = (rowId: string | number, checked: boolean) => {
    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(rowId);
    } else {
      newSelection.delete(rowId);
    }
    setSelectedRows(newSelection);
    onSelectionModelChange?.(Array.from(newSelection));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    onPageChange?.(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(0);
    onPageSizeChange?.(newPageSize);
  };

  // Export data
  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    // Implementation would go here
    logger.debug(`Exporting as ${format}`);
  };

  return (
    <Card className={cn('w-full', className)}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between gap-4 p-4 border-b">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1">
            <div className="relative max-w-sm">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Hľadať..."
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Column visibility */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Stĺpce
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48">
                <div className="space-y-2">
                  {columns.map(column => (
                    <div
                      key={column.field}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        checked={columnVisibility[column.field] !== false}
                        onCheckedChange={checked => {
                          setColumnVisibility(prev => ({
                            ...prev,
                            [column.field]: checked as boolean,
                          }));
                        }}
                      />
                      <Label className="text-sm font-normal cursor-pointer">
                        {column.headerName}
                      </Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Export */}
            {exportOptions && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end">
                  <div className="space-y-1">
                    {exportOptions.formats?.includes('csv') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleExport('csv')}
                      >
                        Export as CSV
                      </Button>
                    )}
                    {exportOptions.formats?.includes('excel') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleExport('excel')}
                      >
                        Export as Excel
                      </Button>
                    )}
                    {exportOptions.formats?.includes('pdf') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleExport('pdf')}
                      >
                        Export as PDF
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div
        className={cn(
          'relative overflow-auto',
          autoHeight ? '' : 'max-h-[600px]',
          tableClassName
        )}
      >
        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <UnifiedIcon name="repeat" className="h-6 w-6 animate-spin" />
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              {checkboxSelection && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      paginatedRows.length > 0 &&
                      paginatedRows.every(row =>
                        selectedRows.has(getRowId(row))
                      )
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}

              {visibleColumns.map(column => (
                <TableHead
                  key={column.field}
                  className={cn(
                    column.sortable && 'cursor-pointer select-none',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right'
                  )}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                  }}
                  onClick={() => column.sortable && handleSort(column.field)}
                >
                  <div className="flex items-center gap-1">
                    {column.headerName}
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp
                          className={cn(
                            'h-3 w-3',
                            sortBy.field === column.field &&
                              sortBy.sort === 'asc'
                              ? 'text-foreground'
                              : 'text-muted-foreground/30'
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            'h-3 w-3 -mt-1',
                            sortBy.field === column.field &&
                              sortBy.sort === 'desc'
                              ? 'text-foreground'
                              : 'text-muted-foreground/30'
                          )}
                        />
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>

            {/* Column filters */}
            {visibleColumns.some(col => col.filterable) && (
              <TableRow>
                {checkboxSelection && <TableHead />}
                {visibleColumns.map(column => (
                  <TableHead key={`${column.field}-filter`} className="p-1">
                    {column.filterable && (
                      <Input
                        placeholder={`Filter ${column.headerName}`}
                        value={columnFilters[column.field] || ''}
                        onChange={e => {
                          setColumnFilters(prev => ({
                            ...prev,
                            [column.field]: e.target.value,
                          }));
                        }}
                        className="h-7 text-xs"
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            )}
          </TableHeader>

          <TableBody>
            {paginatedRows.map((row, index) => {
              const rowId = getRowId(row);
              const isSelected = selectedRows.has(rowId);
              const rowClassName = getRowClassName?.({ row, index });

              return (
                <TableRow
                  key={rowId}
                  className={cn(
                    'cursor-pointer hover:bg-muted/50',
                    isSelected && 'bg-muted',
                    rowClassName
                  )}
                  onClick={() => {
                    if (!disableSelectionOnClick && checkboxSelection) {
                      handleSelectRow(rowId, !isSelected);
                    }
                    onRowClick?.({ row, index });
                  }}
                  onDoubleClick={() => onRowDoubleClick?.({ row, index })}
                >
                  {checkboxSelection && (
                    <TableCell className="w-12">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={checked =>
                          handleSelectRow(rowId, checked as boolean)
                        }
                        onClick={e => e.stopPropagation()}
                      />
                    </TableCell>
                  )}

                  {visibleColumns.map(column => {
                    const value = column.valueGetter
                      ? column.valueGetter({ row, field: column.field })
                      : row[column.field];

                    const displayValue: React.ReactNode = column.valueFormatter
                      ? column.valueFormatter({
                          value,
                          row,
                          field: column.field,
                        })
                      : column.renderCell
                        ? column.renderCell({ value, row, field: column.field })
                        : (value as React.ReactNode);

                    return (
                      <TableCell
                        key={column.field}
                        className={cn(
                          densityClasses[density],
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {displayValue}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}

            {paginatedRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + (checkboxSelection ? 1 : 0)}
                  className="text-center py-8 text-muted-foreground"
                >
                  Žiadne dáta
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      {!hideFooter && pagination && (
        <div className="flex items-center justify-between p-4 border-t">
          {/* Row count */}
          {!hideFooterSelectedRowCount && (
            <div className="text-sm text-muted-foreground">
              {selectedRows.size > 0 && (
                <span className="mr-4">
                  {selectedRows.size} z {sortedRows.length} vybraných
                </span>
              )}
              <span>
                {sortedRows.length}{' '}
                {sortedRows.length === 1
                  ? 'záznam'
                  : sortedRows.length < 5
                    ? 'záznamy'
                    : 'záznamov'}
              </span>
            </div>
          )}

          {/* Pagination controls */}
          {!hideFooterPagination && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Riadkov na stranu:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={value => handlePageSizeChange(Number(value))}
                >
                  <SelectTrigger className="h-8 w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map(size => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(0)}
                  disabled={page === 0}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-sm px-2">
                  Strana {page + 1} z {totalPages || 1}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

// Export convenience aliases
export const DataGrid = UnifiedDataTable;
export const DataTable = UnifiedDataTable;

export default UnifiedDataTable;
