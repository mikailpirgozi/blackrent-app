import { Person as PersonIcon } from '@mui/icons-material';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
} from '@mui/material';
import React from 'react';

interface CompaniesTabProps {
  stats: any;
}

const CompaniesTab: React.FC<CompaniesTabProps> = ({ stats }) => {
  return (
    <Grid container spacing={3}>
      {Object.entries(stats.companyStats)
        .sort(([, a], [, b]) => (b as any).revenue - (a as any).revenue)
        .map(([company, data]) => (
          <Grid item xs={12} md={6} lg={4} key={company}>
            <Card
              sx={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
                >
                  <Avatar sx={{ bgcolor: '#667eea' }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {company}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(data as any).count} prenájmov
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                    p: 1.5,
                    borderRadius: 1,
                    backgroundColor: '#f8f9fa',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Príjmy:
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    sx={{ color: '#11998e' }}
                  >
                    {(data as any).revenue.toLocaleString()} €
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    p: 1.5,
                    borderRadius: 1,
                    backgroundColor: '#fff3e0',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Provízia:
                  </Typography>
                  <Typography
                    variant="body2"
                    color="warning.main"
                    fontWeight="bold"
                  >
                    {(data as any).commission.toLocaleString()} €
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
    </Grid>
  );
};

export default CompaniesTab;
