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
    private parseEmailContent;
    private findVehicleByCode;
    private createPendingRental;
    startMonitoring(intervalMinutes?: number): Promise<void>;
    testConnection(): Promise<boolean>;
}
export default ImapEmailService;
//# sourceMappingURL=imap-email-service.d.ts.map