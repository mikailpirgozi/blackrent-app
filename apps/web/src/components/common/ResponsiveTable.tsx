import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui';
import { Checkbox } from '../ui/checkbox';
import React from 'react';

// Generic table row data interface
export interface TableRowData {
  id: string;
  [key: string]: unknown;
}

export interface ResponsiveTableColumn {
  id: string;
  label: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  width?:
    | string
    | number
    | { xs?: string; sm?: string; md?: string; lg?: string; xl?: string };
  render?: (value: unknown, row: TableRowData) => React.ReactNode;
  format?: (value: unknown) => string;
}

export interface ResponsiveTableProps {
  columns: ResponsiveTableColumn[];
  data: TableRowData[];
  selectable?: boolean;
  selected?: string[];
  onSelectionChange?: (selected: string[]) => void;
  onRowClick?: (row: TableRowData) => void;
  getRowId?: (row: TableRowData) => string;
  getRowColor?: (row: TableRowData) => string;
  mobileCardRenderer?: (row: TableRowData, index: number) => React.ReactNode;
  emptyMessage?: string;
}

export default function ResponsiveTable({
  columns,
  data,
  selectable = false,
  selected = [],
  onSelectionChange,
  onRowClick,
  getRowId = row => row.id,
  getRowColor,
  mobileCardRenderer,
  emptyMessage = 'Žiadne dáta',
}: ResponsiveTableProps) {
  // Mobile detection using window width
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isTablet = typeof window !== 'undefined' && window.innerWidth < 1024;

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(data.map(getRowId));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...selected, id]);
    } else {
      onSelectionChange(selected.filter(s => s !== id));
    }
  };

  // Filter columns based on screen size
  const visibleColumns = columns.filter(col => {
    if (isMobile && col.hideOnMobile) return false;
    if (isTablet && col.hideOnTablet) return false;
    return true;
  });

  // Mobile Card View
  if (isMobile) {
    if (mobileCardRenderer) {
      return (
        <div className="flex flex-col gap-4">
          {data.map((row, index) => (
            <div key={getRowId(row)}>{mobileCardRenderer(row, index)}</div>
          ))}
          {data.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">{emptyMessage}</p>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    // Default Mobile Card Layout
    return (
      <div className="flex flex-col gap-4">
        {data.map(row => {
          const rowId = getRowId(row);
          const backgroundColor = getRowColor ? getRowColor(row) : undefined;

          return (
            <Card
              key={rowId}
              className={`${onRowClick ? 'cursor-pointer hover:bg-muted' : ''}`}
              style={{ backgroundColor }}
              onClick={() => onRowClick && onRowClick(row)}
            >
              <CardContent className="pb-4">
                {selectable && (
                  <div className="mb-2">
                    <Checkbox
                      checked={selected.includes(rowId)}
                      onCheckedChange={(checked) => handleSelectOne(rowId, checked as boolean)}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  {visibleColumns.map(col => {
                    const value = row[col.id];
                    const displayValue = col.render
                      ? col.render(value, row)
                      : col.format
                        ? col.format(value)
                        : value;

                    return (
                      <div
                        key={col.id}
                        className="flex justify-between"
                      >
                        <span className="text-sm text-muted-foreground min-w-20">
                          {col.label}:
                        </span>
                        <span className="text-sm font-medium text-right">
                          {String(displayValue ?? '')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {data.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">{emptyMessage}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Desktop Table View
  return (
    <Card>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selected.length === data.length && data.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {visibleColumns.map(col => (
                <TableHead key={col.id} style={{ width: typeof col.width === 'string' || typeof col.width === 'number' ? col.width : undefined }}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(row => {
              const rowId = getRowId(row);
              const backgroundColor = getRowColor
                ? getRowColor(row)
                : undefined;

              return (
                <TableRow
                  key={rowId}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-muted' : ''} ${
                    selected.includes(rowId) ? 'bg-muted/50' : ''
                  }`}
                  style={{ backgroundColor }}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(rowId)}
                        onCheckedChange={(checked) => handleSelectOne(rowId, checked as boolean)}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.map(col => {
                    const value = row[col.id];
                    const displayValue = col.render
                      ? col.render(value, row)
                      : col.format
                        ? col.format(value)
                        : value;

                    return (
                      <TableCell key={col.id}>
                        {String(displayValue ?? '')}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}

            {data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                  className="text-center py-8"
                >
                  <p className="text-muted-foreground">{emptyMessage}</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

// Helper component for mobile action buttons
export function MobileActionCard({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <Card className="mb-4">
      <CardContent>
        {title && (
          <h3 className="text-lg font-semibold mb-2">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-muted-foreground mb-4">
            {subtitle}
          </p>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
