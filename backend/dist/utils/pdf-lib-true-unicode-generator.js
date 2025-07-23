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
exports.PDFLibTrueUnicodeGenerator = void 0;
const pdf_lib_1 = require("pdf-lib");
const fontkit_1 = __importDefault(require("@pdf-lib/fontkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * PDF-lib TRUE Unicode Generator - Skutočná plná podpora slovenskej diakritiky
 * Používa embeddované Roboto fonty pre perfektný Slovak text rendering
 */
class PDFLibTrueUnicodeGenerator {
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
     * Generovanie handover protokolu s TRUE Unicode podporou
     */
    async generateHandoverProtocol(protocol) {
        console.log('🎨 PDF-LIB TRUE UNICODE GENERÁTOR SPUSTENÝ - Handover protokol');
        console.log('📋 Protokol ID:', protocol.id);
        // Vytvorenie PDF dokumentu s fontkit
        this.doc = await pdf_lib_1.PDFDocument.create();
        this.doc.registerFontkit(fontkit_1.default);
        this.currentPage = this.doc.addPage(pdf_lib_1.PageSizes.A4);
        // Načítanie embeddovaných Unicode fontov
        await this.loadEmbeddedUnicodeFonts();
        this.currentY = this.pageHeight - 50;
        // 1. Záhlavie s plnou diakritiku
        this.addTrueUnicodeHeader('PROTOKOL PREVZATIA VOZIDLA');
        // 2. Základné informácie s diakritiku
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
                ['Spoločnosť:', protocol.rentalData.vehicle.company || 'N/A']
            ]);
        }
        // 5. Stav vozidla s plnou diakritiku  
        this.addInfoSection('Stav vozidla pri prevzatí', [
            ['Stav tachometra:', `${protocol.vehicleCondition.odometer} km`],
            ['Úroveň paliva:', `${protocol.vehicleCondition.fuelLevel}%`],
            ['Typ paliva:', protocol.vehicleCondition.fuelType],
            ['Exteriér:', protocol.vehicleCondition.exteriorCondition],
            ['Interiér:', protocol.vehicleCondition.interiorCondition]
        ]);
        // 6. Poznámky s diakritiku
        if (protocol.vehicleCondition.notes) {
            this.addNotesSection('Poznámky k stavu vozidla', protocol.vehicleCondition.notes);
        }
        // 7. Poškodenia s plnou podporou
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
        this.addTrueUnicodeFooter();
        const pdfBytes = await this.doc.save();
        return Buffer.from(pdfBytes);
    }
    /**
     * Generovanie return protokolu
     */
    async generateReturnProtocol(protocol) {
        console.log('🎨 PDF-LIB TRUE UNICODE - Return protokol');
        this.doc = await pdf_lib_1.PDFDocument.create();
        this.doc.registerFontkit(fontkit_1.default);
        this.currentPage = this.doc.addPage(pdf_lib_1.PageSizes.A4);
        await this.loadEmbeddedUnicodeFonts();
        this.currentY = this.pageHeight - 50;
        this.addTrueUnicodeHeader('PROTOKOL VRÁTENIA VOZIDLA');
        this.addInfoSection('Základné informácie', [
            ['Číslo protokolu:', protocol.id.slice(-8).toUpperCase()],
            ['Dátum vrátenia:', new Date(protocol.completedAt || protocol.createdAt).toLocaleDateString('sk-SK')],
            ['Miesto vrátenia:', protocol.location],
            ['Stav protokolu:', this.getStatusText(protocol.status)]
        ]);
        if (protocol.kilometersUsed !== undefined) {
            this.addInfoSection('Informácie o použití', [
                ['Použité kilometre:', `${protocol.kilometersUsed} km`],
                ['Prekročenie limitu:', protocol.kilometerOverage ? `${protocol.kilometerOverage} km` : 'Nie'],
                ['Poplatok za km:', protocol.kilometerFee ? `${protocol.kilometerFee} EUR` : '0 EUR'],
                ['Dodatočné poplatky:', `${protocol.totalExtraFees || 0} EUR`]
            ]);
        }
        this.addTrueUnicodeFooter();
        const pdfBytes = await this.doc.save();
        return Buffer.from(pdfBytes);
    }
    /**
     * Načítanie embeddovaných Unicode fontov (Roboto)
     */
    async loadEmbeddedUnicodeFonts() {
        try {
            console.log('📁 Načítavam embeddované Unicode fonty (Roboto)...');
            // Načítanie font súborov z disku
            const robotoRegularPath = path_1.default.join(process.cwd(), 'roboto-regular.woff2');
            const robotoBoldPath = path_1.default.join(process.cwd(), 'roboto-bold.woff2');
            if (fs_1.default.existsSync(robotoRegularPath) && fs_1.default.existsSync(robotoBoldPath)) {
                console.log('✅ Našiel som lokálne Roboto fonty, načítavam...');
                const regularFontBytes = fs_1.default.readFileSync(robotoRegularPath);
                const boldFontBytes = fs_1.default.readFileSync(robotoBoldPath);
                this.font = await this.doc.embedFont(regularFontBytes);
                this.boldFont = await this.doc.embedFont(boldFontBytes);
                console.log('✅ Roboto fonty úspešne načítané! Plná Unicode podpora aktívna.');
            }
            else {
                console.log('⚠️  Roboto fonty nenájdené, používam fallback...');
                await this.loadFallbackFonts();
            }
        }
        catch (error) {
            console.error('❌ Chyba pri načítaní embeddovaných fontov:', error);
            console.log('🔄 Skúšam fallback fonty...');
            await this.loadFallbackFonts();
        }
    }
    /**
     * Fallback fonty ak embeddované nefungujú
     */
    async loadFallbackFonts() {
        const { StandardFonts } = await Promise.resolve().then(() => __importStar(require('pdf-lib')));
        // Fallback na najlepšie dostupné PDF fonty
        this.font = await this.doc.embedFont(StandardFonts.Helvetica);
        this.boldFont = await this.doc.embedFont(StandardFonts.HelveticaBold);
        console.log('⚠️  Používam fallback fonty - diakritika môže byť problematická');
    }
    /**
     * Header s TRUE Unicode podporou
     */
    addTrueUnicodeHeader(title) {
        this.currentPage.drawRectangle({
            x: this.margin,
            y: this.currentY - 40,
            width: this.pageWidth - 2 * this.margin,
            height: 40,
            color: this.primaryColor,
        });
        // Použitie TRUE Unicode textu (žiadna konverzia!)
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
     * Informačná sekcia s TRUE Unicode
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
        // Plná diakritika v nadpisoch - žiadna konverzia!
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
            // TRUE Unicode text - Č, Š, Ž, Ľ, Ť, Ň zostávajú zachované!
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
     * Sekcia pre poškodenia s plnou diakritiku
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
     * Poznámky s TRUE Unicode wrappingom
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
        // Plná diakritika v nadpise
        this.currentPage.drawText(title, {
            x: this.margin + 10,
            y: this.currentY - 15,
            size: 12,
            font: this.boldFont,
            color: this.secondaryColor,
        });
        this.currentY -= 30;
        const maxWidth = this.pageWidth - 2 * this.margin - 20;
        const lines = this.wrapTrueUnicodeText(notes, maxWidth, 10);
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
            // TRUE Unicode text v poznámkach - bez konverzie!
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
     * Footer s plnou diakritiku
     */
    addTrueUnicodeFooter() {
        const footerY = 40;
        this.currentPage.drawLine({
            start: { x: this.margin, y: footerY + 20 },
            end: { x: this.pageWidth - this.margin, y: footerY + 20 },
            thickness: 2,
            color: this.primaryColor,
        });
        // TRUE Unicode footer text
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
     * TRUE Unicode text wrapping (zachováva všetku diakritiku)
     */
    wrapTrueUnicodeText(text, maxWidth, fontSize) {
        // Žiadna konverzia - zachováva Č, Š, Ž, Ľ, Ť, Ň, atď.
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const testWidth = this.estimateUnicodeTextWidth(testLine, fontSize);
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
     * Odhad šírky TRUE Unicode textu
     */
    estimateUnicodeTextWidth(text, fontSize) {
        // Lepší odhad pre Unicode znaky vrátane slovenskej diakritiky
        return text.length * (fontSize * 0.55); // Mierne užší pre Roboto font
    }
    /**
     * Status text s plnou diakritiku
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
exports.PDFLibTrueUnicodeGenerator = PDFLibTrueUnicodeGenerator;
//# sourceMappingURL=pdf-lib-true-unicode-generator.js.map