import { Trophy as TrophyIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Typography } from '@/components/ui/typography';
import React from 'react';

interface TopStatCardProps {
  title: string;
  icon: React.ReactNode;
  data: Record<string, unknown>;
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
  <Card className="h-full shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
    <CardContent className="p-6">
      <div className="flex items-center gap-4 mb-4">
        <Avatar
          className="w-14 h-14"
          style={{ background: gradient }}
        >
          <AvatarFallback className="text-white">
            {icon}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Typography variant="h6" className="font-bold text-blue-600">
            {title}
          </Typography>
          <Typography variant="body2" className="text-muted-foreground">
            {data
              ? (data as Record<string, unknown>).vehicle
                ? `${((data as Record<string, unknown>).vehicle as Record<string, unknown>).brand as string} ${((data as Record<string, unknown>).vehicle as Record<string, unknown>).model as string}`
                : ((data as Record<string, unknown>).customerName as string)
              : 'N/A'}
          </Typography>
        </div>
        <TrophyIcon className="text-yellow-500 w-8 h-8" />
      </div>

      <div className="mb-4">
        <Typography
          variant="h4"
          className="font-bold text-blue-600 mb-1"
        >
          {primaryValue}
        </Typography>
        <Typography variant="body2" className="text-muted-foreground">
          {secondaryValue}
        </Typography>
      </div>

      {percentage !== undefined && (
        <div className="mt-4">
          <div className="flex justify-between mb-2">
            <Typography variant="body2" className="text-muted-foreground">
              Vyťaženosť
            </Typography>
            <Typography
              variant="body2"
              className="font-semibold text-blue-600"
            >
              {percentage.toFixed(1)}%
            </Typography>
          </div>
          <Progress
            value={Math.min(percentage, 100)}
            className="h-2"
            style={{
              background: `linear-gradient(90deg, ${gradient})`,
            }}
          />
        </div>
      )}
    </CardContent>
  </Card>
);

export default TopStatCard;
