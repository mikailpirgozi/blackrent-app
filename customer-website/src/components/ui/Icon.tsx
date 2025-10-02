import { cn } from '@/lib/utils'

// Icon components - všetky ikony v jednom mieste
const ICON_MAP = {
  // Navigation
  menu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" x2="20" y1="6" y2="6"/>
      <line x1="4" x2="20" y1="12" y2="12"/>
      <line x1="4" x2="20" y1="18" y2="18"/>
    </svg>
  ),
  close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 6 12 12"/>
      <path d="m18 6-12 12"/>
    </svg>
  ),
  
  // Vehicles
  car: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.4 9c-.3-.8-1-1.3-1.9-1.3H7.5c-.9 0-1.6.5-1.9 1.3l-2.1 2.1C3.2 11.3 2.5 12.1 2.5 13v3c0 .6.4 1 1 1H5"/>
      <circle cx="7" cy="17" r="2"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  
  // User
  user: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  
  // Calendar
  calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
      <line x1="16" x2="16" y1="2" y2="6"/>
      <line x1="8" x2="8" y1="2" y2="6"/>
      <line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  ),
  
  // Search
  search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  
  // Arrow
  'arrow-right': () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14"/>
      <path d="m12 5 7 7-7 7"/>
    </svg>
  ),
  'arrow-top-right': () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 12L12 4"/>
      <path d="M6 4H12V10"/>
    </svg>
  ),
  'arrow-small-down': () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 9l5 5 5-5"/>
    </svg>
  ),
  
  // Plus
  plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14"/>
      <path d="M5 12h14"/>
    </svg>
  ),
  
  // Bag / Store
  bag: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 7h12l1 13H5L6 7Z"/>
      <path d="M9 7a3 3 0 0 1 6 0"/>
    </svg>
  ),
  
  // Socials
  facebook: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7v-3h3.4V9.5c0-3.4 2-5.3 5-5.3 1.5 0 3 .27 3 .27v3.3h-1.7c-1.7 0-2.2 1-2.2 2V12H18l-.5 3h-2.8v7A10 10 0 0 0 22 12Z"/>
    </svg>
  ),
  instagram: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none"/>
    </svg>
  ),
  tiktok: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 8.5a6.5 6.5 0 0 1-4.5-1.8V16a6 6 0 1 1-6-6c.35 0 .69.03 1 .1V13a3 3 0 1 0 3 3V2h2a6.5 6.5 0 0 0 4.5 2v4.5Z"/>
    </svg>
  ),
  
  // Globe
  world: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20"/>
      <path d="M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20Z"/>
    </svg>
  ),
  
  // Phone
  phone: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  
  // Email
  mail: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-10 5L2 7"/>
    </svg>
  ),
  
  // Location
  'map-pin': () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  pin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  
  // Check
  check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20,6 9,17 4,12"/>
    </svg>
  ),
  
  // Star
  star: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
    </svg>
  ),
  
  // Quote marks
  'quote-marks': () => (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M0 8c0-2.5 2-4.5 4.5-4.5.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5c-.3 0-.5.2-.5.5 0 1.1.9 2 2 2 .8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5C2.5 12 0 10.5 0 8zm9.5 0c0-2.5 2-4.5 4.5-4.5.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5c-.3 0-.5.2-.5.5 0 1.1.9 2 2 2 .8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5c-3.5 0-6-1.5-6-3.5z"/>
    </svg>
  ),
  
  // Mobile phone
  mobil: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  ),
  
  // Message
  message: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
} as const

export type IconName = keyof typeof ICON_MAP

export interface IconProps {
  name: IconName
  className?: string
  size?: number
}

export function Icon({ name, className, size = 24 }: IconProps) {
  const IconComponent = ICON_MAP[name]
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in ICON_MAP`)
    return null
  }
  
  return (
    <div 
      className={cn('inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <IconComponent />
    </div>
  )
}
