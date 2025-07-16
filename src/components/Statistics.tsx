import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem, TextField,
  useMediaQuery, useTheme, Accordion, AccordionSummary, AccordionDetails, Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useApp } from '../context/AppContext';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export default function Statistics() {
  const { state } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [month, setMonth] = useState<number | string>(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [company, setCompany] = useState('');
  const [place, setPlace] = useState('');
  const [compareMonth, setCompareMonth] = useState<number | string>(0);
  const [compareYear, setCompareYear] = useState<number | string>(new Date().getFullYear());
  const [customerSortBy, setCustomerSortBy] = useState<'count' | 'amount'>('count');
  const [topCustomersCount, setTopCustomersCount] = useState(5);
  // Nové stavy pre vlastné obdobie a porovnanie
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [compareDateFrom, setCompareDateFrom] = useState<string>('');
  const [compareDateTo, setCompareDateTo] = useState<string>('');
  const [compareCompany, setCompareCompany] = useState('');
  const [compareCustomer, setCompareCustomer] = useState('');
  const [compareMode, setCompareMode] = useState<'period' | 'company' | 'customer'>('period');

  // Filter for main period
  const filteredRentals = state.rentals.filter(rental => {
    const rentalDate = new Date(rental.startDate);
    let matchesPeriod = true;
    if (dateFrom && dateTo) {
      matchesPeriod = rentalDate >= new Date(dateFrom) && rentalDate <= new Date(dateTo);
    } else {
      const matchesMonth = month === 0 || month === '0' || rentalDate.getMonth() + 1 === Number(month);
      const matchesYear = rentalDate.getFullYear() === Number(year);
      matchesPeriod = matchesMonth && matchesYear;
    }
    const matchesCompany = company ? rental.vehicle?.company === company : true;
    const matchesPlace = place ? rental.handoverPlace === place : true;
    return matchesPeriod && matchesCompany && matchesPlace;
  });
  const filteredExpenses = state.expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const matchesMonth = month === 0 || month === '0' || expenseDate.getMonth() + 1 === Number(month);
    const matchesYear = expenseDate.getFullYear() === Number(year);
    return matchesMonth && matchesYear && expense.company === 'Black Holding';
  });
  // Porovnávacie obdobie alebo firma/zákazník
  let compareRentals = state.rentals;
  if (compareMode === 'period') {
    compareRentals = state.rentals.filter(rental => {
      const rentalDate = new Date(rental.startDate);
      let matchesPeriod = true;
      if (compareDateFrom && compareDateTo) {
        matchesPeriod = rentalDate >= new Date(compareDateFrom) && rentalDate <= new Date(compareDateTo);
      } else {
        const matchesMonth = compareMonth === 0 || compareMonth === '0' || rentalDate.getMonth() + 1 === Number(compareMonth);
        const matchesYear = rentalDate.getFullYear() === Number(compareYear);
        matchesPeriod = matchesMonth && matchesYear;
      }
      const matchesCompany = company ? rental.vehicle?.company === company : true;
      const matchesPlace = place ? rental.handoverPlace === place : true;
      return matchesPeriod && matchesCompany && matchesPlace;
    });
  } else if (compareMode === 'company') {
    compareRentals = state.rentals.filter(rental => rental.vehicle?.company === compareCompany);
  } else if (compareMode === 'customer') {
    compareRentals = state.rentals.filter(rental => rental.customerName === compareCustomer);
  }
  const compareExpenses = state.expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const matchesMonth = compareMonth === 0 || compareMonth === '0' || expenseDate.getMonth() + 1 === Number(compareMonth);
    const matchesYear = expenseDate.getFullYear() === Number(compareYear);
    return matchesMonth && matchesYear && expense.company === 'Black Holding';
  });
  // Sums
  const totalRentals = filteredRentals.reduce((sum, r) => sum + r.totalPrice, 0);
  const totalCommissions = filteredRentals.reduce((sum, r) => sum + r.commission, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalProfit = totalCommissions - totalExpenses;
  const compareTotalRentals = compareRentals.reduce((sum, r) => sum + r.totalPrice, 0);
  const compareTotalCommissions = compareRentals.reduce((sum, r) => sum + r.commission, 0);
  const compareTotalExpenses = compareExpenses.reduce((sum, e) => sum + e.amount, 0);
  const compareTotalProfit = compareTotalCommissions - compareTotalExpenses;
  // Percent change helpers
  function percentChange(current: number, prev: number) {
    if (prev === 0) return current === 0 ? 0 : 100;
    return ((current - prev) / Math.abs(prev)) * 100;
  }

  // Rentals by place
  const rentalsByPlace = filteredRentals.reduce((acc, r) => {
    if (!r.handoverPlace) return acc;
    acc[r.handoverPlace] = (acc[r.handoverPlace] || 0) + r.totalPrice;
    return acc;
  }, {} as Record<string, number>);

  // Rentals by company
  const rentalsByCompany = filteredRentals.reduce((acc, r) => {
    const c = r.vehicle?.company;
    if (c) {
      acc[c] = (acc[c] || 0) + r.totalPrice;
    }
    return acc;
  }, {} as Record<string, number>);

  // Unique companies and places for filters
  const companies = Array.from(new Set(state.vehicles.map(v => v.company)));
  const places = Array.from(new Set(state.rentals.map(r => r.handoverPlace).filter(Boolean)));

  // Unique years for filter
  const years = Array.from(new Set(state.rentals.map(r => new Date(r.startDate).getFullYear())));

  const sortedCompanies = Object.entries(rentalsByCompany)
    .sort((a, b) => b[1] - a[1]);
  const maxValue = sortedCompanies.length > 0 ? sortedCompanies[0][1] : 1;
  const colors = ['#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#7b1fa2', '#0288d1', '#c2185b'];

  // Vývoj tržieb po mesiacoch v danom roku
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const monthlySums = months.map(m =>
    state.rentals.filter(r => {
      const d = new Date(r.startDate);
      return d.getFullYear() === Number(year) && d.getMonth() + 1 === m;
    }).reduce((sum, r) => sum + r.totalPrice, 0)
  );
  const maxMonthly = Math.max(...monthlySums, 1);
  const chartColors = ['#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#7b1fa2', '#0288d1', '#c2185b'];

  // TOP zákazníci
  const topCustomersByCount = Array.from(new Set(filteredRentals.map(r => r.customerName))).map(name => ({
    name,
    count: filteredRentals.filter(r => r.customerName === name).length,
    totalAmount: filteredRentals.filter(r => r.customerName === name).reduce((sum, r) => sum + r.totalPrice, 0)
  })).sort((a, b) => b.count - a.count);

  const topCustomersByAmount = Array.from(new Set(filteredRentals.map(r => r.customerName))).map(name => ({
    name,
    count: filteredRentals.filter(r => r.customerName === name).length,
    totalAmount: filteredRentals.filter(r => r.customerName === name).reduce((sum, r) => sum + r.totalPrice, 0)
  })).sort((a, b) => b.totalAmount - a.totalAmount);

  // Priemerná dĺžka prenájmu
  const rentalDurations = filteredRentals.map(r => {
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24); // in days
  });
  const averageRentalDuration = rentalDurations.length > 0 ? rentalDurations.reduce((sum, d) => sum + d, 0) / rentalDurations.length : 0;
  const minRentalDuration = rentalDurations.length > 0 ? Math.min(...rentalDurations) : 0;
  const maxRentalDuration = rentalDurations.length > 0 ? Math.max(...rentalDurations) : 0;

  const shortRentals = filteredRentals.filter(r => {
    const duration = (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24);
    return duration >= 1 && duration <= 3;
  });
  const mediumRentals = filteredRentals.filter(r => {
    const duration = (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24);
    return duration >= 4 && duration <= 7;
  });
  const longRentals = filteredRentals.filter(r => {
    const duration = (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24);
    return duration >= 8 && duration <= 14;
  });
  const veryLongRentals = filteredRentals.filter(r => {
    const duration = (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24);
    return duration >= 15;
  });

  // Obsadenosť vozidiel
  const vehicles = state.vehicles.map(v => ({
    id: v.id,
    brand: v.brand,
    model: v.model,
    licensePlate: v.licensePlate,
    company: v.company,
    rentalCount: filteredRentals.filter(r => r.vehicle?.id === v.id).length,
    totalRevenue: filteredRentals.filter(r => r.vehicle?.id === v.id).reduce((sum, r) => sum + r.totalPrice, 0)
  }));

  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.rentalCount > 0).length;
  const inactiveVehicles = vehicles.filter(v => v.rentalCount === 0).length;

  const mostRentedVehicles = vehicles.sort((a, b) => b.rentalCount - a.rentalCount);
  const leastRentedVehicles = vehicles.sort((a, b) => a.rentalCount - b.rentalCount);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: 'text.primary' }}>Štatistiky prenájmov</Typography>
      {/* Mobilné filtre v Accordione */}
      {isMobile ? (
        <Accordion expanded={filtersExpanded} onChange={() => setFiltersExpanded(!filtersExpanded)} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Filtre</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Mesiac</InputLabel>
                <Select value={month} label="Mesiac" onChange={e => setMonth(Number(e.target.value))}>
                  <MenuItem value={0}>Celý rok</MenuItem>
                  {[...Array(12)].map((_, i) => (
                    <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Rok</InputLabel>
                <Select value={year} label="Rok" onChange={e => setYear(Number(e.target.value))}>
                  {years.map(y => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Firma</InputLabel>
                <Select value={company} label="Firma" onChange={e => setCompany(e.target.value)}>
                  <MenuItem value="">Všetky</MenuItem>
                  {companies.map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#fff' }}>Miesto odovzdania</InputLabel>
                <Select value={place} label="Miesto odovzdania" onChange={e => setPlace(e.target.value)} sx={{ color: '#fff' }}>
                  <MenuItem value="">Všetky</MenuItem>
                  {places.map(p => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Dátum od"
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true, style: { color: '#fff' } }}
                sx={{ input: { color: '#fff' } }}
              />
              <TextField
                label="Dátum do"
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true, style: { color: '#fff' } }}
                sx={{ input: { color: '#fff' } }}
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Mesiac</InputLabel>
                <Select value={month} label="Mesiac" onChange={e => setMonth(Number(e.target.value))}>
                  <MenuItem value={0}>Celý rok</MenuItem>
                  {[...Array(12)].map((_, i) => (
                    <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Rok</InputLabel>
                <Select value={year} label="Rok" onChange={e => setYear(Number(e.target.value))}>
                  {years.map(y => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Firma</InputLabel>
                <Select value={company} label="Firma" onChange={e => setCompany(e.target.value)}>
                  <MenuItem value="">Všetky</MenuItem>
                  {companies.map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Miesto odovzdania</InputLabel>
                <Select value={place} label="Miesto odovzdania" onChange={e => setPlace(e.target.value)}>
                  <MenuItem value="">Všetky</MenuItem>
                  {places.map(p => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* Nové: vlastné obdobie */}
              <TextField
                label="Dátum od"
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 140 }}
              />
              <TextField
                label="Dátum do"
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 140 }}
              />
            </Box>
          </CardContent>
        </Card>
      )}
      {/* Porovnávací mód */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Porovnávať podľa</InputLabel>
          <Select value={compareMode} label="Porovnávať podľa" onChange={e => setCompareMode(e.target.value as any)}>
            <MenuItem value="period">Obdobie</MenuItem>
            <MenuItem value="company">Firma</MenuItem>
            <MenuItem value="customer">Zákazník</MenuItem>
          </Select>
        </FormControl>
        {compareMode === 'period' && (
          <>
            <TextField
              label="Porovnať od"
              type="date"
              value={compareDateFrom}
              onChange={e => setCompareDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 140 }}
            />
            <TextField
              label="Porovnať do"
              type="date"
              value={compareDateTo}
              onChange={e => setCompareDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 140 }}
            />
          </>
        )}
        {compareMode === 'company' && (
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Firma na porovnanie</InputLabel>
            <Select value={compareCompany} label="Firma na porovnanie" onChange={e => setCompareCompany(e.target.value)}>
              {companies.map(c => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {compareMode === 'customer' && (
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Zákazník na porovnanie</InputLabel>
            <Select value={compareCustomer} label="Zákazník na porovnanie" onChange={e => setCompareCustomer(e.target.value)}>
              {Array.from(new Set(state.rentals.map(r => r.customerName))).map(name => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
        <Card sx={{ minWidth: 220 }}>
          <CardContent>
            <Typography variant="subtitle1">Celková suma prenájmov</Typography>
            <Typography variant="h5">{totalRentals.toFixed(2)} €</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" color={percentChange(totalRentals, compareTotalRentals) >= 0 ? 'success.main' : 'error.main'}>
                {percentChange(totalRentals, compareTotalRentals).toFixed(1)} %
              </Typography>
              {percentChange(totalRentals, compareTotalRentals) > 0 && <ArrowUpwardIcon color="success" fontSize="small" />}
              {percentChange(totalRentals, compareTotalRentals) < 0 && <ArrowDownwardIcon color="error" fontSize="small" />}
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 220 }}>
          <CardContent>
            <Typography variant="subtitle1">Celkové provízie</Typography>
            <Typography variant="h5">{totalCommissions.toFixed(2)} €</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" color={percentChange(totalCommissions, compareTotalCommissions) >= 0 ? 'success.main' : 'error.main'}>
                {percentChange(totalCommissions, compareTotalCommissions).toFixed(1)} %
              </Typography>
              {percentChange(totalCommissions, compareTotalCommissions) > 0 && <ArrowUpwardIcon color="success" fontSize="small" />}
              {percentChange(totalCommissions, compareTotalCommissions) < 0 && <ArrowDownwardIcon color="error" fontSize="small" />}
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 220 }}>
          <CardContent>
            <Typography variant="subtitle1">Celkové náklady (Black Holding)</Typography>
            <Typography variant="h5">{totalExpenses.toFixed(2)} €</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" color={percentChange(totalExpenses, compareTotalExpenses) >= 0 ? 'success.main' : 'error.main'}>
                {percentChange(totalExpenses, compareTotalExpenses).toFixed(1)} %
              </Typography>
              {percentChange(totalExpenses, compareTotalExpenses) > 0 && <ArrowUpwardIcon color="success" fontSize="small" />}
              {percentChange(totalExpenses, compareTotalExpenses) < 0 && <ArrowDownwardIcon color="error" fontSize="small" />}
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 220 }}>
          <CardContent>
            <Typography variant="subtitle1">Celkový zisk/strata</Typography>
            <Typography variant="h5" color={totalProfit >= 0 ? 'success.main' : 'error.main'}>{totalProfit.toFixed(2)} €</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" color={percentChange(totalProfit, compareTotalProfit) >= 0 ? 'success.main' : 'error.main'}>
                {percentChange(totalProfit, compareTotalProfit).toFixed(1)} %
              </Typography>
              {percentChange(totalProfit, compareTotalProfit) > 0 && <ArrowUpwardIcon color="success" fontSize="small" />}
              {percentChange(totalProfit, compareTotalProfit) < 0 && <ArrowDownwardIcon color="error" fontSize="small" />}
            </Box>
          </CardContent>
        </Card>
      </Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Sumy prenájmov podľa miesta odovzdania</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {Object.entries(rentalsByPlace).map(([p, sum]) => (
              <Card key={p} sx={{ minWidth: 180, mb: 1 }}><CardContent><Typography>{p}</Typography><Typography variant="h6">{sum.toFixed(2)} €</Typography></CardContent></Card>
            ))}
            {Object.keys(rentalsByPlace).length === 0 && <Typography>Žiadne dáta</Typography>}
          </Box>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Sumy prenájmov podľa firmy</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {Object.entries(rentalsByCompany).map(([c, sum]) => (
              <Card key={c} sx={{ minWidth: 180, mb: 1 }}><CardContent><Typography>{c}</Typography><Typography variant="h6">{sum.toFixed(2)} €</Typography></CardContent></Card>
            ))}
            {Object.keys(rentalsByCompany).length === 0 && <Typography>Žiadne dáta</Typography>}
          </Box>
          {/* Bar chart */}
          <Box sx={{ width: '100%', maxWidth: 600, mt: 4 }}>
            {sortedCompanies.map(([company, sum], idx) => (
              <Box key={company} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    width: `${(sum / maxValue) * 100}%`,
                    minWidth: 24,
                    height: 32,
                    bgcolor: colors[idx % colors.length],
                    borderRadius: 1,
                    mr: 2,
                    transition: 'width 0.3s'
                  }}
                />
                <Typography sx={{ minWidth: 120, fontWeight: 500 }}>{company}</Typography>
                <Typography sx={{ ml: 2, fontWeight: 700 }}>{sum.toFixed(2)} €</Typography>
              </Box>
            ))}
            {sortedCompanies.length === 0 && <Typography>Žiadne dáta</Typography>}
          </Box>
        </CardContent>
      </Card>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Vývoj tržieb po mesiacoch ({year})</Typography>
          <Box sx={{ width: '100%', maxWidth: 700, height: 180, position: 'relative', mt: 2 }}>
            <svg width="100%" height="100%" viewBox="0 0 700 180">
              {/* Osi */}
              <line x1="40" y1="10" x2="40" y2="160" stroke="#888" strokeWidth="1" />
              <line x1="40" y1="160" x2="690" y2="160" stroke="#888" strokeWidth="1" />
              {/* Čiary a body */}
              {monthlySums.map((sum, i) => {
                if (i === 0) return null;
                const prevY = 160 - (monthlySums[i - 1] / maxMonthly) * 140;
                const y = 160 - (sum / maxMonthly) * 140;
                const x1 = 40 + ((i - 1) * 60);
                const x2 = 40 + (i * 60);
                return (
                  <g key={i}>
                    <line x1={x1} y1={prevY} x2={x2} y2={y} stroke={chartColors[i % chartColors.length]} strokeWidth="3" />
                    <circle cx={x2} cy={y} r="5" fill={chartColors[i % chartColors.length]} />
                  </g>
                );
              })}
              {/* Popisky mesiacov */}
              {months.map((m, i) => (
                <text key={m} x={40 + i * 60} y={175} fontSize="12" textAnchor="middle" fill="white">{m}</text>
              ))}
              {/* Popisky hodnôt */}
              {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                <text key={i} x={5} y={160 - p * 140} fontSize="12" fill="white">{(maxMonthly * p).toFixed(0)}</text>
              ))}
            </svg>
          </Box>
        </CardContent>
      </Card>
      
      {/* TOP zákazníci */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>TOP zákazníci</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Zoradiť podľa</InputLabel>
              <Select 
                value={customerSortBy} 
                label="Zoradiť podľa" 
                onChange={e => setCustomerSortBy(e.target.value as 'count' | 'amount')}
              >
                <MenuItem value="count">Počet prenájmov</MenuItem>
                <MenuItem value="amount">Celková suma</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Počet</InputLabel>
              <Select 
                value={topCustomersCount} 
                label="Počet" 
                onChange={e => setTopCustomersCount(Number(e.target.value))}
              >
                <MenuItem value={5}>Top 5</MenuItem>
                <MenuItem value={10}>Top 10</MenuItem>
                <MenuItem value={15}>Top 15</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            {/* Podľa počtu prenájmov */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Podľa počtu prenájmov
              </Typography>
                             {topCustomersByCount.slice(0, topCustomersCount).map((customer, idx) => (
                 <Box key={customer.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                   <Box sx={{ display: 'flex', alignItems: 'center' }}>
                     <Typography variant="body2" sx={{ minWidth: 30, fontWeight: 'bold', color: '#111' }}>
                       #{idx + 1}
                     </Typography>
                     <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold', color: '#111' }}>
                       {customer.name}
                     </Typography>
                   </Box>
                   <Box sx={{ textAlign: 'right' }}>
                     <Typography variant="body2" fontWeight="bold" sx={{ color: '#111' }}>
                       {customer.count} prenájmov
                     </Typography>
                     <Typography variant="caption" sx={{ color: '#111' }}>
                       {customer.totalAmount.toFixed(2)} €
                     </Typography>
                   </Box>
                 </Box>
               ))}
            </Box>
            
            {/* Podľa celkovej sumy */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Podľa celkovej sumy
              </Typography>
                             {topCustomersByAmount.slice(0, topCustomersCount).map((customer, idx) => (
                 <Box key={customer.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                   <Box sx={{ display: 'flex', alignItems: 'center' }}>
                     <Typography variant="body2" sx={{ minWidth: 30, fontWeight: 'bold', color: '#111' }}>
                       #{idx + 1}
                     </Typography>
                     <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold', color: '#111' }}>
                       {customer.name}
                     </Typography>
                   </Box>
                   <Box sx={{ textAlign: 'right' }}>
                     <Typography variant="body2" fontWeight="bold" sx={{ color: '#111' }}>
                       {customer.totalAmount.toFixed(2)} €
                     </Typography>
                     <Typography variant="caption" sx={{ color: '#111' }}>
                       {customer.count} prenájmov
                     </Typography>
                   </Box>
                 </Box>
               ))}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Priemerná dĺžka prenájmu */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Priemerná dĺžka prenájmu</Typography>
                     <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
             <Card sx={{ bgcolor: 'primary.light' }}>
               <CardContent>
                 <Typography variant="subtitle2" sx={{ color: '#111', fontWeight: 'bold' }}>Priemerná dĺžka</Typography>
                 <Typography variant="h4" sx={{ color: '#111', fontWeight: 'bold' }}>{averageRentalDuration.toFixed(1)} dní</Typography>
               </CardContent>
             </Card>
             <Card sx={{ bgcolor: 'success.light' }}>
               <CardContent>
                 <Typography variant="subtitle2" sx={{ color: '#111', fontWeight: 'bold' }}>Najkratší prenájom</Typography>
                 <Typography variant="h4" sx={{ color: '#111', fontWeight: 'bold' }}>{minRentalDuration} dní</Typography>
               </CardContent>
             </Card>
             <Card sx={{ bgcolor: 'warning.light' }}>
               <CardContent>
                 <Typography variant="subtitle2" sx={{ color: '#111', fontWeight: 'bold' }}>Najdlhší prenájom</Typography>
                 <Typography variant="h4" sx={{ color: '#111', fontWeight: 'bold' }}>{maxRentalDuration} dní</Typography>
               </CardContent>
             </Card>
           </Box>
          
          {/* Rozdelenie podľa dĺžky */}
          <Typography variant="subtitle1" gutterBottom>Rozdelenie podľa dĺžky prenájmu</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">{shortRentals.length}</Typography>
                <Typography variant="body2">Krátke (1-3 dni)</Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary.main">{mediumRentals.length}</Typography>
                <Typography variant="body2">Stredné (4-7 dní)</Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">{longRentals.length}</Typography>
                <Typography variant="body2">Dlhé (8-14 dní)</Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error.main">{veryLongRentals.length}</Typography>
                <Typography variant="body2">Veľmi dlhé (15+ dní)</Typography>
              </CardContent>
            </Card>
          </Box>
        </CardContent>
      </Card>

      {/* Obsadenosť vozidiel */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Obsadenosť vozidiel</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            {/* Najviac prenajímané */}
            <Box>
              <Typography variant="subtitle1" gutterBottom color="success.main">
                Najviac prenajímané vozidlá
              </Typography>
              {mostRentedVehicles.slice(0, 5).map((vehicle, idx) => (
                <Box key={vehicle.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ minWidth: 30, fontWeight: 'bold', color: 'white' }}>
                      #{idx + 1}
                    </Typography>
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="body2" fontWeight="bold" color="white">
                        {vehicle.brand} {vehicle.model}
                      </Typography>
                      <Typography variant="caption" color="white">
                        {vehicle.licensePlate} • {vehicle.company}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight="bold" color="white">
                      {vehicle.rentalCount} prenájmov
                    </Typography>
                    <Typography variant="caption" color="white">
                      {vehicle.totalRevenue.toFixed(2)} €
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            
            {/* Najmenej prenajímané */}
            <Box>
              <Typography variant="subtitle1" gutterBottom color="warning.main">
                Najmenej prenajímané vozidlá
              </Typography>
              {leastRentedVehicles.slice(0, 5).map((vehicle, idx) => (
                <Box key={vehicle.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ minWidth: 30, fontWeight: 'bold', color: 'white' }}>
                      #{idx + 1}
                    </Typography>
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="body2" fontWeight="bold" color="white">
                        {vehicle.brand} {vehicle.model}
                      </Typography>
                      <Typography variant="caption" color="white">
                        {vehicle.licensePlate} • {vehicle.company}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight="bold" color="white">
                      {vehicle.rentalCount} prenájmov
                    </Typography>
                    <Typography variant="caption" color="white">
                      {vehicle.totalRevenue.toFixed(2)} €
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
          
          {/* Štatistiky obsadenosti */}
          <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary.main">{totalVehicles}</Typography>
                <Typography variant="body2">Celkový počet vozidiel</Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">{activeVehicles}</Typography>
                <Typography variant="body2">Aktívne vozidlá (aspoň 1 prenájom)</Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">{inactiveVehicles}</Typography>
                <Typography variant="body2">Neaktívne vozidlá (0 prenájmov)</Typography>
              </CardContent>
            </Card>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 