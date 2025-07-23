import PDFDocument from 'pdfkit';
import { HandoverProtocol, ReturnProtocol } from '../types';
import { EnhancedPDFGeneratorBackend } from './enhanced-pdf-generator-backend';
import { PuppeteerPDFGeneratorV2 } from './puppeteer-pdf-generator-v2';

// 🔄 PREPÍNAČ PDF GENERÁTORA:
// 'puppeteer' = Puppeteer Chrome PDF generátor (najlepší)
// 'enhanced' = enhanced jsPDF generator (fallback)

// 🎯 Puppeteer ako default - najlepšia kvalita
const PDF_GENERATOR_TYPE: 'puppeteer' | 'enhanced' = 
  (process.env.PDF_GENERATOR_TYPE as 'puppeteer' | 'enhanced') || 'puppeteer';

console.log(`🎯 PDF Generator inicializovaný: ${PDF_GENERATOR_TYPE.toUpperCase()}`);

// Puppeteer PDF generátor
const getPuppeteerGenerator = () => {
  try {
    console.log('✅ Puppeteer PDF generátor načítaný');
    return new PuppeteerPDFGeneratorV2();
  } catch (error) {
    console.error('❌ Chyba pri načítaní Puppeteer generátora:', error);
    throw error;
  }
};

// Enhanced PDF generátor (fallback)
const getEnhancedGenerator = () => {
  try {
    console.log('✅ Enhanced PDF generátor načítaný (fallback)');
    return new EnhancedPDFGeneratorBackend();
  } catch (error) {
    console.error('❌ Chyba pri načítaní Enhanced generátora:', error);
    throw new Error('PDF generátor nie je dostupný');
  }
};

/**
 * 🎯 HLAVNÁ FUNKCIA - Generovanie handover PDF
 * Automaticky vyberie najlepší dostupný generátor
 */
export const generateHandoverPDF = async (protocolData: HandoverProtocol): Promise<Buffer> => {
  console.log(`🎭 Generujem handover PDF pomocou ${PDF_GENERATOR_TYPE.toUpperCase()} generátora...`);
  console.log('📋 Protocol data preview:', {
    id: protocolData.id,
    location: protocolData.location,
    vehicleImages: protocolData.vehicleImages?.length || 0,
    damages: protocolData.damages?.length || 0
  });

  try {
    if (PDF_GENERATOR_TYPE === 'puppeteer') {
      // 🎭 PUPPETEER - najlepšia kvalita
      try {
        const generator = getPuppeteerGenerator();
        const pdfBuffer = await generator.generateHandoverProtocol(protocolData);
        console.log(`✅ Puppeteer PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
        return pdfBuffer;
      } catch (puppeteerError) {
        console.error('❌ Puppeteer zlyhal, fallback na Enhanced:', puppeteerError);
        // Fallback na Enhanced
        const enhancedGenerator = getEnhancedGenerator();
        const pdfBuffer = await enhancedGenerator.generateHandoverProtocol(protocolData);
        console.log(`✅ Fallback Enhanced PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
        return pdfBuffer;
      }
    } else {
      // Enhanced generátor
      const generator = getEnhancedGenerator();
      const pdfBuffer = await generator.generateHandoverProtocol(protocolData);
      console.log(`✅ Enhanced PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
      return pdfBuffer;
    }
  } catch (error) {
    console.error('❌ PDF generovanie zlyhalo:', error);
    throw new Error(`PDF generovanie zlyhalo: ${error instanceof Error ? error.message : 'Neznáma chyba'}`);
  }
};

/**
 * 🎯 HLAVNÁ FUNKCIA - Generovanie return PDF
 */
export const generateReturnPDF = async (protocolData: ReturnProtocol): Promise<Buffer> => {
  console.log(`🎭 Generujem return PDF pomocou ${PDF_GENERATOR_TYPE.toUpperCase()} generátora...`);
  console.log('📋 Protocol data preview:', {
    id: protocolData.id,
    location: protocolData.location,
    finalRefund: protocolData.finalRefund
  });

  try {
    if (PDF_GENERATOR_TYPE === 'puppeteer') {
      // 🎭 PUPPETEER - najlepšia kvalita
      try {
        const generator = getPuppeteerGenerator();
        const pdfBuffer = await generator.generateReturnProtocol(protocolData);
        console.log(`✅ Puppeteer return PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
        return pdfBuffer;
      } catch (puppeteerError) {
        console.error('❌ Puppeteer zlyhal, fallback na Enhanced:', puppeteerError);
        // Fallback na Enhanced
        const enhancedGenerator = getEnhancedGenerator();
        const pdfBuffer = await enhancedGenerator.generateReturnProtocol(protocolData);
        console.log(`✅ Fallback Enhanced return PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
        return pdfBuffer;
      }
    } else {
      // Enhanced generátor
      const generator = getEnhancedGenerator();
      const pdfBuffer = await generator.generateReturnProtocol(protocolData);
      console.log(`✅ Enhanced return PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
      return pdfBuffer;
    }
  } catch (error) {
    console.error('❌ Return PDF generovanie zlyhalo:', error);
    throw new Error(`Return PDF generovanie zlyhalo: ${error instanceof Error ? error.message : 'Neznáma chyba'}`);
  }
}; 