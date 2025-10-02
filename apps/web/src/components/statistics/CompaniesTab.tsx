import { User } from 'lucide-react';
import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface CompanyData {
  count: number;
  revenue: number;
  commission: number;
}

interface StatsData {
  companyStats: Record<string, CompanyData>;
}

interface CompaniesTabProps {
  stats: StatsData;
}

const CompaniesTab: React.FC<CompaniesTabProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(stats.companyStats)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .map(([company, data]) => (
          <Card
            key={company}
            className="shadow-md transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="bg-blue-500">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold">
                    {company}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {data.count} prenájmov
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center mb-2 p-3 rounded-md bg-muted/50">
                <span className="text-sm font-semibold">
                  Príjmy:
                </span>
                <span className="text-sm font-bold text-green-600">
                  {data.revenue.toLocaleString()} €
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-md bg-orange-50">
                <span className="text-sm font-semibold">
                  Provízia:
                </span>
                <span className="text-sm font-bold text-orange-600">
                  {data.commission.toLocaleString()} €
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
};

export default CompaniesTab;
