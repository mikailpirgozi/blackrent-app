import React from 'react';
import {
  Typography,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import CustomTooltip from './CustomTooltip';

interface ChartsTabProps {
  stats: any;
  COLORS: string[];
}

const ChartsTab: React.FC<ChartsTabProps> = ({ stats, COLORS }) => {
  return (
    <Grid container spacing={3}>
      {/* Stĺpcový graf - mesiačné prenájmy */}
      <Grid item xs={12} lg={6}>
        <Card sx={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#667eea' }}>
              Počet prenájmov podľa mesiacov
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rentals" fill="#667eea" name="Prenájmy" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Koláčový graf - spôsoby platby */}
      <Grid item xs={12} lg={6}>
        <Card sx={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#667eea' }}>
              Rozdelenie podľa spôsobu platby
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(stats.paymentMethodStats).map(([method, data]) => ({
                    name: method,
                    value: (data as any).count,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#667eea"
                  dataKey="value"
                >
                  {Object.entries(stats.paymentMethodStats).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Línový graf - trend príjmov vs provízií */}
      <Grid item xs={12}>
        <Card sx={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#667eea' }}>
              Trend príjmov vs provízií
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  name="Príjmy"
                  dot={{ fill: '#667eea', strokeWidth: 2, r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="commission" 
                  stroke="#11998e" 
                  strokeWidth={3}
                  name="Provízie"
                  dot={{ fill: '#11998e', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ChartsTab;
