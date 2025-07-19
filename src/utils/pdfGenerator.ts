import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ReturnProtocol } from '../types';

export interface PDFGeneratorOptions {
  filename?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  quality?: number;
}

export class PDFGenerator {
  private static formatCurrency = (amount: number, currency = 'EUR'): string => {
    return new Intl.NumberFormat('sk-SK', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  private static formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('sk-SK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  private static createHTML(protocol: ReturnProtocol): string {
    const {
      id,
      location,
      createdAt,
      completedAt,
      rentalData,
      vehicleCondition,
      handoverProtocol,
      kilometersUsed,
      kilometerOverage,
      kilometerFee,
      fuelUsed,
      fuelFee,
      totalExtraFees,
      depositRefund,
      additionalCharges,
      finalRefund,
      damages,
      newDamages,
      notes,
    } = protocol;

    const vehicle = rentalData.vehicle;
    const customer = rentalData.customer;
    const startingOdometer = handoverProtocol.vehicleCondition.odometer;
    const startingFuel = handoverProtocol.vehicleCondition.fuelLevel;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white; color: black;">
        <!-- Header -->
        <div style="text-align: center; border-bottom: 3px solid #1976d2; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #1976d2; margin: 0; font-size: 32px;">BLACKRENT</h1>
          <h2 style="color: #666; margin: 10px 0 0 0; font-size: 24px;">Odovzdávací protokol</h2>
          <div style="background: #f5f5f5; padding: 10px; margin-top: 15px; border-radius: 8px;">
            <strong>Protokol č.: ${id.slice(-8)}</strong><br>
            <span style="color: #666;">Vytvorené: ${this.formatDate(createdAt)}</span>
            ${completedAt ? `<br><span style="color: #666;">Dokončené: ${this.formatDate(completedAt)}</span>` : ''}
          </div>
        </div>

        <!-- Rental Info -->
        <div style="margin-bottom: 30px;">
          <h3 style="background: #1976d2; color: white; padding: 12px; margin: 0 0 15px 0; border-radius: 6px;">
            📋 Informácie o prenájme
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f9f9f9; padding: 20px; border-radius: 8px;">
            <div>
              <strong>Číslo objednávky:</strong><br>
              <span style="color: #1976d2; font-weight: bold;">${rentalData.orderNumber}</span><br><br>
              
              <strong>Zákazník:</strong><br>
              ${customer.name}<br>
              ${customer.email || ''}<br>
              ${customer.phone || ''}<br><br>
              
              <strong>Vozidlo:</strong><br>
              ${vehicle.brand} ${vehicle.model}<br>
              <span style="color: #666;">ŠPZ: ${vehicle.licensePlate}</span>
            </div>
            <div>
              <strong>Prenájom:</strong><br>
              ${this.formatDate(rentalData.startDate)} -<br>
              ${this.formatDate(rentalData.endDate)}<br><br>
              
              <strong>Cena prenájmu:</strong><br>
              <span style="color: #2e7d32; font-weight: bold; font-size: 18px;">
                ${this.formatCurrency(rentalData.totalPrice)}
              </span><br><br>
              
              <strong>Miesto vrátenia:</strong><br>
              📍 ${location}
            </div>
          </div>
        </div>

        <!-- Vehicle Condition Comparison -->
        <div style="margin-bottom: 30px;">
          <h3 style="background: #1976d2; color: white; padding: 12px; margin: 0 0 15px 0; border-radius: 6px;">
            🚗 Porovnanie stavu vozidla
          </h3>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background: #e3f2fd;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Parameter</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Pri preberaní</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Pri vrátení</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Rozdiel</th>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #ddd;"><strong>Tachometer (km)</strong></td>
                <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${startingOdometer.toLocaleString()}</td>
                <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${vehicleCondition.odometer.toLocaleString()}</td>
                <td style="padding: 12px; text-align: center; border: 1px solid #ddd; font-weight: bold; color: ${kilometersUsed > 0 ? '#f57c00' : '#2e7d32'};">
                  +${kilometersUsed.toLocaleString()} km
                </td>
              </tr>
              <tr style="background: #f5f5f5;">
                <td style="padding: 12px; border: 1px solid #ddd;"><strong>Palivo (%)</strong></td>
                <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${startingFuel}%</td>
                <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${vehicleCondition.fuelLevel}%</td>
                <td style="padding: 12px; text-align: center; border: 1px solid #ddd; font-weight: bold; color: ${fuelUsed > 0 ? '#f57c00' : '#2e7d32'};">
                  -${fuelUsed}%
                </td>
              </tr>
            </table>
            
            <div style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <strong>Stav exteriéru:</strong> ${vehicleCondition.exteriorCondition}<br>
                <strong>Stav interiéru:</strong> ${vehicleCondition.interiorCondition}
              </div>
              ${vehicleCondition.notes ? `
                <div>
                  <strong>Poznámky:</strong><br>
                  <span style="font-style: italic;">${vehicleCondition.notes}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Fee Calculations -->
        <div style="margin-bottom: 30px;">
          <h3 style="background: #1976d2; color: white; padding: 12px; margin: 0 0 15px 0; border-radius: 6px;">
            💰 Prepočet poplatkov
          </h3>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
              <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #ddd;">
                <div style="font-size: 24px; font-weight: bold; color: #f57c00;">${kilometersUsed}</div>
                <div style="color: #666; font-size: 14px;">Najazdené km</div>
              </div>
              <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #ddd;">
                <div style="font-size: 24px; font-weight: bold; color: ${kilometerOverage > 0 ? '#d32f2f' : '#2e7d32'};">${kilometerOverage}</div>
                <div style="color: #666; font-size: 14px;">Prekročenie km</div>
              </div>
              <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #ddd;">
                <div style="font-size: 24px; font-weight: bold; color: ${fuelUsed > 0 ? '#f57c00' : '#2e7d32'};">${fuelUsed}%</div>
                <div style="color: #666; font-size: 14px;">Spotrebované palivo</div>
              </div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background: #e3f2fd;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Poplatok</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Suma</th>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #ddd;">Poplatok za km (${kilometerOverage} × ${rentalData.extraKilometerRate || 0.50}€)</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #ddd; color: ${kilometerFee > 0 ? '#d32f2f' : '#666'};">
                  ${this.formatCurrency(kilometerFee)}
                </td>
              </tr>
              <tr style="background: #f5f5f5;">
                <td style="padding: 12px; border: 1px solid #ddd;">Poplatok za palivo (${fuelUsed}% × 0.02€)</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #ddd; color: ${fuelFee > 0 ? '#d32f2f' : '#666'};">
                  ${this.formatCurrency(fuelFee)}
                </td>
              </tr>
              <tr style="background: #fff3e0; font-weight: bold;">
                <td style="padding: 15px; border: 1px solid #ddd;">CELKOVÉ POPLATKY</td>
                <td style="padding: 15px; text-align: right; border: 1px solid #ddd; color: ${totalExtraFees > 0 ? '#d32f2f' : '#2e7d32'}; font-size: 18px;">
                  ${this.formatCurrency(totalExtraFees)}
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Refund Calculation -->
        <div style="margin-bottom: 30px;">
          <h3 style="background: #2e7d32; color: white; padding: 12px; margin: 0 0 15px 0; border-radius: 6px;">
            💳 Vyúčtovanie depozitu
          </h3>
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; border: 2px solid #2e7d32;">
            <div style="display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center;">
              <div>
                <div style="font-size: 16px; margin-bottom: 10px;">
                  <strong>Depozit:</strong> ${this.formatCurrency(rentalData.deposit || 0)}<br>
                  <strong>Poplatky:</strong> ${this.formatCurrency(totalExtraFees)}<br>
                  ${additionalCharges > 0 ? `<span style="color: #d32f2f;"><strong>Doplatok:</strong> ${this.formatCurrency(additionalCharges)}</span>` : ''}
                </div>
              </div>
              <div style="text-align: right;">
                <div style="background: white; padding: 20px; border-radius: 10px; border: 2px solid #2e7d32;">
                  <div style="color: #666; font-size: 14px;">FINÁLNY REFUND</div>
                  <div style="color: #2e7d32; font-size: 32px; font-weight: bold;">
                    ${this.formatCurrency(finalRefund)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Damages Section -->
        ${damages.length > 0 || newDamages.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h3 style="background: #d32f2f; color: white; padding: 12px; margin: 0 0 15px 0; border-radius: 6px;">
              ⚠️ Poškodenia vozidla
            </h3>
            <div style="background: #ffebee; padding: 20px; border-radius: 8px; border: 1px solid #d32f2f;">
              ${damages.length > 0 ? `
                <div style="margin-bottom: 20px;">
                  <h4 style="color: #d32f2f; margin: 0 0 10px 0;">Existujúce poškodenia (z preberacieho protokolu):</h4>
                  ${damages.map(damage => `
                    <div style="background: white; padding: 15px; margin-bottom: 10px; border-radius: 6px; border-left: 4px solid #ff9800;">
                      <strong>${damage.location}:</strong> ${damage.description}<br>
                      <small style="color: #666;">Závažnosť: ${damage.severity === 'low' ? 'Nízka' : damage.severity === 'medium' ? 'Stredná' : 'Vysoká'}</small>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              ${newDamages.length > 0 ? `
                <div>
                  <h4 style="color: #d32f2f; margin: 0 0 10px 0;">Nové poškodenia (pri vrátení):</h4>
                  ${newDamages.map(damage => `
                    <div style="background: white; padding: 15px; margin-bottom: 10px; border-radius: 6px; border-left: 4px solid #d32f2f;">
                      <strong>${damage.location}:</strong> ${damage.description}<br>
                      <small style="color: #666;">Závažnosť: ${damage.severity === 'low' ? 'Nízka' : damage.severity === 'medium' ? 'Stredná' : 'Vysoká'}</small>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #1976d2; text-align: center; color: #666;">
          <p style="margin: 0; font-size: 14px;">
            Protokol vygenerovaný automaticky systémom BlackRent<br>
            Dátum generovania: ${this.formatDate(new Date())}
          </p>
          ${notes ? `
            <div style="margin-top: 20px; background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <strong>Dodatočné poznámky:</strong><br>
              <span style="font-style: italic;">${notes}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  public static async generateReturnProtocolPDF(
    protocol: ReturnProtocol,
    options: PDFGeneratorOptions = {}
  ): Promise<void> {
    try {
      const {
        filename = `protokol_${protocol.id.slice(-8)}_${new Date().toISOString().split('T')[0]}.pdf`,
        format = 'a4',
        orientation = 'portrait',
        quality = 0.98
      } = options;

      console.log('🔄 Generating PDF for protocol:', protocol.id);

      // Create temporary HTML container
      const htmlContainer = document.createElement('div');
      htmlContainer.innerHTML = this.createHTML(protocol);
      htmlContainer.style.position = 'absolute';
      htmlContainer.style.left = '-9999px';
      htmlContainer.style.top = '0';
      document.body.appendChild(htmlContainer);

      // Generate canvas from HTML
      const canvas = await html2canvas(htmlContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Remove temporary container
      document.body.removeChild(htmlContainer);

      // Create PDF
      const imgData = canvas.toDataURL('image/jpeg', quality);
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: format
      });

      // Calculate dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Save PDF
      pdf.save(filename);

      console.log('✅ PDF generated successfully:', filename);

    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      throw new Error('Chyba pri generovaní PDF: ' + (error as Error).message);
    }
  }
}

// Convenience function for direct use
export const generateProtocolPDF = (protocol: ReturnProtocol, options?: PDFGeneratorOptions) => {
  return PDFGenerator.generateReturnProtocolPDF(protocol, options);
}; 