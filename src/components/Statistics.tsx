import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';

interface StatisticsData {
  totalRentals: number;
  totalRevenue: number;
  activeRentals: number;
  totalVehicles: number;
  monthlyRevenue: number;
  monthlyRentals: number;
}

const Statistics: React.FC = () => {
  const { state } = useAuth();
  const [stats, setStats] = useState<StatisticsData>({
    totalRentals: 0,
    totalRevenue: 0,
    activeRentals: 0,
    totalVehicles: 0,
    monthlyRevenue: 0,
    monthlyRentals: 0,
  });
  const [compareMonth] = useState(new Date().getMonth());
  const [compareYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await apiService.get('/statistics');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Mock data for demo
      setStats({
        totalRentals: 127,
        totalRevenue: 45632,
        activeRentals: 8,
        totalVehicles: 23,
        monthlyRevenue: 8450,
        monthlyRentals: 15,
      });
    }
  };

  const currentMonth = format(new Date(), 'MMMM yyyy', { locale: sk });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 3 }}>
        Štatistiky
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ backgroundColor: '#2d2d2d', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Celkový počet prenájmov
              </Typography>
              <Typography variant="h3" color="primary">
                {stats.totalRentals}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ backgroundColor: '#2d2d2d', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Celkové príjmy
              </Typography>
              <Typography variant="h3" color="success.main">
                €{stats.totalRevenue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ backgroundColor: '#2d2d2d', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Aktívne prenájmy
              </Typography>
              <Typography variant="h3" color="warning.main">
                {stats.activeRentals}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ backgroundColor: '#2d2d2d', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Celkový počet vozidiel
              </Typography>
              <Typography variant="h3" color="info.main">
                {stats.totalVehicles}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, backgroundColor: '#2d2d2d', color: 'white' }}>
            <Typography variant="h6" gutterBottom>
              Príjmy za {currentMonth}
            </Typography>
            <Typography variant="h4" color="success.main">
              €{stats.monthlyRevenue.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, backgroundColor: '#2d2d2d', color: 'white' }}>
            <Typography variant="h6" gutterBottom>
              Prenájmy za {currentMonth}
            </Typography>
            <Typography variant="h4" color="primary">
              {stats.monthlyRentals}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Statistics; 