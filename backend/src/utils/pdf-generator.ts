import PDFDocument from 'pdfkit';
import { HandoverProtocol, ReturnProtocol } from '../types';
import { EnhancedPDFGeneratorBackend } from './enhanced-pdf-generator-backend';

// 🔄 PREPÍNAČ PDF GENERÁTORA:
// 'legacy' = starý pdfkit generator
// 'enhanced' = enhanced jsPDF generator (najlepší dostupný)

// 🎯 Enhanced ako default (269KB+ kvalitné PDFs)
const PDF_GENERATOR_TYPE: 'enhanced' | 'legacy' = 
  (process.env.PDF_GENERATOR_TYPE as 'enhanced' | 'legacy') || 'enhanced';

console.log(`🎯 PDF Generator inicializovaný: ${PDF_GENERATOR_TYPE.toUpperCase()}`);

// Enhanced PDF generátor
const getEnhancedGenerator = () => {
  try {
    console.log('✅ Enhanced PDF generátor načítaný');
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
    if (PDF_GENERATOR_TYPE === 'enhanced') {
      const generator = getEnhancedGenerator();
      const pdfBuffer = await generator.generateHandoverProtocol(protocolData);
      console.log(`✅ Enhanced PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
      return pdfBuffer;
    } else {
      // Legacy fallback - použije Enhanced ako fallback
      const generator = getEnhancedGenerator();
      const pdfBuffer = await generator.generateHandoverProtocol(protocolData);
      console.log(`✅ Fallback Enhanced PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);  
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
    if (PDF_GENERATOR_TYPE === 'enhanced') {
      const generator = getEnhancedGenerator();
      const pdfBuffer = await generator.generateReturnProtocol(protocolData);
      console.log(`✅ Enhanced return PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
      return pdfBuffer;
    } else {
      // Legacy fallback - použije Enhanced ako fallback
      const generator = getEnhancedGenerator();
      const pdfBuffer = await generator.generateReturnProtocol(protocolData);
      console.log(`✅ Fallback Enhanced return PDF vygenerované, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
      return pdfBuffer;
    }
  } catch (error) {
    console.error('❌ Return PDF generovanie zlyhalo:', error);
    throw new Error(`Return PDF generovanie zlyhalo: ${error instanceof Error ? error.message : 'Neznáma chyba'}`);
  }
}; 