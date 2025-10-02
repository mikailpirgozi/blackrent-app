// 🔴 REAL-TIME NOTIFICATIONS - BlackRent
// Komponent pre zobrazenie WebSocket notifikácií

import {
  Plus as AddIcon,
  Car as CarIcon,
  CheckCircle as CheckIcon,
  X as ClearIcon,
  Trash2 as DeleteIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  Bell as NotificationsActiveIcon,
  BellRing as NotificationsIcon,
  User as PersonIcon,
  // AlertTriangle as WarningIcon, // TODO: Implement warning notifications
  // AlertCircle as ErrorIcon, // TODO: Implement error notifications
  Wifi as WiFiIcon,
  WifiOff as WiFiOffIcon,
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Button,
} from '@/components/ui/button';
import {
  Separator,
} from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Typography,
} from '@/components/ui/typography';
import { formatDistanceToNow } from 'date-fns';
import { sk } from 'date-fns/locale';
import React, { useState } from 'react';

import { useWebSocket } from '../../hooks/useWebSocket';

const RealTimeNotifications: React.FC = () => {
  const {
    isConnected,
    connectedUsers,
    notifications,
    unreadCount,
    markNotificationRead,
    clearNotifications,
  } = useWebSocket();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleNotificationClick = (id: string) => {
    markNotificationRead(id);
  };

  const handleClearAll = () => {
    clearNotifications();
    setIsDropdownOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    const iconProps = { size: 16 };
    
    switch (type) {
      case 'rental_created':
        return <AddIcon {...iconProps} className="text-green-600" />;
      case 'rental_updated':
        return <EditIcon {...iconProps} className="text-blue-600" />;
      case 'rental_deleted':
        return <DeleteIcon {...iconProps} className="text-red-600" />;
      case 'vehicle_updated':
        return <CarIcon {...iconProps} className="text-blue-600" />;
      case 'customer_created':
        return <PersonIcon {...iconProps} className="text-green-600" />;
      case 'system':
        return <InfoIcon {...iconProps} className="text-yellow-600" />;
      default:
        return <NotificationsIcon {...iconProps} className="text-gray-600" />;
    }
  };

  // TODO: Implement notification color logic
  // const getNotificationColor = (type: string) => {
  //   switch (type) {
  //     case 'rental_created':
  //     case 'customer_created':
  //       return 'success';
  //     case 'rental_updated':
  //     case 'vehicle_updated':
  //       return 'info';
  //     case 'rental_deleted':
  //       return 'error';
  //     case 'system':
  //       return 'warning';
  //     default:
  //       return 'default';
  //   }
  // };

  return (
    <div className="flex items-center gap-2">
      {/* Connection Status Indicator */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={`flex items-center gap-1 px-2 py-1 text-xs ${
                isConnected 
                  ? 'border-green-500 text-green-700 bg-green-50' 
                  : 'border-red-500 text-red-700 bg-red-50'
              }`}
            >
              {isConnected ? <WiFiIcon size={12} /> : <WiFiOffIcon size={12} />}
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {isConnected
              ? `Pripojené - ${connectedUsers.count} užívateľov online`
              : 'Odpojené od real-time updates'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Notifications Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`relative ${unreadCount > 0 ? 'text-blue-600' : 'text-gray-600'}`}
                  >
                    {unreadCount > 0 ? (
                      <NotificationsActiveIcon size={20} />
                    ) : (
                      <NotificationsIcon size={20} />
                    )}
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-96 max-h-[600px]" align="end">
                  {/* Header */}
                  <div className="p-4 border-b">
                    <div className="flex justify-between items-center">
                      <Typography variant="h6">
                        🔴 Real-time Updates
                      </Typography>
                      {notifications.length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleClearAll}
                          className="text-xs"
                        >
                          <ClearIcon size={14} className="mr-1" />
                          Vymazať všetko
                        </Button>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1 text-xs ${
                          isConnected 
                            ? 'border-green-500 text-green-700 bg-green-50' 
                            : 'border-red-500 text-red-700 bg-red-50'
                        }`}
                      >
                        {isConnected ? <WiFiIcon size={12} /> : <WiFiOffIcon size={12} />}
                        {isConnected ? `${connectedUsers.count} online` : 'Offline'}
                      </Badge>
                      {unreadCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {unreadCount} nových
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Connection Warning */}
                  {!isConnected && (
                    <Alert className="m-2">
                      <AlertDescription>
                        Real-time updates sú momentálne nedostupné. Obnovte stránku pre
                        opätovné pripojenie.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Notifications List */}
                  <div className="max-h-96 overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <NotificationsIcon
                          size={48}
                          className="text-gray-400 mb-2 mx-auto"
                        />
                        <Typography className="text-gray-500">Žiadne notifikácie</Typography>
                        <Typography variant="body2" className="text-gray-400">
                          Real-time updates sa zobrazia tu
                        </Typography>
                      </div>
                    ) : (
                      <div>
                        {notifications.map((notification, index) => (
                          <React.Fragment key={notification.id}>
                            <div
                              className={`p-3 cursor-pointer hover:bg-gray-50 ${
                                !notification.read ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => handleNotificationClick(notification.id)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Typography variant="subtitle2" className="font-medium">
                                      {notification.title}
                                    </Typography>
                                    {!notification.read && (
                                      <Badge variant="secondary" className="text-xs h-5">
                                        NOVÉ
                                      </Badge>
                                    )}
                                  </div>
                                  <Typography variant="body2" className="text-gray-600 mt-1">
                                    {notification.message}
                                  </Typography>
                                  <Typography variant="caption" className="text-gray-400">
                                    {formatDistanceToNow(
                                      new Date(notification.timestamp),
                                      {
                                        addSuffix: true,
                                        locale: sk,
                                      }
                                    )}
                                  </Typography>
                                </div>
                                {!notification.read && (
                                  <div className="flex-shrink-0">
                                    <CheckIcon size={16} className="text-blue-600" />
                                  </div>
                                )}
                              </div>
                            </div>
                            {index < notifications.length - 1 && <Separator />}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-2 border-t text-center">
                      <Typography variant="caption" className="text-gray-500">
                        Zobrazených {Math.min(notifications.length, 50)} zo všetkých
                        notifikácií
                      </Typography>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Real-time notifikácie
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default RealTimeNotifications;
