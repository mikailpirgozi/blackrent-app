import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import {
  Assessment as AssessmentIcon,
  Euro as EuroIcon,
  Person as PersonIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';

interface EmployeeStats {
  activeEmployees: number;
  totalProtocols: number;
  totalHandovers: number;
  totalReturns: number;
  topEmployeesByProtocols: Array<{
    employeeName: string;
    totalProtocols: number;
    handoverCount: number;
    returnCount: number;
    uniqueRentals?: number;
  }>;
  topEmployeesByRevenue: Array<{
    employeeName: string;
    totalRevenue: number;
  }>;
  allEmployees: Array<{
    employeeName: string;
    totalProtocols: number;
    handoverCount: number;
    returnCount: number;
    uniqueRentals?: number;
  }>;
}

interface EmployeesTabProps {
  stats: {
    employeeStats?: EmployeeStats;
  };
  formatPeriod: () => string;
}

const EmployeesTab: React.FC<EmployeesTabProps> = ({ stats, formatPeriod }) => {
  return (
    <Grid container spacing={3}>
      {/* Header */}
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
          <UnifiedIcon name="user" />
          Výkon zamestnancov za obdobie: {formatPeriod()}
        </Typography>
      </Grid>

      {/* Employee Statistics Cards */}
      {stats.employeeStats && stats.employeeStats.activeEmployees > 0 ? (
        <>
          {/* Summary Stats */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {stats.employeeStats.totalProtocols}
                    </Typography>
                    <Typography variant="body2">Celkovo protokolov</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    background:
                      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {stats.employeeStats.totalHandovers}
                    </Typography>
                    <Typography variant="body2">Odovzdaní</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    background:
                      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {stats.employeeStats.totalReturns}
                    </Typography>
                    <Typography variant="body2">Prebraní</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    background:
                      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    color: 'white',
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {stats.employeeStats.activeEmployees}
                    </Typography>
                    <Typography variant="body2">
                      Aktívnych zamestnancov
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Top Employees by Protocols */}
          <Grid item xs={12} lg={6}>
            <Card
              sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: '100%' }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <TrophyIcon />
                  Top zamestnanci (protokoly)
                </Typography>
                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {stats.employeeStats.topEmployeesByProtocols
                    .slice(0, 10)
                    .map((employee, index: number) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 2,
                          mb: 1,
                          bgcolor:
                            index < 3
                              ? 'rgba(102, 126, 234, 0.1)'
                              : 'background.paper',
                          borderRadius: 2,
                          border:
                            index < 3
                              ? '1px solid rgba(102, 126, 234, 0.2)'
                              : '1px solid rgba(0,0,0,0.1)',
                        }}
                      >
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                        >
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor:
                                index === 0
                                  ? '#FFD700'
                                  : index === 1
                                    ? '#C0C0C0'
                                    : index === 2
                                      ? '#CD7F32'
                                      : '#667eea',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 700,
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Box>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 600 }}
                            >
                              {employee.employeeName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {employee.handoverCount} odovzdaní •{' '}
                              {employee.returnCount} prebraní
                            </Typography>
                          </Box>
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: '#667eea' }}
                        >
                          {employee.totalProtocols}
                        </Typography>
                      </Box>
                    ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Employees by Revenue */}
          <Grid item xs={12} lg={6}>
            <Card
              sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: '100%' }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <EuroIcon />
                  Top zamestnanci (tržby)
                </Typography>
                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {stats.employeeStats.topEmployeesByRevenue
                    .slice(0, 10)
                    .map((employee, index: number) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 2,
                          mb: 1,
                          bgcolor:
                            index < 3
                              ? 'rgba(76, 175, 80, 0.1)'
                              : 'background.paper',
                          borderRadius: 2,
                          border:
                            index < 3
                              ? '1px solid rgba(76, 175, 80, 0.2)'
                              : '1px solid rgba(0,0,0,0.1)',
                        }}
                      >
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                        >
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor:
                                index === 0
                                  ? '#FFD700'
                                  : index === 1
                                    ? '#C0C0C0'
                                    : index === 2
                                      ? '#CD7F32'
                                      : '#4CAF50',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 700,
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Box>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 600 }}
                            >
                              {employee.employeeName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Tržby: €{employee.totalRevenue.toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: '#4CAF50' }}
                        >
                          €{employee.totalRevenue?.toLocaleString() || 0}
                        </Typography>
                      </Box>
                    ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Detailed Employee Table */}
          <Grid item xs={12}>
            <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <UnifiedIcon name="assessment" />
                  Detailné štatistiky zamestnancov
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>
                          Zamestnanec
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                          Protokoly
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                          Odovzdania
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                          Prebrania
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          Tržby
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                          Prenájmy
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.employeeStats.allEmployees
                        .sort((a, b) => b.totalProtocols - a.totalProtocols)
                        .map((employee, index: number) => (
                          <TableRow
                            key={index}
                            sx={{
                              '&:nth-of-type(odd)': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                              },
                            }}
                          >
                            <TableCell>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <UnifiedIcon name="user" color="primary" />
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {employee.employeeName}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={employee.totalProtocols}
                                color="primary"
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={employee.handoverCount}
                                color="secondary"
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={employee.returnCount}
                                color="info"
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, color: '#4CAF50' }}
                              >
                                N/A
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">
                                {employee.uniqueRentals || 0}
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
        </>
      ) : (
        <Grid item xs={12}>
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <UnifiedIcon name="user" sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Žiadne protokoly za vybrané obdobie
              </Typography>
              <Typography variant="body2" color="text.secondary">
                V tomto období neboli vytvorené žiadne protokoly odovzdávania
                alebo preberania vozidiel.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

export default EmployeesTab;
