import {
  ChevronDown as KeyboardArrowDownIcon,
  Trophy as TrophyIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import React from 'react';

interface TopListCardProps {
  title: string;
  icon: React.ReactNode;
  gradient: string;
  data: Record<string, unknown>[];
  showCount: number;
  onLoadMore: () => void;
  renderItem: (item: Record<string, unknown>, index: number) => React.ReactNode;
  emptyMessage?: string;
}

const TopListCard: React.FC<TopListCardProps> = ({
  title,
  icon,
  gradient,
  data,
  showCount,
  onLoadMore,
  renderItem,
  emptyMessage = 'Žiadne dáta',
}) => (
  <Card className="h-fit shadow-sm transition-all duration-200 hover:shadow-md">
    <CardContent className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Avatar
          className="w-12 h-12"
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
            Top {Math.min(showCount, data.length)} z {data.length}
          </Typography>
        </div>
        <TrophyIcon className="text-yellow-500 w-7 h-7" />
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8">
          <Typography variant="body1" className="text-muted-foreground">
            {emptyMessage}
          </Typography>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {data
              .slice(0, showCount)
              .map((item, index) => renderItem(item, index))}
          </div>

          {showCount < data.length && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={onLoadMore}
                className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700"
              >
                <KeyboardArrowDownIcon className="w-4 h-4 mr-2" />
                Zobraziť ďalších {Math.min(10, data.length - showCount)}
              </Button>
            </div>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

export default TopListCard;
