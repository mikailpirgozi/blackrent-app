"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReturnPDF = exports.generateHandoverPDF = void 0;
const enhanced_pdf_generator_backend_1 = require("./enhanced-pdf-generator-backend");
// 🔄 PREPÍNAČ PDF GENERÁTORA:
// 'legacy' = starý pdfkit generator
// 'enhanced' = enhanced jsPDF generator (najlepší dostupný)
// 🎯 Enhanced ako default (269KB+ kvalitné PDFs)
const PDF_GENERATOR_TYPE = process.env.PDF_GENERATOR_TYPE || 'enhanced';
console.log(`🎯 PDF Generator inicializovaný: ${PDF_GENERATOR_TYPE.toUpperCase()}`);
// Enhanced PDF generátor
const getEnhancedGenerator = () => {
    try {
        console.log('✅ Enhanced PDF generátor načítaný');
        return new enhanced_pdf_generator_backend_1.EnhancedPDFGeneratorBackend();
    }
    catch (error) {
        console.error('❌ Chyba pri načítaní Enhanced generátora:', error);
        throw new Error('PDF generátor nie je dostupný');
    }
};
/**
 * 🎯 HLAVNÁ FUNKCIA - Generovanie handover PDF
 * Automaticky vyberie najlepší dostupný generátor
 */
const generateHandoverPDF = async (protocolData) => {
    console.log(`🎭 Generujem handover PDF pomocou ${PDF_GENERATOR_TYPE.toUpperCase()} generátora...`);
    console.log('📋 Protocol data preview:', {
        id: protocolData.id,
        location: protocolData.location,
        vehicleImages: protocolData.vehicleImages?.length || 0,
        damages: protocolData.damages?.length || 0
    });
    try {
        if (PDF_GENERATOR_TYPE === 'enhanced') {
            const generator = getEnhancedGenerator();
            const pdfBuffer = await generator.generateHandoverProtocol(protocolData);
            console.log(`✅ Enhanced PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
            return pdfBuffer;
        }
        else {
            // Legacy fallback - použije Enhanced ako fallback
            const generator = getEnhancedGenerator();
            const pdfBuffer = await generator.generateHandoverProtocol(protocolData);
            console.log(`✅ Fallback Enhanced PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
            return pdfBuffer;
        }
    }
    catch (error) {
        console.error('❌ PDF generovanie zlyhalo:', error);
        throw new Error(`PDF generovanie zlyhalo: ${error instanceof Error ? error.message : 'Neznáma chyba'}`);
    }
};
exports.generateHandoverPDF = generateHandoverPDF;
/**
 * 🎯 HLAVNÁ FUNKCIA - Generovanie return PDF
 */
const generateReturnPDF = async (protocolData) => {
    console.log(`🎭 Generujem return PDF pomocou ${PDF_GENERATOR_TYPE.toUpperCase()} generátora...`);
    console.log('📋 Protocol data preview:', {
        id: protocolData.id,
        location: protocolData.location,
        finalRefund: protocolData.finalRefund
    });
    try {
        if (PDF_GENERATOR_TYPE === 'enhanced') {
            const generator = getEnhancedGenerator();
            const pdfBuffer = await generator.generateReturnProtocol(protocolData);
            console.log(`✅ Enhanced return PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
            return pdfBuffer;
        }
        else {
            // Legacy fallback - použije Enhanced ako fallback
            const generator = getEnhancedGenerator();
            const pdfBuffer = await generator.generateReturnProtocol(protocolData);
            console.log(`✅ Fallback Enhanced return PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
            return pdfBuffer;
        }
    }
    catch (error) {
        console.error('❌ Return PDF generovanie zlyhalo:', error);
        throw new Error(`Return PDF generovanie zlyhalo: ${error instanceof Error ? error.message : 'Neznáma chyba'}`);
    }
};
exports.generateReturnPDF = generateReturnPDF;
//# sourceMappingURL=pdf-generator.js.map