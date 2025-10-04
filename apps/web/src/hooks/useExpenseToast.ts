// ✅ Unified toast notifications pre Expense sekciu
import { useToast } from '@/hooks/use-toast';

export function useExpenseToast() {
  const { toast } = useToast();

  return {
    success: (message: string) => {
      toast({
        title: 'Úspech',
        description: message,
        variant: 'default',
      });
    },
    error: (message: string) => {
      toast({
        title: 'Chyba',
        description: message,
        variant: 'destructive',
      });
    },
    info: (message: string) => {
      toast({
        title: 'Informácia',
        description: message,
      });
    },
    warning: (message: string) => {
      toast({
        title: 'Upozornenie',
        description: message,
        variant: 'default',
      });
    },
  };
}
