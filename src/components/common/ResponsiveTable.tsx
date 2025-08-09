import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
  Button,
  Stack,
  Divider,
  CircularProgress
} from '@mui/material';

export interface ResponsiveTableColumn {
  id: string;
  label: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  width?: string | number | { xs?: string; sm?: string; md?: string; lg?: string; xl?: string; };
  render?: (value: any, row: any) => React.ReactNode;
  format?: (value: any) => string;
}

export interface ResponsiveTableProps {
  columns: ResponsiveTableColumn[];
  data: any[];
  selectable?: boolean;
  selected?: string[];
  onSelectionChange?: (selected: string[]) => void;
  onRowClick?: (row: any) => void;
  getRowId?: (row: any) => string;
  getRowColor?: (row: any) => string;
  mobileCardRenderer?: (row: any, index: number) => React.ReactNode;
  emptyMessage?: string;
  loading?: boolean;

}

export default function ResponsiveTable({
  columns,
  data,
  selectable = false,
  selected = [],
  onSelectionChange,
  onRowClick,
  getRowId = (row) => row.id,
  getRowColor,
  mobileCardRenderer,
  emptyMessage = 'Žiadne dáta',
  loading = false
}: ResponsiveTableProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

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
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2
          }}
        >
          {data.map((row, index) => (
            <Box key={getRowId(row)}>
              {mobileCardRenderer(row, index)}
            </Box>
          ))}
          {data.length === 0 && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">{emptyMessage}</Typography>
              </CardContent>
            </Card>
          )}

        </Box>
      );
    }

    // Default Mobile Card Layout
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2
        }}
      >
        {data.map((row) => {
          const rowId = getRowId(row);
          const backgroundColor = getRowColor ? getRowColor(row) : undefined;
          
          return (
            <Card 
              key={rowId}
              sx={{ 
                backgroundColor,
                cursor: onRowClick ? 'pointer' : 'default',
                '&:hover': onRowClick ? { 
                  backgroundColor: theme.palette.action.hover 
                } : {}
              }}
              onClick={() => onRowClick && onRowClick(row)}
            >
              <CardContent sx={{ pb: '16px !important' }}>
                {selectable && (
                  <Box sx={{ mb: 1 }}>
                    <Checkbox
                      checked={selected.includes(rowId)}
                      onChange={(e) => handleSelectOne(rowId, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Box>
                )}
                
                <Stack spacing={1}>
                  {visibleColumns.map((col) => {
                    const value = row[col.id];
                    const displayValue = col.render 
                      ? col.render(value, row)
                      : col.format 
                        ? col.format(value) 
                        : value;
                    
                    return (
                      <Box key={col.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>
                          {col.label}:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'right' }}>
                          {displayValue}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
        
        {data.length === 0 && (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">{emptyMessage}</Typography>
            </CardContent>
          </Card>
        )}

      </Box>
    );
  }

  // Desktop Table View
  return (
    <Card>
      <TableContainer 
        component={Paper} 
        sx={{ 
          backgroundColor: 'transparent'
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.length === data.length && data.length > 0}
                    indeterminate={selected.length > 0 && selected.length < data.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
              )}
              {visibleColumns.map((col) => (
                <TableCell 
                  key={col.id}
                  sx={{ width: col.width }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => {
              const rowId = getRowId(row);
              const backgroundColor = getRowColor ? getRowColor(row) : undefined;
              
              return (
                <TableRow
                  key={rowId}
                  selected={selected.includes(rowId)}
                  sx={{ 
                    backgroundColor,
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:hover': onRowClick ? { 
                      backgroundColor: theme.palette.action.hover 
                    } : {}
                  }}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.includes(rowId)}
                        onChange={(e) => handleSelectOne(rowId, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.map((col) => {
                    const value = row[col.id];
                    const displayValue = col.render 
                      ? col.render(value, row)
                      : col.format 
                        ? col.format(value) 
                        : value;
                    
                    return (
                      <TableCell key={col.id}>
                        {displayValue}
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
                  sx={{ textAlign: 'center', py: 4 }}
                >
                  <Typography color="text.secondary">{emptyMessage}</Typography>
                </TableCell>
              </TableRow>
            )}

          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

// Helper component for mobile action buttons
export function MobileActionCard({ 
  children, 
  title, 
  subtitle 
}: { 
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {title && (
          <Typography variant="h6" sx={{ mb: 1 }}>
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {subtitle}
          </Typography>
        )}
        {children}
      </CardContent>
    </Card>
  );
} 