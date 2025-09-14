/**
 * PDF Builder Queue pre Protocol V2
 * Koordinuje generovanie PDF protokolov s fotografiami
 */
import { type PDFGenerationRequest } from '../utils/v2/pdf-a-generator';
export interface PDFBuildJob {
    protocolId: string;
    protocolType: 'handover' | 'return';
    protocolData: PDFGenerationRequest['data'];
    userId?: string;
    priority?: number;
}
export interface PDFBuildResult {
    success: boolean;
    protocolId: string;
    pdfUrl?: string;
    pdfHash?: string;
    fileSize?: number;
    pageCount?: number;
    error?: string;
    processingTime?: number;
}
//# sourceMappingURL=pdf-builder.d.ts.map