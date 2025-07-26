import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import { Settlement } from '../types';

/**
 * PDF generátor pre vyúčtovania - používa PDF-lib pre vysokú kvalitu
 */
export class SettlementPDFGenerator {
  private doc!: PDFDocument;
  private currentY: number = 750;
  private pageWidth: number = 595; // A4 width
  private pageHeight: number = 842; // A4 height
  private margin: number = 50;
  private primaryColor = rgb(0.1, 0.46, 0.82); // Blue
  private secondaryColor = rgb(0.26, 0.26, 0.26); // Dark gray
  private lightGray = rgb(0.94, 0.94, 0.94);
  private successColor = rgb(0.3, 0.69, 0.31); // Green
  private errorColor = rgb(0.96, 0.26, 0.21); // Red
  private warningColor = rgb(1, 0.6, 0); // Orange
  private currentPage: any;
  private font: any;
  private boldFont: any;

  constructor() {
    // Inicializácia sa vykoná v generate metóde
  }

  /**
   * Generovanie vyúčtovania PDF
   */
  async generateSettlementPDF(settlement: Settlement): Promise<Buffer> {
    console.log('🎨 SETTLEMENT PDF GENERÁTOR SPUSTENÝ');
    console.log('📋 Settlement ID:', settlement.id);
    
    // Vytvorenie nového PDF dokumentu
    this.doc = await PDFDocument.create();
    this.currentPage = this.doc.addPage(PageSizes.A4);
    
    // Nahranie fontov
    this.font = await this.doc.embedFont(StandardFonts.Helvetica);
    this.boldFont = await this.doc.embedFont(StandardFonts.HelveticaBold);
    
    // Reset pozície (PDF súradnice začínajú zdola)
    this.currentY = this.pageHeight - 50;
    
    // 1. Záhlavie
    this.addHeader(settlement);
    
    // 2. Základné informácie o vyúčtovaní
    this.addBasicInfo(settlement);
    
    // 3. Finančný prehľad
    this.addFinancialSummary(settlement);
    
    // 4. Prehľad podľa spôsobov platby
    this.addPaymentMethodSummary(settlement);
    
    // 5. Zoznam prenájmov
    this.addRentalsList(settlement);
    
    // 6. Zoznam nákladov
    this.addExpensesList(settlement);
    
    // 7. Päta dokumentu
    this.addFooter();
    
    // Vygeneruj PDF buffer
    const pdfBytes = await this.doc.save();
    console.log(`✅ Settlement PDF vygenerované, veľkosť: ${(pdfBytes.length / 1024).toFixed(1)}KB`);
    
    return Buffer.from(pdfBytes);
  }

  /**
   * Záhlavie dokumentu
   */
  private addHeader(settlement: Settlement): void {
    // Pozadie záhlavia
    this.currentPage.drawRectangle({
      x: 0,
      y: this.currentY - 80,
      width: this.pageWidth,
      height: 80,
      color: this.primaryColor,
    });
    
    // Hlavný nadpis
    this.currentPage.drawText('VYÚČTOVANIE', {
      x: this.margin,
      y: this.currentY - 30,
      size: 24,
      font: this.boldFont,
      color: rgb(1, 1, 1),
    });
    
    // Firma
    this.currentPage.drawText(this.toAsciiText(settlement.company || 'N/A'), {
      x: this.margin,
      y: this.currentY - 55,
      size: 16,
      font: this.font,
      color: rgb(1, 1, 1),
    });
    
    // Dátum vygenervania
    const currentDate = new Date().toLocaleDateString('sk-SK');
    this.currentPage.drawText(`Vygenerované: ${currentDate}`, {
      x: this.pageWidth - this.margin - 120,
      y: this.currentY - 30,
      size: 10,
      font: this.font,
      color: rgb(1, 1, 1),
    });
    
    this.currentY -= 100;
  }

  /**
   * Základné informácie
   */
  private addBasicInfo(settlement: Settlement): void {
    this.addSectionTitle('Základné informácie');
    
    const info = [
      ['Číslo vyúčtovania:', settlement.id.slice(-8).toUpperCase()],
      ['Firma:', settlement.company || 'N/A'],
      ['Obdobie od:', this.formatDate(settlement.period.from)],
      ['Obdobie do:', this.formatDate(settlement.period.to)],
      ['Počet prenájmov:', (settlement.rentals?.length || 0).toString()],
      ['Počet nákladov:', (settlement.expenses?.length || 0).toString()],
    ];
    
    this.addInfoTable(info);
  }

  /**
   * Finančný súhrn
   */
  private addFinancialSummary(settlement: Settlement): void {
    this.addSectionTitle('Finančný prehľad');
    
    const boxHeight = 120;
    const boxWidth = (this.pageWidth - 2 * this.margin - 20) / 4;
    
    this.checkPageBreak(boxHeight + 40);
    
    // Celkové príjmy
    this.drawFinancialBox(
      this.margin,
      this.currentY - boxHeight,
      boxWidth,
      boxHeight,
      'CELKOVÉ PRÍJMY',
      `${settlement.totalIncome.toFixed(2)} €`,
      this.successColor
    );
    
    // Celkové náklady
    this.drawFinancialBox(
      this.margin + boxWidth + 5,
      this.currentY - boxHeight,
      boxWidth,
      boxHeight,
      'CELKOVÉ NÁKLADY',
      `${settlement.totalExpenses.toFixed(2)} €`,
      this.errorColor
    );
    
    // Provízie
    this.drawFinancialBox(
      this.margin + 2 * (boxWidth + 5),
      this.currentY - boxHeight,
      boxWidth,
      boxHeight,
      'PROVÍZIE',
      `${settlement.totalCommission.toFixed(2)} €`,
      this.warningColor
    );
    
    // Zisk/Strata
    const isProfit = settlement.profit >= 0;
    this.drawFinancialBox(
      this.margin + 3 * (boxWidth + 5),
      this.currentY - boxHeight,
      boxWidth,
      boxHeight,
      isProfit ? 'ZISK' : 'STRATA',
      `${settlement.profit.toFixed(2)} €`,
      isProfit ? this.successColor : this.errorColor
    );
    
    this.currentY -= boxHeight + 30;
  }

  /**
   * Kreslenie finančného boxu
   */
  private drawFinancialBox(x: number, y: number, width: number, height: number, title: string, value: string, color: any): void {
    // Pozadie
    this.currentPage.drawRectangle({
      x,
      y,
      width,
      height,
      color: rgb(1, 1, 1),
      borderColor: color,
      borderWidth: 2,
    });
    
    // Farebná lišta navrchu
    this.currentPage.drawRectangle({
      x,
      y: y + height - 8,
      width,
      height: 8,
      color,
    });
    
    // Nadpis
    this.currentPage.drawText(this.toAsciiText(title), {
      x: x + 10,
      y: y + height - 30,
      size: 10,
      font: this.boldFont,
      color: this.secondaryColor,
    });
    
    // Hodnota
    this.currentPage.drawText(value, {
      x: x + 10,
      y: y + height - 60,
      size: 16,
      font: this.boldFont,
      color,
    });
  }

  /**
   * Prehľad podľa spôsobov platby
   */
  private addPaymentMethodSummary(settlement: Settlement): void {
    if (!settlement.rentals || settlement.rentals.length === 0) {
      return;
    }

    this.addSectionTitle('Prehľad podľa spôsobov platby');
    
    // Zoznam spôsobov platby
    const paymentMethods = ['cash', 'bank_transfer', 'vrp', 'direct_to_owner'];
    const paymentMethodLabels = {
      cash: 'Hotovosť',
      bank_transfer: 'FA (Faktúra)',
      vrp: 'VRP',
      direct_to_owner: 'Majiteľ'
    };
    
    // Výpočty pre každý spôsob platby
    const stats = paymentMethods.map(method => {
      const rentals = settlement.rentals.filter(r => r.paymentMethod === method);
      const totalPrice = rentals.reduce((sum, r) => sum + r.totalPrice, 0);
      const commission = rentals.reduce((sum, r) => sum + r.commission, 0);
      const netAmount = totalPrice - commission;
      
      return [
        paymentMethodLabels[method as keyof typeof paymentMethodLabels],
        rentals.length.toString(),
        `${totalPrice.toFixed(2)} €`,
        `${commission.toFixed(2)} €`,
        `${netAmount.toFixed(2)} €`
      ];
    }).filter(row => parseInt(row[1]) > 0); // Iba spôsoby platby s prenájmami
    
    if (stats.length > 0) {
      // Hlavička tabuľky
      const headers = ['Spôsob platby', 'Počet', 'Celková cena', 'Provízie', 'Po províziách'];
      this.addTable(headers, stats, true);
    }
  }

  /**
   * Zoznam prenájmov
   */
  private addRentalsList(settlement: Settlement): void {
    if (!settlement.rentals || settlement.rentals.length === 0) {
      return;
    }

    this.addSectionTitle(`Zoznam prenájmov (${settlement.rentals.length})`);
    
    const headers = ['Vozidlo', 'Zákazník', 'Spôsob platby', 'Cena', 'Provízia'];
    const data = settlement.rentals.map(rental => [
      `${rental.vehicle?.brand || 'N/A'} ${rental.vehicle?.model || ''}`,
      rental.customerName || 'N/A',
      this.getPaymentMethodLabel(rental.paymentMethod),
      `${rental.totalPrice.toFixed(2)} €`,
      `${rental.commission.toFixed(2)} €`
    ]);
    
    this.addTable(headers, data);
  }

  /**
   * Zoznam nákladov
   */
  private addExpensesList(settlement: Settlement): void {
    if (!settlement.expenses || settlement.expenses.length === 0) {
      return;
    }

    this.addSectionTitle(`Zoznam nákladov (${settlement.expenses.length})`);
    
    const headers = ['Popis', 'Kategória', 'Dátum', 'Suma'];
    const data = settlement.expenses.map(expense => [
      expense.description || 'N/A',
      expense.category || 'N/A',
      this.formatDate(expense.date),
      `${expense.amount.toFixed(2)} €`
    ]);
    
    this.addTable(headers, data);
  }

  /**
   * Pridanie nadpisu sekcie
   */
  private addSectionTitle(title: string): void {
    this.checkPageBreak(40);
    
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - 25,
      width: this.pageWidth - 2 * this.margin,
      height: 25,
      color: this.lightGray,
    });
    
    this.currentPage.drawText(this.toAsciiText(title), {
      x: this.margin + 10,
      y: this.currentY - 18,
      size: 12,
      font: this.boldFont,
      color: this.primaryColor,
    });
    
    this.currentY -= 40;
  }

  /**
   * Pridanie informačnej tabuľky
   */
  private addInfoTable(data: string[][]): void {
    const boxHeight = Math.max(150, data.length * 20 + 20);
    this.checkPageBreak(boxHeight);
    
    // Pozadie
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - boxHeight,
      width: this.pageWidth - 2 * this.margin,
      height: boxHeight,
      color: rgb(1, 1, 1),
      borderColor: this.lightGray,
      borderWidth: 1,
    });
    
    // Data
    data.forEach((row, index) => {
      const yPos = this.currentY - 25 - (index * 20);
      
      // Label (tučne)
      this.currentPage.drawText(this.toAsciiText(row[0]), {
        x: this.margin + 15,
        y: yPos,
        size: 10,
        font: this.boldFont,
        color: this.secondaryColor,
      });
      
      // Hodnota
      this.currentPage.drawText(this.toAsciiText(row[1]), {
        x: this.margin + 180,
        y: yPos,
        size: 10,
        font: this.font,
        color: rgb(0, 0, 0),
      });
    });
    
    this.currentY -= boxHeight + 15;
  }

  /**
   * Pridanie tabuľky
   */
  private addTable(headers: string[], data: string[][], isPaymentMethodTable: boolean = false): void {
    const rowHeight = 20;
    const headerHeight = 25;
    const totalHeight = headerHeight + (data.length * rowHeight) + 10;
    
    this.checkPageBreak(totalHeight);
    
    const tableWidth = this.pageWidth - 2 * this.margin;
    const colWidth = tableWidth / headers.length;
    
    // Pozadie tabuľky
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - totalHeight,
      width: tableWidth,
      height: totalHeight,
      color: rgb(1, 1, 1),
      borderColor: this.lightGray,
      borderWidth: 1,
    });
    
    // Hlavička
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - headerHeight,
      width: tableWidth,
      height: headerHeight,
      color: this.primaryColor,
    });
    
    headers.forEach((header, index) => {
      this.currentPage.drawText(this.toAsciiText(header), {
        x: this.margin + (index * colWidth) + 5,
        y: this.currentY - 18,
        size: 10,
        font: this.boldFont,
        color: rgb(1, 1, 1),
      });
    });
    
    // Dáta
    data.forEach((row, rowIndex) => {
      const yPos = this.currentY - headerHeight - ((rowIndex + 1) * rowHeight) + 5;
      
      // Striedavé pozadie riadkov
      if (rowIndex % 2 === 1) {
        this.currentPage.drawRectangle({
          x: this.margin,
          y: yPos - 5,
          width: tableWidth,
          height: rowHeight,
          color: rgb(0.98, 0.98, 0.98),
        });
      }
      
      row.forEach((cell, cellIndex) => {
        let cellColor = rgb(0, 0, 0);
        
        // Farebné označenie pre payment method tabuľku
        if (isPaymentMethodTable && cellIndex === 0) {
          const methodColors = {
            'Hotovosť': this.successColor,
            'FA (Faktúra)': this.primaryColor,
            'VRP': this.warningColor,
            'Majiteľ': rgb(0.5, 0.5, 0.5)
          };
          cellColor = methodColors[cell as keyof typeof methodColors] || rgb(0, 0, 0);
        }
        
        this.currentPage.drawText(this.toAsciiText(cell), {
          x: this.margin + (cellIndex * colWidth) + 5,
          y: yPos,
          size: 9,
          font: this.font,
          color: cellColor,
        });
      });
    });
    
    this.currentY -= totalHeight + 15;
  }

  /**
   * Päta dokumentu
   */
  private addFooter(): void {
    // Pozícia pätky
    const footerY = 30;
    
    this.currentPage.drawText('Tento dokument bol automaticky vygenerovaný systémom BlackRent', {
      x: this.margin,
      y: footerY,
      size: 8,
      font: this.font,
      color: this.secondaryColor,
    });
    
    this.currentPage.drawText(`Strana 1`, {
      x: this.pageWidth - this.margin - 50,
      y: footerY,
      size: 8,
      font: this.font,
      color: this.secondaryColor,
    });
  }

  /**
   * Kontrola zalomenia stránky
   */
  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY - requiredSpace < 80) {
      this.currentPage = this.doc.addPage(PageSizes.A4);
      this.currentY = this.pageHeight - 50;
    }
  }

  /**
   * Konverzia na ASCII text (odstránenie diakritiky)
   */
  private toAsciiText(text: string): string {
    return text
      .replace(/[áäâà]/g, 'a')
      .replace(/[ÁÄÂÀ]/g, 'A')
      .replace(/[éëêè]/g, 'e')
      .replace(/[ÉËÊÈ]/g, 'E')
      .replace(/[íïîì]/g, 'i')
      .replace(/[ÍÏÎÌ]/g, 'I')
      .replace(/[óöôò]/g, 'o')
      .replace(/[ÓÖÔÒ]/g, 'O')
      .replace(/[úüûù]/g, 'u')
      .replace(/[ÚÜÛÙ]/g, 'U')
      .replace(/[ýÿ]/g, 'y')
      .replace(/[ÝŸ]/g, 'Y')
      .replace(/ň/g, 'n')
      .replace(/Ň/g, 'N')
      .replace(/š/g, 's')
      .replace(/Š/g, 'S')
      .replace(/č/g, 'c')
      .replace(/Č/g, 'C')
      .replace(/ť/g, 't')
      .replace(/Ť/g, 'T')
      .replace(/ž/g, 'z')
      .replace(/Ž/g, 'Z')
      .replace(/ľ/g, 'l')
      .replace(/Ľ/g, 'L')
      .replace(/ŕ/g, 'r')
      .replace(/Ŕ/g, 'R')
      .replace(/ô/g, 'o')
      .replace(/Ô/g, 'O')
      .replace(/ä/g, 'a')
      .replace(/Ä/g, 'A')
      .replace(/ř/g, 'r')
      .replace(/Ř/g, 'R')
      .replace(/ě/g, 'e')
      .replace(/Ě/g, 'E')
      .replace(/ů/g, 'u')
      .replace(/Ů/g, 'U')
      .replace(/ď/g, 'd')
      .replace(/Ď/g, 'D');
  }

  /**
   * Formatovanie dátumu
   */
  private formatDate(date: Date | string): string {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('sk-SK');
    } catch {
      return 'N/A';
    }
  }

  /**
   * Získanie názvu spôsobu platby
   */
  private getPaymentMethodLabel(method: string): string {
    const labels = {
      cash: 'Hotovosť',
      bank_transfer: 'FA (Faktúra)',
      vrp: 'VRP',
      direct_to_owner: 'Majiteľ'
    };
    return labels[method as keyof typeof labels] || method;
  }
} 