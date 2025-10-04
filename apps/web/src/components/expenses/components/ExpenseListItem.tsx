// ✅ Modern List Item Component - Pekné UI pre list view
import { format } from 'date-fns';
import {
  Edit2,
  Trash2,
  Calendar,
  Building,
  Car,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Expense, ExpenseCategory, Vehicle } from '@/types';
import {
  getCategoryIcon,
  getCategoryText,
  getCategoryColor,
} from '@/utils/expenseCategories';
import { formatCurrency } from '@/utils/money';
// ✅ FÁZA 1.1: Timezone-safe date handling
import { parseDate } from '@/utils/dateUtils';

interface ExpenseListItemProps {
  expense: Expense;
  vehicle?: Vehicle;
  categories: ExpenseCategory[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpenseListItem({
  expense,
  vehicle,
  categories,
  onEdit,
  onDelete,
}: ExpenseListItemProps) {
  const categoryColor = getCategoryColor(expense.category, categories);

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200 p-4">
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-all group-hover:w-1.5"
        style={{ backgroundColor: categoryColor }}
      />

      <div className="flex items-center justify-between gap-4 ml-3">
        {/* Left Section - Main Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Category Icon */}
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg transition-transform group-hover:scale-110"
            style={{ backgroundColor: `${categoryColor}15` }}
          >
            <div style={{ color: categoryColor }}>
              {getCategoryIcon(expense.category, categories)}
            </div>
          </div>

          {/* Description & Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {expense.description}
              </h3>
              <Badge
                variant="secondary"
                className="shrink-0 text-xs"
                style={{
                  backgroundColor: `${categoryColor}20`,
                  color: categoryColor,
                  borderColor: `${categoryColor}40`,
                }}
              >
                {getCategoryText(expense.category, categories)}
              </Badge>
            </div>

            {/* Metadata Row */}
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {/* Date */}
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {format(parseDate(expense.date) || new Date(), 'dd.MM.yyyy')}
                </span>
              </div>

              {/* Company */}
              <div className="flex items-center gap-1 truncate">
                <Building className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{expense.company}</span>
              </div>

              {/* Vehicle */}
              {vehicle && (
                <div className="flex items-center gap-1 truncate">
                  <Car className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                  </span>
                </div>
              )}

              {/* Note indicator */}
              {expense.note && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">{expense.note}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Amount & Actions */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Amount */}
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(expense.amount)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(expense)}
                    className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Upraviť</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(expense)}
                    className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zmazať</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Chevron for visual cue */}
          <ChevronRight className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}
