// ✅ FÁZA 3.2: Category utilities - extracted z ExpenseListNew
import {
  Fuel as FuelIcon,
  Wrench as ServiceIcon,
  Shield as InsuranceIcon,
  Tag as OtherIcon,
  Receipt as ReceiptIcon,
} from 'lucide-react';
import type { ExpenseCategory } from '@/types';

/**
 * Mapovanie ikony pre kategóriu
 */
export function getCategoryIcon(
  categoryName: string,
  categories: ExpenseCategory[]
): React.ReactElement {
  const category = categories.find(c => c.name === categoryName);
  if (!category) return <ReceiptIcon className="h-4 w-4" />;

  // Mapovanie ikon na Lucide komponenty
  const iconMap: Record<string, React.ReactElement> = {
    local_gas_station: <FuelIcon className="h-4 w-4" />,
    build: <ServiceIcon className="h-4 w-4" />,
    security: <InsuranceIcon className="h-4 w-4" />,
    category: <OtherIcon className="h-4 w-4" />,
    receipt: <ReceiptIcon className="h-4 w-4" />,
  };

  return iconMap[category.icon] || <ReceiptIcon className="h-4 w-4" />;
}

/**
 * Zobrazovací text pre kategóriu
 */
export function getCategoryText(
  categoryName: string,
  categories: ExpenseCategory[]
): string {
  const category = categories.find(c => c.name === categoryName);
  return category?.displayName || categoryName;
}

/**
 * Farba pre kategóriu (pre badge, graf...)
 */
export function getCategoryColor(
  categoryName: string,
  categories: ExpenseCategory[]
): string {
  const category = categories.find(c => c.name === categoryName);
  if (!category) return '#666666';

  // Mapovanie farieb
  const colorMap: Record<string, string> = {
    primary: '#1976d2',
    secondary: '#9c27b0',
    success: '#2e7d32',
    error: '#d32f2f',
    warning: '#ed6c02',
    info: '#0288d1',
  };

  return colorMap[category.color] || '#666666';
}
