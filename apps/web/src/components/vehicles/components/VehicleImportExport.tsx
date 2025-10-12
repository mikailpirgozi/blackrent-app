import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import React from 'react';

import { apiService } from '../../../services/api';
import { Button } from '@/components/ui/button';
import { logger } from '@/utils/smartLogger';
import type { Vehicle } from '@/types';

interface VehicleImportExportProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  isMobile: boolean;
}

const VehicleImportExport: React.FC<VehicleImportExportProps> = ({
  loading,
  setLoading,
  isMobile,
}) => {
  // CSV Export funkcionalita
  const handleExportCSV = async () => {
    try {
      const blob = await apiService.exportVehiclesCSV();
      const filename = `vozidla-${new Date().toISOString().split('T')[0]}.csv`;
      saveAs(blob, filename);

      alert('CSV export úspešný');
    } catch (error) {
      console.error('CSV export error:', error);
      alert('Chyba pri CSV exporte');
    }
  };

  // CSV Import funkcionalita
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Zobraz loading state
    setLoading(true);

    Papa.parse(file, {
      complete: async (results: { data: unknown[] }) => {
        try {
          // Zobraz počet riadkov na spracovanie
          const totalRows = results.data.length - 1; // -1 pre header
          logger.debug(`📊 Spracovávam ${totalRows} vozidiel z CSV...`);

          // Zobraz progress dialog
          const progressDialog = window.confirm(
            `📥 Začínam import ${totalRows} vozidiel z CSV súboru...\n\n` +
              'Tento proces môže trvať niekoľko sekúnd.\n' +
              'Chcete pokračovať?'
          );

          if (!progressDialog) {
            setLoading(false);
            return;
          }

          // 📦 BATCH PROCESSING: Priprav vozidlá pre batch import
          const batchVehicles = [];

          // Spracuj CSV dáta a vytvor vozidlá pre batch import
          const header = results.data[0];
          const dataRows = results.data.slice(1);

          for (const row of dataRows) {
            const fieldMap: { [key: string]: string } = {};
            (header as string[]).forEach(
              (headerName: string, index: number) => {
                const value = (row as string[])[index];
                fieldMap[headerName] = typeof value === 'string' ? value : '';
              }
            );

            // Mapovanie základných polí
            const brand = fieldMap['brand'] || fieldMap['Značka'];
            const model = fieldMap['model'] || fieldMap['Model'];
            const licensePlate = fieldMap['licensePlate'] || fieldMap['ŠPZ'];
            const company = fieldMap['company'] || fieldMap['Firma'];
            const year = fieldMap['year'] || fieldMap['Rok'];
            const status = fieldMap['status'] || fieldMap['Status'];
            const stk = fieldMap['stk'] || fieldMap['STK'];

            if (!brand || !model || !company) {
              console.warn('⚠️ Preskakujem riadok - chýbajú povinné polia:', {
                brand,
                model,
                company,
              });
              continue;
            }

            // Parsovanie cenotvorby
            const pricing: Array<{
              id: string;
              minDays: number;
              maxDays: number;
              pricePerDay: number;
            }> = [];

            const priceColumns = [
              { columns: ['cena_0_1', 'Cena_0-1_dni'], minDays: 0, maxDays: 1 },
              { columns: ['cena_2_3', 'Cena_2-3_dni'], minDays: 2, maxDays: 3 },
              { columns: ['cena_4_7', 'Cena_4-7_dni'], minDays: 4, maxDays: 7 },
              {
                columns: ['cena_8_14', 'Cena_8-14_dni'],
                minDays: 8,
                maxDays: 14,
              },
              {
                columns: ['cena_15_22', 'Cena_15-22_dni'],
                minDays: 15,
                maxDays: 22,
              },
              {
                columns: ['cena_23_30', 'Cena_23-30_dni'],
                minDays: 23,
                maxDays: 30,
              },
              {
                columns: ['cena_31_9999', 'Cena_31+_dni'],
                minDays: 31,
                maxDays: 365,
              },
            ];

            priceColumns.forEach((priceCol, index) => {
              let priceValue = '';
              for (const columnName of priceCol.columns) {
                if (fieldMap[columnName]) {
                  priceValue = fieldMap[columnName];
                  break;
                }
              }

              if (priceValue && !isNaN(parseFloat(priceValue))) {
                pricing.push({
                  id: (index + 1).toString(),
                  minDays: priceCol.minDays,
                  maxDays: priceCol.maxDays,
                  pricePerDay: parseFloat(priceValue),
                });
              }
            });

            // Parsovanie provízie
            const commissionType = (fieldMap['commissionType'] ||
              fieldMap['Provizia_typ'] ||
              'percentage') as 'percentage' | 'fixed';

            const commissionValue =
              fieldMap['commissionValue'] || fieldMap['Provizia_hodnota']
                ? parseFloat(
                    (fieldMap['commissionValue'] ||
                      fieldMap['Provizia_hodnota']) ??
                      '20'
                  )
                : 20;

            // Vytvor vehicle data
            const vehicleData = {
              id: '', // Bude vygenerované na backend
              brand: brand.trim(),
              model: model.trim(),
              licensePlate: licensePlate?.trim() || '',
              company: company.trim(),
              year:
                year && year.trim() && !isNaN(parseInt(year))
                  ? parseInt(year)
                  : 2024,
              status: (status?.trim() || 'available') as
                | 'available'
                | 'rented'
                | 'maintenance'
                | 'temporarily_removed'
                | 'removed',
              stk: stk && stk.trim() ? new Date(stk.trim()) : undefined,
              pricing: pricing,
              commission: {
                type: commissionType,
                value: commissionValue,
              },
            };

            batchVehicles.push(vehicleData);
          }

          logger.debug(
            `📦 Pripravených ${batchVehicles.length} vozidiel pre batch import`
          );

          // Použij batch import namiesto CSV importu
          const result = await apiService.batchImportVehicles(
            batchVehicles as unknown as Vehicle[]
          );

          logger.debug('📥 CSV Import result:', result);

          // Result už obsahuje priamo dáta, nie je wrapped v success/data
          const {
            success: created,
            failed: errorsCount,
            total,
          } = result as { success: number; failed: number; total: number };

          const updated = 0; // Batch import len vytvára nové
          const processed = created + errorsCount;
          const successRate =
            total > 0 ? Math.round((created / total) * 100) : 0;

          if ((created as number) > 0 || (updated as number) > 0) {
            alert(
              `🚀 BATCH IMPORT ÚSPEŠNÝ!\n\n📊 Výsledky:\n• Vytvorených: ${created}\n• Aktualizovaných: ${updated}\n• Spracovaných: ${processed}/${total}\n• Chýb: ${errorsCount}\n• Úspešnosť: ${successRate}\n\nStránka sa obnoví za 3 sekundy...`
            );
            setTimeout(() => window.location.reload(), 3000);
          } else if ((errorsCount as number) > 0) {
            alert(
              `⚠️ Import dokončený, ale žiadne vozidlá neboli pridané.\n\n📊 Výsledky:\n• Vytvorených: ${created}\n• Aktualizovaných: ${updated}\n• Chýb: ${errorsCount}\n• Úspešnosť: ${successRate}\n\nSkontrolujte formát CSV súboru.`
            );
          } else {
            alert(
              `⚠️ Import dokončený, ale žiadne vozidlá neboli pridané.\nSkontrolujte formát CSV súboru.`
            );
          }
        } catch (error) {
          console.error('❌ CSV import error:', error);
          // ✅ ZLEPŠENÉ ERROR HANDLING - menej dramatické
          alert(
            `⚠️ Import dokončený s upozornením: ${error instanceof Error ? error.message : 'Sieťová chyba'}\n\nSkontrolujte výsledok po obnovení stránky.`
          );
          // Aj tak skús refresh - možno sa import dokončil
          setTimeout(() => window.location.reload(), 2000);
        } finally {
          setLoading(false);
        }
      },
      header: false,
      skipEmptyLines: true,
      error: (error: Error) => {
        console.error('❌ Papa Parse error:', error);
        alert(`❌ Chyba pri čítaní CSV súboru: ${error.message}`);
        setLoading(false);
      },
    });

    // Reset input
    event.target.value = '';
  };

  // Render len na desktope
  if (isMobile) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleExportCSV}
        className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:border-blue-700"
      >
        📊 Export CSV
      </Button>

      <Button
        variant="outline"
        disabled={loading}
        className="text-green-600 border-green-600 hover:bg-green-50 hover:border-green-700"
        asChild
      >
        <label>
          📥 Import CSV
          <input
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />
        </label>
      </Button>
    </div>
  );
};

export default VehicleImportExport;
