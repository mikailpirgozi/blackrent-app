import { HandoverProtocol, ReturnProtocol } from '../types';
/**
 * 🎯 HLAVNÁ FUNKCIA - Generovanie handover PDF
 * Automaticky vyberie najlepší dostupný generátor
 */
export declare const generateHandoverPDF: (protocolData: HandoverProtocol) => Promise<Buffer>;
/**
 * 🎯 HLAVNÁ FUNKCIA - Generovanie return PDF
 */
export declare const generateReturnPDF: (protocolData: ReturnProtocol) => Promise<Buffer>;
//# sourceMappingURL=pdf-generator.d.ts.map