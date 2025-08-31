import type { Customer, HandoverProtocol, ReturnProtocol } from '../types';
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
    /**
     * 🧪 TEST: Odoslanie testovacieho protokolu bez CC
     */
    sendTestProtocolEmail(customer: Customer, pdfBuffer: Buffer, protocolData: HandoverProtocol): Promise<boolean>;
}
export declare const emailService: EmailService;
export default EmailService;
//# sourceMappingURL=email-service.d.ts.map