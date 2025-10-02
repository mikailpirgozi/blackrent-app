import { BarChart3, Euro, User, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface EmployeeStatistic {
  employeeName: string;
  handoverCount: number;
  returnCount: number;
  totalProtocols: number;
  handoverRevenue: number;
  returnRevenue: number;
  totalRevenue: number;
  uniqueRentals: number;
}

interface EmployeeStats {
  allEmployees: EmployeeStatistic[];
  topEmployeesByProtocols: EmployeeStatistic[];
  topEmployeesByRevenue: EmployeeStatistic[];
  topEmployeesByHandovers: EmployeeStatistic[];
  topEmployeesByReturns: EmployeeStatistic[];
  totalProtocols: number;
  totalHandovers: number;
  totalReturns: number;
  activeEmployees: number;
}

interface StatsData {
  employeeStats: EmployeeStats;
}

interface EmployeesTabProps {
  stats: StatsData;
  formatPeriod: () => string;
}

const EmployeesTab = ({ stats, formatPeriod }: EmployeesTabProps) => {
  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="col-span-full">
        <h2 className="text-2xl font-bold mb-6 text-blue-600 flex items-center gap-2">
          <User className="h-6 w-6" />
          Výkon zamestnancov za obdobie: {formatPeriod()}
        </h2>
      </div>

      {/* Employee Statistics Cards */}
      {stats.employeeStats && stats.employeeStats.activeEmployees > 0 ? (
        <>
          {/* Summary Stats */}
          <div className="col-span-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                <CardContent className="text-center p-6">
                  <h3 className="text-3xl font-bold mb-2">
                    {stats.employeeStats.totalProtocols}
                  </h3>
                  <p className="text-sm opacity-90">Celkovo protokolov</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-pink-400 to-red-500 text-white shadow-lg">
                <CardContent className="text-center p-6">
                  <h3 className="text-3xl font-bold mb-2">
                    {stats.employeeStats.totalHandovers}
                  </h3>
                  <p className="text-sm opacity-90">Odovzdaní</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg">
                <CardContent className="text-center p-6">
                  <h3 className="text-3xl font-bold mb-2">
                    {stats.employeeStats.totalReturns}
                  </h3>
                  <p className="text-sm opacity-90">Prebraní</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-pink-500 to-yellow-400 text-white shadow-lg">
                <CardContent className="text-center p-6">
                  <h3 className="text-3xl font-bold mb-2">
                    {stats.employeeStats.activeEmployees}
                  </h3>
                  <p className="text-sm opacity-90">Aktívnych zamestnancov</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Top Employees by Protocols */}
          <div className="col-span-full lg:col-span-6">
            <Card className="shadow-lg h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Trophy className="h-5 w-5" />
                  Top zamestnanci (protokoly)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  {stats.employeeStats.topEmployeesByProtocols
                    .slice(0, 10)
                    .map((employee: EmployeeStatistic, index: number) => (
                      <div
                        key={index}
                        className={`flex justify-between items-center p-4 mb-2 rounded-lg border ${
                          index < 3
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              index === 0
                                ? 'bg-yellow-500'
                                : index === 1
                                  ? 'bg-gray-400'
                                  : index === 2
                                    ? 'bg-amber-600'
                                    : 'bg-blue-500'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              {employee.employeeName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {employee.handoverCount} odovzdaní •{' '}
                              {employee.returnCount} prebraní
                            </p>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-blue-600">
                          {employee.totalProtocols}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Employees by Revenue */}
          <div className="col-span-full lg:col-span-6">
            <Card className="shadow-lg h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Euro className="h-5 w-5" />
                  Top zamestnanci (tržby)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  {stats.employeeStats.topEmployeesByRevenue
                    .slice(0, 10)
                    .map((employee: EmployeeStatistic, index: number) => (
                      <div
                        key={index}
                        className={`flex justify-between items-center p-4 mb-2 rounded-lg border ${
                          index < 3
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              index === 0
                                ? 'bg-yellow-500'
                                : index === 1
                                  ? 'bg-gray-400'
                                  : index === 2
                                    ? 'bg-amber-600'
                                    : 'bg-green-500'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              {employee.employeeName}
                            </p>
                            <p className="text-xs text-gray-500">
                              Tržby: €{employee.totalRevenue.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-green-600">
                          €{employee.totalRevenue?.toLocaleString() || 0}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Employee Table */}
          <div className="col-span-full">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <BarChart3 className="h-5 w-5" />
                  Detailné štatistiky zamestnancov
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Zamestnanec</TableHead>
                        <TableHead className="text-center font-semibold">Protokoly</TableHead>
                        <TableHead className="text-center font-semibold">Odovzdania</TableHead>
                        <TableHead className="text-center font-semibold">Prebrania</TableHead>
                        <TableHead className="text-right font-semibold">Tržby</TableHead>
                        <TableHead className="text-center font-semibold">Prenájmy</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.employeeStats.allEmployees
                        .sort((a: EmployeeStatistic, b: EmployeeStatistic) => b.totalProtocols - a.totalProtocols)
                        .map((employee: EmployeeStatistic, index: number) => (
                          <TableRow
                            key={index}
                            className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600" />
                                <span className="font-semibold text-sm">
                                  {employee.employeeName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="default" className="bg-blue-600">
                                {employee.totalProtocols}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">
                                {employee.handoverCount}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">
                                {employee.returnCount}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-semibold text-green-600">
                                N/A
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm">
                                {employee.uniqueRentals || 0}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="col-span-full">
          <Card className="shadow-lg">
            <CardContent className="text-center py-8">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Žiadne protokoly za vybrané obdobie
              </h3>
              <p className="text-sm text-gray-500">
                V tomto období neboli vytvorené žiadne protokoly odovzdávania
                alebo preberania vozidiel.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EmployeesTab;
