import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Euro as EuroIcon,
  Speed as SpeedIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Avatar,
  LinearProgress,
} from '@mui/material';
import React from 'react';

import TopListCard from './TopListCard';
import TopStatCard from './TopStatCard';

interface TopStatsTabProps {
  stats: any;
  formatPeriod: () => string;
  showVehiclesByUtilization: number;
  showVehiclesByRevenue: number;
  showVehiclesByRentals: number;
  showCustomersByRentals: number;
  showCustomersByRevenue: number;
  showCustomersByDays: number;
  setShowVehiclesByUtilization: React.Dispatch<React.SetStateAction<number>>;
  setShowVehiclesByRevenue: React.Dispatch<React.SetStateAction<number>>;
  setShowVehiclesByRentals: React.Dispatch<React.SetStateAction<number>>;
  setShowCustomersByRentals: React.Dispatch<React.SetStateAction<number>>;
  setShowCustomersByRevenue: React.Dispatch<React.SetStateAction<number>>;
  setShowCustomersByDays: React.Dispatch<React.SetStateAction<number>>;
}

const TopStatsTab: React.FC<TopStatsTabProps> = ({
  stats,
  formatPeriod,
  showVehiclesByUtilization,
  showVehiclesByRevenue,
  showVehiclesByRentals,
  showCustomersByRentals,
  showCustomersByRevenue,
  showCustomersByDays,
  setShowVehiclesByUtilization,
  setShowVehiclesByRevenue,
  setShowVehiclesByRentals,
  setShowCustomersByRentals,
  setShowCustomersByRevenue,
  setShowCustomersByDays,
}) => {
  return (
    <Grid container spacing={3}>
      {/* Úvodný prehľad */}
      <Grid item xs={12}>
        <Card
          sx={{
            mb: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TrophyIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  TOP Štatistiky
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Najlepšie výkony za obdobie: {formatPeriod()}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* 🏆 NAJLEPŠIE VÝKONY - Prehľadové karty */}
      <Grid item xs={12}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            mb: 3,
            color: '#667eea',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <StarIcon />
          🏆 Najlepšie výkony
        </Typography>
      </Grid>

      {/* Top výkony v 3 kartách */}
      <Grid item xs={12} md={4}>
        <TopStatCard
          title="Najvyťaženejšie auto"
          icon={<SpeedIcon />}
          data={stats.topVehicleByUtilization}
          primaryValue={
            stats.topVehicleByUtilization
              ? `${stats.topVehicleByUtilization.utilizationPercentage.toFixed(1)}%`
              : 'N/A'
          }
          secondaryValue={
            stats.topVehicleByUtilization
              ? `${stats.topVehicleByUtilization.totalDaysRented} dní prenájmu`
              : ''
          }
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          percentage={stats.topVehicleByUtilization?.utilizationPercentage}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TopStatCard
          title="Najvýnosnejšie auto"
          icon={<EuroIcon />}
          data={stats.topVehicleByRevenue}
          primaryValue={
            stats.topVehicleByRevenue
              ? `${stats.topVehicleByRevenue.totalRevenue.toLocaleString()} €`
              : 'N/A'
          }
          secondaryValue={
            stats.topVehicleByRevenue
              ? `${stats.topVehicleByRevenue.rentalCount} prenájmov`
              : ''
          }
          gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TopStatCard
          title="Najaktívnejší zákazník"
          icon={<PersonIcon />}
          data={stats.topCustomerByRentals}
          primaryValue={
            stats.topCustomerByRentals
              ? `${stats.topCustomerByRentals.rentalCount}x`
              : 'N/A'
          }
          secondaryValue={
            stats.topCustomerByRentals
              ? `${stats.topCustomerByRentals.totalRevenue.toLocaleString()} € celkom`
              : ''
          }
          gradient="linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)"
        />
      </Grid>

      {/* Divider */}
      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
      </Grid>

      {/* 🚗 TOP AUTÁ - Detailné rebríčky */}
      <Grid item xs={12}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            mb: 3,
            color: '#667eea',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <CarIcon />
          🚗 TOP Autá - Detailné rebríčky
        </Typography>
      </Grid>

      {/* Najvyťaženejšie autá */}
      <Grid item xs={12} lg={4}>
        <TopListCard
          title="Najvyťaženejšie autá"
          icon={<SpeedIcon />}
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          data={stats.vehiclesByUtilization}
          showCount={showVehiclesByUtilization}
          onLoadMore={() => setShowVehiclesByUtilization(prev => prev + 10)}
          renderItem={(vehicle, index) => (
            <Box
              key={vehicle.vehicle.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 2,
                backgroundColor:
                  index < 3 ? 'rgba(102, 126, 234, 0.04)' : '#f8f9fa',
                border: index === 0 ? '2px solid #ffd700' : '1px solid #e0e0e0',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Box
                sx={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: '50%',
                  background:
                    index < 3
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#bdbdbd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                {index + 1}
              </Box>

              <Avatar sx={{ width: 40, height: 40, bgcolor: '#667eea' }}>
                <CarIcon fontSize="small" />
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  {vehicle.vehicle.brand} {vehicle.vehicle.model}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {vehicle.vehicle.licensePlate} • {vehicle.totalDaysRented} dní
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{
                    color:
                      vehicle.utilizationPercentage > 70
                        ? '#4caf50'
                        : vehicle.utilizationPercentage > 40
                          ? '#ff9800'
                          : '#f44336',
                  }}
                >
                  {vehicle.utilizationPercentage.toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(vehicle.utilizationPercentage, 100)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      background:
                        vehicle.utilizationPercentage > 70
                          ? '#4caf50'
                          : vehicle.utilizationPercentage > 40
                            ? '#ff9800'
                            : '#f44336',
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>
            </Box>
          )}
          emptyMessage="Žiadne autá v tomto období"
        />
      </Grid>

      {/* Najvýnosnejšie autá */}
      <Grid item xs={12} lg={4}>
        <TopListCard
          title="Najvýnosnejšie autá"
          icon={<EuroIcon />}
          gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
          data={stats.vehiclesByRevenue}
          showCount={showVehiclesByRevenue}
          onLoadMore={() => setShowVehiclesByRevenue(prev => prev + 10)}
          renderItem={(vehicle, index) => (
            <Box
              key={vehicle.vehicle.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 2,
                backgroundColor:
                  index < 3 ? 'rgba(17, 153, 142, 0.04)' : '#f8f9fa',
                border: index === 0 ? '2px solid #ffd700' : '1px solid #e0e0e0',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Box
                sx={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: '50%',
                  background:
                    index < 3
                      ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                      : '#bdbdbd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                {index + 1}
              </Box>

              <Avatar sx={{ width: 40, height: 40, bgcolor: '#11998e' }}>
                <CarIcon fontSize="small" />
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  {vehicle.vehicle.brand} {vehicle.vehicle.model}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {vehicle.vehicle.licensePlate} • {vehicle.rentalCount}{' '}
                  prenájmov
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ color: '#11998e' }}
                >
                  {vehicle.totalRevenue.toLocaleString()} €
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {vehicle.avgRevenuePerRental.toFixed(0)} €/prenájom
                </Typography>
              </Box>
            </Box>
          )}
          emptyMessage="Žiadne autá v tomto období"
        />
      </Grid>

      {/* Najčastejšie prenajímané */}
      <Grid item xs={12} lg={4}>
        <TopListCard
          title="Najčastejšie prenajímané"
          icon={<CarIcon />}
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          data={stats.vehiclesByRentals}
          showCount={showVehiclesByRentals}
          onLoadMore={() => setShowVehiclesByRentals(prev => prev + 10)}
          renderItem={(vehicle, index) => (
            <Box
              key={vehicle.vehicle.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 2,
                backgroundColor:
                  index < 3 ? 'rgba(240, 147, 251, 0.04)' : '#f8f9fa',
                border: index === 0 ? '2px solid #ffd700' : '1px solid #e0e0e0',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Box
                sx={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: '50%',
                  background:
                    index < 3
                      ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                      : '#bdbdbd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                {index + 1}
              </Box>

              <Avatar sx={{ width: 40, height: 40, bgcolor: '#f093fb' }}>
                <CarIcon fontSize="small" />
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  {vehicle.vehicle.brand} {vehicle.vehicle.model}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {vehicle.vehicle.licensePlate} • {vehicle.totalDaysRented} dní
                  celkom
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ color: '#f093fb' }}
                >
                  {vehicle.rentalCount}x
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {vehicle.totalRevenue.toLocaleString()} € celkom
                </Typography>
              </Box>
            </Box>
          )}
          emptyMessage="Žiadne autá v tomto období"
        />
      </Grid>

      {/* Divider */}
      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
      </Grid>

      {/* 👥 TOP ZÁKAZNÍCI - Detailné rebríčky */}
      <Grid item xs={12}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            mb: 3,
            color: '#667eea',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <PersonIcon />
          👥 TOP Zákazníci - Detailné rebríčky
        </Typography>
      </Grid>

      {/* Najaktívnejší zákazníci */}
      <Grid item xs={12} lg={4}>
        <TopListCard
          title="Najaktívnejší zákazníci"
          icon={<StarIcon />}
          gradient="linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)"
          data={stats.customersByRentals}
          showCount={showCustomersByRentals}
          onLoadMore={() => setShowCustomersByRentals(prev => prev + 10)}
          renderItem={(customer, index) => (
            <Box
              key={customer.customerName}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 2,
                backgroundColor:
                  index < 3 ? 'rgba(255, 154, 158, 0.04)' : '#f8f9fa',
                border: index === 0 ? '2px solid #ffd700' : '1px solid #e0e0e0',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Box
                sx={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: '50%',
                  background:
                    index < 3
                      ? 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)'
                      : '#bdbdbd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                {index + 1}
              </Box>

              <Avatar sx={{ width: 40, height: 40, bgcolor: '#ff9a9e' }}>
                <PersonIcon fontSize="small" />
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  {customer.customerName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {customer.totalDaysRented} dní celkom • Priemer:{' '}
                  {customer.avgRentalDuration.toFixed(1)} dní
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ color: '#ff9a9e' }}
                >
                  {customer.rentalCount}x
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {customer.totalRevenue.toLocaleString()} € celkom
                </Typography>
              </Box>
            </Box>
          )}
          emptyMessage="Žiadni zákazníci v tomto období"
        />
      </Grid>

      {/* Najziskovejší zákazníci */}
      <Grid item xs={12} lg={4}>
        <TopListCard
          title="Najziskovejší zákazníci"
          icon={<MoneyIcon />}
          gradient="linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)"
          data={stats.customersByRevenue}
          showCount={showCustomersByRevenue}
          onLoadMore={() => setShowCustomersByRevenue(prev => prev + 10)}
          renderItem={(customer, index) => (
            <Box
              key={customer.customerName}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 2,
                backgroundColor:
                  index < 3 ? 'rgba(255, 107, 107, 0.04)' : '#f8f9fa',
                border: index === 0 ? '2px solid #ffd700' : '1px solid #e0e0e0',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Box
                sx={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: '50%',
                  background:
                    index < 3
                      ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'
                      : '#bdbdbd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                {index + 1}
              </Box>

              <Avatar sx={{ width: 40, height: 40, bgcolor: '#ff6b6b' }}>
                <PersonIcon fontSize="small" />
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  {customer.customerName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {customer.rentalCount} prenájmov • {customer.totalDaysRented}{' '}
                  dní
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ color: '#ff6b6b' }}
                >
                  {customer.totalRevenue.toLocaleString()} €
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(customer.totalRevenue / customer.rentalCount).toFixed(0)}{' '}
                  €/prenájom
                </Typography>
              </Box>
            </Box>
          )}
          emptyMessage="Žiadni zákazníci v tomto období"
        />
      </Grid>

      {/* Najdlhodobejší zákazníci */}
      <Grid item xs={12} lg={4}>
        <TopListCard
          title="Najdlhodobejší zákazníci"
          icon={<TimeIcon />}
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          data={stats.customersByDays}
          showCount={showCustomersByDays}
          onLoadMore={() => setShowCustomersByDays(prev => prev + 10)}
          renderItem={(customer, index) => (
            <Box
              key={customer.customerName}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 2,
                backgroundColor:
                  index < 3 ? 'rgba(79, 172, 254, 0.04)' : '#f8f9fa',
                border: index === 0 ? '2px solid #ffd700' : '1px solid #e0e0e0',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Box
                sx={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: '50%',
                  background:
                    index < 3
                      ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                      : '#bdbdbd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                {index + 1}
              </Box>

              <Avatar sx={{ width: 40, height: 40, bgcolor: '#4facfe' }}>
                <PersonIcon fontSize="small" />
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  {customer.customerName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {customer.rentalCount} prenájmov •{' '}
                  {customer.totalRevenue.toLocaleString()} €
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ color: '#4facfe' }}
                >
                  {customer.totalDaysRented} dní
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Priemer: {customer.avgRentalDuration.toFixed(1)} dní/prenájom
                </Typography>
              </Box>
            </Box>
          )}
          emptyMessage="Žiadni zákazníci v tomto období"
        />
      </Grid>
    </Grid>
  );
};

export default TopStatsTab;
