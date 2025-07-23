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
exports.PDFLibCustomFontGenerator = void 0;
const pdf_lib_1 = require("pdf-lib");
const fontkit_1 = __importDefault(require("@pdf-lib/fontkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * PDF-lib CUSTOM Font Generator - Používa vlastný font používateľa
 * Plná podpora slovenskej diakritiky s custom fontom
 */
class PDFLibCustomFontGenerator {
    constructor(fontName = 'aeonik') {
        this.currentY = 750;
        this.pageWidth = 595;
        this.pageHeight = 842;
        this.margin = 50;
        this.primaryColor = (0, pdf_lib_1.rgb)(0.1, 0.46, 0.82);
        this.secondaryColor = (0, pdf_lib_1.rgb)(0.26, 0.26, 0.26);
        this.lightGray = (0, pdf_lib_1.rgb)(0.94, 0.94, 0.94);
        this.fontName = fontName;
        // Podpora pre rôzne formáty fontov (TTF, WOFF, WOFF2)
        this.customFontPath = this.findFontFile(fontName, 'regular');
        this.customBoldFontPath = this.findFontFile(fontName, 'bold');
    }
    /**
     * Nájde font súbor s podporou rôznych formátov
     */
    findFontFile(fontName, weight) {
        const fontDir = path_1.default.join(__dirname, '../../fonts');
        const possibleExtensions = ['.ttf', '.otf', '.woff2', '.woff'];
        const possibleNames = [
            `${fontName}-${weight}`,
            `${fontName}_${weight}`,
            `${fontName}${weight}`,
            weight === 'regular' ? fontName : `${fontName}-${weight}`
        ];
        // Špecifické mapovanie pre Aeonik font
        if (fontName.toLowerCase().includes('aeonik')) {
            const aeonikDir = path_1.default.join(fontDir, 'Aeonik Essentials Website');
            if (weight === 'regular') {
                const regularWoff2 = path_1.default.join(aeonikDir, 'aeonik-regular.woff2');
                const regularWoff = path_1.default.join(aeonikDir, 'aeonik-regular.woff');
                if (fs_1.default.existsSync(regularWoff2))
                    return regularWoff2;
                if (fs_1.default.existsSync(regularWoff))
                    return regularWoff;
            }
            else if (weight === 'bold') {
                const boldWoff2 = path_1.default.join(aeonikDir, 'aeonik-bold.woff2');
                const boldWoff = path_1.default.join(aeonikDir, 'aeonik-bold.woff');
                if (fs_1.default.existsSync(boldWoff2))
                    return boldWoff2;
                if (fs_1.default.existsSync(boldWoff))
                    return boldWoff;
            }
        }
        // Všeobecné hľadanie
        for (const name of possibleNames) {
            for (const ext of possibleExtensions) {
                const filePath = path_1.default.join(fontDir, `${name}${ext}`);
                if (fs_1.default.existsSync(filePath)) {
                    return filePath;
                }
            }
        }
        // Fallback
        return path_1.default.join(fontDir, `${fontName}.ttf`);
    }
    /**
     * Generovanie handover protokolu s VLASTNÝM fontom
     */
    async generateHandoverProtocol(protocol) {
        console.log(`🎨 PDF-LIB CUSTOM FONT GENERÁTOR SPUSTENÝ - ${this.fontName.toUpperCase()}`);
        console.log('📋 Protokol ID:', protocol.id);
        // Vytvorenie PDF dokumentu s fontkit
        this.doc = await pdf_lib_1.PDFDocument.create();
        this.doc.registerFontkit(fontkit_1.default);
        this.currentPage = this.doc.addPage(pdf_lib_1.PageSizes.A4);
        // Načítanie vlastného fontu
        await this.loadCustomFont();
        this.currentY = this.pageHeight - 50;
        // 1. Záhlavie s vlastným fontom
        this.addCustomFontHeader('PROTOKOL PREVZATIA VOZIDLA');
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
                ['Spoločnosť:', protocol.rentalData.vehicle.company || 'N/A']
            ]);
        }
        // 5. Stav vozidla
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
        // 11. Footer s vlastným fontom
        this.addCustomFontFooter();
        const pdfBytes = await this.doc.save();
        return Buffer.from(pdfBytes);
    }
    /**
     * Generovanie return protokolu
     */
    async generateReturnProtocol(protocol) {
        console.log(`🎨 PDF-LIB CUSTOM FONT - Return protokol (${this.fontName})`);
        this.doc = await pdf_lib_1.PDFDocument.create();
        this.doc.registerFontkit(fontkit_1.default);
        this.currentPage = this.doc.addPage(pdf_lib_1.PageSizes.A4);
        await this.loadCustomFont();
        this.currentY = this.pageHeight - 50;
        this.addCustomFontHeader('PROTOKOL VRÁTENIA VOZIDLA');
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
        this.addCustomFontFooter();
        const pdfBytes = await this.doc.save();
        return Buffer.from(pdfBytes);
    }
    /**
     * Načítanie vlastného fontu
     */
    async loadCustomFont() {
        try {
            console.log(`📁 Načítavam vlastný font: ${this.fontName}...`);
            console.log(`📂 Regular font path: ${this.customFontPath}`);
            console.log(`📂 Bold font path: ${this.customBoldFontPath}`);
            // Kontrola existencie font súborov
            const regularExists = fs_1.default.existsSync(this.customFontPath);
            const boldExists = fs_1.default.existsSync(this.customBoldFontPath);
            console.log(`📋 Regular font exists: ${regularExists}`);
            console.log(`📋 Bold font exists: ${boldExists}`);
            if (regularExists) {
                // Načítanie regular fontu
                const regularFontBytes = fs_1.default.readFileSync(this.customFontPath);
                this.font = await this.doc.embedFont(regularFontBytes);
                console.log(`✅ Vlastný regular font načítaný: ${this.fontName}`);
                if (boldExists) {
                    // Načítanie bold fontu
                    const boldFontBytes = fs_1.default.readFileSync(this.customBoldFontPath);
                    this.boldFont = await this.doc.embedFont(boldFontBytes);
                    console.log(`✅ Vlastný bold font načítaný: ${this.fontName}-bold`);
                }
                else {
                    // Použitie regular fontu aj pre bold ak bold neexistuje
                    this.boldFont = this.font;
                    console.log(`⚠️  Bold font nenájdený, používam regular pre oba`);
                }
                console.log(`🎉 VLASTNÝ FONT ${this.fontName.toUpperCase()} ÚSPEŠNE NAČÍTANÝ!`);
                console.log(`🔤 Plná podpora slovenskej diakritiky s vaším fontom!`);
            }
            else {
                console.log(`❌ Vlastný font nenájdený: ${this.customFontPath}`);
                console.log(`🔄 Fallback na Roboto fonty...`);
                await this.loadRobotoFallback();
            }
        }
        catch (error) {
            console.error(`❌ Chyba pri načítaní vlastného fontu ${this.fontName}:`, error);
            console.log(`🔄 Fallback na Roboto fonty...`);
            await this.loadRobotoFallback();
        }
    }
    /**
     * Fallback na Roboto fonty ak vlastný font zlyhá
     */
    async loadRobotoFallback() {
        try {
            const robotoRegularPath = path_1.default.join(process.cwd(), 'roboto-regular.woff2');
            const robotoBoldPath = path_1.default.join(process.cwd(), 'roboto-bold.woff2');
            if (fs_1.default.existsSync(robotoRegularPath) && fs_1.default.existsSync(robotoBoldPath)) {
                const regularFontBytes = fs_1.default.readFileSync(robotoRegularPath);
                const boldFontBytes = fs_1.default.readFileSync(robotoBoldPath);
                this.font = await this.doc.embedFont(regularFontBytes);
                this.boldFont = await this.doc.embedFont(boldFontBytes);
                console.log('✅ Roboto fallback fonty načítané');
            }
            else {
                // Úplný fallback na štandardné PDF fonty
                const { StandardFonts } = await Promise.resolve().then(() => __importStar(require('pdf-lib')));
                this.font = await this.doc.embedFont(StandardFonts.Helvetica);
                this.boldFont = await this.doc.embedFont(StandardFonts.HelveticaBold);
                console.log('⚠️  Štandardné PDF fonty ako posledný fallback');
            }
        }
        catch (error) {
            console.error('❌ Aj fallback fonty zlyhali:', error);
            throw new Error('Nepodarilo sa načítať žiadne fonty');
        }
    }
    /**
     * Header s vlastným fontom
     */
    addCustomFontHeader(title) {
        this.currentPage.drawRectangle({
            x: this.margin,
            y: this.currentY - 40,
            width: this.pageWidth - 2 * this.margin,
            height: 40,
            color: this.primaryColor,
        });
        // Vlastný font v hlavičke
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
     * Informačná sekcia s vlastným fontom
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
        // Vlastný font v nadpisoch
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
            // Vlastný font v texte - plná diakritika!
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
     * Sekcia pre poškodenia s vlastným fontom
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
     * Poznámky s vlastným fontom
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
        const lines = this.wrapCustomFontText(notes, maxWidth, 10);
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
            // Vlastný font v poznámkach
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
     * Footer s vlastným fontom
     */
    addCustomFontFooter() {
        const footerY = 40;
        this.currentPage.drawLine({
            start: { x: this.margin, y: footerY + 20 },
            end: { x: this.pageWidth - this.margin, y: footerY + 20 },
            thickness: 2,
            color: this.primaryColor,
        });
        // Footer s vlastným fontom
        const footerText = `Vygenerované ${new Date().toLocaleString('sk-SK')} | BlackRent Systém (${this.fontName})`;
        this.currentPage.drawText(footerText, {
            x: this.pageWidth / 2 - 90,
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
     * Text wrapping s vlastným fontom
     */
    wrapCustomFontText(text, maxWidth, fontSize) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const testWidth = this.estimateCustomFontWidth(testLine, fontSize);
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
     * Odhad šírky textu pre vlastný font
     */
    estimateCustomFontWidth(text, fontSize) {
        // Odhad pre vlastný font (môže sa líšiť podľa typu fontu)
        return text.length * (fontSize * 0.6);
    }
    /**
     * Status text s vlastným fontom
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
exports.PDFLibCustomFontGenerator = PDFLibCustomFontGenerator;
//# sourceMappingURL=pdf-lib-custom-font-generator.js.map