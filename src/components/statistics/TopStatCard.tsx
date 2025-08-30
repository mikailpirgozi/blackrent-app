import { EmojiEvents as TrophyIcon } from '@mui/icons-material';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
} from '@mui/material';
import React from 'react';

interface TopStatCardProps {
  title: string;
  icon: React.ReactNode;
  data: any;
  primaryValue: string;
  secondaryValue: string;
  gradient: string;
  percentage?: number;
}

const TopStatCard: React.FC<TopStatCardProps> = ({
  title,
  icon,
  data,
  primaryValue,
  secondaryValue,
  gradient,
  percentage,
}) => (
  <Card
    sx={{
      height: '100%',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        transform: 'translateY(-4px)',
      },
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Avatar
          sx={{
            bgcolor: 'transparent',
            background: gradient,
            width: 56,
            height: 56,
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea' }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data
              ? data.vehicle
                ? `${data.vehicle.brand} ${data.vehicle.model}`
                : data.customerName
              : 'N/A'}
          </Typography>
        </Box>
        <TrophyIcon sx={{ color: '#ffd700', fontSize: 32 }} />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, color: '#667eea', mb: 0.5 }}
        >
          {primaryValue}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {secondaryValue}
        </Typography>
      </Box>

      {percentage !== undefined && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Vyťaženosť
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: '#667eea' }}
            >
              {percentage.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(percentage, 100)}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                background: gradient,
                borderRadius: 4,
              },
            }}
          />
        </Box>
      )}
    </CardContent>
  </Card>
);

export default TopStatCard;
