import {
  Car,
  Users,
  Receipt,
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Typography } from '@/components/ui/typography';
import { Separator } from '@/components/ui/separator';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRentals } from '@/lib/react-query/hooks/useRentals';
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  gradient: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  gradient,
}) => (
  <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
    {/* Gradient background */}
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
    
    <CardContent className="relative p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <div className="text-white">{icon}</div>
        </div>
        {trend && (
          <Badge
            variant={trend.isPositive ? 'default' : 'destructive'}
            className="gap-1"
          >
            <TrendingUp className={`h-3 w-3 ${!trend.isPositive && 'rotate-180'}`} />
            {trend.value}
          </Badge>
        )}
      </div>
      
      <div>
        <Typography variant="h3" className="text-3xl font-bold mb-1">
          {value}
        </Typography>
        <Typography variant="body2" className="text-muted-foreground font-medium">
          {title}
        </Typography>
        <Typography variant="caption" className="text-muted-foreground/70 mt-1">
          {subtitle}
        </Typography>
      </div>
    </CardContent>
  </Card>
);

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  gradient: string;
}

const QuickAction: React.FC<QuickActionProps> = ({
  title,
  description,
  icon,
  onClick,
  gradient,
}) => (
  <Card
    className="cursor-pointer border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group"
    onClick={onClick}
  >
    <CardContent className="p-5">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <div className="text-white">{icon}</div>
        </div>
        <div className="flex-1">
          <Typography variant="h6" className="font-semibold mb-1 group-hover:text-primary transition-colors">
            {title}
          </Typography>
          <Typography variant="body2" className="text-muted-foreground">
            {description}
          </Typography>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
    </CardContent>
  </Card>
);

interface RecentActivityItem {
  id: string;
  type: 'rental' | 'return' | 'booking';
  title: string;
  subtitle: string;
  time: string;
  status: 'success' | 'warning' | 'pending';
}

const RecentActivityCard: React.FC<{ item: RecentActivityItem }> = ({ item }) => {
  const statusColors = {
    success: 'from-green-500 to-emerald-600',
    warning: 'from-orange-500 to-amber-600',
    pending: 'from-blue-500 to-cyan-600',
  };

  const StatusIcon = item.status === 'success' ? CheckCircle : item.status === 'warning' ? AlertTriangle : Clock;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
      <div className={`p-2 rounded-lg bg-gradient-to-br ${statusColors[item.status]} mt-1`}>
        <StatusIcon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <Typography variant="body2" className="font-semibold group-hover:text-primary transition-colors">
          {item.title}
        </Typography>
        <Typography variant="caption" className="text-muted-foreground">
          {item.subtitle}
        </Typography>
      </div>
      <Typography variant="caption" className="text-muted-foreground whitespace-nowrap">
        {item.time}
      </Typography>
    </div>
  );
};

export default function PremiumDashboard() {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { data: rentals, isLoading: rentalsLoading } = useRentals();
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate statistics
  const activeRentals = rentals?.filter(r => r.status === 'active').length || 0;
  const totalVehicles = vehicles?.length || 0;
  const availableVehicles = vehicles?.filter(v => v.status === 'available').length || 0;
  const pendingRentals = rentals?.filter(r => r.status === 'pending').length || 0;

  // Calculate monthly revenue (example)
  const monthlyRevenue = rentals
    ?.filter(r => {
      const rentalDate = new Date(r.startDate);
      return rentalDate.getMonth() === new Date().getMonth();
    })
    .reduce((sum, r) => sum + (r.totalPrice || 0), 0) || 0;

  // Recent activity
  const recentActivity: RecentActivityItem[] = (rentals || [])
    .slice(0, 5)
    .filter(rental => rental.customer && rental.vehicle)
    .map(rental => ({
      id: rental.id,
      type: rental.status === 'active' ? 'rental' : rental.status === 'finished' ? 'return' : 'booking',
      title: rental.customer?.name || 'Neznámy zákazník',
      subtitle: rental.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model}` : 'Neznáme vozidlo',
      time: format(new Date(rental.startDate), 'HH:mm', { locale: sk }),
      status: rental.status === 'finished' ? 'success' : rental.status === 'active' ? 'warning' : 'pending',
    }));

  const isLoading = rentalsLoading || vehiclesLoading;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-blue-950/30 dark:to-slate-950">
      {/* Animated background orbs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
      <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />

      {/* Content */}
      <div className="relative container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <Typography variant="h1" className="text-3xl font-bold">
                Vitajte späť, {state.user?.firstName || 'Admin'}! 👋
              </Typography>
            </div>
            <Typography variant="body1" className="text-muted-foreground">
              {format(currentTime, "EEEE, d. MMMM yyyy • HH:mm", { locale: sk })}
            </Typography>
          </div>
          
          <Button
            onClick={() => navigate('/rentals/new')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60 transition-all"
          >
            <Receipt className="h-5 w-5 mr-2" />
            Nový prenájom
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          <StatCard
            title="Aktívne prenájmy"
            value={isLoading ? '...' : activeRentals}
            subtitle="Momentálne aktívne vozidlá"
            icon={<Activity className="h-6 w-6" />}
            gradient="from-blue-500 to-cyan-600"
            trend={{ value: '+12%', isPositive: true }}
          />
          <StatCard
            title="Dostupné vozidlá"
            value={isLoading ? '...' : `${availableVehicles}/${totalVehicles}`}
            subtitle="Pripravené na prenájom"
            icon={<Car className="h-6 w-6" />}
            gradient="from-green-500 to-emerald-600"
          />
          <StatCard
            title="Mesačný príjem"
            value={isLoading ? '...' : `€${monthlyRevenue.toFixed(0)}`}
            subtitle="Za aktuálny mesiac"
            icon={<DollarSign className="h-6 w-6" />}
            gradient="from-purple-500 to-pink-600"
            trend={{ value: '+8%', isPositive: true }}
          />
          <StatCard
            title="Čakajúce"
            value={isLoading ? '...' : pendingRentals}
            subtitle="Rezervácie na spracovanie"
            icon={<Clock className="h-6 w-6" />}
            gradient="from-orange-500 to-amber-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-4 animate-slide-up animation-delay-200">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  Rýchle akcie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <QuickAction
                  title="Spravovať vozidlá"
                  description="Pridať, upraviť alebo zobraziť vozidlá"
                  icon={<Car className="h-5 w-5" />}
                  onClick={() => navigate('/vehicles')}
                  gradient="from-blue-500 to-cyan-600"
                />
                <QuickAction
                  title="Zákazníci"
                  description="Zobraziť databázu zákazníkov"
                  icon={<Users className="h-5 w-5" />}
                  onClick={() => navigate('/customers')}
                  gradient="from-purple-500 to-pink-600"
                />
                <QuickAction
                  title="Dostupnosť"
                  description="Kalendár dostupnosti vozidiel"
                  icon={<Calendar className="h-5 w-5" />}
                  onClick={() => navigate('/availability')}
                  gradient="from-green-500 to-emerald-600"
                />
                <QuickAction
                  title="Štatistiky"
                  description="Zobrazať reporty a analytiku"
                  icon={<TrendingUp className="h-5 w-5" />}
                  onClick={() => navigate('/statistics')}
                  gradient="from-orange-500 to-amber-600"
                />
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="space-y-4 animate-slide-up animation-delay-400">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  Nedávna aktivita
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-2">
                    {recentActivity.map(item => (
                      <RecentActivityCard key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Typography variant="body2" className="text-muted-foreground">
                      Žiadna nedávna aktivita
                    </Typography>
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/rentals')}
                >
                  Zobraziť všetky prenájmy
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

