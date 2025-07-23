import { HandoverProtocol, ReturnProtocol } from '../types';
export declare class PuppeteerPDFGeneratorV2 {
    private browser;
    constructor();
    private getBrowser;
    private closeBrowser;
    generateHandoverProtocol(protocol: HandoverProtocol): Promise<Buffer>;
    generateReturnProtocol(protocol: ReturnProtocol): Promise<Buffer>;
    private generateHandoverHTML;
    private generateReturnHTML;
    private getStatusText;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=puppeteer-pdf-generator-v2.d.ts.map