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
const fontkit_1 = __importDefault(require("@pdf-lib/fontkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdf_lib_1 = require("pdf-lib");
const protocol_helpers_1 = require("./protocol-helpers");
/**
 * PDF-lib CUSTOM Font Generator - Používa vlastný font používateľa
 * Plná podpora slovenskej diakritiky s custom fontom
 */
class PDFLibCustomFontGenerator {
    constructor(fontName = 'sf-pro') {
        this.currentY = 750;
        this.pageWidth = 595;
        this.pageHeight = 842;
        this.margin = 50;
        this.primaryColor = (0, pdf_lib_1.rgb)(0.1, 0.46, 0.82);
        this.secondaryColor = (0, pdf_lib_1.rgb)(0.26, 0.26, 0.26);
        this.lightGray = (0, pdf_lib_1.rgb)(0.94, 0.94, 0.94);
        // 🎨 PÔVODNÁ TYPOGRAFICKÁ HIERARCHIA (bez simulácie váh)
        this.typography = {
            // Hlavné nadpisy (protokol títuly)
            h1: { size: 18, font: 'bold', color: (0, pdf_lib_1.rgb)(0.1, 0.1, 0.1) },
            // Sekcie nadpisy 
            h2: { size: 14, font: 'bold', color: (0, pdf_lib_1.rgb)(0.2, 0.2, 0.2) },
            // Pod-sekcie
            h3: { size: 12, font: 'regular', color: (0, pdf_lib_1.rgb)(0.3, 0.3, 0.3) },
            // Labely
            label: { size: 10, font: 'bold', color: (0, pdf_lib_1.rgb)(0.1, 0.1, 0.1) },
            // Hodnoty
            value: { size: 10, font: 'regular', color: (0, pdf_lib_1.rgb)(0.4, 0.4, 0.4) },
            // Bežný text
            body: { size: 11, font: 'regular', color: (0, pdf_lib_1.rgb)(0.2, 0.2, 0.2) },
            // Poznámky
            caption: { size: 9, font: 'regular', color: (0, pdf_lib_1.rgb)(0.5, 0.5, 0.5) },
            // Footer
            footer: { size: 8, font: 'regular', color: (0, pdf_lib_1.rgb)(0.6, 0.6, 0.6) }
        };
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
        // Špecifické mapovanie pre SF-Pro font s váhami - ULTRA OPTIMALIZOVANÉ
        if (fontName.toLowerCase().includes('sf-pro') || fontName.toLowerCase().includes('sfpro')) {
            const sfProDir = path_1.default.join(fontDir, 'SF-Pro-Expanded-Font-main');
            // PRIORITA 1: Špecifické váhy fontov (252KB každý)
            const weightMapping = {
                'light': 'SF-Pro-Light.ttf',
                'regular': 'SF-Pro-Regular.ttf',
                'medium': 'SF-Pro-Medium.ttf',
                'bold': 'SF-Pro-Bold.ttf'
            };
            const specificWeightFile = path_1.default.join(sfProDir, weightMapping[weight] || weightMapping['regular']);
            if (fs_1.default.existsSync(specificWeightFile)) {
                console.log(`🚀 SF-Pro ${weight.toUpperCase()} font: ${specificWeightFile} (252KB)`);
                return specificWeightFile;
            }
            // PRIORITA 2: Minimálny subset ako fallback (252KB)
            const sfProMinimalFile = path_1.default.join(sfProDir, 'SF-Pro-Minimal.ttf');
            if (fs_1.default.existsSync(sfProMinimalFile)) {
                console.log(`⚠️ SF-Pro ${weight} nenájdený, používam Minimal: ${sfProMinimalFile} (252KB)`);
                return sfProMinimalFile;
            }
            // PRIORITA 3: Slovak subset ako fallback (448KB)
            const sfProSubsetFile = path_1.default.join(sfProDir, 'SF-Pro-Slovak-Subset.ttf');
            if (fs_1.default.existsSync(sfProSubsetFile)) {
                console.log(`⚠️ SF-Pro ${weight} nenájdený, používam Slovak subset: ${sfProSubsetFile} (448KB)`);
                return sfProSubsetFile;
            }
        }
        // Špecifické mapovanie pre Aeonik font (legacy podpora)
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
        this.addCustomFontHeader('ODOVZDÁVACÍ PROTOKOL');
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
        // 8. Obrázky vozidla 🖼️
        console.log('🖼️ DEBUG: Volám addImagesSection pre vehicleImages:', protocol.vehicleImages?.length || 0);
        await this.addImagesSection('🚗 FOTKY VOZIDLA', protocol.vehicleImages || []);
        // 9. Obrázky dokumentov 🖼️
        console.log('🖼️ DEBUG: Volám addImagesSection pre documentImages:', protocol.documentImages?.length || 0);
        await this.addImagesSection('📄 FOTKY DOKUMENTOV', protocol.documentImages || []);
        // 10. Obrázky poškodení 🖼️  
        console.log('🖼️ DEBUG: Volám addImagesSection pre damageImages:', protocol.damageImages?.length || 0);
        await this.addImagesSection('⚠️ FOTKY POŠKODENÍ', protocol.damageImages || []);
        // 11. Podpisy
        if (protocol.signatures && protocol.signatures.length > 0) {
            this.addSignaturesSection(protocol.signatures);
        }
        // 12. Poznámky
        if (protocol.notes) {
            this.addNotesSection('Dodatočné poznámky', protocol.notes);
        }
        // 13. Footer s vlastným fontom
        this.addCustomFontFooter();
        const pdfBytes = await this.doc.save();
        return Buffer.from(pdfBytes);
    }
    /**
     * Generovanie return protokolu s kompletným obsahom
     */
    async generateReturnProtocol(protocol) {
        console.log(`🎨 PDF-LIB CUSTOM FONT - Return protokol (${this.fontName})`);
        this.doc = await pdf_lib_1.PDFDocument.create();
        this.doc.registerFontkit(fontkit_1.default);
        this.currentPage = this.doc.addPage(pdf_lib_1.PageSizes.A4);
        await this.loadCustomFont();
        this.currentY = this.pageHeight - 50;
        // 1. Záhlavie
        this.addCustomFontHeader('PREBERACÍ PROTOKOL');
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
        // Počiatočný stav získame z rental dát (startOdometer) alebo vypočítame
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
        // 10. Obrázky vozidla 🖼️
        await this.addImagesSection('🚗 FOTKY VOZIDLA', protocol.vehicleImages || []);
        // 11. Obrázky dokumentov 🖼️
        await this.addImagesSection('📄 FOTKY DOKUMENTOV', protocol.documentImages || []);
        // 12. Obrázky poškodení 🖼️  
        await this.addImagesSection('⚠️ FOTKY POŠKODENÍ', protocol.damageImages || []);
        // 13. Podpisy
        if (protocol.signatures && protocol.signatures.length > 0) {
            this.addSignaturesSection(protocol.signatures);
        }
        // 14. Footer s vlastným fontom
        this.addCustomFontFooter();
        const pdfBytes = await this.doc.save();
        console.log(`✅ PDF-lib Custom Font Return protokol dokončený! Veľkosť: ${(pdfBytes.length / 1024).toFixed(1)} KB`);
        return Buffer.from(pdfBytes);
    }
    /**
     * Načítanie vlastného fontu s podporou rôznych váh
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
                // Pokus o načítanie light a medium váh (fallback na regular ak neexistujú)
                const lightPath = this.findFontFile(this.fontName, 'light');
                const mediumPath = this.findFontFile(this.fontName, 'medium');
                try {
                    if (fs_1.default.existsSync(lightPath)) {
                        const lightFontBytes = fs_1.default.readFileSync(lightPath);
                        this.lightFont = await this.doc.embedFont(lightFontBytes);
                        console.log(`✅ Light font načítaný: ${this.fontName}-light`);
                    }
                    else {
                        this.lightFont = this.font;
                        console.log(`⚠️  Light font nenájdený, používam regular`);
                    }
                }
                catch {
                    this.lightFont = this.font;
                }
                try {
                    if (fs_1.default.existsSync(mediumPath)) {
                        const mediumFontBytes = fs_1.default.readFileSync(mediumPath);
                        this.mediumFont = await this.doc.embedFont(mediumFontBytes);
                        console.log(`✅ Medium font načítaný: ${this.fontName}-medium`);
                    }
                    else {
                        this.mediumFont = this.font;
                        console.log(`⚠️  Medium font nenájdený, používam regular`);
                    }
                }
                catch {
                    this.mediumFont = this.font;
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
                this.lightFont = this.font; // Použitie regular aj pre light
                this.mediumFont = this.font; // Použitie regular aj pre medium
                console.log('✅ Roboto fallback fonty načítané');
            }
            else {
                // Úplný fallback na štandardné PDF fonty
                const { StandardFonts } = await Promise.resolve().then(() => __importStar(require('pdf-lib')));
                this.font = await this.doc.embedFont(StandardFonts.Helvetica);
                this.boldFont = await this.doc.embedFont(StandardFonts.HelveticaBold);
                this.lightFont = this.font;
                this.mediumFont = this.font;
                console.log('⚠️  Štandardné PDF fonty ako posledný fallback');
            }
        }
        catch (error) {
            console.error('❌ Aj fallback fonty zlyhali:', error);
            throw new Error('Nepodarilo sa načítať žiadne fonty');
        }
    }
    /**
     * 🎨 Pomocná metóda pre výber správneho fontu podľa typografie
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getFontByType(fontType) {
        switch (fontType) {
            case 'bold':
                return this.boldFont;
            case 'light':
                return this.lightFont;
            case 'medium':
                return this.mediumFont;
            case 'regular':
            default:
                return this.font;
        }
    }
    /**
     * 🎨 Vylepšená metóda pre kreslenie textu s typografiou
     */
    drawStyledText(text, x, y, style) {
        const typography = this.typography[style];
        const font = this.getFontByType(typography.font);
        this.currentPage.drawText(text, {
            x,
            y,
            size: typography.size,
            font,
            color: typography.color,
        });
    }
    /**
     * ✏️ VYLEPŠENÁ HLAVIČKA S NOVOU TYPOGRAFIOU
     */
    addCustomFontHeader(title) {
        // 🎨 HLAVNÝ NADPIS - väčší a výraznejší
        const h1Typography = this.typography.h1;
        const titleFont = this.getFontByType(h1Typography.font);
        const titleWidth = titleFont.widthOfTextAtSize(title, h1Typography.size);
        const centerX = this.pageWidth / 2 - titleWidth / 2;
        this.drawStyledText(title, centerX, this.currentY - 30, 'h1');
        // 🏢 BlackRent logo - menší a jemnejší
        this.drawStyledText('BlackRent', this.margin, this.currentY - 30, 'h3');
        // 📅 Dátum - najmenší a najjemnejší
        const now = new Date();
        const dateStr = now.toLocaleDateString('sk-SK');
        this.drawStyledText(dateStr, this.pageWidth - this.margin - 80, this.currentY - 30, 'caption');
        // Elegantná oddeľovacia čiara pod hlavičkou
        this.currentPage.drawLine({
            start: { x: this.margin, y: this.currentY - 45 },
            end: { x: this.pageWidth - this.margin, y: this.currentY - 45 },
            thickness: 1,
            color: (0, pdf_lib_1.rgb)(0.9, 0.9, 0.9),
        });
        this.currentY -= 65;
    }
    /**
     * 📋 JEDNODUCHÁ INFORMAČNÁ SEKCIA
     */
    addInfoSection(title, data) {
        this.checkPageBreak(data.length * 16 + 30);
        // 🎨 Nadpis sekcie - h2 štýl
        this.drawStyledText(title, this.margin, this.currentY - 15, 'h2');
        this.currentY -= 25;
        // Jemnejší box s obsahom
        const boxHeight = data.length * 18 + 12; // Väčší spacing
        this.currentPage.drawRectangle({
            x: this.margin,
            y: this.currentY - boxHeight,
            width: this.pageWidth - 2 * this.margin,
            height: boxHeight,
            color: (0, pdf_lib_1.rgb)(0.99, 0.99, 0.99),
            borderColor: (0, pdf_lib_1.rgb)(0.95, 0.95, 0.95),
            borderWidth: 0.5,
        });
        // Obsah s vylepšenou typografiou
        data.forEach(([label, value], index) => {
            const yPos = this.currentY - 14 - (index * 18);
            // 🏷️ Label - hrubší font
            this.drawStyledText(String(label || ''), this.margin + 12, yPos, 'label');
            // 📝 Hodnota - tenší font, jemnejšia farba
            this.drawStyledText(String(value || ''), this.margin + 190, yPos, 'value');
        });
        this.currentY -= boxHeight + 20; // Väčší spacing medzi sekciami
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
     * 📝 Vylepšené poznámky s novou typografiou
     */
    addNotesSection(title, notes) {
        this.checkPageBreak(60);
        // Jemnejšie pozadie pre nadpis
        this.currentPage.drawRectangle({
            x: this.margin,
            y: this.currentY - 22,
            width: this.pageWidth - 2 * this.margin,
            height: 22,
            color: (0, pdf_lib_1.rgb)(0.97, 0.97, 0.97),
        });
        // 🎨 Nadpis poznámok - h2 štýl
        this.drawStyledText(title, this.margin + 12, this.currentY - 16, 'h2');
        this.currentY -= 32;
        const maxWidth = this.pageWidth - 2 * this.margin - 24;
        const bodyTypography = this.typography.body;
        const lines = this.wrapCustomFontText(notes, maxWidth, bodyTypography.size);
        const boxHeight = lines.length * 16 + 24; // Väčší line-height
        // Jemnejší border pre poznámky
        this.currentPage.drawRectangle({
            x: this.margin,
            y: this.currentY - boxHeight,
            width: this.pageWidth - 2 * this.margin,
            height: boxHeight,
            color: (0, pdf_lib_1.rgb)(0.995, 0.995, 0.995),
            borderColor: (0, pdf_lib_1.rgb)(0.92, 0.92, 0.92),
            borderWidth: 0.5,
        });
        lines.forEach((line, index) => {
            // 📝 Poznámky s body štýlom
            this.drawStyledText(line, this.margin + 12, this.currentY - 16 - (index * 16), 'body');
        });
        this.currentY -= boxHeight + 15;
    }
    /**
     * 🦶 Vylepšený footer s novou typografiou
     */
    addCustomFontFooter() {
        const footerY = 40;
        // Jemnejšia oddeľovacia čiara
        this.currentPage.drawLine({
            start: { x: this.margin, y: footerY + 20 },
            end: { x: this.pageWidth - this.margin, y: footerY + 20 },
            thickness: 1,
            color: (0, pdf_lib_1.rgb)(0.9, 0.9, 0.9),
        });
        // 📄 Footer text s caption štýlom
        const footerText = `Vygenerované ${new Date().toLocaleString('sk-SK')} | BlackRent Systém (${this.fontName})`;
        this.drawStyledText(footerText, this.pageWidth / 2 - 120, footerY, 'footer');
        // 📄 Číslo strany s caption štýlom
        this.drawStyledText('Strana 1', this.pageWidth - this.margin - 50, footerY, 'footer');
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
    /**
     * 🔍 Detekcia formátu obrázka podľa magic bytes
     */
    detectImageFormat(bytes) {
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
            return { format: 'png', mimeType: 'image/png' };
        }
        // JPEG: FF D8 FF
        if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
            return { format: 'jpeg', mimeType: 'image/jpeg' };
        }
        // WebP: RIFF ... WEBP
        if (bytes.length >= 12 &&
            bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // RIFF
            bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) { // WEBP
            return { format: 'webp', mimeType: 'image/webp' };
        }
        // GIF: GIF87a alebo GIF89a
        if (bytes.length >= 6 &&
            bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && // GIF
            bytes[3] === 0x38 && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61) {
            return { format: 'gif', mimeType: 'image/gif' };
        }
        return { format: 'unknown', mimeType: 'application/octet-stream' };
    }
    /**
     * 🔄 Konverzia WebP na JPEG pomocou Sharp
     */
    async convertWebPToJpeg(webpBytes) {
        try {
            const sharp = (await Promise.resolve().then(() => __importStar(require('sharp')))).default;
            // Konvertuj WebP na JPEG s kvalitou 85%
            const jpegBuffer = await sharp(Buffer.from(webpBytes))
                .jpeg({ quality: 85, mozjpeg: true })
                .toBuffer();
            return new Uint8Array(jpegBuffer);
        }
        catch (error) {
            console.error('❌ Error converting WebP to JPEG:', error);
            return null;
        }
    }
    /**
     * 🖼️ Stiahnutie obrázka z R2 URL alebo konverzia z base64
     */
    async downloadImageFromR2(imageUrl) {
        try {
            // 🔍 DETEKCIA FORMÁTU OBRÁZKA
            if (imageUrl.startsWith('data:image/')) {
                // ✅ BASE64 OBRÁZOK - konvertuj priamo
                console.log('📥 Converting base64 image to bytes');
                const base64Data = imageUrl.split(',')[1];
                if (!base64Data) {
                    console.error('❌ Invalid base64 format');
                    return null;
                }
                const uint8Array = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                console.log(`✅ Base64 image converted: ${uint8Array.length} bytes`);
                // 🔍 DETEKCIA SKUTOČNÉHO FORMÁTU PODĽA MAGIC BYTES
                const formatInfo = this.detectImageFormat(uint8Array);
                console.log(`🔍 Detected image format: ${formatInfo.format} (MIME: ${formatInfo.mimeType})`);
                // 🔄 KONVERZIA WebP → JPEG ak je potrebná
                if (formatInfo.format === 'webp') {
                    console.log('🔄 Converting WebP to JPEG for PDF compatibility...');
                    const convertedBytes = await this.convertWebPToJpeg(uint8Array);
                    if (convertedBytes) {
                        console.log(`✅ WebP converted to JPEG: ${convertedBytes.length} bytes`);
                        return convertedBytes;
                    }
                    else {
                        console.log('⚠️ WebP conversion not available, will use placeholder');
                        return null; // Vráti null aby sa použil placeholder
                    }
                }
                return uint8Array;
            }
            else if (imageUrl.startsWith('http')) {
                // ✅ R2 URL OBRÁZOK - stiahni cez HTTP
                console.log('📥 Downloading image from R2 URL:', imageUrl);
                const response = await fetch(imageUrl);
                if (!response.ok) {
                    console.error('❌ Failed to download image:', response.status, response.statusText);
                    return null;
                }
                const arrayBuffer = await response.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                console.log(`✅ R2 image downloaded: ${uint8Array.length} bytes`);
                // 🔍 DETEKCIA SKUTOČNÉHO FORMÁTU PODĽA MAGIC BYTES aj pre R2 obrázky
                console.log('🔍 First 16 bytes of R2 image:', Array.from(uint8Array.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
                const formatInfo = this.detectImageFormat(uint8Array);
                console.log(`🔍 Detected R2 image format: ${formatInfo.format} (MIME: ${formatInfo.mimeType})`);
                // 🔄 KONVERZIA WebP → JPEG ak je potrebná
                if (formatInfo.format === 'webp') {
                    console.log('🔄 Converting R2 WebP to JPEG for PDF compatibility...');
                    const convertedBytes = await this.convertWebPToJpeg(uint8Array);
                    if (convertedBytes) {
                        console.log(`✅ R2 WebP converted to JPEG: ${convertedBytes.length} bytes`);
                        return convertedBytes;
                    }
                    else {
                        console.log('⚠️ R2 WebP conversion not available, will use placeholder');
                        return null; // Vráti null aby sa použil placeholder
                    }
                }
                return uint8Array;
            }
            else {
                console.error('❌ Unsupported image format:', imageUrl.substring(0, 50));
                return null;
            }
        }
        catch (error) {
            console.error('❌ Error processing image:', error);
            return null;
        }
    }
    /**
     * 🖼️ Pridanie obrázkov do PDF pomocou pdf-lib - MODERNÝ DESIGN
     */
    async addImagesSection(title, images) {
        console.log(`🖼️ DEBUG: addImagesSection called with title: ${title}, images count: ${images?.length || 0}`);
        console.log(`🖼️ DEBUG: First image sample:`, images?.[0] ? { id: images[0].id, url: images[0].url?.substring(0, 50) + '...', type: images[0].type } : 'No images');
        if (!images || images.length === 0) {
            console.log(`🖼️ DEBUG: No images found for ${title}, adding placeholder`);
            // Jednoduchá sekcia pre prázdne obrázky
            this.currentPage.drawText(title, {
                x: this.margin,
                y: this.currentY - 15,
                size: 12,
                font: this.boldFont,
                color: (0, pdf_lib_1.rgb)(0, 0, 0),
            });
            this.currentPage.drawText('Žiadne obrázky', {
                x: this.margin + 10,
                y: this.currentY - 30,
                size: 9,
                font: this.font,
                color: (0, pdf_lib_1.rgb)(0.5, 0.5, 0.5),
            });
            this.currentY -= 40;
            return;
        }
        console.log(`🖼️ Adding ${images.length} images for section: ${title}`);
        // 🎨 Header sekcie s h2 štýlom
        this.checkPageBreak(30);
        this.drawStyledText(title, this.margin, this.currentY - 15, 'h2');
        this.currentY -= 30;
        // 🖼️ USPORIADANIE OBRÁZKOV 3 V RADE - VÄČŠIE A KVALITNEJŠIE
        const imagesPerRow = 3; // 🔧 ZLEPŠENÉ: 3 namiesto 4 pre väčšie obrázky
        const imageSpacing = 12; // 🔧 ZLEPŠENÉ: Väčší spacing pre lepší vzhľad
        const maxImageWidth = 160; // 🔧 ZLEPŠENÉ: Väčšie obrázky (160px namiesto 120px)
        const maxImageHeight = 120; // 🔧 ZLEPŠENÉ: Väčšie obrázky (120px namiesto 90px)
        const availableWidth = this.pageWidth - 2 * this.margin;
        const imageAreaWidth = (availableWidth - imageSpacing) / imagesPerRow;
        const actualMaxWidth = Math.min(maxImageWidth, imageAreaWidth - 10);
        let currentCol = 0;
        let rowHeight = 0;
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            try {
                // Stiahnuť obrázok z R2 - použij komprimovanú verziu pre PDF ak existuje
                const imageUrl = image.compressedUrl || image.url;
                console.log(`🔍 Using image URL for PDF: ${String(imageUrl).substring(0, 100)}...`);
                const imageBytes = await this.downloadImageFromR2(String(imageUrl));
                if (!imageBytes) {
                    // Placeholder pre chybný obrázok alebo nepodporovaný formát
                    await this.addImagePlaceholderInGrid(i + 1, 'WebP formát - konverzia nedostupná', currentCol, actualMaxWidth, 100);
                    this.moveToNextGridPosition();
                    continue;
                }
                // Embed obrázok do PDF - inteligentná detekcia formátu
                let pdfImage;
                try {
                    // 🔍 Detekcia formátu pre správne embedovanie
                    const formatInfo = this.detectImageFormat(imageBytes);
                    console.log(`🔍 Embedding image as ${formatInfo.format}`);
                    if (formatInfo.format === 'jpeg' || formatInfo.format === 'jpg') {
                        pdfImage = await this.doc.embedJpg(imageBytes);
                    }
                    else if (formatInfo.format === 'png') {
                        pdfImage = await this.doc.embedPng(imageBytes);
                    }
                    else {
                        // Fallback: skús JPEG najprv, potom PNG
                        try {
                            pdfImage = await this.doc.embedJpg(imageBytes);
                            console.log('✅ Successfully embedded as JPEG (fallback)');
                        }
                        catch (jpgError) {
                            console.log('⚠️ JPEG embed failed, trying PNG...');
                            pdfImage = await this.doc.embedPng(imageBytes);
                            console.log('✅ Successfully embedded as PNG (fallback)');
                        }
                    }
                }
                catch (error) {
                    console.error('❌ Failed to embed image:', error instanceof Error ? error.message : String(error));
                    await this.addImagePlaceholderInGrid(i + 1, 'Nepodporovaný formát obrázka', currentCol, actualMaxWidth, 100);
                    this.moveToNextGridPosition();
                    continue;
                }
                // 🎯 VÝPOČET ROZMEROV - VÄČŠIE OBRÁZKY
                const { width: originalWidth, height: originalHeight } = pdfImage.scale(1);
                let width = originalWidth;
                let height = originalHeight;
                // Proporcionálne zmenšenie ak je potrebné
                if (width > actualMaxWidth || height > maxImageHeight) {
                    const widthRatio = actualMaxWidth / width;
                    const heightRatio = maxImageHeight / height;
                    const ratio = Math.min(widthRatio, heightRatio);
                    width = width * ratio;
                    height = height * ratio;
                }
                // Výpočet pozície v gridu
                const xPos = this.margin + currentCol * (imageAreaWidth + imageSpacing) + (imageAreaWidth - width) / 2;
                // Kontrola či sa zmestí riadok na stránku
                const totalRowHeight = height + 20; // obrázok + malý popis + spacing
                if (currentCol === 0) { // Začiatok nového riadku
                    this.checkPageBreak(totalRowHeight);
                    rowHeight = totalRowHeight;
                }
                // Jednoduché vykreslenie obrázka
                this.currentPage.drawImage(pdfImage, {
                    x: xPos,
                    y: this.currentY - height,
                    width: width,
                    height: height,
                });
                // Jednoduchý border
                this.currentPage.drawRectangle({
                    x: xPos,
                    y: this.currentY - height,
                    width: width,
                    height: height,
                    borderColor: (0, pdf_lib_1.rgb)(0.7, 0.7, 0.7),
                    borderWidth: 0.5,
                });
                // Jednoduchý popis
                const descriptionY = this.currentY - height - 12;
                this.currentPage.drawText(`${i + 1}`, {
                    x: xPos + 2,
                    y: descriptionY,
                    size: 8,
                    font: this.font,
                    color: (0, pdf_lib_1.rgb)(0.4, 0.4, 0.4),
                });
                console.log(`✅ Image ${i + 1} added to PDF grid: ${width.toFixed(0)}x${height.toFixed(0)}px at col ${currentCol}`);
                // Posun na ďalšiu pozíciu v gride
                currentCol++;
                if (currentCol >= imagesPerRow) {
                    // Nový riadok
                    this.currentY -= rowHeight;
                    currentCol = 0;
                    rowHeight = 0;
                }
            }
            catch (error) {
                console.error(`❌ Error processing image ${i + 1}:`, error);
                await this.addImagePlaceholderInGrid(i + 1, 'Chyba pri spracovaní obrázka', currentCol, actualMaxWidth, 100);
                this.moveToNextGridPosition();
            }
        }
        // Dokončenie posledného riadku ak nie je úplný
        if (currentCol > 0) {
            this.currentY -= rowHeight;
        }
        // Malý spacing po sekcii obrázkov
        this.currentY -= 10;
    }
    /**
     * 🖼️ Helper pre jednoduchý grid placeholder
     */
    async addImagePlaceholderInGrid(imageNumber, errorMessage, col, width, height) {
        const imageSpacing = 8;
        const availableWidth = this.pageWidth - 2 * this.margin;
        const imageAreaWidth = (availableWidth - imageSpacing) / 4;
        const xPos = this.margin + col * (imageAreaWidth + imageSpacing) + (imageAreaWidth - width) / 2;
        // Jednoduchý placeholder box
        this.currentPage.drawRectangle({
            x: xPos,
            y: this.currentY - height,
            width: width,
            height: height,
            color: (0, pdf_lib_1.rgb)(0.95, 0.95, 0.95),
            borderColor: (0, pdf_lib_1.rgb)(0.7, 0.7, 0.7),
            borderWidth: 0.5,
        });
        // 📷 Číslo obrázka s caption štýlom
        this.drawStyledText(`${imageNumber}`, xPos + 2, this.currentY - height - 12, 'caption');
    }
    /**
     * Helper pre posun v gride
     */
    moveToNextGridPosition() {
        // Táto metóda sa volá v main loop, posun sa spracuje tam
    }
    /**
     * 🖼️ Placeholder pre chybný obrázok
     */
    addImagePlaceholder(imageNumber, errorMessage) {
        this.checkPageBreak(80);
        const width = 200;
        const height = 60;
        // Sivý box ako placeholder
        this.currentPage.drawRectangle({
            x: this.margin,
            y: this.currentY - height,
            width: width,
            height: height,
            color: this.lightGray,
        });
        // 📷 Error text s h3 štýlom
        this.drawStyledText(`Obrázok ${imageNumber}`, this.margin + 10, this.currentY - 25, 'h3');
        // 📝 Error message s caption štýlom
        this.drawStyledText(errorMessage, this.margin + 10, this.currentY - 45, 'caption');
        this.currentY -= (height + 20);
    }
}
exports.PDFLibCustomFontGenerator = PDFLibCustomFontGenerator;
//# sourceMappingURL=pdf-lib-custom-font-generator.js.map