// Unified Icon component for BlackRent
// Centralized icon management with consistent styling

import { ICON_MAP, type IconName } from './icon-map';
import { cn } from '@/lib/utils';

export interface UnifiedIconProps {
  name: IconName;
  className?: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  // MUI compatibility props
  fontSize?: 'small' | 'medium' | 'large' | string;
  sx?: Record<string, unknown>; // Allow sx props for MUI compatibility
}

export const UnifiedIcon = ({ 
  name, 
  className, 
  size = 20, 
  color,
  strokeWidth = 2,
  fontSize,
  sx 
}: UnifiedIconProps) => {
  const IconComponent = ICON_MAP[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in ICON_MAP`);
    return null;
  }

  // Handle fontSize prop (MUI compatibility)
  let iconSize = size;
  if (fontSize) {
    switch (fontSize) {
      case 'small':
        iconSize = 16;
        break;
      case 'medium':
        iconSize = 20;
        break;
      case 'large':
        iconSize = 24;
        break;
      default:
        // If fontSize is a number string, use it
        if (!isNaN(Number(fontSize))) {
          iconSize = Number(fontSize);
        }
    }
  }

  // Handle sx prop (MUI compatibility) - convert to className
  let sxClasses = '';
  if (sx) {
    // Basic sx to className conversion
    if (sx.fontSize && typeof sx.fontSize === 'number') {
      iconSize = sx.fontSize;
    }
    if (sx.color && typeof sx.color === 'string') {
      // Convert MUI color names to Tailwind classes
      if (sx.color === 'text.secondary') {
        sxClasses += ' text-gray-500';
      } else if (sx.color === 'success.main') {
        sxClasses += ' text-green-500';
      } else if (sx.color.startsWith('#')) {
        // Handle hex colors
        sxClasses += ` text-[${sx.color}]`;
      }
    }
    if (sx.opacity && typeof sx.opacity === 'number') {
      sxClasses += ` opacity-${Math.round(sx.opacity * 100)}`;
    }
  }

  return (
    <IconComponent 
      className={cn("", className, sxClasses)} 
      size={iconSize}
      color={color}
      strokeWidth={strokeWidth}
    />
  );
};

// Export commonly used icon names for autocomplete
export const ICONS = {
  // Actions
  ADD: 'add' as const,
  EDIT: 'edit' as const,
  DELETE: 'delete' as const,
  CLOSE: 'close' as const,
  CHECK: 'check' as const,
  SEARCH: 'search' as const,
  FILTER: 'filter' as const,
  
  // Navigation
  CHEVRON_DOWN: 'chevronDown' as const,
  CHEVRON_UP: 'chevronUp' as const,
  CHEVRON_LEFT: 'chevronLeft' as const,
  CHEVRON_RIGHT: 'chevronRight' as const,
  ARROW_LEFT: 'arrowLeft' as const,
  ARROW_RIGHT: 'arrowRight' as const,
  
  // Business
  CAR: 'car' as const,
  BUILDING: 'building' as const,
  USER: 'user' as const,
  USERS: 'users' as const,
  CALENDAR: 'calendar' as const,
  CLOCK: 'clock' as const,
  MONEY: 'money' as const,
  
  // Communication
  MAIL: 'mail' as const,
  PHONE: 'phone' as const,
  BELL: 'bell' as const,
  ALERT: 'alert' as const,
  SUCCESS: 'success' as const,
  ERROR: 'error' as const,
  
  // Files
  FILE: 'file' as const,
  DOWNLOAD: 'download' as const,
  UPLOAD: 'upload' as const,
  FOLDER: 'folder' as const,
  IMAGE: 'image' as const,
  EYE: 'eye' as const,
  
  // Settings
  SETTINGS: 'settings' as const,
  LOCK: 'lock' as const,
  UNLOCK: 'unlock' as const,
  
  // Status
  CIRCLE: 'circle' as const,
  STAR: 'star' as const,
  HEART: 'heart' as const,
  FLAG: 'flag' as const,
  
  // UI
  MENU: 'menu' as const,
  GRID: 'grid' as const,
  LIST: 'list' as const,
  MORE: 'more' as const,
  
  // Time
  CALENDAR_DAYS: 'calendarDays' as const,
  TIMER: 'timer' as const,
  HISTORY: 'history' as const,
  
  // Technology
  WIFI: 'wifi' as const,
  BATTERY: 'battery' as const,
  POWER: 'power' as const,
  
  // Misc
  HELP: 'help' as const,
  HOME: 'home' as const,
  MAP: 'map' as const,
  LINK: 'link' as const,
  COPY: 'copy' as const,
  SAVE: 'save' as const,
  SEND: 'send' as const,
  SHARE: 'share' as const,
  PRINTER: 'printer' as const,
} as const;

export default UnifiedIcon;