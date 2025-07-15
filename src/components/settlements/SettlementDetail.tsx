import React from 'react';
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
  Divider,
} from '@mui/material';
import { Settlement } from '../../types';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';

interface SettlementDetailProps {
  settlement: Settlement;
  onClose: () => void;
}

export default function SettlementDetail({ settlement, onClose }: SettlementDetailProps) {
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

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Vyúčtovanie pre firmu: <strong>{settlement.company || 'N/A'}</strong>
        </Typography>
        <Typography variant="h6" gutterBottom>
          Obdobie: {format(settlement.period.from, 'dd.MM.yyyy', { locale: sk })} - 
          {format(settlement.period.to, 'dd.MM.yyyy', { locale: sk })}
        </Typography>
      </Box>

      {/* Prehľad podľa spôsobov platby */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Prehľad podľa spôsobov platby
          </Typography>
          <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Spôsob platby</strong></TableCell>
                  <TableCell align="right"><strong>Počet prenájmov</strong></TableCell>
                  <TableCell align="right"><strong>Celková cena (€)</strong></TableCell>
                  <TableCell align="right"><strong>Provízie (€)</strong></TableCell>
                  <TableCell align="right"><strong>Po odpočítaní provízií (€)</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(paymentMethodStats).map(([method, stats]) => (
                  <TableRow key={method}>
                    <TableCell><strong>{getPaymentMethodLabel(method)}</strong></TableCell>
                    <TableCell align="right">{stats.count}</TableCell>
                    <TableCell align="right">{stats.totalPrice.toFixed(2)}</TableCell>
                    <TableCell align="right">{stats.totalCommission.toFixed(2)}</TableCell>
                    <TableCell align="right">{stats.netAmount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell><strong>SPOLU</strong></TableCell>
                  <TableCell align="right">
                    <strong>{settlement.rentals.length}</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{settlement.totalIncome.toFixed(2)}</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{settlement.totalCommission.toFixed(2)}</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{(settlement.totalIncome - settlement.totalCommission).toFixed(2)}</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Celková rekapitulácia */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Celková rekapitulácia
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  Celkové príjmy
                </Typography>
                <Typography variant="h4">
                  {settlement.totalIncome.toFixed(2)} €
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  Celkové provízie
                </Typography>
                <Typography variant="h4">
                  {settlement.totalCommission.toFixed(2)} €
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error">
                  Náklady ({settlement.company || 'N/A'})
                </Typography>
                <Typography variant="h4">
                  {settlement.totalExpenses.toFixed(2)} €
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" color={settlement.profit >= 0 ? 'success.main' : 'error.main'}>
                  Celkový zisk
                </Typography>
                <Typography variant="h4">
                  {settlement.profit.toFixed(2)} €
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </CardContent>
      </Card>

      {/* Detailné zobrazenie prenájmov */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Prenájmy ({settlement.rentals.length})
            </Typography>
            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Vozidlo</TableCell>
                    <TableCell>Zákazník</TableCell>
                    <TableCell>Spôsob platby</TableCell>
                    <TableCell>Cena (€)</TableCell>
                    <TableCell>Provízia (€)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {settlement.rentals.map((rental) => (
                    <TableRow key={rental.id}>
                      <TableCell>
                        {rental.vehicle?.brand} {rental.vehicle?.model}
                      </TableCell>
                      <TableCell>{rental.customerName}</TableCell>
                      <TableCell>{getPaymentMethodLabel(rental.paymentMethod)}</TableCell>
                      <TableCell>{rental.totalPrice.toFixed(2)}</TableCell>
                      <TableCell>{rental.commission.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Náklady {settlement.company || 'N/A'} ({settlement.expenses.length})
            </Typography>
            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Popis</TableCell>
                    <TableCell>Kategória</TableCell>
                    <TableCell>Suma (€)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {settlement.expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="outlined" onClick={onClose}>
          Zavrieť
        </Button>
      </Box>
    </Box>
  );
} 