import { HandoverProtocol, ReturnProtocol } from '../types';
/**
 * 🎭 PUPPETEER PDF GENERÁTOR V2
 *
 * Najmodernejší PDF generátor používajúci:
 * - Puppeteer headless Chrome
 * - HTML/CSS templaty
 * - Plnú podporu diakritiky
 * - Profesionálny dizajn
 * - Responzívny layout
 */
export declare class PuppeteerPDFGeneratorV2 {
    /**
     * 🎨 Generuje HTML template pre handover protokol
     */
    private generateHandoverHTML;
    /**
     * 🎭 Generuje handover protokol pomocou Puppeteer
     */
    generateHandoverProtocol(protocol: HandoverProtocol): Promise<Buffer>;
    /**
     * 🎭 Generuje return protokol (podobne ako handover)
     */
    generateReturnProtocol(protocol: ReturnProtocol): Promise<Buffer>;
}
export default PuppeteerPDFGeneratorV2;
//# sourceMappingURL=puppeteer-pdf-generator-v2.d.ts.map