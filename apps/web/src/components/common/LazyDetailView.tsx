// 👁️ Lazy Detail View - Heavy component for performance testing
// This represents a complex detail view component that should be lazy loaded

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';
import {
  BarChart3,
  Info,
  Clock,
} from 'lucide-react';

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
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}>
        <DialogContent className="max-w-4xl">
          <div className="flex justify-center items-center py-12">
            <Progress className="w-16 h-16" />
            <div className="ml-6">
              <h3 className="text-lg font-semibold">
                Načítavam detailné informácie...
              </h3>
              <p className="text-sm text-muted-foreground">
                Spracovávam komplexné dáta...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!detailData) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-6xl w-full">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-4">
              <Avatar className="bg-blue-500">
                <AvatarFallback>
                  <Info className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{detailData.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {detailData.subtitle}
                </p>
              </div>
              <Badge
                variant={detailData.status === 'active' ? 'default' : 'secondary'}
                className={detailData.status === 'active' ? 'bg-green-500' : ''}
              >
                {detailData.status}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
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
            <Card>
              <CardHeader>
                <CardTitle>Popis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {detailData.description}
                </p>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  História zmien
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {detailData.timeline.map((item, index: number) => (
                    <div key={index}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.event || item.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(item.date || item.timestamp).toLocaleDateString('sk')}
                          </p>
                        </div>
                        <Badge
                          variant={
                            item.type === 'success'
                              ? 'default'
                              : item.type === 'warning'
                                ? 'secondary'
                                : 'outline'
                          }
                          className={
                            item.type === 'success'
                              ? 'bg-green-500'
                              : item.type === 'warning'
                                ? 'bg-yellow-500'
                                : ''
                          }
                        >
                          {item.type || 'info'}
                        </Badge>
                      </div>
                      {index < detailData.timeline.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Informácie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-medium">Kategória:</span>{' '}
                  <span className="text-sm text-muted-foreground">
                    {detailData.category || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Zobrazenia:</span>{' '}
                  <span className="text-sm text-muted-foreground">
                    {detailData.metadata?.views || 0}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Hodnotenie:</span>{' '}
                  <span className="text-sm text-muted-foreground">
                    {detailData.metadata?.rating || 0}/5
                  </span>
                </div>
                <div>
                  <span className="font-medium">Vytvorené:</span>{' '}
                  <span className="text-sm text-muted-foreground">
                    {detailData.metadata?.createdAt
                      ? new Date(
                          detailData.metadata.createdAt
                        ).toLocaleDateString('sk')
                      : new Date(detailData.created).toLocaleDateString('sk')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytika
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {detailData.analytics?.totalViews?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Celkové zobrazenia
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {detailData.analytics?.uniqueVisitors || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Unikátni návštevníci
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold">
                      {detailData.analytics?.averageTime || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">Priemerný čas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold">
                      {detailData.analytics?.bounceRate || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">Bounce rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Items */}
            <Card>
              <CardHeader>
                <CardTitle>Súvisiace položky</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {detailData.relatedItems.map(item => (
                    <div key={item.id} className="flex gap-3">
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
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {item.id} | {item.type} | {item.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Advanced sections with accordions */}
        <div className="mt-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced">
              <AccordionTrigger className="text-lg font-semibold">
                Pokročilé nastavenia
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Tu by boli pokročilé nastavenia a konfigurácie pre túto položku.
                  Tento obsah sa načítava iba keď používateľ rozbalí sekciu.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="technical">
              <AccordionTrigger className="text-lg font-semibold">
                Technické detaily
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Technické informácie, logy, a diagnostické dáta. Tieto dáta sa
                  načítavajú iba na požiadanie.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>
            Zavrieť
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LazyDetailView;
