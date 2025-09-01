"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const imap_1 = __importDefault(require("imap"));
const mailparser_1 = require("mailparser");
const postgres_database_1 = require("../models/postgres-database");
class ImapEmailService {
    constructor() {
        this.imap = null;
        this.isConnected = false;
        this.processingEmails = false;
        this.isEnabled = false;
        // Kontrola či je IMAP povolené
        this.isEnabled = process.env.IMAP_ENABLED !== 'false' && !!process.env.IMAP_PASSWORD;
        if (!this.isEnabled) {
            console.log('📧 IMAP: Služba je vypnutá (IMAP_ENABLED=false alebo chýba IMAP_PASSWORD)');
            return;
        }
        this.imap = new imap_1.default({
            user: process.env.IMAP_USER || 'info@blackrent.sk',
            password: process.env.IMAP_PASSWORD || '',
            host: process.env.IMAP_HOST || 'imap.m1.websupport.sk',
            port: parseInt(process.env.IMAP_PORT || '993'),
            tls: true,
            tlsOptions: {
                rejectUnauthorized: false,
                servername: 'imap.m1.websupport.sk'
            },
            keepalive: true,
            connTimeout: 60000,
            authTimeout: 30000,
            autotls: 'always',
            // Plain text authentication is handled by default
        });
        this.setupEventListeners();
    }
    setupEventListeners() {
        if (!this.imap)
            return;
        this.imap.once('ready', () => {
            console.log('📧 IMAP: Pripojenie úspešné');
            this.isConnected = true;
        });
        this.imap.once('error', (err) => {
            console.error('❌ IMAP Error:', err);
            this.isConnected = false;
        });
        this.imap.once('end', () => {
            console.log('📧 IMAP: Pripojenie ukončené');
            this.isConnected = false;
        });
    }
    async connect() {
        if (!this.isEnabled || !this.imap) {
            throw new Error('IMAP služba je vypnutá');
        }
        return new Promise((resolve, reject) => {
            if (this.isConnected) {
                resolve();
                return;
            }
            this.imap.once('ready', () => resolve());
            this.imap.once('error', reject);
            console.log('📧 IMAP: Pripájam sa na server...');
            this.imap.connect();
        });
    }
    async disconnect() {
        if (this.isConnected && this.imap) {
            this.imap.end();
        }
    }
    async checkForNewEmails() {
        if (!this.isEnabled) {
            console.log('📧 IMAP: Služba je vypnutá, preskakujem kontrolu emailov');
            return;
        }
        if (this.processingEmails) {
            console.log('⏳ IMAP: Už spracúvam emaily, preskakujem...');
            return;
        }
        try {
            this.processingEmails = true;
            await this.connect();
            console.log('📬 IMAP: Kontrolujem nové emaily...');
            await this.processInbox();
        }
        catch (error) {
            console.error('❌ IMAP: Chyba pri kontrole emailov:', error);
        }
        finally {
            this.processingEmails = false;
        }
    }
    async processInbox() {
        if (!this.imap) {
            throw new Error('IMAP nie je inicializovaný');
        }
        return new Promise((resolve, reject) => {
            this.imap.openBox('INBOX', false, (err, box) => {
                if (err) {
                    reject(err);
                    return;
                }
                // 🔍 HĽADANIE LEN OBJEDNÁVOK: Filtruj len emaily s predmetom "Objednávka od zákaznika"
                console.log('🔥 NOVÝ KÓD: Hľadám len OBJEDNÁVKY (predmet: "Objednávka od zákaznika")');
                // Najprv skús UNSEEN emaily s filtrom na objednávky
                this.imap.search(['UNSEEN', ['SUBJECT', 'Objednávka od zákaznika']], (err, results) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (results && results.length > 0) {
                        console.log(`📧 IMAP: Našiel som ${results.length} nových OBJEDNÁVOK (UNSEEN)`);
                        this.processFetchedEmails(results, resolve, reject);
                        return;
                    }
                    console.log('📭 IMAP: Žiadne nové objednávky (UNSEEN), skúšam objednávky z dnešného dňa...');
                    // Ak nie sú UNSEEN objednávky, skús objednávky z dnešného dňa
                    const today = new Date();
                    const todayStr = today.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    }); // napr. "Aug 23, 2025"
                    this.imap.search([['SINCE', todayStr], ['SUBJECT', 'Objednávka od zákaznika']], (err2, dateResults) => {
                        if (err2) {
                            reject(err2);
                            return;
                        }
                        if (dateResults && dateResults.length > 0) {
                            console.log(`📧 IMAP: Našiel som ${dateResults.length} OBJEDNÁVOK z dnešného dňa (${todayStr})`);
                            this.processFetchedEmails(dateResults, resolve, reject);
                            return;
                        }
                        console.log(`📭 IMAP: Žiadne objednávky z dnešného dňa (${todayStr})`);
                        resolve();
                    });
                });
            });
        });
    }
    processFetchedEmails(results, resolve, reject) {
        const fetch = this.imap.fetch(results, {
            bodies: '',
            markSeen: false // Neoznačuj ako prečítané hneď
        });
        let processed = 0;
        const total = results.length;
        fetch.on('message', (msg, seqno) => {
            this.processMessage(msg, seqno)
                .then(() => {
                processed++;
                if (processed === total) {
                    resolve();
                }
            })
                .catch((error) => {
                console.error(`❌ IMAP: Chyba pri spracovaní emailu ${seqno}:`, error);
                processed++;
                if (processed === total) {
                    resolve();
                }
            });
        });
        fetch.once('error', reject);
    }
    async processMessage(msg, seqno) {
        return new Promise((resolve, reject) => {
            let buffer = '';
            msg.on('body', (stream) => {
                stream.on('data', (chunk) => {
                    buffer += chunk.toString('utf8');
                });
            });
            msg.once('end', async () => {
                let emailData = null;
                let emailHistoryId = null;
                try {
                    const parsed = await (0, mailparser_1.simpleParser)(buffer);
                    emailData = {
                        from: parsed.from?.text || '',
                        subject: parsed.subject || '',
                        text: parsed.text || '',
                        html: parsed.html?.toString() || '',
                        date: parsed.date || new Date(),
                        messageId: parsed.messageId || `${seqno}-${Date.now()}`
                    };
                    console.log(`📧 IMAP: Spracúvam email: "${emailData.subject}" od: ${emailData.from}`);
                    console.log(`📄 EMAIL OBSAH DEBUG:`);
                    console.log(`- Text dĺžka: ${emailData.text.length}`);
                    console.log(`- HTML dĺžka: ${emailData.html.length}`);
                    console.log(`- Text preview:`, emailData.text.substring(0, 200));
                    console.log(`- HTML preview:`, emailData.html.substring(0, 200));
                    // Skontroluj prílohy
                    if (parsed.attachments && parsed.attachments.length > 0) {
                        console.log(`📎 EMAIL PRÍLOHY: ${parsed.attachments.length}`);
                        parsed.attachments.forEach((att, index) => {
                            console.log(`📎 Príloha ${index + 1}: ${att.filename} (${att.contentType})`);
                        });
                    }
                    // FILTER 1: Spracúvaj LEN emaily od objednavky@blackrent.sk
                    if (!emailData.from.includes('objednavky@blackrent.sk')) {
                        console.log(`🚫 IMAP: Email nie je od objednavky@blackrent.sk (je od: ${emailData.from}) - IGNORUJEM`);
                        return; // Vôbec ho neuložíme ani nespracujeme
                    }
                    // FILTER 2: Spracúvaj LEN emaily s predmetom "Objednávka od zákaznika"
                    if (!emailData.subject.includes('Objednávka od zákaznika')) {
                        console.log(`🚫 IMAP: Email nemá predmet "Objednávka od zákaznika" (má: "${emailData.subject}") - IGNORUJEM`);
                        return; // Vôbec ho neuložíme ani nespracujeme
                    }
                    // 🆕 ULOŽIŤ EMAIL DO HISTÓRIE - len ak je od objednavky@blackrent.sk
                    emailHistoryId = await this.saveEmailToHistory(emailData);
                    console.log(`✅ IMAP: Email je OBJEDNÁVKA od objednavky@blackrent.sk - SPRACÚVAM`);
                    // Email s objednávkou uložený - BEZ automatického statusu
                    // Užívateľ si bude spravovať statusy manuálne v dashboarde
                    console.log(`📧 IMAP: OBJEDNÁVKA uložená pre manuálne spracovanie (ID: ${emailHistoryId})`);
                    resolve();
                }
                catch (error) {
                    console.error('❌ IMAP: Chyba pri spracovaní emailu:', error);
                    // Ak máme emailHistoryId, označ ako error v histórii
                    if (emailHistoryId) {
                        try {
                            await this.updateEmailHistory(emailHistoryId, 'rejected', 'rejected', null, `Processing error: ${error}`);
                        }
                        catch (historyError) {
                            console.error('❌ Chyba pri ukladaní error do email histórie:', historyError);
                        }
                    }
                    reject(error);
                }
            });
        });
    }
    // 🎯 VYLEPŠENÁ parseEmailText FUNKCIA - PODPORUJE HTML
    parseEmailText(text) {
        const data = {};
        // Parsovanie čísla objednávky (plain text aj HTML)
        let orderNumberMatch = text.match(/Číslo objednávky\s+([A-Z]+\d+)/i);
        if (!orderNumberMatch) {
            // Skús HTML format: <td>Číslo objednávky</td> <td>OBJ02025018</td>
            orderNumberMatch = text.match(/Číslo\s+objednávky<\/td>\s*<td[^>]*>([A-Z]+\d+)/i);
        }
        if (orderNumberMatch) {
            data.orderNumber = orderNumberMatch[1];
        }
        // Parsovanie dátumu objednávky (plain text aj HTML)
        let orderDateMatch = text.match(/Objednávka prijatá\s+(\d{2}\.\d{2}\.\d{4})/);
        if (!orderDateMatch) {
            orderDateMatch = text.match(/Objednávka\s+prijatá<\/td>\s*<td[^>]*>(\d{2}\.\d{2}\.\d{4})/);
        }
        if (orderDateMatch) {
            data.orderDate = orderDateMatch[1];
        }
        // Parsovanie spôsobu úhrady (plain text aj HTML)
        let paymentMethodMatch = text.match(/Spôsob úhrady\s+(.+)/);
        if (!paymentMethodMatch) {
            paymentMethodMatch = text.match(/Spôsob\s+úhrady<\/td>\s*<td[^>]*>([^<]+)/);
        }
        if (paymentMethodMatch) {
            data.paymentMethod = paymentMethodMatch[1].trim();
        }
        // Parsovanie odoberateľa (plain text aj HTML)
        let customerMatch = text.match(/Odoberateľ\s+(.+)/);
        if (!customerMatch) {
            customerMatch = text.match(/Odoberateľ<\/td>\s*<td[^>]*>([^<]+)/);
        }
        if (customerMatch) {
            data.customerName = customerMatch[1].trim();
        }
        // Parsovanie emailu (plain text aj HTML)
        let emailMatch = text.match(/E-mail\s+(.+)/);
        if (!emailMatch) {
            emailMatch = text.match(/E-mail<\/td>\s*<td[^>]*>([^<]+)/);
        }
        if (emailMatch) {
            data.customerEmail = emailMatch[1].trim();
        }
        // Parsovanie telefónu (plain text aj HTML)
        let phoneMatch = text.match(/Telefon\s+(.+)/);
        if (!phoneMatch) {
            phoneMatch = text.match(/Telefon<\/td>\s*<td[^>]*>([^<]+)/);
        }
        if (phoneMatch) {
            data.customerPhone = phoneMatch[1].trim();
        }
        // Parsovanie kontaktnej adresy (plain text aj HTML)
        let addressMatch = text.match(/Kontaktná adresa\s+(.+)/);
        if (!addressMatch) {
            addressMatch = text.match(/Kontaktná\s+adresa<\/td>\s*<td[^>]*>([^<]+)/);
        }
        if (addressMatch) {
            data.customerAddress = addressMatch[1].trim();
        }
        // Parsovanie miesta vyzdvihnutia (plain text aj HTML)
        let pickupMatch = text.match(/Miesto vyzdvihnutia\s+(.+)/);
        if (!pickupMatch) {
            pickupMatch = text.match(/Miesto vyzdvihnutia<\/td>\s*<td[^>]*>([^<]+)/);
        }
        if (pickupMatch) {
            data.pickupPlace = pickupMatch[1].trim();
        }
        // Parsovanie miesta odovzdania (plain text aj HTML)
        let returnMatch = text.match(/Miesto odovzdania\s+(.+)/);
        if (!returnMatch) {
            returnMatch = text.match(/Miesto\s+odovzdania<\/td>\s*<td[^>]*>([^<]+)/);
        }
        if (returnMatch) {
            data.returnPlace = returnMatch[1].trim();
        }
        // Parsovanie času rezervácie (plain text aj HTML)
        let reservationMatch = text.match(/Čas rezervacie\s+(.+)/);
        if (!reservationMatch) {
            reservationMatch = text.match(/Čas\s+rezervacie<\/td>\s*<td[^>]*>([^<]+)/);
        }
        if (reservationMatch) {
            data.reservationTime = reservationMatch[1].trim();
        }
        // Parsovanie depozitu (plain text aj HTML)
        let depositMatch = text.match(/Depozit\s+([\d\s,]+)\s*€/);
        if (!depositMatch) {
            // HTML format: <td>Depozit</td> <td>500,00 &#8364;</td>
            depositMatch = text.match(/Depozit<\/td>\s*<td[^>]*>([\d\s,]+)\s*(?:&#8364;|€)/);
        }
        if (depositMatch) {
            const depositStr = depositMatch[1].replace(/\s/g, '').replace(',', '.');
            data.deposit = parseFloat(depositStr);
        }
        // Parsovanie sumy k úhrade (plain text aj HTML)
        let totalMatch = text.match(/Suma k úhrade\s+([\d\s,]+)\s*€/);
        if (!totalMatch) {
            // HTML format: <td>Suma k úhrade</td> <td>200,00 &#8364;</td>
            totalMatch = text.match(/Suma k úhrade<\/td>\s*<td[^>]*>([\d\s,]+)\s*(?:&#8364;|€)/);
        }
        if (totalMatch) {
            const totalStr = totalMatch[1].replace(/\s/g, '').replace(',', '.');
            data.totalAmount = parseFloat(totalStr);
        }
        // 🚗 PARSOVANIE VOZIDLA Z HTML TABULKY
        console.log('🔍 Parsing vehicle from HTML...');
        // HTML format: <td>Volkswagen Polo GTI</td> <td>TN076HA</td> <td>50,00 &#8364;</td> <td>200,00 &#8364;</td>
        const htmlVehicleMatch = text.match(/<tr[^>]*>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([A-Z0-9]{6,7})<\/td>\s*<td[^>]*>([\d\s,]+)\s*(?:&#8364;|€)<\/td>\s*<td[^>]*>([\d\s,]+)\s*(?:&#8364;|€)<\/td>/);
        if (htmlVehicleMatch) {
            data.vehicleName = htmlVehicleMatch[1].trim();
            data.vehicleCode = htmlVehicleMatch[2].trim();
            const priceStr = htmlVehicleMatch[3].replace(/\s/g, '').replace(',', '.');
            data.vehiclePrice = parseFloat(priceStr);
            const totalStr = htmlVehicleMatch[4].replace(/\s/g, '').replace(',', '.');
            data.vehicleTotalAmount = parseFloat(totalStr);
            console.log('✅ Parsed HTML vehicle:', {
                name: data.vehicleName,
                code: data.vehicleCode,
                price: data.vehiclePrice,
                total: data.vehicleTotalAmount
            });
        }
        else {
            // Fallback pre plain text format
            const vehicleMatch = text.match(/Položky objednávky\s*\n\s*Názov\s+Kód\s+Cena\s+Spolu\s*\n([^\n]+)/);
            if (vehicleMatch) {
                const vehicleLine = vehicleMatch[1].trim();
                console.log('🔍 Parsing plain text vehicle line:', vehicleLine);
                // Rozdeliť riadok podľa tabuliek alebo viacerých medzier
                const parts = vehicleLine.split(/\s+/).filter(part => part.trim());
                console.log('🔍 Vehicle parts:', parts);
                // Nájdi ŠPZ (6-7 znakov, len písmená a čísla)
                const spzIndex = parts.findIndex(part => /^[A-Z0-9]{6,7}$/.test(part.trim()));
                console.log('🔍 SPZ index:', spzIndex, 'SPZ:', spzIndex >= 0 ? parts[spzIndex] : 'not found');
                if (spzIndex > 0) {
                    // Názov auta je všetko pred ŠPZ
                    data.vehicleName = parts.slice(0, spzIndex).join(' ');
                    data.vehicleCode = parts[spzIndex];
                    // Cena a suma sú za ŠPZ
                    if (parts.length > spzIndex + 2) {
                        const priceStr = parts[spzIndex + 1].replace(',', '.').replace('€', '').trim();
                        data.vehiclePrice = parseFloat(priceStr);
                    }
                    console.log('✅ Parsed plain text vehicle:', {
                        name: data.vehicleName,
                        code: data.vehicleCode,
                        price: data.vehiclePrice
                    });
                }
                else {
                    console.log('❌ Could not find SPZ in vehicle line');
                }
            }
        }
        // Parsovanie kilometrov - VŠETKY sa považujú za denné km - IDENTICKÉ S FRONTEND
        console.log('🔍 DEBUG: Searching for kilometers in text...');
        console.log('🔍 Text sample around km:', text.substring(text.indexOf('Počet povolených km') - 20, text.indexOf('Počet povolených km') + 50));
        // NAJVYŠŠIA PRIORITA: Špecifické patterny pre "Počet povolených km" (plain text aj HTML)
        let specificKmMatch = text.match(/Počet povolených km\s+(\d+)\s*km/i);
        if (!specificKmMatch) {
            // HTML format: <td>Počet povolených km</td> <td>210 km</td>
            specificKmMatch = text.match(/Počet povolených km<\/td>\s*<td[^>]*>(\d+)\s*km/i);
        }
        console.log('🔍 DEBUG: specificKmMatch result:', specificKmMatch);
        if (specificKmMatch) {
            data.dailyKilometers = parseInt(specificKmMatch[1]);
            console.log(`🚗 Parsed "Počet povolených km": ${data.dailyKilometers} km/day (interpreted as daily)`);
        }
        else {
            console.log('🔍 DEBUG: specificKmMatch failed, trying other patterns...');
            // Prioritne hľadáme explicitne denné km patterny
            const explicitDailyKmMatch = text.match(/(\d+)\s*km\s*\/\s*de[ňn]/i) ||
                text.match(/(\d+)\s*km\s*na\s*de[ňn]/i) ||
                text.match(/denný\s*limit[:\s]*(\d+)\s*km/i) ||
                text.match(/denne[:\s]*(\d+)\s*km/i) ||
                text.match(/(\d+)\s*km\s*daily/i);
            console.log('🔍 DEBUG: explicitDailyKmMatch result:', explicitDailyKmMatch);
            if (explicitDailyKmMatch) {
                data.dailyKilometers = parseInt(explicitDailyKmMatch[1]);
                console.log(`🚗 Parsed explicit daily km: ${data.dailyKilometers} km/day`);
            }
            else {
                console.log('🔍 DEBUG: explicitDailyKmMatch failed, trying general patterns...');
                // Ak nie sú explicitne denné, hľadáme ostatné všeobecné km patterny a považujeme ich za denné
                const generalKmMatch = text.match(/Povolené\s+km[:\s]+(\d+)/i) ||
                    text.match(/Kilometrov[:\s]+(\d+)/i) ||
                    text.match(/Limit\s+km[:\s]+(\d+)/i) ||
                    text.match(/(\d+)\s*km/i); // Všeobecný pattern pre číslo + km (najnižšia priorita)
                console.log('🔍 DEBUG: generalKmMatch result:', generalKmMatch);
                if (generalKmMatch) {
                    data.dailyKilometers = parseInt(generalKmMatch[1]);
                    console.log(`🚗 Parsed general km as daily: ${data.dailyKilometers} km/day (interpreted as daily)`);
                }
                else {
                    console.log('🔍 DEBUG: No kilometer patterns matched!');
                }
            }
        }
        // Parsovanie ceny za extra km
        const extraKmMatch = text.match(/Cena\s+za\s+km[:\s]+([\d,]+)\s*€/i) ||
            text.match(/Extra\s+km[:\s]+([\d,]+)\s*€/i) ||
            text.match(/Nadlimitn[ý]\s+km[:\s]+([\d,]+)\s*€/i);
        if (extraKmMatch) {
            const extraKmStr = extraKmMatch[1].replace(',', '.');
            data.extraKilometerRate = parseFloat(extraKmStr);
        }
        // Parsovanie úrovne paliva
        const fuelMatch = text.match(/Palivo[:\s]+(\d+)%/i) ||
            text.match(/Fuel[:\s]+(\d+)%/i) ||
            text.match(/Nádrž[:\s]+(\d+)%/i);
        if (fuelMatch) {
            data.fuelLevel = parseInt(fuelMatch[1]);
        }
        // Parsovanie stavu tachometra
        const odometerMatch = text.match(/Tachometer[:\s]+([\d\s]+)\s*km/i) ||
            text.match(/Kilometrov[:\s]+([\d\s]+)\s*km/i) ||
            text.match(/Stav[:\s]+([\d\s]+)\s*km/i);
        if (odometerMatch) {
            const odometerStr = odometerMatch[1].replace(/\s/g, '');
            data.startOdometer = parseInt(odometerStr);
        }
        // Parsovanie podmienok vrátenia
        const conditionsMatch = text.match(/Podmienky\s+vrátenia[:\s]+([^.]+)/i) ||
            text.match(/Return\s+conditions[:\s]+([^.]+)/i);
        if (conditionsMatch) {
            data.returnConditions = conditionsMatch[1].trim();
        }
        // Parsovanie poznámok
        const notesMatch = text.match(/Poznámky[:\s]+([^.]+)/i) ||
            text.match(/Notes[:\s]+([^.]+)/i) ||
            text.match(/Dodatočné\s+informácie[:\s]+([^.]+)/i);
        if (notesMatch) {
            data.notes = notesMatch[1].trim();
        }
        // Parsovanie informácií o poistení
        const insuranceMatch = text.match(/Poistenie[:\s]+([^.]+)/i) ||
            text.match(/Insurance[:\s]+([^.]+)/i);
        if (insuranceMatch) {
            data.insuranceInfo = insuranceMatch[1].trim();
        }
        return data;
    }
    // 🎯 IDENTICKÁ PARSING LOGIKA AKO V FRONTEND EmailParser.tsx
    async parseEmailContent(emailData) {
        try {
            // Získaj text obsah s fallback na HTML
            let content = emailData.text?.trim();
            if ((!content || content.length === 0) && emailData.html) {
                // Extrahuj text z HTML - rovnaký ako v EmailParser
                content = emailData.html
                    .replace(/<style[^>]*>.*?<\/style>/gis, '') // Odstráň CSS
                    .replace(/<script[^>]*>.*?<\/script>/gis, '') // Odstráň JS
                    .replace(/<br\s*\/?>/gi, '\n') // <br> → nový riadok
                    .replace(/<\/?(div|p|tr|td|th)[^>]*>/gi, '\n') // Bloky → nový riadok
                    .replace(/<[^>]+>/g, ' ') // Ostatné tagy → medzera
                    .replace(/&nbsp;/g, ' ') // &nbsp; → medzera
                    .replace(/&amp;/g, '&') // HTML entity
                    .replace(/&lt;/g, '<') // HTML entity
                    .replace(/&gt;/g, '>') // HTML entity
                    .replace(/&quot;/g, '"') // HTML entity
                    .replace(/&#39;/g, "'") // HTML entity
                    .replace(/\s+/g, ' ') // Viacnásobné medzery → jedna
                    .trim();
                console.log('🔄 PARSING: Extrahujem text z HTML emailu');
            }
            if (!content) {
                console.log('❌ PARSING: Žiadny obsah na spracovanie');
                return null;
            }
            console.log('🎯 PARSING: Používam identickú logiku ako manuálne parsovanie...');
            console.log('📧 EMAIL TEXT pre parsing:', content.substring(0, 300) + '...');
            // 🎯 IDENTICKÁ PARSING LOGIKA AKO V EmailParser.tsx
            const parsedData = this.parseEmailText(content);
            console.log('📊 PARSED DATA (identické s manuálnym):', parsedData);
            // Validácia povinných údajov
            if (!parsedData.orderNumber || !parsedData.customerName) {
                console.log('⚠️ PARSING: Chýbajú povinné údaje (objednávka alebo meno)');
                console.log('- Číslo objednávky:', parsedData.orderNumber || 'CHÝBA');
                console.log('- Meno zákazníka:', parsedData.customerName || 'CHÝBA');
                return null;
            }
            // IDENTICKÉ VEHICLE MATCHING AKO V MANUÁLNOM PARSOVANÍ
            const vehicleSearchResult = await this.findVehicleWithIdenticalLogic(parsedData);
            // Parsovanie dátumu rezervácie - identické s manuálnym
            let startDate = new Date();
            let endDate = new Date();
            if (parsedData.reservationTime) {
                const timeMatch = parsedData.reservationTime.match(/(\d{4}-\d{2}-\d{2}[\s\n]+\d{2}:\d{2}:\d{2}) - (\d{4}-\d{2}-\d{2}[\s\n]+\d{2}:\d{2}:\d{2})/);
                if (timeMatch) {
                    // Parsuj časy presne ako prichádzajú v emaili - ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE
                    const parseAsPlainString = (dateStr) => {
                        if (dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
                            // Nahraď newline medzi dátumom a časom medzerou
                            const cleanDateStr = dateStr.replace(/\n/g, ' ').trim();
                            const [datePart, timePart] = cleanDateStr.split(' ');
                            // Vráť ako plain string pre PostgreSQL TIMESTAMP (bez timezone)
                            // DÔLEŽITÉ: Nekonvertuj na Date objekt, zachovaj presný čas z emailu
                            return `${datePart} ${timePart}`;
                        }
                        // Ak nie je ISO formát, skús DD.MM.YYYY HH:MM:SS formát
                        if (dateStr.match(/\d{1,2}\.\d{1,2}\.\d{4}/)) {
                            const cleanDateStr = dateStr.replace(/\n/g, ' ').trim();
                            const [datePart, timePart] = cleanDateStr.split(' ');
                            // Konvertuj DD.MM.YYYY na YYYY-MM-DD pre PostgreSQL
                            const [day, month, year] = datePart.split('.');
                            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${timePart}`;
                        }
                        return new Date().toISOString();
                    };
                    const startDateString = parseAsPlainString(timeMatch[1]);
                    const endDateString = parseAsPlainString(timeMatch[2]);
                    // Vytvor Date objekty len pre validáciu, ale použijem stringy v SQL
                    startDate = new Date(startDateString);
                    endDate = new Date(endDateString);
                    // Uložím plain stringy pre použitie v SQL
                    startDate.plainString = startDateString;
                    endDate.plainString = endDateString;
                }
            }
            // Určenie spôsobu platby - identické s manuálnym
            let paymentMethod = 'cash';
            if (parsedData.paymentMethod) {
                const paymentLower = parsedData.paymentMethod.toLowerCase();
                if (paymentLower.includes('hotovosť') || paymentLower.includes('cash')) {
                    paymentMethod = 'cash';
                }
                else if (paymentLower.includes('bank') || paymentLower.includes('prevod')) {
                    paymentMethod = 'bank_transfer';
                }
                else if (paymentLower.includes('vrp')) {
                    paymentMethod = 'vrp';
                }
            }
            // Finálne rental data - identické s manuálnym parsovaním
            const finalRentalData = {
                orderNumber: parsedData.orderNumber,
                customerName: parsedData.customerName,
                customerEmail: parsedData.customerEmail || '',
                customerPhone: parsedData.customerPhone || '',
                vehicleName: parsedData.vehicleName || '',
                vehicleCode: parsedData.vehicleCode || '',
                vehicleId: vehicleSearchResult?.id || undefined,
                startDate,
                endDate,
                totalPrice: parsedData.totalAmount || 0,
                deposit: parsedData.deposit || 0,
                paymentMethod: paymentMethod,
                handoverPlace: parsedData.pickupPlace || '',
                dailyKilometers: parsedData.dailyKilometers || 0,
            };
            console.log('✅ PARSING: Úspešne parsované údaje identicky s manuálnym!');
            console.log('🎯 FINÁLNE RESULTS (identické s manuálnym):');
            console.log('- Order Number:', finalRentalData.orderNumber);
            console.log('- Customer:', finalRentalData.customerName);
            console.log('- Email:', finalRentalData.customerEmail);
            console.log('- Phone:', finalRentalData.customerPhone);
            console.log('- Vehicle:', finalRentalData.vehicleName);
            console.log('- SPZ:', finalRentalData.vehicleCode);
            console.log('- Vehicle ID:', finalRentalData.vehicleId);
            console.log('- Price:', finalRentalData.totalPrice);
            console.log('- Daily KM:', finalRentalData.dailyKilometers);
            console.log('- Payment:', finalRentalData.paymentMethod);
            console.log('- Place:', finalRentalData.handoverPlace);
            console.log('- Dates:', finalRentalData.startDate, '→', finalRentalData.endDate);
            console.log('- Deposit:', finalRentalData.deposit);
            return finalRentalData;
        }
        catch (error) {
            console.error('❌ PARSING: Chyba pri parsovaní emailu:', error);
            return null;
        }
    }
    // 🎯 IDENTICKÁ VEHICLE MATCHING LOGIKA AKO V FRONTEND EmailParser.tsx
    async getAllVehicles() {
        try {
            const result = await postgres_database_1.postgresDatabase.query(`
        SELECT id, brand, model, license_plate
        FROM vehicles 
        WHERE license_plate IS NOT NULL
      `);
            return result.rows;
        }
        catch (error) {
            console.error('❌ Chyba pri načítaní vozidiel:', error);
            return [];
        }
    }
    // Normalizácia ŠPZ - identická s frontend
    normalizeSpz(spz) {
        return spz?.trim().toUpperCase().replace(/\s+/g, '') || '';
    }
    // IDENTICKÁ vehicle search logika ako v EmailParser.tsx handleApplyData
    async findVehicleWithIdenticalLogic(parsedData) {
        try {
            const vehicles = await this.getAllVehicles();
            console.log('🚗 Vehicle search START:', {
                hasVehicleCode: !!parsedData.vehicleCode,
                vehicleCode: parsedData.vehicleCode,
                vehiclesAvailable: vehicles.length,
                vehiclesList: vehicles.map(v => ({
                    id: v.id.substring(0, 8),
                    plate: v.license_plate,
                    normalized: this.normalizeSpz(v.license_plate || ''),
                    brand: v.brand,
                    model: v.model
                }))
            });
            // Nájdenie vozidla - primárne podľa ŠPZ, potom podľa názvu
            let selectedVehicle = undefined;
            if (parsedData.vehicleCode) {
                // Najprv hľadám podľa ŠPZ (kódu) s normalizáciou
                const normalizedCode = this.normalizeSpz(parsedData.vehicleCode);
                selectedVehicle = vehicles.find(v => this.normalizeSpz(v.license_plate || '') === normalizedCode);
                console.log('🔍 Vehicle search details:', {
                    searchingFor: parsedData.vehicleCode,
                    normalized: normalizedCode,
                    found: !!selectedVehicle,
                    foundVehicle: selectedVehicle ? { id: selectedVehicle.id, plate: selectedVehicle.license_plate, brand: selectedVehicle.brand, model: selectedVehicle.model } : null,
                    vehicleCount: vehicles.length
                });
            }
            // Ak sa nenájde podľa ŠPZ, skúsim podľa názvu
            if (!selectedVehicle && parsedData.vehicleName) {
                console.log('🔍 Searching by name fallback:', {
                    vehicleName: parsedData.vehicleName,
                    searchTerm: parsedData.vehicleName.toLowerCase()
                });
                selectedVehicle = vehicles.find(v => v.brand && v.model && `${v.brand} ${v.model}`.toLowerCase().includes(parsedData.vehicleName.toLowerCase()));
                console.log('🔍 Name search result:', {
                    found: !!selectedVehicle,
                    foundVehicle: selectedVehicle ? {
                        id: selectedVehicle.id.substring(0, 8),
                        plate: selectedVehicle.license_plate,
                        brand: selectedVehicle.brand,
                        model: selectedVehicle.model
                    } : null
                });
            }
            if (selectedVehicle) {
                const vehicleName = selectedVehicle.brand && selectedVehicle.model
                    ? `${selectedVehicle.brand} ${selectedVehicle.model}`
                    : (selectedVehicle.brand || selectedVehicle.model || 'Unknown Vehicle');
                return {
                    id: selectedVehicle.id,
                    name: vehicleName
                };
            }
            return null;
        }
        catch (error) {
            console.error('❌ Chyba pri hľadaní vozidla:', error);
            return null;
        }
    }
    // 🆕 NOVÉ: Email History Management Functions
    async saveEmailToHistory(emailData) {
        try {
            // 🚀 PARSUJ EMAIL TEXT PRED ULOŽENÍM
            const parsedData = this.parseEmailText(emailData.text);
            console.log('🔍 PARSED EMAIL DATA:', parsedData);
            const result = await postgres_database_1.postgresDatabase.query(`
        INSERT INTO email_processing_history (
          email_id, message_id, subject, sender, email_content, email_html,
          received_at, status, confidence_score, parsed_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
        ON CONFLICT (email_id) DO UPDATE SET
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `, [
                emailData.messageId,
                emailData.messageId,
                emailData.subject,
                emailData.from,
                emailData.text,
                emailData.html,
                emailData.date,
                'new',
                0.0,
                JSON.stringify(parsedData)
            ]);
            const historyId = result.rows[0].id;
            console.log(`📧 EMAIL HISTORY: Uložený email ${emailData.messageId} (ID: ${historyId})`);
            return historyId;
        }
        catch (error) {
            console.error('❌ EMAIL HISTORY: Chyba pri ukladaní emailu:', error);
            throw error;
        }
    }
    async updateEmailHistory(historyId, status, actionTaken, parsedData, errorMessage) {
        try {
            await postgres_database_1.postgresDatabase.query(`
        UPDATE email_processing_history 
        SET 
          status = $2,
          action_taken = $3,
          parsed_data = $4,
          error_message = $5,
          processed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [historyId, status, actionTaken, parsedData ? JSON.stringify(parsedData) : null, errorMessage]);
            console.log(`📧 EMAIL HISTORY: Updated ${historyId} → ${status}/${actionTaken}`);
        }
        catch (error) {
            console.error('❌ EMAIL HISTORY: Chyba pri aktualizácii:', error);
        }
    }
    async logEmailAction(historyId, action, userId, notes) {
        try {
            await postgres_database_1.postgresDatabase.query(`
        INSERT INTO email_action_logs (email_id, user_id, action, notes)
        VALUES ($1, $2, $3, $4)
      `, [historyId, userId, action, notes]);
            console.log(`📧 ACTION LOG: ${action} logged for email ${historyId}`);
        }
        catch (error) {
            console.error('❌ ACTION LOG: Chyba pri logovaní akcie:', error);
        }
    }
    async createPendingRental(rentalData, emailData, emailHistoryId) {
        try {
            // 🚫 KONTROLA BLACKLISTU - ZABLOKOVANÉ OBJEDNÁVKY
            const blacklistCheck = await postgres_database_1.postgresDatabase.query('SELECT id, reason FROM email_blacklist WHERE order_number = $1', [rentalData.orderNumber]);
            if (blacklistCheck.rows.length > 0) {
                const reason = blacklistCheck.rows[0].reason;
                console.log(`🚫 BLACKLIST: Objednávka ${rentalData.orderNumber} je zablokovaná (${reason}), preskakujem`);
                return;
            }
            // Overíme či objednávka už neexistuje
            const existingRental = await postgres_database_1.postgresDatabase.query('SELECT id FROM rentals WHERE order_number = $1', [rentalData.orderNumber]);
            if (existingRental.rows.length > 0) {
                console.log(`⚠️ DB: Objednávka ${rentalData.orderNumber} už existuje, preskakujem`);
                return;
            }
            // Parsovanie mena na firstName a lastName
            const nameParts = rentalData.customerName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || firstName;
            // Použijem plain stringy pre časy ak sú dostupné
            const startDateValue = rentalData.startDate?.plainString || rentalData.startDate;
            const endDateValue = rentalData.endDate?.plainString || rentalData.endDate;
            // Vytvor pending rental
            const result = await postgres_database_1.postgresDatabase.query(`
        INSERT INTO rentals (
          order_number, customer_name, customer_email, customer_phone,
          vehicle_name, vehicle_code, vehicle_id, start_date, end_date, total_price,
          deposit, handover_place, daily_kilometers, approval_status, status,
          payment_method, commission, auto_processed_at, email_content, 
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8::timestamp, $9::timestamp, $10, $11, $12, $13, 'pending', 'pending',
          $14, 0.00, CURRENT_TIMESTAMP, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id
      `, [
                rentalData.orderNumber,
                rentalData.customerName,
                rentalData.customerEmail,
                rentalData.customerPhone,
                rentalData.vehicleName,
                rentalData.vehicleCode,
                rentalData.vehicleId || null, // NOVÉ: vehicle_id pre automatické napárovanie
                startDateValue,
                endDateValue,
                rentalData.totalPrice,
                rentalData.deposit,
                rentalData.handoverPlace,
                rentalData.dailyKilometers,
                rentalData.paymentMethod || 'Prevod',
                JSON.stringify({
                    subject: emailData.subject,
                    from: emailData.from,
                    text: emailData.text,
                    receivedAt: emailData.date
                })
            ]);
            console.log(`✅ DB: Vytvorený pending rental ${rentalData.orderNumber} (ID: ${result.rows[0].id})`);
            // 🆕 Prepoj rental s email históriou
            if (emailHistoryId) {
                await postgres_database_1.postgresDatabase.query(`
          UPDATE email_processing_history 
          SET rental_id = $1 
          WHERE id = $2
        `, [result.rows[0].id, emailHistoryId]);
                console.log(`🔗 EMAIL HISTORY: Prepojený rental ${result.rows[0].id} s email ${emailHistoryId}`);
            }
            // Log do konzoly
            console.log('📊 AUTO-PROCESSING:', {
                rentalId: result.rows[0].id,
                orderNumber: rentalData.orderNumber,
                customerName: rentalData.customerName,
                processedAt: new Date().toISOString(),
                source: 'IMAP',
                emailHistoryId: emailHistoryId
            });
        }
        catch (error) {
            console.error('❌ DB: Chyba pri vytváraní pending rental:', error);
            throw error;
        }
    }
    // Verejná metóda pre manuálne spustenie
    async startMonitoring(intervalMinutes = 0.5) {
        if (!this.isEnabled) {
            console.log('📧 IMAP: Služba je vypnutá, monitoring sa nespustí');
            throw new Error('IMAP služba je vypnutá');
        }
        console.log(`🚀 IMAP: Spúšťam monitoring emailov (interval: ${intervalMinutes} min)`);
        // Prvá kontrola hneď
        await this.checkForNewEmails();
        // Nastavenie intervalu
        setInterval(async () => {
            await this.checkForNewEmails();
        }, intervalMinutes * 60 * 1000);
    }
    // Test pripojenia
    async testConnection() {
        if (!this.isEnabled) {
            console.log('📧 IMAP: Služba je vypnutá, test pripojenia preskočený');
            return false;
        }
        try {
            await this.connect();
            console.log('✅ IMAP: Test pripojenia úspešný');
            await this.disconnect();
            return true;
        }
        catch (error) {
            console.error('❌ IMAP: Test pripojenia neúspešný:', error);
            return false;
        }
    }
}
exports.default = ImapEmailService;
//# sourceMappingURL=imap-email-service.js.map