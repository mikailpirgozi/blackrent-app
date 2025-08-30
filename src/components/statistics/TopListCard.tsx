import {
  EmojiEvents as TrophyIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
} from '@mui/material';
import React from 'react';

interface TopListCardProps {
  title: string;
  icon: React.ReactNode;
  gradient: string;
  data: any[];
  showCount: number;
  onLoadMore: () => void;
  renderItem: (item: any, index: number) => React.ReactNode;
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
  <Card
    sx={{
      height: 'fit-content',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      },
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar
          sx={{
            bgcolor: 'transparent',
            background: gradient,
            width: 48,
            height: 48,
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea' }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Top {Math.min(showCount, data.length)} z {data.length}
          </Typography>
        </Box>
        <TrophyIcon sx={{ color: '#ffd700', fontSize: 28 }} />
      </Box>

      {data.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {data
              .slice(0, showCount)
              .map((item, index) => renderItem(item, index))}
          </Box>

          {showCount < data.length && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="outlined"
                onClick={onLoadMore}
                startIcon={<KeyboardArrowDownIcon />}
                sx={{
                  borderColor: '#667eea',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#5a6fd8',
                    backgroundColor: 'rgba(102, 126, 234, 0.04)',
                  },
                }}
              >
                Zobraziť ďalších {Math.min(10, data.length - showCount)}
              </Button>
            </Box>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

export default TopListCard;
