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
exports.generateReturnPDF = exports.generateHandoverPDF = exports.ProtocolPDFGenerator = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const enhanced_pdf_generator_backend_1 = require("./enhanced-pdf-generator-backend");
const puppeteer_pdf_generator_v2_1 = require("./puppeteer-pdf-generator-v2");
// 🔄 PREPÍNAČ PDF GENERÁTORA:
// 'legacy' = starý pdfkit generator
// 'jspdf' = enhanced jsPDF generator 
// 'puppeteer' = nový Puppeteer generator (najlepší) - PRIPRAVENÝ!
// 🎯 Puppeteer ako default, s fallback na Enhanced jsPDF
const PDF_GENERATOR_TYPE = process.env.PDF_GENERATOR_TYPE || 'puppeteer';
console.log(`🎯 PDF Generator inicializovaný: ${PDF_GENERATOR_TYPE.toUpperCase()}`);
// Puppeteer generátor - runtime require s fallback
const getPuppeteerGenerator = async () => {
    try {
        // Skúsim načítať Puppeteer V2 generátor
        const { PuppeteerPDFGeneratorV2 } = await Promise.resolve().then(() => __importStar(require('./puppeteer-pdf-generator-v2')));
        console.log('✅ Puppeteer V2 generátor úspešne načítaný');
        return new PuppeteerPDFGeneratorV2();
    }
    catch (error) {
        console.error('❌ Chyba pri načítaní Puppeteer generátora:', error);
        console.log('🔄 Fallback na Enhanced jsPDF generátor');
        // Fallback na Enhanced jsPDF ak Puppeteer zlyhá
        const enhancedGenerator = new enhanced_pdf_generator_backend_1.EnhancedPDFGeneratorBackend();
        return {
            generateHandoverProtocol: enhancedGenerator.generateHandoverProtocol.bind(enhancedGenerator),
            generateReturnProtocol: enhancedGenerator.generateReturnProtocol.bind(enhancedGenerator)
        };
    }
};
class ProtocolPDFGenerator {
    constructor() {
        this.doc = new pdfkit_1.default({
            size: 'A4',
            margin: 50,
            info: {
                Title: 'BlackRent - Protokol',
                Author: 'BlackRent System',
                Subject: 'Protokol prevzatia/vrátenia vozidla',
                Keywords: 'protokol, vozidlo, prenájom',
                CreationDate: new Date(),
            }
        });
    }
    // Funkcia pre načítanie obrázka z R2 URL alebo base64
    async loadImageBuffer(imageUrl) {
        try {
            // Ak je to R2 URL alebo iná HTTP URL
            if (imageUrl.startsWith('http')) {
                console.log('🔄 Načítavam obrázok z URL:', imageUrl);
                const response = await fetch(imageUrl);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                return Buffer.from(arrayBuffer);
            }
            // Ak je to base64
            if (imageUrl.startsWith('data:image/')) {
                console.log('🔄 Načítavam obrázok z base64');
                const base64Data = imageUrl.split(',')[1];
                return Buffer.from(base64Data, 'base64');
            }
            throw new Error('Nepodporovaný formát obrázka');
        }
        catch (error) {
            console.error('❌ Chyba pri načítaní obrázka:', error);
            throw error;
        }
    }
    // Generovanie handover protokolu
    async generateHandoverProtocol(protocol) {
        this.setupHeader('PROTOKOL PREVZATIA VOZIDLA');
        // Základné informácie
        this.addSection('Základné informácie');
        this.addInfoRow('Číslo protokolu:', protocol.id.slice(-8).toUpperCase());
        this.addInfoRow('Dátum vytvorenia:', new Date(protocol.createdAt).toLocaleDateString('sk-SK'));
        this.addInfoRow('Miesto prevzatia:', protocol.location);
        this.addInfoRow('Stav protokolu:', this.getStatusText(protocol.status));
        // Informácie o prenájme
        if (protocol.rentalData) {
            this.addSection('Informácie o prenájme');
            this.addInfoRow('Číslo objednávky:', protocol.rentalData.orderNumber || 'N/A');
            this.addInfoRow('Zákazník:', protocol.rentalData.customer?.name || 'N/A');
            this.addInfoRow('Dátum od:', new Date(protocol.rentalData.startDate).toLocaleDateString('sk-SK'));
            this.addInfoRow('Dátum do:', new Date(protocol.rentalData.endDate).toLocaleDateString('sk-SK'));
            this.addInfoRow('Celková cena:', `${protocol.rentalData.totalPrice} ${protocol.rentalData.currency}`);
            this.addInfoRow('Záloha:', `${protocol.rentalData.deposit} ${protocol.rentalData.currency}`);
        }
        // Informácie o vozidle
        if (protocol.rentalData?.vehicle) {
            this.addSection('Informácie o vozidle');
            this.addInfoRow('Značka:', protocol.rentalData.vehicle.brand || 'N/A');
            this.addInfoRow('Model:', protocol.rentalData.vehicle.model || 'N/A');
            this.addInfoRow('ŠPZ:', protocol.rentalData.vehicle.licensePlate || 'N/A');
        }
        // Stav vozidla
        this.addSection('Stav vozidla pri prevzatí');
        this.addInfoRow('Stav tachometra:', `${protocol.vehicleCondition.odometer} km`);
        this.addInfoRow('Úroveň paliva:', `${protocol.vehicleCondition.fuelLevel}%`);
        this.addInfoRow('Typ paliva:', protocol.vehicleCondition.fuelType);
        this.addInfoRow('Exteriér:', protocol.vehicleCondition.exteriorCondition);
        this.addInfoRow('Interiér:', protocol.vehicleCondition.interiorCondition);
        if (protocol.vehicleCondition.notes) {
            this.addInfoRow('Poznámky:', protocol.vehicleCondition.notes);
        }
        // Poškodenia
        if (protocol.damages && protocol.damages.length > 0) {
            this.addSection('Zaznamenané poškodenia');
            protocol.damages.forEach((damage, index) => {
                this.addInfoRow(`Poškodenie ${index + 1}:`, `${damage.description} (${damage.severity})`);
            });
        }
        // Media súbory
        this.addSection('Priložené súbory');
        const totalImages = (protocol.vehicleImages?.length || 0) +
            (protocol.documentImages?.length || 0) +
            (protocol.damageImages?.length || 0);
        const totalVideos = protocol.vehicleVideos?.length || 0;
        this.addInfoRow('Počet fotiek:', totalImages.toString());
        this.addInfoRow('Počet videí:', totalVideos.toString());
        // Zobrazenie fotiek
        if (totalImages > 0) {
            this.addSection('Fotodokumentácia');
            // Vozidlo fotky
            if (protocol.vehicleImages && protocol.vehicleImages.length > 0) {
                this.doc.fontSize(12).font('Helvetica-Bold').text('Fotky vozidla:', { continued: true });
                this.doc.fontSize(10).font('Helvetica').text(` ${protocol.vehicleImages.length} fotiek`);
                this.doc.moveDown(0.5);
                // Zobrazenie prvých 3 fotiek ako thumbnail
                const imagesToShow = protocol.vehicleImages.slice(0, 3);
                for (let i = 0; i < imagesToShow.length; i++) {
                    const image = imagesToShow[i];
                    try {
                        // Načítaj obrázok z R2 URL alebo base64
                        const imageBuffer = await this.loadImageBuffer(image.url);
                        // Pridaj obrázok do PDF
                        this.doc.image(imageBuffer, {
                            fit: [150, 100]
                        });
                        this.doc.fontSize(8).text(`${image.type || 'Vozidlo'} - ${new Date(image.timestamp).toLocaleString('sk-SK')}`, {
                            align: 'center'
                        });
                        if (i < imagesToShow.length - 1) {
                            this.doc.moveDown(0.5);
                        }
                    }
                    catch (error) {
                        console.error('Chyba pri vkladaní obrázka do PDF:', error);
                        this.doc.fontSize(8).text(`Chyba pri načítaní obrázka ${i + 1}`, { align: 'center' });
                    }
                }
                if (protocol.vehicleImages.length > 3) {
                    this.doc.fontSize(8).text(`... a ďalších ${protocol.vehicleImages.length - 3} fotiek`, { align: 'center' });
                }
                this.doc.moveDown(1);
            }
            // Doklady fotky
            if (protocol.documentImages && protocol.documentImages.length > 0) {
                this.doc.fontSize(12).font('Helvetica-Bold').text('Fotky dokladov:', { continued: true });
                this.doc.fontSize(10).font('Helvetica').text(` ${protocol.documentImages.length} fotiek`);
                this.doc.moveDown(0.5);
            }
            // Poškodenia fotky
            if (protocol.damageImages && protocol.damageImages.length > 0) {
                this.doc.fontSize(12).font('Helvetica-Bold').text('Fotky poškodení:', { continued: true });
                this.doc.fontSize(10).font('Helvetica').text(` ${protocol.damageImages.length} fotiek`);
                this.doc.moveDown(0.5);
            }
        }
        // Podpisy
        if (protocol.signatures && protocol.signatures.length > 0) {
            this.addSection('Podpisy');
            for (const [index, signature] of protocol.signatures.entries()) {
                this.addInfoRow(`Podpis ${index + 1}:`, `${signature.signerName} (${signature.signerRole})`);
                this.addInfoRow(`Časová pečiatka:`, new Date(signature.timestamp).toLocaleString('sk-SK'));
                this.addInfoRow(`Miesto:`, signature.location);
                // Pridaj obrázok podpisu
                try {
                    const signatureBuffer = await this.loadImageBuffer(signature.signature);
                    this.doc.image(signatureBuffer, {
                        fit: [200, 80]
                    });
                    this.doc.moveDown(0.5);
                }
                catch (error) {
                    console.error('Chyba pri vkladaní podpisu do PDF:', error);
                    this.doc.fontSize(8).text('Chyba pri načítaní podpisu', { align: 'center' });
                }
            }
        }
        // Poznámky
        if (protocol.notes) {
            this.addSection('Poznámky');
            this.doc.text(protocol.notes, { width: 500 });
        }
        this.addFooter();
        return this.doc;
    }
    // Generovanie return protokolu
    async generateReturnProtocol(protocol) {
        this.setupHeader('PROTOKOL VRÁTENIA VOZIDLA');
        // Základné informácie
        this.addSection('Základné informácie');
        this.addInfoRow('Číslo protokolu:', protocol.id.slice(-8).toUpperCase());
        this.addInfoRow('Dátum vytvorenia:', new Date(protocol.createdAt).toLocaleDateString('sk-SK'));
        this.addInfoRow('Miesto vrátenia:', protocol.location);
        this.addInfoRow('Stav protokolu:', this.getStatusText(protocol.status));
        // Informácie o prenájme
        if (protocol.rentalData) {
            this.addSection('Informácie o prenájme');
            this.addInfoRow('Číslo objednávky:', protocol.rentalData.orderNumber || 'N/A');
            this.addInfoRow('Zákazník:', protocol.rentalData.customer?.name || 'N/A');
            this.addInfoRow('Dátum od:', new Date(protocol.rentalData.startDate).toLocaleDateString('sk-SK'));
            this.addInfoRow('Dátum do:', new Date(protocol.rentalData.endDate).toLocaleDateString('sk-SK'));
            this.addInfoRow('Celková cena:', `${protocol.rentalData.totalPrice} ${protocol.rentalData.currency}`);
            this.addInfoRow('Záloha:', `${protocol.rentalData.deposit} ${protocol.rentalData.currency}`);
        }
        // Informácie o vozidle
        if (protocol.rentalData?.vehicle) {
            this.addSection('Informácie o vozidle');
            this.addInfoRow('Značka:', protocol.rentalData.vehicle.brand || 'N/A');
            this.addInfoRow('Model:', protocol.rentalData.vehicle.model || 'N/A');
            this.addInfoRow('ŠPZ:', protocol.rentalData.vehicle.licensePlate || 'N/A');
        }
        // Stav vozidla pri vrátení
        this.addSection('Stav vozidla pri vrátení');
        this.addInfoRow('Stav tachometra:', `${protocol.vehicleCondition.odometer} km`);
        this.addInfoRow('Úroveň paliva:', `${protocol.vehicleCondition.fuelLevel}%`);
        this.addInfoRow('Typ paliva:', protocol.vehicleCondition.fuelType);
        this.addInfoRow('Exteriér:', protocol.vehicleCondition.exteriorCondition);
        this.addInfoRow('Interiér:', protocol.vehicleCondition.interiorCondition);
        // Výpočty
        this.addSection('Výpočty a poplatky');
        this.addInfoRow('Najazdené km:', `${protocol.kilometersUsed} km`);
        this.addInfoRow('Prekročenie km:', `${protocol.kilometerOverage} km`);
        this.addInfoRow('Poplatok za km:', `${protocol.kilometerFee.toFixed(2)} EUR`);
        this.addInfoRow('Spotrebované palivo:', `${protocol.fuelUsed}%`);
        this.addInfoRow('Poplatok za palivo:', `${protocol.fuelFee.toFixed(2)} EUR`);
        this.addInfoRow('Celkové poplatky:', `${protocol.totalExtraFees.toFixed(2)} EUR`);
        this.addInfoRow('Vrátenie zálohy:', `${protocol.depositRefund.toFixed(2)} EUR`);
        this.addInfoRow('Dodatočné poplatky:', `${protocol.additionalCharges.toFixed(2)} EUR`);
        this.addInfoRow('Finálny refund:', `${protocol.finalRefund.toFixed(2)} EUR`);
        // Nové poškodenia
        if (protocol.newDamages && protocol.newDamages.length > 0) {
            this.addSection('Nové poškodenia zistené pri vrátení');
            protocol.newDamages.forEach((damage, index) => {
                this.addInfoRow(`Poškodenie ${index + 1}:`, `${damage.description} (${damage.severity})`);
            });
        }
        // Media súbory
        this.addSection('Priložené súbory');
        const totalImages = (protocol.vehicleImages?.length || 0) +
            (protocol.documentImages?.length || 0) +
            (protocol.damageImages?.length || 0);
        const totalVideos = protocol.vehicleVideos?.length || 0;
        this.addInfoRow('Počet fotiek:', totalImages.toString());
        this.addInfoRow('Počet videí:', totalVideos.toString());
        // Zobrazenie fotiek
        if (totalImages > 0) {
            this.addSection('Fotodokumentácia');
            // Vozidlo fotky
            if (protocol.vehicleImages && protocol.vehicleImages.length > 0) {
                this.doc.fontSize(12).font('Helvetica-Bold').text('Fotky vozidla:', { continued: true });
                this.doc.fontSize(10).font('Helvetica').text(` ${protocol.vehicleImages.length} fotiek`);
                this.doc.moveDown(0.5);
                // Zobrazenie prvých 3 fotiek ako thumbnail
                const imagesToShow = protocol.vehicleImages.slice(0, 3);
                for (let i = 0; i < imagesToShow.length; i++) {
                    const image = imagesToShow[i];
                    try {
                        // Konvertuj base64 na buffer
                        const imageBuffer = Buffer.from(image.url.split(',')[1], 'base64');
                        // Pridaj obrázok do PDF
                        this.doc.image(imageBuffer, {
                            fit: [150, 100]
                        });
                        this.doc.fontSize(8).text(`${image.type || 'Vozidlo'} - ${new Date(image.timestamp).toLocaleString('sk-SK')}`, {
                            align: 'center'
                        });
                        if (i < imagesToShow.length - 1) {
                            this.doc.moveDown(0.5);
                        }
                    }
                    catch (error) {
                        console.error('Chyba pri vkladaní obrázka do PDF:', error);
                        this.doc.fontSize(8).text(`Chyba pri načítaní obrázka ${i + 1}`, { align: 'center' });
                    }
                }
                if (protocol.vehicleImages.length > 3) {
                    this.doc.fontSize(8).text(`... a ďalších ${protocol.vehicleImages.length - 3} fotiek`, { align: 'center' });
                }
                this.doc.moveDown(1);
            }
            // Doklady fotky
            if (protocol.documentImages && protocol.documentImages.length > 0) {
                this.doc.fontSize(12).font('Helvetica-Bold').text('Fotky dokladov:', { continued: true });
                this.doc.fontSize(10).font('Helvetica').text(` ${protocol.documentImages.length} fotiek`);
                this.doc.moveDown(0.5);
            }
            // Poškodenia fotky
            if (protocol.damageImages && protocol.damageImages.length > 0) {
                this.doc.fontSize(12).font('Helvetica-Bold').text('Fotky poškodení:', { continued: true });
                this.doc.fontSize(10).font('Helvetica').text(` ${protocol.damageImages.length} fotiek`);
                this.doc.moveDown(0.5);
            }
        }
        // Podpisy
        if (protocol.signatures && protocol.signatures.length > 0) {
            this.addSection('Podpisy');
            for (const [index, signature] of protocol.signatures.entries()) {
                this.addInfoRow(`Podpis ${index + 1}:`, `${signature.signerName} (${signature.signerRole})`);
                this.addInfoRow(`Časová pečiatka:`, new Date(signature.timestamp).toLocaleString('sk-SK'));
                this.addInfoRow(`Miesto:`, signature.location);
                // Pridaj obrázok podpisu
                try {
                    const signatureBuffer = await this.loadImageBuffer(signature.signature);
                    this.doc.image(signatureBuffer, {
                        fit: [200, 80]
                    });
                    this.doc.moveDown(0.5);
                }
                catch (error) {
                    console.error('Chyba pri vkladaní podpisu do PDF:', error);
                    this.doc.fontSize(8).text('Chyba pri načítaní podpisu', { align: 'center' });
                }
            }
        }
        // Poznámky
        if (protocol.notes) {
            this.addSection('Poznámky');
            this.doc.text(protocol.notes, { width: 500 });
        }
        this.addFooter();
        return this.doc;
    }
    setupHeader(title) {
        // Logo a názov
        this.doc
            .fontSize(24)
            .font('Helvetica-Bold')
            .text('BLACKRENT', { align: 'center' })
            .moveDown(0.5);
        this.doc
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(title, { align: 'center' })
            .moveDown(2);
    }
    addSection(title) {
        this.doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .text(title)
            .moveDown(0.5);
    }
    addInfoRow(label, value) {
        this.doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(label, { continued: true })
            .font('Helvetica')
            .text(`: ${value}`)
            .moveDown(0.3);
    }
    getStatusText(status) {
        switch (status) {
            case 'draft': return 'Koncept';
            case 'completed': return 'Dokončený';
            case 'cancelled': return 'Zrušený';
            default: return status;
        }
    }
    addFooter() {
        this.doc
            .moveDown(2)
            .fontSize(8)
            .font('Helvetica')
            .text('Dokument vygenerovaný automaticky systémom BlackRent', { align: 'center' })
            .text(`Vygenerované: ${new Date().toLocaleString('sk-SK')}`, { align: 'center' });
    }
    // Získanie PDF ako buffer
    getBuffer() {
        return new Promise((resolve, reject) => {
            const chunks = [];
            this.doc.on('data', (chunk) => chunks.push(chunk));
            this.doc.on('end', () => resolve(Buffer.concat(chunks)));
            this.doc.on('error', reject);
            this.doc.end();
        });
    }
}
exports.ProtocolPDFGenerator = ProtocolPDFGenerator;
// Export funkcie pre jednoduché použitie s prepínačom
const generateHandoverPDF = async (protocol) => {
    console.log(`🎯 Generujem handover PDF s ${PDF_GENERATOR_TYPE.toUpperCase()} generátorom`);
    try {
        // Puppeteer generátor - najlepšia kvalita
        if (PDF_GENERATOR_TYPE === 'puppeteer') {
            console.log('🎭 Používam Puppeteer generátor');
            const puppeteerGenerator = new puppeteer_pdf_generator_v2_1.PuppeteerPDFGeneratorV2();
            return await puppeteerGenerator.generateHandoverProtocol(protocol);
        }
        // Enhanced jsPDF generátor - dobrá kvalita s diakritikoy
        if (PDF_GENERATOR_TYPE === 'jspdf') {
            console.log('🎨 Používam Enhanced jsPDF generátor');
            const enhancedGenerator = new enhanced_pdf_generator_backend_1.EnhancedPDFGeneratorBackend();
            return await enhancedGenerator.generateHandoverProtocol(protocol);
        }
        // Legacy PDFKit generátor - fallback
        console.log('📄 Používam Legacy PDFKit generátor');
        const generator = new ProtocolPDFGenerator();
        const doc = await generator.generateHandoverProtocol(protocol);
        return new Promise((resolve, reject) => {
            const chunks = [];
            doc.on('data', chunks.push.bind(chunks));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            doc.end();
        });
    }
    catch (error) {
        console.error(`❌ Chyba v ${PDF_GENERATOR_TYPE} generátore:`, error);
        console.log('🔄 Fallback na Enhanced jsPDF generátor');
        // Fallback na Enhanced jsPDF
        const enhancedGenerator = new enhanced_pdf_generator_backend_1.EnhancedPDFGeneratorBackend();
        return await enhancedGenerator.generateHandoverProtocol(protocol);
    }
};
exports.generateHandoverPDF = generateHandoverPDF;
const generateReturnPDF = async (protocol) => {
    console.log(`🎯 Generujem return PDF s ${PDF_GENERATOR_TYPE.toUpperCase()} generátorom`);
    try {
        // Puppeteer generátor - najlepšia kvalita
        if (PDF_GENERATOR_TYPE === 'puppeteer') {
            console.log('🎭 Používam Puppeteer generátor');
            const puppeteerGenerator = new puppeteer_pdf_generator_v2_1.PuppeteerPDFGeneratorV2();
            return await puppeteerGenerator.generateReturnProtocol(protocol);
        }
        // Enhanced jsPDF generátor - dobrá kvalita s diakritikoy
        if (PDF_GENERATOR_TYPE === 'jspdf') {
            console.log('🎨 Používam Enhanced jsPDF generátor');
            const enhancedGenerator = new enhanced_pdf_generator_backend_1.EnhancedPDFGeneratorBackend();
            return await enhancedGenerator.generateReturnProtocol(protocol);
        }
        // Legacy PDFKit generátor - fallback
        console.log('📄 Používam Legacy PDFKit generátor');
        const generator = new ProtocolPDFGenerator();
        const doc = await generator.generateReturnProtocol(protocol);
        return new Promise((resolve, reject) => {
            const chunks = [];
            doc.on('data', chunks.push.bind(chunks));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            doc.end();
        });
    }
    catch (error) {
        console.error(`❌ Chyba v ${PDF_GENERATOR_TYPE} generátore:`, error);
        console.log('🔄 Fallback na Enhanced jsPDF generátor');
        // Fallback na Enhanced jsPDF
        const enhancedGenerator = new enhanced_pdf_generator_backend_1.EnhancedPDFGeneratorBackend();
        return await enhancedGenerator.generateReturnProtocol(protocol);
    }
};
exports.generateReturnPDF = generateReturnPDF;
//# sourceMappingURL=pdf-generator.js.map