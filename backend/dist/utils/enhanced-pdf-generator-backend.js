"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedPDFGeneratorBackend = void 0;
const jspdf_1 = __importDefault(require("jspdf"));
/**
 * Backend-kompatibilný Enhanced PDF Generator
 * Používa jsPDF namiesto pdfkit pre lepšie výsledky
 */
class EnhancedPDFGeneratorBackend {
    constructor() {
        this.currentY = 20;
        this.margin = 20;
        this.primaryColor = [25, 118, 210]; // Blue
        this.secondaryColor = [66, 66, 66]; // Dark gray
        this.doc = new jspdf_1.default();
        this.pageWidth = this.doc.internal.pageSize.getWidth();
        this.pageHeight = this.doc.internal.pageSize.getHeight();
    }
    /**
     * Generovanie handover protokolu s enhanced PDF
     */
    async generateHandoverProtocol(protocol) {
        console.log('🎨 ENHANCED jsPDF GENERÁTOR SPUSTENÝ - Handover protokol');
        console.log('📋 Protokol ID:', protocol.id);
        // Reset pozície
        this.currentY = 20;
        // 1. Záhlavie s logom a názvom
        this.addEnhancedHeader('PROTOKOL PREVZATIA VOZIDLA');
        // 2. Základné informácie v boxe
        this.addInfoBox('Základné informácie', [
            ['Číslo protokolu:', protocol.id.slice(-8).toUpperCase()],
            ['Dátum vytvorenia:', new Date(protocol.createdAt).toLocaleDateString('sk-SK')],
            ['Miesto prevzatia:', protocol.location],
            ['Stav protokolu:', this.getStatusText(protocol.status)]
        ]);
        // 3. Informácie o prenájme
        if (protocol.rentalData) {
            this.addInfoBox('Informácie o prenájme', [
                ['Číslo objednávky:', protocol.rentalData.orderNumber || 'N/A'],
                ['Zákazník:', protocol.rentalData.customer?.name || 'N/A'],
                ['Dátum od:', new Date(protocol.rentalData.startDate).toLocaleDateString('sk-SK')],
                ['Dátum do:', new Date(protocol.rentalData.endDate).toLocaleDateString('sk-SK')],
                ['Celková cena:', `${protocol.rentalData.totalPrice} ${protocol.rentalData.currency}`],
                ['Záloha:', `${protocol.rentalData.deposit} ${protocol.rentalData.currency}`]
            ]);
        }
        // 4. Informácie o vozidle
        if (protocol.rentalData?.vehicle) {
            this.addInfoBox('Informácie o vozidle', [
                ['Značka:', protocol.rentalData.vehicle.brand || 'N/A'],
                ['Model:', protocol.rentalData.vehicle.model || 'N/A'],
                ['ŠPZ:', protocol.rentalData.vehicle.licensePlate || 'N/A'],
                ['Spoločnosť:', protocol.rentalData.vehicle.company || 'N/A']
            ]);
        }
        // 5. Stav vozidla
        this.addInfoBox('Stav vozidla pri prevzatí', [
            ['Stav tachometra:', `${protocol.vehicleCondition.odometer} km`],
            ['Úroveň paliva:', `${protocol.vehicleCondition.fuelLevel}%`],
            ['Typ paliva:', protocol.vehicleCondition.fuelType],
            ['Exteriér:', protocol.vehicleCondition.exteriorCondition],
            ['Interiér:', protocol.vehicleCondition.interiorCondition]
        ]);
        if (protocol.vehicleCondition.notes) {
            this.addNotesSection('Poznámky k stavu vozidla', protocol.vehicleCondition.notes);
        }
        // 6. Poškodenia
        if (protocol.damages && protocol.damages.length > 0) {
            this.addDamagesSection(protocol.damages);
        }
        // 7. Súhrn médií
        this.addMediaSummary(protocol);
        // 8. Podpisy (bez obrázkov kvôli backend prostrediu)
        if (protocol.signatures && protocol.signatures.length > 0) {
            this.addSignaturesSection(protocol.signatures);
        }
        // 9. Poznámky
        if (protocol.notes) {
            this.addNotesSection('Dodatočné poznámky', protocol.notes);
        }
        // 10. Pätka
        this.addEnhancedFooter();
        // Vrátime PDF ako Buffer
        const pdfBuffer = Buffer.from(this.doc.output('arraybuffer'));
        return pdfBuffer;
    }
    /**
     * Generovanie return protokolu
     */
    async generateReturnProtocol(protocol) {
        this.currentY = 20;
        this.addEnhancedHeader('PROTOKOL VRÁTENIA VOZIDLA');
        // Podobná štruktúra ako handover, ale s return-specific dátami
        this.addInfoBox('Základné informácie', [
            ['Číslo protokolu:', protocol.id.slice(-8).toUpperCase()],
            ['Dátum vrátenia:', new Date(protocol.completedAt || protocol.createdAt).toLocaleDateString('sk-SK')],
            ['Miesto vrátenia:', protocol.location],
            ['Stav protokolu:', this.getStatusText(protocol.status)]
        ]);
        // Return-specific informácie
        if (protocol.kilometersUsed !== undefined) {
            this.addInfoBox('Informácie o použití', [
                ['Použité kilometre:', `${protocol.kilometersUsed} km`],
                ['Prekročenie limitu:', protocol.kilometerOverage ? `${protocol.kilometerOverage} km` : 'Nie'],
                ['Poplatok za km:', protocol.kilometerFee ? `${protocol.kilometerFee} EUR` : '0 EUR'],
                ['Dodatočné poplatky:', `${protocol.totalExtraFees || 0} EUR`]
            ]);
        }
        this.addEnhancedFooter();
        const pdfBuffer = Buffer.from(this.doc.output('arraybuffer'));
        return pdfBuffer;
    }
    /**
     * Enhanced záhlavie s moderným dizajnom
     */
    addEnhancedHeader(title) {
        // Hlavné záhlavie s farbou
        this.doc.setFillColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 25, 'F');
        // Biely text na modrom pozadí
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(18);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(title, this.pageWidth / 2, this.currentY + 16, { align: 'center' });
        // BlackRent logo/text v pravom rohu
        this.doc.setFontSize(12);
        this.doc.text('BlackRent', this.pageWidth - this.margin - 5, this.currentY + 16, { align: 'right' });
        this.currentY += 35;
        // Reset farby textu
        this.doc.setTextColor(0, 0, 0);
    }
    /**
     * Informačný box s rámčekom
     */
    addInfoBox(title, data) {
        this.checkPageBreak(60);
        // Nadpis sekcie
        this.doc.setFillColor(240, 240, 240);
        this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 15, 'F');
        this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(title, this.margin + 5, this.currentY + 10);
        this.currentY += 20;
        // Dáta v boxe
        this.doc.setDrawColor(200, 200, 200);
        this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, data.length * 12 + 10);
        this.doc.setTextColor(0, 0, 0);
        this.doc.setFontSize(10);
        data.forEach(([label, value], index) => {
            const yPos = this.currentY + 15 + (index * 12);
            // Label (tučné)
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(String(label || ''), this.margin + 10, yPos);
            // Value (normálne)
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(String(value || ''), this.margin + 80, yPos);
        });
        this.currentY += data.length * 12 + 20;
    }
    /**
     * Sekcia pre poškodenia
     */
    addDamagesSection(damages) {
        this.addInfoBox('Zaznamenané poškodenia', damages.map((damage, index) => [
            `Poškodenie ${index + 1}:`,
            `${damage.description} (${damage.severity})`
        ]));
    }
    /**
     * Súhrn médií
     */
    addMediaSummary(protocol) {
        const totalImages = (protocol.vehicleImages?.length || 0) +
            (protocol.documentImages?.length || 0) +
            (protocol.damageImages?.length || 0);
        const totalVideos = protocol.vehicleVideos?.length || 0;
        this.addInfoBox('Priložené súbory', [
            ['Počet fotiek:', totalImages.toString()],
            ['Fotky vozidla:', (protocol.vehicleImages?.length || 0).toString()],
            ['Fotky dokladov:', (protocol.documentImages?.length || 0).toString()],
            ['Fotky poškodení:', (protocol.damageImages?.length || 0).toString()],
            ['Počet videí:', totalVideos.toString()]
        ]);
    }
    /**
     * Sekcia pre podpisy (bez obrázkov)
     */
    addSignaturesSection(signatures) {
        this.addInfoBox('Podpisy', signatures.flatMap((signature, index) => [
            [`Podpis ${index + 1}:`, `${signature.signerName} (${signature.signerRole})`],
            [`Čas podpisu:`, new Date(signature.timestamp).toLocaleString('sk-SK')],
            [`Miesto:`, signature.location || 'N/A']
        ]).flat().reduce((acc, curr, index, arr) => {
            if (index % 2 === 0) {
                acc.push([curr, arr[index + 1] || '']);
            }
            return acc;
        }, []));
    }
    /**
     * Sekcia pre poznámky
     */
    addNotesSection(title, notes) {
        this.checkPageBreak(40);
        // Nadpis
        this.doc.setFillColor(240, 240, 240);
        this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 15, 'F');
        this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(title, this.margin + 5, this.currentY + 10);
        this.currentY += 20;
        // Poznámky v boxe
        const lines = this.doc.splitTextToSize(notes, this.pageWidth - 2 * this.margin - 20);
        const boxHeight = lines.length * 6 + 20;
        this.doc.setDrawColor(200, 200, 200);
        this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, boxHeight);
        this.doc.setTextColor(0, 0, 0);
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(lines, this.margin + 10, this.currentY + 15);
        this.currentY += boxHeight + 10;
    }
    /**
     * Enhanced pätka
     */
    addEnhancedFooter() {
        const footerY = this.pageHeight - 30;
        // Čiara
        this.doc.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        this.doc.setLineWidth(0.5);
        this.doc.line(this.margin, footerY, this.pageWidth - this.margin, footerY);
        // Text pätky
        this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', 'normal');
        const footerText = `Vygenerované ${new Date().toLocaleString('sk-SK')} | BlackRent System`;
        this.doc.text(footerText, this.pageWidth / 2, footerY + 10, { align: 'center' });
        // Číslo stránky
        this.doc.text('Strana 1', this.pageWidth - this.margin, footerY + 10, { align: 'right' });
    }
    /**
     * Kontrola prelomenia stránky
     */
    checkPageBreak(requiredSpace) {
        if (this.currentY + requiredSpace > this.pageHeight - 50) {
            this.doc.addPage();
            this.currentY = 20;
        }
    }
    /**
     * Získanie textu stavu
     */
    getStatusText(status) {
        const statusMap = {
            'pending': 'Čaká na spracovanie',
            'in_progress': 'Prebieha',
            'completed': 'Dokončený',
            'cancelled': 'Zrušený'
        };
        return statusMap[status] || status;
    }
}
exports.EnhancedPDFGeneratorBackend = EnhancedPDFGeneratorBackend;
//# sourceMappingURL=enhanced-pdf-generator-backend.js.map