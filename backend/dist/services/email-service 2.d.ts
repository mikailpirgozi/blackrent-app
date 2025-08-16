import { Customer, HandoverProtocol, ReturnProtocol } from '../types';
declare class EmailService {
    private transporter;
    private isEnabled;
    constructor();
    /**
     * Test SMTP pripojenia
     */
    testConnection(): Promise<boolean>;
    /**
     * Odoslanie odovzdávacieho protokolu emailom
     */
    sendHandoverProtocolEmail(customer: Customer, pdfBuffer: Buffer, protocolData: HandoverProtocol): Promise<boolean>;
    /**
     * Odoslanie preberacieho protokolu emailom
     */
    sendReturnProtocolEmail(customer: Customer, pdfBuffer: Buffer, protocolData: ReturnProtocol): Promise<boolean>;
    /**
     * Generovanie HTML šablóny pre odovzdávací protokol
     */
    private generateHandoverEmailTemplate;
    /**
     * Generovanie HTML šablóny pre preberací protokol
     */
    private generateReturnEmailTemplate;
    /**
     * Generovanie názvu PDF súboru
     */
    private generatePDFFilename;
}
export declare const emailService: EmailService;
export default EmailService;
//# sourceMappingURL=email-service%202.d.ts.map