import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import {
  AccountBalance as BankIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  Business as CompanyIcon,
  Euro as EuroIcon,
  TrendingDown as LossIcon,
  Payment as PaymentIcon,
  PictureAsPdf as PdfIcon,
  Person as PersonIcon,
  TrendingUp as ProfitIcon,
  Receipt as ReceiptIcon,
  Assessment as ReportIcon,
  DirectionsCar as VehicleIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  // Paper, // TODO: Implement Paper layout
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { sk } from 'date-fns/locale';
import { useState } from 'react';

import { useAuth } from '../../context/AuthContext';
import { getAPI_BASE_URL } from '../../services/api';
import type { Settlement } from '../../types';

interface SettlementDetailProps {
  settlement: Settlement;
  onClose: () => void;
}

export default function SettlementDetail({
  settlement,
  onClose,
}: SettlementDetailProps) {
  const { state } = useAuth();
  const [pdfLoading, setPdfLoading] = useState(false);

  // Počítame podľa spôsobov platby
  const rentalsByPaymentMethod = {
    cash: settlement.rentals.filter(r => r.paymentMethod === 'cash'),
    bank_transfer: settlement.rentals.filter(
      r => r.paymentMethod === 'bank_transfer'
    ),
    vrp: settlement.rentals.filter(r => r.paymentMethod === 'vrp'),
    direct_to_owner: settlement.rentals.filter(
      r => r.paymentMethod === 'direct_to_owner'
    ),
  };

  // Výpočty pre každý spôsob platby
  const paymentMethodStats = {
    cash: {
      count: rentalsByPaymentMethod.cash.length,
      totalPrice: rentalsByPaymentMethod.cash.reduce(
        (sum, r) => sum + r.totalPrice,
        0
      ),
      totalCommission: rentalsByPaymentMethod.cash.reduce(
        (sum, r) => sum + r.commission,
        0
      ),
      netAmount: rentalsByPaymentMethod.cash.reduce(
        (sum, r) => sum + r.totalPrice - r.commission,
        0
      ),
    },
    bank_transfer: {
      count: rentalsByPaymentMethod.bank_transfer.length,
      totalPrice: rentalsByPaymentMethod.bank_transfer.reduce(
        (sum, r) => sum + r.totalPrice,
        0
      ),
      totalCommission: rentalsByPaymentMethod.bank_transfer.reduce(
        (sum, r) => sum + r.commission,
        0
      ),
      netAmount: rentalsByPaymentMethod.bank_transfer.reduce(
        (sum, r) => sum + r.totalPrice - r.commission,
        0
      ),
    },
    vrp: {
      count: rentalsByPaymentMethod.vrp.length,
      totalPrice: rentalsByPaymentMethod.vrp.reduce(
        (sum, r) => sum + r.totalPrice,
        0
      ),
      totalCommission: rentalsByPaymentMethod.vrp.reduce(
        (sum, r) => sum + r.commission,
        0
      ),
      netAmount: rentalsByPaymentMethod.vrp.reduce(
        (sum, r) => sum + r.totalPrice - r.commission,
        0
      ),
    },
    direct_to_owner: {
      count: rentalsByPaymentMethod.direct_to_owner.length,
      totalPrice: rentalsByPaymentMethod.direct_to_owner.reduce(
        (sum, r) => sum + r.totalPrice,
        0
      ),
      totalCommission: rentalsByPaymentMethod.direct_to_owner.reduce(
        (sum, r) => sum + r.commission,
        0
      ),
      netAmount: rentalsByPaymentMethod.direct_to_owner.reduce(
        (sum, r) => sum + r.totalPrice - r.commission,
        0
      ),
    },
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Hotovosť';
      case 'bank_transfer':
        return 'FA (Faktúra)';
      case 'vrp':
        return 'VRP';
      case 'direct_to_owner':
        return 'Majiteľ';
      default:
        return method;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash':
        return '#4caf50';
      case 'bank_transfer':
        return '#2196f3';
      case 'vrp':
        return '#ff9800';
      case 'direct_to_owner':
        return '#9e9e9e';
      default:
        return '#666';
    }
  };

  // Server PDF generovanie (rovnaký ako protokoly)
  const handleDownloadPDF = async () => {
    if (!state.token) {
      alert('Nie ste prihlásený');
      return;
    }

    setPdfLoading(true);
    try {
      const response = await fetch(
        `${getAPI_BASE_URL()}/settlements/${settlement.id}/pdf`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${state.token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Neznáma chyba' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Získaj PDF blob
      const blob = await response.blob();

      // Vytvor download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Názov súboru
      const filename = `vyuctovanie_${settlement.company?.replace(/[^a-zA-Z0-9]/g, '_')}_${settlement.id.slice(-8)}.pdf`;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ PDF úspešne stiahnuté');
    } catch (error) {
      console.error('❌ Chyba pri sťahovaní PDF:', error);
      alert(
        `Chyba pri sťahovaní PDF: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
      );
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Modern Header */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <CardContent
          sx={{
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <UnifiedIcon name="report" sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Detail vyúčtovania
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UnifiedIcon name="company" sx={{ fontSize: 20 }} />
                  <Typography variant="h6">
                    {settlement.company || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Button
              variant="outlined"
              startIcon={<UnifiedIcon name="close" />}
              onClick={onClose}
              sx={{
                color: 'white',
                borderColor: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              Zavrieť
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon sx={{ fontSize: 18 }} />
            <Typography variant="body1">
              Obdobie:{' '}
              {format(
                settlement.period.from instanceof Date
                  ? settlement.period.from
                  : parseISO(settlement.period.from),
                'dd.MM.yyyy',
                { locale: sk }
              )}{' '}
              -{' '}
              {format(
                settlement.period.to instanceof Date
                  ? settlement.period.to
                  : parseISO(settlement.period.to),
                'dd.MM.yyyy',
                { locale: sk }
              )}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Financial Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    CELKOVÉ PRÍJMY
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {settlement.totalIncome.toFixed(2)}€
                  </Typography>
                </Box>
                <UnifiedIcon name="bank" sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    CELKOVÉ NÁKLADY
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {settlement.totalExpenses.toFixed(2)}€
                  </Typography>
                </Box>
                <EuroIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    CELKOVÉ PROVÍZIE
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {settlement.totalCommission.toFixed(2)}€
                  </Typography>
                </Box>
                <UnifiedIcon name="receipt" sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background:
                settlement.profit >= 0
                  ? 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
                  : 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {settlement.profit >= 0 ? 'CELKOVÝ ZISK' : 'CELKOVÁ STRATA'}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {settlement.profit.toFixed(2)}€
                  </Typography>
                </Box>
                {settlement.profit >= 0 ? (
                  <ProfitIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                ) : (
                  <LossIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Methods Overview */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PaymentIcon sx={{ color: '#1976d2' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
              Prehľad podľa spôsobov platby
            </Typography>
          </Box>

          <TableContainer
            sx={{
              backgroundColor: 'transparent',
              '& .MuiTableHead-root': {
                '& .MuiTableCell-root': {
                  backgroundColor: '#f8f9fa',
                  fontWeight: 600,
                  color: '#1976d2',
                },
              },
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Spôsob platby</TableCell>
                  <TableCell align="center">Počet prenájmov</TableCell>
                  <TableCell align="right">Celková cena (€)</TableCell>
                  <TableCell align="right">Provízie (€)</TableCell>
                  <TableCell align="right">
                    Po odpočítaní provízií (€)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(paymentMethodStats).map(([method, stats]) => (
                  <TableRow
                    key={method}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.04)',
                      },
                    }}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: getPaymentMethodColor(method),
                          }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {getPaymentMethodLabel(method)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={stats.count}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {stats.totalPrice.toFixed(2)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 600, color: '#ff9800' }}
                    >
                      {stats.totalCommission.toFixed(2)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 600, color: '#4caf50' }}
                    >
                      {stats.netAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow
                  sx={{
                    backgroundColor: '#e3f2fd',
                    '& .MuiTableCell-root': {
                      fontWeight: 700,
                      borderTop: '2px solid #1976d2',
                    },
                  }}
                >
                  <TableCell>SPOLU</TableCell>
                  <TableCell align="center">
                    {settlement.rentals?.length || 0}
                  </TableCell>
                  <TableCell align="right">
                    {settlement.totalIncome.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    {settlement.totalCommission.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    {(
                      settlement.totalIncome - settlement.totalCommission
                    ).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Detailed Lists */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card
            sx={{
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              height: 'fit-content',
            }}
          >
            <CardContent>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                <VehicleIcon sx={{ color: '#4caf50' }} />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: '#4caf50' }}
                >
                  Prenájmy ({settlement.rentals?.length || 0})
                </Typography>
              </Box>

              <TableContainer
                sx={{
                  maxHeight: 600,
                  '& .MuiTableHead-root': {
                    '& .MuiTableCell-root': {
                      backgroundColor: '#e8f5e8',
                      fontWeight: 600,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                    },
                  },
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Vozidlo</TableCell>
                      <TableCell>Zákazník</TableCell>
                      <TableCell>Dátum prenájmu</TableCell>
                      <TableCell>Platba</TableCell>
                      <TableCell align="right">Cena (€)</TableCell>
                      <TableCell align="right">Provízia (€)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {settlement.rentals.map((rental, index) => (
                      <TableRow
                        key={rental.id}
                        sx={{
                          backgroundColor:
                            index % 2 === 0 ? 'transparent' : '#fafafa',
                          '&:hover': {
                            backgroundColor: 'rgba(76, 175, 80, 0.04)',
                          },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {rental.vehicle?.brand} {rental.vehicle?.model}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rental.vehicle?.licensePlate}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <UnifiedIcon name="user" sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {rental.customerName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {format(new Date(rental.startDate), 'dd.MM.yyyy', {
                              locale: sk,
                            })}{' '}
                            -{' '}
                            {format(new Date(rental.endDate), 'dd.MM.yyyy', {
                              locale: sk,
                            })}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {Math.max(
                              1,
                              Math.ceil(
                                (new Date(rental.endDate).getTime() -
                                  new Date(rental.startDate).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            )}{' '}
                            dní
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getPaymentMethodLabel(rental.paymentMethod)}
                            size="small"
                            sx={{
                              backgroundColor: getPaymentMethodColor(
                                rental.paymentMethod
                              ),
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {rental.totalPrice.toFixed(2)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 600, color: '#ff9800' }}
                        >
                          {rental.commission.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
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
              height: 'fit-content',
            }}
          >
            <CardContent>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                <EuroIcon sx={{ color: '#f44336' }} />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: '#f44336' }}
                >
                  Náklady {settlement.company || 'N/A'} (
                  {settlement.expenses?.length || 0})
                </Typography>
              </Box>

              <TableContainer
                sx={{
                  maxHeight: 400,
                  '& .MuiTableHead-root': {
                    '& .MuiTableCell-root': {
                      backgroundColor: '#ffebee',
                      fontWeight: 600,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                    },
                  },
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Popis</TableCell>
                      <TableCell>Kategória</TableCell>
                      <TableCell align="right">Suma (€)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {settlement.expenses.map((expense, index) => (
                      <TableRow
                        key={expense.id}
                        sx={{
                          backgroundColor:
                            index % 2 === 0 ? 'transparent' : '#fafafa',
                          '&:hover': {
                            backgroundColor: 'rgba(244, 67, 54, 0.04)',
                          },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {expense.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={expense.category}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 600, color: '#f44336' }}
                        >
                          {expense.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={
                pdfLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <UnifiedIcon name="pdf" />
                )
              }
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              sx={{
                background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #c62828 0%, #e53935 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(211, 47, 47, 0.4)',
                },
                '&:disabled': {
                  background:
                    'linear-gradient(135deg, #bdbdbd 0%, #9e9e9e 100%)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {pdfLoading ? 'Generujem PDF...' : 'Stiahnuť PDF'}
            </Button>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontStyle: 'italic',
                textAlign: { xs: 'center', sm: 'right' },
              }}
            >
              ID vyúčtovania: {settlement.id.slice(-8).toUpperCase()}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
