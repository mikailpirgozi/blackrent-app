// 👁️ Lazy Detail View - Heavy component for performance testing
// This represents a complex detail view component that should be lazy loaded

import {
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

import { OptimizedImage } from './OptimizedImage';

interface DetailData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  created: string;
  updated: string;
  tags: string[];
  image?: string;
  category?: string;
  metadata?: {
    createdAt: string;
    updatedAt: string;
    views: number;
    rating: number;
  };
  timeline: Array<{
    id: string;
    action: string;
    timestamp: string;
    user: string;
    details: string;
    date?: string;
    event?: string;
    type?: string;
  }>;
  analytics?: {
    totalViews: number;
    uniqueVisitors: number;
    averageTime: string;
    bounceRate: string;
  };
  relatedItems: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    image?: string;
  }>;
}

interface LazyDetailViewProps {
  itemId: string;
  open: boolean;
  onClose: () => void;
}

const LazyDetailView: React.FC<LazyDetailViewProps> = ({
  itemId,
  open,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [detailData, setDetailData] = useState<DetailData | null>(null);

  // Simulate loading heavy detail data
  useEffect(() => {
    if (open) {
      setLoading(true);
      // Simulate API call with complex data
      setTimeout(() => {
        setDetailData({
          id: itemId,
          title: `Detail View for Item ${itemId}`,
          subtitle: 'Comprehensive item details',
          description:
            'This is a detailed description of the item with lots of information.',
          status: 'active',
          priority: 'high',
          assignee: 'John Doe',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          tags: ['important', 'urgent'],
          image: '/placeholder-image.jpg',
          category: 'Sample Category',
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            views: Math.floor(Math.random() * 1000),
            rating: 4.5,
          },
          timeline: [
            {
              id: '1',
              action: 'Item created',
              timestamp: '2025-01-15T10:00:00Z',
              user: 'System',
              details: 'Item was created',
              date: '2025-01-15',
              event: 'Item created',
              type: 'info',
            },
            {
              id: '2',
              action: 'Status updated',
              timestamp: '2025-01-14T15:30:00Z',
              user: 'Admin',
              details: 'Status changed to active',
              date: '2025-01-14',
              event: 'Status updated',
              type: 'success',
            },
            {
              id: '3',
              action: 'Category changed',
              timestamp: '2025-01-13T09:15:00Z',
              user: 'Manager',
              details: 'Category updated',
              date: '2025-01-13',
              event: 'Category changed',
              type: 'warning',
            },
          ],
          analytics: {
            totalViews: 1234,
            uniqueVisitors: 567,
            averageTime: '2m 34s',
            bounceRate: '12%',
          },
          relatedItems: [
            {
              id: '1',
              title: 'Related Item 1',
              type: 'document',
              status: 'active',
              image: '/placeholder-1.jpg',
            },
            {
              id: '2',
              title: 'Related Item 2',
              type: 'task',
              status: 'pending',
              image: '/placeholder-2.jpg',
            },
            {
              id: '3',
              title: 'Related Item 3',
              type: 'note',
              status: 'completed',
              image: '/placeholder-3.jpg',
            },
          ],
        });
        setLoading(false);
      }, 800); // Longer delay to simulate complex data loading
    }
  }, [open, itemId]);

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            py={6}
          >
            <CircularProgress size={60} />
            <Box ml={3}>
              <Typography variant="h6">
                Načítavam detailné informácie...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Spracovávam komplexné dáta...
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!detailData) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <InfoIcon />
          </Avatar>
          <Box>
            <Typography variant="h5">{detailData.title}</Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {detailData.subtitle}
            </Typography>
          </Box>
          <Box ml="auto">
            <Chip
              label={detailData.status}
              color={detailData.status === 'active' ? 'success' : 'default'}
            />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            {/* Image */}
            {detailData.image && (
              <OptimizedImage
                src={detailData.image}
                alt={detailData.title}
                width="100%"
                height={300}
                aspectRatio={16 / 9}
                placeholder="skeleton"
                priority={true}
              />
            )}

            {/* Description */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Popis
                </Typography>
                <Typography variant="body1">
                  {detailData.description}
                </Typography>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  História zmien
                </Typography>
                <List>
                  {detailData.timeline.map((item, index: number) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemText
                          primary={item.event || item.action}
                          secondary={new Date(
                            item.date || item.timestamp
                          ).toLocaleDateString('sk')}
                        />
                        <Chip
                          size="small"
                          label={item.type || 'info'}
                          color={
                            item.type === 'success'
                              ? 'success'
                              : item.type === 'warning'
                                ? 'warning'
                                : 'info'
                          }
                        />
                      </ListItem>
                      {index < detailData.timeline.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Metadata */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Informácie
                </Typography>
                <Box sx={{ '& > *': { mb: 1 } }}>
                  <Typography variant="body2">
                    <strong>Kategória:</strong> {detailData.category || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Zobrazenia:</strong>{' '}
                    {detailData.metadata?.views || 0}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Hodnotenie:</strong>{' '}
                    {detailData.metadata?.rating || 0}/5
                  </Typography>
                  <Typography variant="body2">
                    <strong>Vytvorené:</strong>{' '}
                    {detailData.metadata?.createdAt
                      ? new Date(
                          detailData.metadata.createdAt
                        ).toLocaleDateString('sk')
                      : new Date(detailData.created).toLocaleDateString('sk')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Analytika
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary.main">
                        {detailData.analytics?.totalViews?.toLocaleString() ||
                          0}
                      </Typography>
                      <Typography variant="caption">
                        Celkové zobrazenia
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="secondary.main">
                        {detailData.analytics?.uniqueVisitors || 0}
                      </Typography>
                      <Typography variant="caption">
                        Unikátni návštevníci
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="body1">
                        {detailData.analytics?.averageTime || 'N/A'}
                      </Typography>
                      <Typography variant="caption">Priemerný čas</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="body1">
                        {detailData.analytics?.bounceRate || 'N/A'}
                      </Typography>
                      <Typography variant="caption">Bounce rate</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Related Items */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Súvisiace položky
                </Typography>
                {detailData.relatedItems.map(item => (
                  <Box key={item.id} sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    {item.image && (
                      <OptimizedImage
                        src={item.image}
                        alt={item.title}
                        width={60}
                        height={60}
                        aspectRatio={1}
                        placeholder="icon"
                        lazy={true}
                      />
                    )}
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {item.id} | {item.type} | {item.status}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Advanced sections with accordions */}
        <Box sx={{ mt: 3 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Pokročilé nastavenia</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                Tu by boli pokročilé nastavenia a konfigurácie pre túto položku.
                Tento obsah sa načítava iba keď používateľ rozbalí sekciu.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Technické detaily</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                Technické informácie, logy, a diagnostické dáta. Tieto dáta sa
                načítavajú iba na požiadanie.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Zavrieť
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LazyDetailView;
