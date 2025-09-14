export declare class RecurringExpenseScheduler {
    private static instance;
    private isRunning;
    static getInstance(): RecurringExpenseScheduler;
    startScheduler(): void;
    generateMonthlyExpenses(targetDate?: Date): Promise<{
        generated: number;
        skipped: number;
        errors: string[];
    }>;
    private checkOverdueExpenses;
    stopScheduler(): void;
    getStatus(): {
        isRunning: boolean;
        nextRun: string;
        timezone: string;
    };
}
export declare const recurringExpenseScheduler: RecurringExpenseScheduler;
//# sourceMappingURL=recurring-expense-scheduler.d.ts.map