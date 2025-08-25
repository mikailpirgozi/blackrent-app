import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Divider,
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Person as PersonIcon } from '@mui/icons-material';
import CustomTooltip from './CustomTooltip';

interface OverviewTabProps {
  stats: any;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ stats }) => {
  return (
    <Grid container spacing={3}>
      {/* Mesiačný trend */}
      <Grid item xs={12} lg={8}>
        <Card sx={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#667eea' }}>
              Mesiačný trend príjmov
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#667eea" 
                  fill="url(#colorRevenue)" 
                  strokeWidth={3}
                  name="Príjmy"
                />
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Rýchle štatistiky */}
      <Grid item xs={12} lg={4}>
        <Card sx={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#667eea' }}>
              Rýchle štatistiky
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                p: 2,
                borderRadius: 1,
                backgroundColor: '#f8f9fa'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Priemerná cena</Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#11998e' }}>
                  {stats.avgRentalPrice.toFixed(2)} €
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                p: 2,
                borderRadius: 1,
                backgroundColor: '#f8f9fa'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Priemerná dĺžka</Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#667eea' }}>
                  {stats.avgRentalDuration.toFixed(1)} dní
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                p: 2,
                borderRadius: 1,
                backgroundColor: '#f8f9fa'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Celková provízia</Typography>
                <Typography variant="h6" fontWeight="bold" color="warning.main">
                  {stats.totalCommission.toLocaleString()} €
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                p: 2,
                borderRadius: 1,
                backgroundColor: '#f8f9fa'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Zajtrajšie vrátenia</Typography>
                <Typography variant="h6" fontWeight="bold" color="info.main">
                  {stats.tomorrowReturns.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Top firmy */}
      <Grid item xs={12}>
        <Card sx={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#667eea' }}>
              Top firmy podľa príjmov
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Firma</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Počet prenájmov</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Príjmy</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Provízia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(stats.companyStats)
                    .sort(([,a], [,b]) => (b as any).revenue - (a as any).revenue)
                    .slice(0, 5)
                    .map(([company, data]) => (
                      <TableRow 
                        key={company}
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: '#f8f9fa' 
                          },
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#667eea' }}>
                              <PersonIcon fontSize="small" />
                            </Avatar>
                            <Typography variant="body2" fontWeight="medium">
                              {company}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={(data as any).count} 
                            size="small" 
                            sx={{ 
                              backgroundColor: '#667eea',
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" sx={{ color: '#11998e' }}>
                            {(data as any).revenue.toLocaleString()} €
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="warning.main" fontWeight="bold">
                            {(data as any).commission.toLocaleString()} €
                          </Typography>
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
  );
};

export default OverviewTab;
