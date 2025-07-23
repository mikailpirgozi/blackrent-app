import PDFDocument from 'pdfkit';
import { HandoverProtocol, ReturnProtocol } from '../types';
import { EnhancedPDFGeneratorBackend } from './enhanced-pdf-generator-backend';
import { PuppeteerPDFGeneratorV2 } from './puppeteer-pdf-generator-v2';
import { PDFLibGenerator } from './pdf-lib-generator';
import { PDFLibCustomFontGenerator } from './pdf-lib-custom-font-generator';

// 🔄 PREPÍNAČ PDF GENERÁTORA:
// 'custom-font' = PDF-lib s vlastným fontom (najlepšie pre vlastný font)
// 'pdf-lib' = PDF-lib generátor (nový, vysoká kvalita, žiadne system dependencies)
// 'puppeteer' = Puppeteer Chrome PDF generátor (najlepší ale Railway problémy)
// 'enhanced' = enhanced jsPDF generator (fallback)

// 🎯 Custom font ako najlepšia voľba ak je dostupný
const PDF_GENERATOR_TYPE: 'custom-font' | 'pdf-lib' | 'puppeteer' | 'enhanced' = 
  (process.env.PDF_GENERATOR_TYPE as 'custom-font' | 'pdf-lib' | 'puppeteer' | 'enhanced') || 'custom-font';

console.log(`🎯 PDF Generator inicializovaný: ${PDF_GENERATOR_TYPE.toUpperCase()}`);

// Custom font PDF-lib generátor (najlepší pre vlastný font)
const getCustomFontGenerator = (fontName: string = 'vas-font') => {
  try {
    console.log(`✅ Custom Font PDF generátor načítaný (${fontName})`);
    return new PDFLibCustomFontGenerator(fontName);
  } catch (error) {
    console.error('❌ Chyba pri načítaní Custom Font generátora:', error);
    throw error;
  }
};

// PDF-lib generátor (nový default)
const getPDFLibGenerator = () => {
  try {
    console.log('✅ PDF-lib PDF generátor načítaný');
    return new PDFLibGenerator();
  } catch (error) {
    console.error('❌ Chyba pri načítaní PDF-lib generátora:', error);
    throw error;
  }
};

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
 * Automaticky vyberie najlepší dostupný generátor s fallback stratégiou
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
    if (PDF_GENERATOR_TYPE === 'custom-font') {
      // 🎨 CUSTOM FONT - najlepšie pre vlastný font s plnou diakritiku
      try {
        const fontName = process.env.CUSTOM_FONT_NAME || 'aeonik';
        const generator = getCustomFontGenerator(fontName);
        const pdfBuffer = await generator.generateHandoverProtocol(protocolData);
        console.log(`✅ Custom Font PDF vygenerované (${fontName}), veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
        return pdfBuffer;
      } catch (customFontError) {
        console.error('❌ Custom Font zlyhal, fallback na PDF-lib:', customFontError);
        // Fallback na PDF-lib
        try {
          const generator = getPDFLibGenerator();
          const pdfBuffer = await generator.generateHandoverProtocol(protocolData);
          console.log(`✅ Fallback PDF-lib PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
          return pdfBuffer;
        } catch (pdfLibError) {
          console.error('❌ PDF-lib tiež zlyhal, fallback na Enhanced:', pdfLibError);
          const enhancedGenerator = getEnhancedGenerator();
          const pdfBuffer = await enhancedGenerator.generateHandoverProtocol(protocolData);
          console.log(`✅ Fallback Enhanced PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
          return pdfBuffer;
        }
      }
    } else if (PDF_GENERATOR_TYPE === 'pdf-lib') {
      // 🎨 PDF-LIB - vysoká kvalita bez dependencies
      try {
        const generator = getPDFLibGenerator();
        const pdfBuffer = await generator.generateHandoverProtocol(protocolData);
        console.log(`✅ PDF-lib PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
        return pdfBuffer;
      } catch (pdfLibError) {
        console.error('❌ PDF-lib zlyhal, fallback na Enhanced:', pdfLibError);
        // Fallback na Enhanced
        const enhancedGenerator = getEnhancedGenerator();
        const pdfBuffer = await enhancedGenerator.generateHandoverProtocol(protocolData);
        console.log(`✅ Fallback Enhanced PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
        return pdfBuffer;
      }
    } else if (PDF_GENERATOR_TYPE === 'puppeteer') {
      // 🎭 PUPPETEER - najlepšia kvalita ale Railway problémy
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
    if (PDF_GENERATOR_TYPE === 'custom-font') {
      // 🎨 CUSTOM FONT - najlepšie pre vlastný font s plnou diakritiku
      try {
        const fontName = process.env.CUSTOM_FONT_NAME || 'aeonik';
        const generator = getCustomFontGenerator(fontName);
        const pdfBuffer = await generator.generateReturnProtocol(protocolData);
        console.log(`✅ Custom Font return PDF vygenerované (${fontName}), veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
        return pdfBuffer;
      } catch (customFontError) {
        console.error('❌ Custom Font zlyhal, fallback na PDF-lib:', customFontError);
        // Fallback na PDF-lib
        try {
          const generator = getPDFLibGenerator();
          const pdfBuffer = await generator.generateReturnProtocol(protocolData);
          console.log(`✅ Fallback PDF-lib return PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
          return pdfBuffer;
        } catch (pdfLibError) {
          console.error('❌ PDF-lib tiež zlyhal, fallback na Enhanced:', pdfLibError);
          const enhancedGenerator = getEnhancedGenerator();
          const pdfBuffer = await enhancedGenerator.generateReturnProtocol(protocolData);  
          console.log(`✅ Fallback Enhanced return PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
          return pdfBuffer;
        }
      }
    } else if (PDF_GENERATOR_TYPE === 'pdf-lib') {
      // 🎨 PDF-LIB - vysoká kvalita bez dependencies
      try {
        const generator = getPDFLibGenerator();
        const pdfBuffer = await generator.generateReturnProtocol(protocolData);
        console.log(`✅ PDF-lib return PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
        return pdfBuffer;
      } catch (pdfLibError) {
        console.error('❌ PDF-lib zlyhal, fallback na Enhanced:', pdfLibError);
        // Fallback na Enhanced
        const enhancedGenerator = getEnhancedGenerator();
        const pdfBuffer = await enhancedGenerator.generateReturnProtocol(protocolData);
        console.log(`✅ Fallback Enhanced return PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
        return pdfBuffer;
      }
    } else if (PDF_GENERATOR_TYPE === 'puppeteer') {
      // 🎭 PUPPETEER - najlepšia kvalita ale Railway problémy
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