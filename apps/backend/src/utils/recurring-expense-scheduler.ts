import { postgresDatabase } from '../models/postgres-database';
import cron from 'node-cron';

// Automatické generovanie pravidelných nákladov
export class RecurringExpenseScheduler {
  private static instance: RecurringExpenseScheduler;
  private isRunning = false;

  public static getInstance(): RecurringExpenseScheduler {
    if (!RecurringExpenseScheduler.instance) {
      RecurringExpenseScheduler.instance = new RecurringExpenseScheduler();
    }
    return RecurringExpenseScheduler.instance;
  }

  // Spustenie automatického generovania - každý 1. deň v mesiaci o 6:00 ráno
  public startScheduler() {
    if (this.isRunning) {
      console.log('🔄 Recurring expense scheduler už beží');
      return;
    }

    console.log('🔄 Spúšťam recurring expense scheduler...');

    // Cron pattern: '0 6 1 * *' = každý 1. deň v mesiaci o 6:00
    cron.schedule('0 6 1 * *', async () => {
      console.log('🔄 Automatické generovanie pravidelných nákladov - začiatok mesiaca');
      await this.generateMonthlyExpenses();
    }, {
      timezone: "Europe/Bratislava"
    });

    // Dodatočný cron pre testovanie - každých 5 minút (len pre development)
    if (process.env.NODE_ENV === 'development') {
      cron.schedule('*/5 * * * *', async () => {
        // console.log('🔄 Development check - pravidelné náklady');
        await this.checkOverdueExpenses();
      }, {
        timezone: "Europe/Bratislava"
      });
    }

    this.isRunning = true;
    console.log('✅ Recurring expense scheduler spustený');
  }

  // Manuálne spustenie generovania
  public async generateMonthlyExpenses(targetDate?: Date): Promise<{
    generated: number;
    skipped: number;
    errors: string[];
  }> {
    try {
      const today = targetDate || new Date();
      console.log(`🔄 Generujem pravidelné náklady pre: ${today.toISOString().split('T')[0]}`);

      const results = await postgresDatabase.generateRecurringExpenses(today);

      console.log(`✅ Generovanie dokončené:`, {
        generated: results.generated,
        skipped: results.skipped,
        errors: results.errors.length
      });

      if (results.errors.length > 0) {
        console.error('❌ Chyby pri generovaní:', results.errors);
      }

      return results;
    } catch (error) {
      console.error('❌ Chyba pri automatickom generovaní:', error);
      return { generated: 0, skipped: 0, errors: [error instanceof Error ? error.message : 'Neznáma chyba'] };
    }
  }

  // Kontrola splatných nákladov (development helper)
  private async checkOverdueExpenses(): Promise<void> {
    try {
      const recurringExpenses = await postgresDatabase.getRecurringExpenses();
      const today = new Date();
      
      const overdue = recurringExpenses.filter(r => 
        r.isActive && 
        r.nextGenerationDate && 
        r.nextGenerationDate <= today
      );

      if (overdue.length > 0) {
        console.log(`⏰ Splatné pravidelné náklady: ${overdue.length}`);
        overdue.forEach(r => {
          console.log(`   - ${r.name}: splatný ${r.nextGenerationDate?.toISOString().split('T')[0]}`);
        });
      }
    } catch (error) {
      // Tichá chyba pre development check
    }
  }

  // Zastavenie schedulera
  public stopScheduler() {
    this.isRunning = false;
    console.log('🛑 Recurring expense scheduler zastavený');
  }

  // Status info
  public getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: 'Každý 1. deň v mesiaci o 6:00',
      timezone: 'Europe/Bratislava'
    };
  }
}

// Export singleton instance
export const recurringExpenseScheduler = RecurringExpenseScheduler.getInstance();
