import PDFDocument from 'pdfkit';
import { HandoverProtocol, ReturnProtocol } from '../types';
export declare class ProtocolPDFGenerator {
    private doc;
    constructor();
    generateHandoverProtocol(protocol: HandoverProtocol): InstanceType<typeof PDFDocument>;
    generateReturnProtocol(protocol: ReturnProtocol): InstanceType<typeof PDFDocument>;
    private setupHeader;
    private addSection;
    private addInfoRow;
    private getStatusText;
    private addFooter;
    getBuffer(): Promise<Buffer>;
}
export declare const generateHandoverPDF: (protocol: HandoverProtocol) => Promise<Buffer>;
export declare const generateReturnPDF: (protocol: ReturnProtocol) => Promise<Buffer>;
//# sourceMappingURL=pdf-generator.d.ts.map