import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';

interface PaymentMethodData {
  count: number;
  revenue: number;
}

interface UnpaidRental {
  id: string;
  customerName: string;
  vehicle?: {
    brand: string;
    model: string;
  };
  totalPrice?: number;
}

interface StatsData {
  paymentMethodStats: Record<string, PaymentMethodData>;
  totalRevenue: number;
  unpaidRentals: UnpaidRental[];
}

interface PaymentsTabProps {
  stats: StatsData;
}

const PaymentsTab: React.FC<PaymentsTabProps> = ({ stats }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={8}>
        <Card
          sx={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            },
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 700, color: '#667eea' }}
            >
              Štatistiky platieb
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Spôsob platby
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Počet
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Príjmy
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Podiel
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(stats.paymentMethodStats)
                    .sort(([, a], [, b]) => b.revenue - a.revenue)
                    .map(([method, data]) => {
                      const percentage =
                        (data.revenue / stats.totalRevenue) * 100;
                      return (
                        <TableRow
                          key={method}
                          sx={{
                            '&:hover': {
                              backgroundColor: '#f8f9fa',
                            },
                            transition: 'background-color 0.2s ease',
                          }}
                        >
                          <TableCell>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <Chip
                                label={method}
                                size="small"
                                sx={{
                                  backgroundColor: '#667eea',
                                  color: 'white',
                                  fontWeight: 600,
                                }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              {data.count}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              sx={{ color: '#11998e' }}
                            >
                              {data.revenue.toLocaleString()} €
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              fontWeight="bold"
                            >
                              {percentage.toFixed(1)}%
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={4}>
        <Card
          sx={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            },
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 700, color: '#667eea' }}
            >
              Nezaplatené prenájmy
            </Typography>
            {stats.unpaidRentals.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <UnifiedIcon name="success" sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography
                  variant="body1"
                  color="success.main"
                  gutterBottom
                  fontWeight="bold"
                >
                  Všetky prenájmy sú zaplatené!
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {stats.unpaidRentals.slice(0, 5).map((rental: UnpaidRental) => (
                  <Box
                    key={rental.id}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      backgroundColor: '#fff3e0',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {rental.customerName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rental.vehicle?.brand} {rental.vehicle?.model}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="error.main"
                      fontWeight="bold"
                    >
                      {rental.totalPrice?.toLocaleString()} €
                    </Typography>
                  </Box>
                ))}
                {stats.unpaidRentals.length > 5 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    fontWeight="bold"
                  >
                    + {stats.unpaidRentals.length - 5} ďalších
                  </Typography>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default PaymentsTab;
