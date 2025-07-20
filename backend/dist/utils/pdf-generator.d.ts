import PDFDocument from 'pdfkit';
import { HandoverProtocol, ReturnProtocol } from '../types';
export declare class ProtocolPDFGenerator {
    private doc;
    constructor();
    private loadImageBuffer;
    generateHandoverProtocol(protocol: HandoverProtocol): Promise<InstanceType<typeof PDFDocument>>;
    generateReturnProtocol(protocol: ReturnProtocol): Promise<InstanceType<typeof PDFDocument>>;
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