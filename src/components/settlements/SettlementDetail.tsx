import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Grid,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  AccountBalance as BankIcon,
  TrendingUp as ProfitIcon,
  TrendingDown as LossIcon,
  Euro as EuroIcon,
  Business as CompanyIcon,
  Assessment as ReportIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
  DirectionsCar as VehicleIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Settlement } from '../../types';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';

interface SettlementDetailProps {
  settlement: Settlement;
  onClose: () => void;
}

export default function SettlementDetail({ settlement, onClose }: SettlementDetailProps) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Počítame podľa spôsobov platby
  const rentalsByPaymentMethod = {
    cash: settlement.rentals.filter(r => r.paymentMethod === 'cash'),
    bank_transfer: settlement.rentals.filter(r => r.paymentMethod === 'bank_transfer'),
    vrp: settlement.rentals.filter(r => r.paymentMethod === 'vrp'),
    direct_to_owner: settlement.rentals.filter(r => r.paymentMethod === 'direct_to_owner'),
  };

  // Výpočty pre každý spôsob platby
  const paymentMethodStats = {
    cash: {
      count: rentalsByPaymentMethod.cash.length,
      totalPrice: rentalsByPaymentMethod.cash.reduce((sum, r) => sum + r.totalPrice, 0),
      totalCommission: rentalsByPaymentMethod.cash.reduce((sum, r) => sum + r.commission, 0),
      netAmount: rentalsByPaymentMethod.cash.reduce((sum, r) => sum + r.totalPrice - r.commission, 0),
    },
    bank_transfer: {
      count: rentalsByPaymentMethod.bank_transfer.length,
      totalPrice: rentalsByPaymentMethod.bank_transfer.reduce((sum, r) => sum + r.totalPrice, 0),
      totalCommission: rentalsByPaymentMethod.bank_transfer.reduce((sum, r) => sum + r.commission, 0),
      netAmount: rentalsByPaymentMethod.bank_transfer.reduce((sum, r) => sum + r.totalPrice - r.commission, 0),
    },
    vrp: {
      count: rentalsByPaymentMethod.vrp.length,
      totalPrice: rentalsByPaymentMethod.vrp.reduce((sum, r) => sum + r.totalPrice, 0),
      totalCommission: rentalsByPaymentMethod.vrp.reduce((sum, r) => sum + r.commission, 0),
      netAmount: rentalsByPaymentMethod.vrp.reduce((sum, r) => sum + r.totalPrice - r.commission, 0),
    },
    direct_to_owner: {
      count: rentalsByPaymentMethod.direct_to_owner.length,
      totalPrice: rentalsByPaymentMethod.direct_to_owner.reduce((sum, r) => sum + r.totalPrice, 0),
      totalCommission: rentalsByPaymentMethod.direct_to_owner.reduce((sum, r) => sum + r.commission, 0),
      netAmount: rentalsByPaymentMethod.direct_to_owner.reduce((sum, r) => sum + r.totalPrice - r.commission, 0),
    },
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Hotovosť';
      case 'bank_transfer': return 'FA (Faktúra)';
      case 'vrp': return 'VRP';
      case 'direct_to_owner': return 'Majiteľ';
      default: return method;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return '#4caf50';
      case 'bank_transfer': return '#2196f3';
      case 'vrp': return '#ff9800';
      case 'direct_to_owner': return '#9e9e9e';
      default: return '#666';
    }
  };

  // Client-side PDF generovanie (bez servera!)
  const handleDownloadPDF = () => {
    setPdfLoading(true);
    
    try {
      // Vytvor hidden print container
      const printContainer = document.createElement('div');
      printContainer.id = 'pdf-print-container';
      printContainer.style.position = 'absolute';
      printContainer.style.left = '-9999px';
      printContainer.style.top = '0';
      
      // Vygeneruj HTML pre tlač
      printContainer.innerHTML = generatePrintHTML();
      
      // Pridaj do DOM
      document.body.appendChild(printContainer);
      
      // Pridaj print styles
      const printStyles = document.createElement('style');
      printStyles.innerHTML = getPrintStyles();
      document.head.appendChild(printStyles);
      
      // Spusti print dialog
      setTimeout(() => {
        window.print();
        
        // Cleanup po tlači
        setTimeout(() => {
          document.body.removeChild(printContainer);
          document.head.removeChild(printStyles);
          setPdfLoading(false);
        }, 1000);
      }, 100);
      
      console.log('✅ PDF print dialog otvorený');
    } catch (error) {
      console.error('❌ Chyba pri generovaní PDF:', error);
      alert(`Chyba pri generovaní PDF: ${error instanceof Error ? error.message : 'Neznáma chyba'}`);
      setPdfLoading(false);
    }
  };

  // Generuj HTML pre tlač
  const generatePrintHTML = () => {
    const formatDate = (date: Date | string) => {
      try {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('sk-SK');
      } catch {
        return 'N/A';
      }
    };

    return `
      <div class="print-document">
        <div class="print-header">
          <h1>VYÚČTOVANIE</h1>
          <h2>${settlement.company || 'N/A'}</h2>
          <div class="print-period">
            Obdobie: ${formatDate(settlement.period.from)} - ${formatDate(settlement.period.to)}
          </div>
        </div>

        <div class="print-summary">
          <div class="summary-item">
            <h3>Celkové príjmy</h3>
            <div class="amount">${settlement.totalIncome.toFixed(2)}€</div>
          </div>
          <div class="summary-item">
            <h3>Celkové náklady</h3>
            <div class="amount">${settlement.totalExpenses.toFixed(2)}€</div>
          </div>
          <div class="summary-item">
            <h3>Celkové provízie</h3>
            <div class="amount">${settlement.totalCommission.toFixed(2)}€</div>
          </div>
          <div class="summary-item ${settlement.profit >= 0 ? 'profit' : 'loss'}">
            <h3>${settlement.profit >= 0 ? 'Celkový zisk' : 'Celková strata'}</h3>
            <div class="amount">${settlement.profit.toFixed(2)}€</div>
          </div>
        </div>

        <div class="print-section">
          <h2>Prehľad podľa spôsobov platby</h2>
          <table class="print-table">
            <thead>
              <tr>
                <th>Spôsob platby</th>
                <th>Počet prenájmov</th>
                <th>Celková cena (€)</th>
                <th>Provízie (€)</th>
                <th>Po odpočítaní provízií (€)</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(paymentMethodStats).map(([method, stats]) => `
                <tr>
                  <td>${getPaymentMethodLabel(method)}</td>
                  <td>${stats.count}</td>
                  <td>${stats.totalPrice.toFixed(2)}</td>
                  <td>${stats.totalCommission.toFixed(2)}</td>
                  <td>${stats.netAmount.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td><strong>SPOLU</strong></td>
                <td><strong>${settlement.rentals?.length || 0}</strong></td>
                <td><strong>${settlement.totalIncome.toFixed(2)}</strong></td>
                <td><strong>${settlement.totalCommission.toFixed(2)}</strong></td>
                <td><strong>${(settlement.totalIncome - settlement.totalCommission).toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="print-details">
          <div class="print-section">
            <h2>Prenájmy (${settlement.rentals?.length || 0})</h2>
            <table class="print-table">
              <thead>
                <tr>
                  <th>Vozidlo</th>
                  <th>Zákazník</th>
                  <th>Platba</th>
                  <th>Cena (€)</th>
                  <th>Provízia (€)</th>
                </tr>
              </thead>
              <tbody>
                ${settlement.rentals.map(rental => `
                  <tr>
                    <td>${rental.vehicle?.brand || ''} ${rental.vehicle?.model || ''}<br>
                        <small>${rental.vehicle?.licensePlate || ''}</small></td>
                    <td>${rental.customerName}</td>
                    <td>${getPaymentMethodLabel(rental.paymentMethod)}</td>
                    <td>${rental.totalPrice.toFixed(2)}</td>
                    <td>${rental.commission.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="print-section">
            <h2>Náklady ${settlement.company || 'N/A'} (${settlement.expenses?.length || 0})</h2>
            <table class="print-table">
              <thead>
                <tr>
                  <th>Popis</th>
                  <th>Kategória</th>
                  <th>Suma (€)</th>
                </tr>
              </thead>
              <tbody>
                ${settlement.expenses.map(expense => `
                  <tr>
                    <td>${expense.description}</td>
                    <td>${expense.category}</td>
                    <td>${expense.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="print-footer">
          <p>ID vyúčtovania: ${settlement.id.slice(-8).toUpperCase()}</p>
          <p>Dokument automaticky vygenerovaný systémom BlackRent dňa ${new Date().toLocaleDateString('sk-SK')}</p>
        </div>
      </div>
    `;
  };

  // CSS štýly pre tlač
  const getPrintStyles = () => {
    return `
      @media print {
        body * {
          visibility: hidden;
        }
        
        #pdf-print-container,
        #pdf-print-container * {
          visibility: visible;
        }
        
        #pdf-print-container {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
        }

        .print-document {
          font-family: 'Inter', Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          margin: 0;
          padding: 20px;
        }

        .print-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #1976d2;
          padding-bottom: 20px;
        }

        .print-header h1 {
          font-size: 28px;
          font-weight: bold;
          color: #1976d2;
          margin: 0 0 10px 0;
        }

        .print-header h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 15px 0;
        }

        .print-period {
          font-size: 16px;
          background: #f0f0f0;
          padding: 8px 16px;
          border-radius: 20px;
          display: inline-block;
        }

        .print-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }

        .summary-item {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }

        .summary-item h3 {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 8px 0;
          text-transform: uppercase;
        }

        .summary-item .amount {
          font-size: 20px;
          font-weight: bold;
        }

        .summary-item.profit .amount {
          color: #4caf50;
        }

        .summary-item.loss .amount {
          color: #f44336;
        }

        .print-section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }

        .print-section h2 {
          font-size: 16px;
          font-weight: 600;
          color: #1976d2;
          background: #f8f9fa;
          padding: 12px 16px;
          border-left: 4px solid #1976d2;
          margin: 0 0 15px 0;
        }

        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }

        .print-table th {
          background: #1976d2;
          color: white;
          padding: 10px;
          text-align: left;
          font-weight: 600;
          font-size: 11px;
        }

        .print-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #ddd;
          font-size: 11px;
        }

        .print-table tr:nth-child(even) {
          background: #f9f9f9;
        }

        .total-row {
          background: #e3f2fd !important;
          border-top: 2px solid #1976d2;
        }

        .print-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        .print-footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 11px;
          color: #666;
        }

        small {
          font-size: 9px;
          color: #666;
        }
      }
    `;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Modern Header */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          position: 'relative'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <ReportIcon sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Detail vyúčtovania
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CompanyIcon sx={{ fontSize: 20 }} />
                  <Typography variant="h6">
                    {settlement.company || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Button
              variant="outlined"
              startIcon={<CloseIcon />}
              onClick={onClose}
              sx={{
                color: 'white',
                borderColor: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Zavrieť
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon sx={{ fontSize: 18 }} />
            <Typography variant="body1">
              Obdobie: {format(settlement.period.from, 'dd.MM.yyyy', { locale: sk })} - 
              {format(settlement.period.to, 'dd.MM.yyyy', { locale: sk })}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Financial Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    CELKOVÉ PRÍJMY
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {settlement.totalIncome.toFixed(2)}€
                  </Typography>
                </Box>
                <BankIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          <Card sx={{ 
            background: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    CELKOVÉ PROVÍZIE
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {settlement.totalCommission.toFixed(2)}€
                  </Typography>
                </Box>
                <ReceiptIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: settlement.profit >= 0 
              ? 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
              : 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {settlement.profit >= 0 ? 'CELKOVÝ ZISK' : 'CELKOVÁ STRATA'}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {settlement.profit.toFixed(2)}€
                  </Typography>
                </Box>
                {settlement.profit >= 0 ? 
                  <ProfitIcon sx={{ fontSize: 40, opacity: 0.8 }} /> :
                  <LossIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                }
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
          
          <TableContainer sx={{ 
            backgroundColor: 'transparent',
            '& .MuiTableHead-root': {
              '& .MuiTableCell-root': {
                backgroundColor: '#f8f9fa',
                fontWeight: 600,
                color: '#1976d2'
              }
            }
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Spôsob platby</TableCell>
                  <TableCell align="center">Počet prenájmov</TableCell>
                  <TableCell align="right">Celková cena (€)</TableCell>
                  <TableCell align="right">Provízie (€)</TableCell>
                  <TableCell align="right">Po odpočítaní provízií (€)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(paymentMethodStats).map(([method, stats]) => (
                  <TableRow key={method} sx={{
                    '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
                  }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: getPaymentMethodColor(method)
                        }} />
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
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#ff9800' }}>
                      {stats.totalCommission.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#4caf50' }}>
                      {stats.netAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ 
                  backgroundColor: '#e3f2fd',
                  '& .MuiTableCell-root': { 
                    fontWeight: 700,
                    borderTop: '2px solid #1976d2'
                  }
                }}>
                  <TableCell>SPOLU</TableCell>
                  <TableCell align="center">{settlement.rentals?.length || 0}</TableCell>
                  <TableCell align="right">{settlement.totalIncome.toFixed(2)}</TableCell>
                  <TableCell align="right">{settlement.totalCommission.toFixed(2)}</TableCell>
                  <TableCell align="right">{(settlement.totalIncome - settlement.totalCommission).toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Detailed Lists */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={6}>
          <Card sx={{ 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            height: 'fit-content'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <VehicleIcon sx={{ color: '#4caf50' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#4caf50' }}>
                  Prenájmy ({settlement.rentals?.length || 0})
                </Typography>
              </Box>
              
              <TableContainer sx={{ 
                maxHeight: 400,
                '& .MuiTableHead-root': {
                  '& .MuiTableCell-root': {
                    backgroundColor: '#e8f5e8',
                    fontWeight: 600,
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }
                }
              }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Vozidlo</TableCell>
                      <TableCell>Zákazník</TableCell>
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
                          backgroundColor: index % 2 === 0 ? 'transparent' : '#fafafa',
                          '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.04)' }
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {rental.customerName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getPaymentMethodLabel(rental.paymentMethod)}
                            size="small"
                            sx={{
                              backgroundColor: getPaymentMethodColor(rental.paymentMethod),
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {rental.totalPrice.toFixed(2)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#ff9800' }}>
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

        <Grid item xs={12} lg={6}>
          <Card sx={{ 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            height: 'fit-content'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <EuroIcon sx={{ color: '#f44336' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#f44336' }}>
                  Náklady {settlement.company || 'N/A'} ({settlement.expenses?.length || 0})
                </Typography>
              </Box>
              
              <TableContainer sx={{ 
                maxHeight: 400,
                '& .MuiTableHead-root': {
                  '& .MuiTableCell-root': {
                    backgroundColor: '#ffebee',
                    fontWeight: 600,
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }
                }
              }}>
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
                          backgroundColor: index % 2 === 0 ? 'transparent' : '#fafafa',
                          '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.04)' }
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
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#f44336' }}>
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
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
            <Button
              variant="contained"
              size="large"
              startIcon={pdfLoading ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
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
                  background: 'linear-gradient(135deg, #c62828 0%, #e53935 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(211, 47, 47, 0.4)',
                },
                '&:disabled': {
                  background: 'linear-gradient(135deg, #bdbdbd 0%, #9e9e9e 100%)',
                },
                transition: 'all 0.2s ease'
              }}
            >
              {pdfLoading ? 'Pripravujem tlač...' : 'Tlačiť / Uložiť PDF'}
            </Button>
            
            <Typography variant="body2" color="text.secondary" sx={{ 
              fontStyle: 'italic',
              textAlign: { xs: 'center', sm: 'right' }
            }}>
              ID vyúčtovania: {settlement.id.slice(-8).toUpperCase()}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 