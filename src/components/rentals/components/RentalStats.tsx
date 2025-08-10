import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  DirectionsCar as CarIcon
} from '@mui/icons-material';

interface RentalStatsProps {
  stats: {
    total: number;
    active: number;
    completed: number;
    pending: number;
  };
}

export function RentalStats({ stats }: RentalStatsProps) {
  const theme = useTheme();

  const statItems = [
    {
      label: 'Celkom',
      value: stats.total,
      icon: <CarIcon />,
      color: theme.palette.primary.main,
      bgColor: theme.palette.primary.light + '20'
    },
    {
      label: 'Aktívne',
      value: stats.active,
      icon: <TrendingUpIcon />,
      color: theme.palette.success.main,
      bgColor: theme.palette.success.light + '20'
    },
    {
      label: 'Dokončené',
      value: stats.completed,
      icon: <CheckCircleIcon />,
      color: theme.palette.info.main,
      bgColor: theme.palette.info.light + '20'
    },
    {
      label: 'Čakajúce',
      value: stats.pending,
      icon: <ScheduleIcon />,
      color: theme.palette.warning.main,
      bgColor: theme.palette.warning.light + '20'
    }
  ];

  return (
    <Box mb={3}>
      <Grid container spacing={2}>
        {statItems.map((item, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                backgroundColor: item.bgColor,
                border: `1px solid ${item.color}30`
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: item.color + '20',
                  color: item.color
                }}
              >
                {item.icon}
              </Box>
              
              <Box>
                <Typography variant="h6" fontWeight="bold" color={item.color}>
                  {item.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
