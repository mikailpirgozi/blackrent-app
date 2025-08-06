declare class ImapEmailService {
    private imap;
    private isConnected;
    private processingEmails;
    private isEnabled;
    constructor();
    private setupEventListeners;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    checkForNewEmails(): Promise<void>;
    private processInbox;
    private processFetchedEmails;
    private processMessage;
    private parseEmailText;
    private parseEmailContent;
    private getAllVehicles;
    private normalizeSpz;
    private findVehicleWithIdenticalLogic;
    private saveEmailToHistory;
    private updateEmailHistory;
    private logEmailAction;
    private createPendingRental;
    startMonitoring(intervalMinutes?: number): Promise<void>;
    testConnection(): Promise<boolean>;
}
export default ImapEmailService;
//# sourceMappingURL=imap-email-service.d.ts.map