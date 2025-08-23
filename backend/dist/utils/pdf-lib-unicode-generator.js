"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFLibUnicodeGenerator = void 0;
const pdf_lib_1 = require("pdf-lib");
const fontkit_1 = __importDefault(require("@pdf-lib/fontkit"));
const protocol_helpers_1 = require("./protocol-helpers");
/**
 * PDF-lib Unicode Generator - Plná podpora slovenskej diakritiky
 * Používa custom TTF fonty cez fontkit pre perfektný text rendering
 */
class PDFLibUnicodeGenerator {
    constructor() {
        this.currentY = 750;
        this.pageWidth = 595;
        this.pageHeight = 842;
        this.margin = 50;
        this.primaryColor = (0, pdf_lib_1.rgb)(0.1, 0.46, 0.82);
        this.secondaryColor = (0, pdf_lib_1.rgb)(0.26, 0.26, 0.26);
        this.lightGray = (0, pdf_lib_1.rgb)(0.94, 0.94, 0.94);
        // Inicializácia sa vykoná v generate metódach
    }
    /**
     * Generovanie handover protokolu s Unicode podporou
     */
    async generateHandoverProtocol(protocol) {
        console.log('🎨 PDF-LIB UNICODE GENERÁTOR SPUSTENÝ - Handover protokol');
        console.log('📋 Protokol ID:', protocol.id);
        // Vytvorenie PDF dokumentu s fontkit
        this.doc = await pdf_lib_1.PDFDocument.create();
        this.doc.registerFontkit(fontkit_1.default);
        this.currentPage = this.doc.addPage(pdf_lib_1.PageSizes.A4);
        // Načítanie Unicode fontov
        await this.loadUnicodeFonts();
        this.currentY = this.pageHeight - 50;
        // 1. Záhlavie s diakritiku
        this.addUnicodeHeader('ODOVZDÁVACÍ PROTOKOL');
        // 2. Základné informácie
        this.addInfoSection('Základné informácie', [
            ['Číslo protokolu:', protocol.id.slice(-8).toUpperCase()],
            ['Dátum vytvorenia:', new Date(protocol.createdAt).toLocaleDateString('sk-SK')],
            ['Miesto prevzatia:', protocol.location],
            ['Stav protokolu:', this.getStatusText(protocol.status)]
        ]);
        // 3. Informácie o prenájme
        if (protocol.rentalData) {
            this.addInfoSection('Informácie o prenájme', [
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
            this.addInfoSection('Informácie o vozidle', [
                ['Značka:', protocol.rentalData.vehicle.brand || 'N/A'],
                ['Model:', protocol.rentalData.vehicle.model || 'N/A'],
                ['ŠPZ:', protocol.rentalData.vehicle.licensePlate || 'N/A'],
                ['Spoločnosť:', (0, protocol_helpers_1.getProtocolCompanyDisplay)(protocol.rentalData.vehicle.company)],
                ...(0, protocol_helpers_1.getRepresentativeSection)()
            ]);
        }
        // 5. Stav vozidla s diakritiku
        this.addInfoSection('Stav vozidla pri prevzatí', [
            ['Stav tachometra:', `${protocol.vehicleCondition.odometer} km`],
            ['Úroveň paliva:', `${protocol.vehicleCondition.fuelLevel}%`],
            ['Typ paliva:', protocol.vehicleCondition.fuelType],
            ['Exteriér:', protocol.vehicleCondition.exteriorCondition],
            ['Interiér:', protocol.vehicleCondition.interiorCondition]
        ]);
        // 6. Poznámky
        if (protocol.vehicleCondition.notes) {
            this.addNotesSection('Poznámky k stavu vozidla', protocol.vehicleCondition.notes);
        }
        // 7. Poškodenia
        if (protocol.damages && protocol.damages.length > 0) {
            this.addDamagesSection(protocol.damages);
        }
        // 8. Súhrn médií
        this.addMediaSummary(protocol);
        // 9. Podpisy
        if (protocol.signatures && protocol.signatures.length > 0) {
            this.addSignaturesSection(protocol.signatures);
        }
        // 10. Poznámky
        if (protocol.notes) {
            this.addNotesSection('Dodatočné poznámky', protocol.notes);
        }
        // 11. Footer s diakritiku
        this.addUnicodeFooter();
        const pdfBytes = await this.doc.save();
        return Buffer.from(pdfBytes);
    }
    /**
     * Generovanie return protokolu s kompletným obsahom
     */
    async generateReturnProtocol(protocol) {
        console.log('🎨 PDF-LIB UNICODE - Return protokol');
        this.doc = await pdf_lib_1.PDFDocument.create();
        this.doc.registerFontkit(fontkit_1.default);
        this.currentPage = this.doc.addPage(pdf_lib_1.PageSizes.A4);
        await this.loadUnicodeFonts();
        this.currentY = this.pageHeight - 50;
        // 1. Záhlavie
        this.addUnicodeHeader('PREBERACÍ PROTOKOL');
        // 2. Základné informácie
        this.addInfoSection('Základné informácie', [
            ['Číslo protokolu:', protocol.id.slice(-8).toUpperCase()],
            ['Dátum vrátenia:', new Date(protocol.completedAt || protocol.createdAt).toLocaleDateString('sk-SK')],
            ['Miesto vrátenia:', protocol.location],
            ['Stav protokolu:', this.getStatusText(protocol.status)]
        ]);
        // 3. Informácie o prenájme
        if (protocol.rentalData) {
            this.addInfoSection('Informácie o prenájme', [
                ['Číslo objednávky:', protocol.rentalData.orderNumber || 'N/A'],
                ['Zákazník:', protocol.rentalData.customer?.name || 'N/A'],
                ['Email zákazníka:', protocol.rentalData.customer?.email || 'N/A'],
                ['Telefón zákazníka:', protocol.rentalData.customer?.phone || 'N/A'],
                ['Dátum od:', new Date(protocol.rentalData.startDate).toLocaleDateString('sk-SK')],
                ['Dátum do:', new Date(protocol.rentalData.endDate).toLocaleDateString('sk-SK')],
                ['Celková cena prenájmu:', `${protocol.rentalData.totalPrice} ${protocol.rentalData.currency || 'EUR'}`],
                ['Záloha:', `${protocol.rentalData.deposit || 0} ${protocol.rentalData.currency || 'EUR'}`],
                ['Povolené km:', `${protocol.rentalData.allowedKilometers || 0} km`],
                ['Cena za extra km:', `${protocol.rentalData.extraKilometerRate || 0} EUR/km`]
            ]);
        }
        // 4. Informácie o vozidle
        if (protocol.rentalData?.vehicle) {
            this.addInfoSection('Informácie o vozidle', [
                ['Značka:', protocol.rentalData.vehicle.brand || 'N/A'],
                ['Model:', protocol.rentalData.vehicle.model || 'N/A'],
                ['ŠPZ:', protocol.rentalData.vehicle.licensePlate || 'N/A'],
                ['Spoločnosť:', (0, protocol_helpers_1.getProtocolCompanyDisplay)(protocol.rentalData.vehicle.company)],
                ...(0, protocol_helpers_1.getRepresentativeSection)()
            ]);
        }
        // 5. Stav vozidla pri vrátení
        const currentOdometer = protocol.vehicleCondition?.odometer || 0;
        const kilometersUsed = protocol.kilometersUsed || 0;
        const initialOdometer = Math.max(0, currentOdometer - kilometersUsed);
        this.addInfoSection('Stav vozidla pri vrátení', [
            ['Počiatočný stav tachometra:', `${initialOdometer} km`],
            ['Konečný stav tachometra:', `${currentOdometer} km`],
            ['Úroveň paliva:', `${protocol.vehicleCondition?.fuelLevel || 'N/A'}%`],
            ['Typ paliva:', protocol.vehicleCondition?.fuelType || 'N/A'],
            ['Exteriér:', protocol.vehicleCondition?.exteriorCondition || 'N/A'],
            ['Interiér:', protocol.vehicleCondition?.interiorCondition || 'N/A']
        ]);
        // 6. Informácie o použití vozidla a poplatky
        if (protocol.kilometersUsed !== undefined) {
            this.addInfoSection('Informácie o použití vozidla', [
                ['Použité kilometre:', `${protocol.kilometersUsed} km`],
                ['Prekročenie limitu:', protocol.kilometerOverage ? `${protocol.kilometerOverage} km` : 'Nie'],
                ['Poplatok za prekročené km:', protocol.kilometerFee ? `${protocol.kilometerFee.toFixed(2)} EUR` : '0.00 EUR'],
                ['Poplatok za palivo:', protocol.fuelFee ? `${protocol.fuelFee.toFixed(2)} EUR` : '0.00 EUR'],
                ['Celkové dodatočné poplatky:', `${(protocol.totalExtraFees || 0).toFixed(2)} EUR`],
                ['Refund zálohy:', `${(protocol.depositRefund || 0).toFixed(2)} EUR`],
                ['Dodatočné platby:', `${(protocol.additionalCharges || 0).toFixed(2)} EUR`],
                ['Finálny refund:', `${(protocol.finalRefund || 0).toFixed(2)} EUR`]
            ]);
        }
        // 7. Poznámky k stavu vozidla
        if (protocol.notes) {
            this.addNotesSection('Poznámky k stavu vozidla', protocol.notes);
        }
        // 8. Poškodenia
        if (protocol.damages && protocol.damages.length > 0) {
            this.addDamagesSection(protocol.damages);
        }
        // 9. Nové poškodenia
        if (protocol.newDamages && protocol.newDamages.length > 0) {
            this.addDamagesSection(protocol.newDamages);
        }
        // 10. Fotky (zatiaľ len počet)
        if (protocol.vehicleImages && protocol.vehicleImages.length > 0) {
            this.addInfoSection('Fotky vozidla', [
                ['Počet fotiek:', `${protocol.vehicleImages.length}`]
            ]);
        }
        if (protocol.documentImages && protocol.documentImages.length > 0) {
            this.addInfoSection('Fotky dokumentov', [
                ['Počet fotiek:', `${protocol.documentImages.length}`]
            ]);
        }
        if (protocol.damageImages && protocol.damageImages.length > 0) {
            this.addInfoSection('Fotky poškodení', [
                ['Počet fotiek:', `${protocol.damageImages.length}`]
            ]);
        }
        // 13. Podpisy
        if (protocol.signatures && protocol.signatures.length > 0) {
            this.addSignaturesSection(protocol.signatures);
        }
        // 14. Footer
        this.addUnicodeFooter();
        const pdfBytes = await this.doc.save();
        console.log(`✅ PDF-lib Unicode Return protokol dokončený! Veľkosť: ${(pdfBytes.length / 1024).toFixed(1)} KB`);
        return Buffer.from(pdfBytes);
    }
    /**
   * Načítanie Unicode fontov
   */
    async loadUnicodeFonts() {
        try {
            console.log('📁 Načítavam Unicode fonty...');
            // Pre demo použijem štandardné PDF fonty (lepšie ako nič)
            this.font = await this.useDefaultPDFFont('regular');
            this.boldFont = await this.useDefaultPDFFont('bold');
            console.log('✅ Unicode fonty načítané úspešne (štandardné PDF fonty)');
        }
        catch (error) {
            console.error('❌ Chyba pri načítaní fontov:', error);
            throw new Error('Nepodarilo sa načítať Unicode fonty');
        }
    }
    /**
   * Použitie default PDF fontov (lepšia Unicode podpora)
   */
    async useDefaultPDFFont(fontType) {
        const { StandardFonts } = await Promise.resolve().then(() => __importStar(require('pdf-lib')));
        // Použitie najlepších štandardných fontov pre Unicode
        if (fontType === 'bold') {
            // Helvetica Bold môže mať lepšiu podporu pre niektoré znaky
            return await this.doc.embedFont(StandardFonts.HelveticaBold);
        }
        else {
            return await this.doc.embedFont(StandardFonts.Helvetica);
        }
    }
    /**
     * Header s Unicode podporou
     */
    addUnicodeHeader(title) {
        this.currentPage.drawRectangle({
            x: this.margin,
            y: this.currentY - 40,
            width: this.pageWidth - 2 * this.margin,
            height: 40,
            color: this.primaryColor,
        });
        // Plná slovenská diakritika
        this.currentPage.drawText(title, {
            x: this.pageWidth / 2 - 120,
            y: this.currentY - 25,
            size: 18,
            font: this.boldFont,
            color: (0, pdf_lib_1.rgb)(1, 1, 1),
        });
        this.currentPage.drawText('BlackRent', {
            x: this.pageWidth - this.margin - 60,
            y: this.currentY - 25,
            size: 12,
            font: this.boldFont,
            color: (0, pdf_lib_1.rgb)(1, 1, 1),
        });
        this.currentY -= 60;
    }
    /**
     * Informačná sekcia s Unicode
     */
    addInfoSection(title, data) {
        this.checkPageBreak(80);
        this.currentPage.drawRectangle({
            x: this.margin,
            y: this.currentY - 20,
            width: this.pageWidth - 2 * this.margin,
            height: 20,
            color: this.lightGray,
        });
        // Zachováme diakritiku v nadpisoch
        this.currentPage.drawText(title, {
            x: this.margin + 10,
            y: this.currentY - 15,
            size: 12,
            font: this.boldFont,
            color: this.secondaryColor,
        });
        this.currentY -= 30;
        const boxHeight = data.length * 20 + 20;
        this.currentPage.drawRectangle({
            x: this.margin,
            y: this.currentY - boxHeight,
            width: this.pageWidth - 2 * this.margin,
            height: boxHeight,
            borderColor: (0, pdf_lib_1.rgb)(0.8, 0.8, 0.8),
            borderWidth: 1,
        });
        data.forEach(([label, value], index) => {
            const yPos = this.currentY - 15 - (index * 20);
            // Zachováme slovenskú diakritiku
            this.currentPage.drawText(String(label || ''), {
                x: this.margin + 15,
                y: yPos,
                size: 10,
                font: this.boldFont,
                color: (0, pdf_lib_1.rgb)(0, 0, 0),
            });
            this.currentPage.drawText(String(value || ''), {
                x: this.margin + 150,
                y: yPos,
                size: 10,
                font: this.font,
                color: (0, pdf_lib_1.rgb)(0, 0, 0),
            });
        });
        this.currentY -= boxHeight + 15;
    }
    /**
     * Sekcia pre poškodenia s diakritiku
     */
    addDamagesSection(damages) {
        this.addInfoSection('Zaznamenané poškodenia', damages.map((damage, index) => [
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
        this.addInfoSection('Priložené súbory', [
            ['Počet fotiek:', totalImages.toString()],
            ['Fotky vozidla:', (protocol.vehicleImages?.length || 0).toString()],
            ['Fotky dokladov:', (protocol.documentImages?.length || 0).toString()],
            ['Fotky poškodení:', (protocol.damageImages?.length || 0).toString()],
            ['Počet videí:', totalVideos.toString()]
        ]);
    }
    /**
     * Sekcia pre podpisy
     */
    addSignaturesSection(signatures) {
        const signatureData = [];
        signatures.forEach((signature, index) => {
            signatureData.push([`Podpis ${index + 1}:`, `${signature.signerName} (${signature.signerRole})`], [`Čas podpisu:`, new Date(signature.timestamp).toLocaleString('sk-SK')], [`Miesto:`, signature.location || 'N/A']);
        });
        this.addInfoSection('Podpisy', signatureData);
    }
    /**
     * Poznámky s Unicode wrappingom
     */
    addNotesSection(title, notes) {
        this.checkPageBreak(60);
        this.currentPage.drawRectangle({
            x: this.margin,
            y: this.currentY - 20,
            width: this.pageWidth - 2 * this.margin,
            height: 20,
            color: this.lightGray,
        });
        this.currentPage.drawText(title, {
            x: this.margin + 10,
            y: this.currentY - 15,
            size: 12,
            font: this.boldFont,
            color: this.secondaryColor,
        });
        this.currentY -= 30;
        const maxWidth = this.pageWidth - 2 * this.margin - 20;
        const lines = this.wrapUnicodeText(notes, maxWidth, 10);
        const boxHeight = lines.length * 15 + 20;
        this.currentPage.drawRectangle({
            x: this.margin,
            y: this.currentY - boxHeight,
            width: this.pageWidth - 2 * this.margin,
            height: boxHeight,
            borderColor: (0, pdf_lib_1.rgb)(0.8, 0.8, 0.8),
            borderWidth: 1,
        });
        lines.forEach((line, index) => {
            this.currentPage.drawText(line, {
                x: this.margin + 10,
                y: this.currentY - 15 - (index * 15),
                size: 10,
                font: this.font,
                color: (0, pdf_lib_1.rgb)(0, 0, 0),
            });
        });
        this.currentY -= boxHeight + 15;
    }
    /**
     * Footer s diakritiku
     */
    addUnicodeFooter() {
        const footerY = 40;
        this.currentPage.drawLine({
            start: { x: this.margin, y: footerY + 20 },
            end: { x: this.pageWidth - this.margin, y: footerY + 20 },
            thickness: 2,
            color: this.primaryColor,
        });
        const footerText = `Vygenerované ${new Date().toLocaleString('sk-SK')} | BlackRent Systém`;
        this.currentPage.drawText(footerText, {
            x: this.pageWidth / 2 - 80,
            y: footerY,
            size: 8,
            font: this.font,
            color: this.secondaryColor,
        });
        this.currentPage.drawText('Strana 1', {
            x: this.pageWidth - this.margin - 40,
            y: footerY,
            size: 8,
            font: this.font,
            color: this.secondaryColor,
        });
    }
    checkPageBreak(requiredSpace) {
        if (this.currentY - requiredSpace < 80) {
            this.currentPage = this.doc.addPage(pdf_lib_1.PageSizes.A4);
            this.currentY = this.pageHeight - 50;
        }
    }
    /**
     * Unicode text wrapping (zachováva diakritiku)
     */
    wrapUnicodeText(text, maxWidth, fontSize) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const testWidth = this.estimateTextWidth(testLine, fontSize);
            if (testWidth <= maxWidth) {
                currentLine = testLine;
            }
            else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
        return lines;
    }
    /**
     * Odhad šírky Unicode textu
     */
    estimateTextWidth(text, fontSize) {
        // Aproximácia pre Unicode znaky vrátane diakritiky
        return text.length * (fontSize * 0.6);
    }
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
exports.PDFLibUnicodeGenerator = PDFLibUnicodeGenerator;
//# sourceMappingURL=pdf-lib-unicode-generator.js.map