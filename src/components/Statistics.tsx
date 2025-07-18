import React from 'react';
import { Box, Typography, Card, CardContent, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Statistics: React.FC = () => {
  const { state } = useAuth();

  // Fiktívne dáta pre štatistiky
  const stats = {
    totalRentals: 127,
    totalRevenue: 45632,
    activeRentals: 8,
    totalVehicles: 23,
    monthlyRevenue: 8450,
    monthlyRentals: 15,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Štatistiky
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Celkový počet prenájmov
            </Typography>
            <Typography variant="h3" color="primary">
              {stats.totalRentals}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Celkové príjmy
            </Typography>
            <Typography variant="h3" color="success.main">
              €{stats.totalRevenue.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Aktívne prenájmy
            </Typography>
            <Typography variant="h3" color="warning.main">
              {stats.activeRentals}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Celkový počet vozidiel
            </Typography>
            <Typography variant="h3" color="info.main">
              {stats.totalVehicles}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Mesačné príjmy
          </Typography>
          <Typography variant="h4" color="success.main">
            €{stats.monthlyRevenue.toLocaleString()}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Mesačné prenájmy
          </Typography>
          <Typography variant="h4" color="primary">
            {stats.monthlyRentals}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default Statistics;
