# 🚀 MASTER IMPLEMENTAČNÝ PLÁN - BlackRent Protokoly (ZJEDNOTENÝ)

> **📋 Tento plán zjednocuje všetky tri implementačné plány do jedného kompletného dokumentu**

## 🎯 HLAVNÉ CIELE

1. **100% spoľahlivé nahrávanie fotiek** - inteligentný queue systém s garantovaným úspechom
2. **5x rýchlejšie nahrávanie** - paralelné spracovanie s adaptívnym limitom  
3. **60% menšie PDF súbory** - kategorizovaná kompresia (vehicle 100%, damage 100%, document 70%)
4. **Profesionálna galéria** - zoom, full-screen, navigation, pinch-to-zoom
5. **Súdne uznateľné podpisy** - Disig TSA + voliteľný Autogram
6. **Dokonalý design systém** - konzistentné UI komponenty
7. **Offline podpora** - draft protokoly, background sync
8. **Čistý kód** - postupné odstránenie V2 závislostí

---

## 📊 KOMPLETNÝ ČASOVÝ HARMONOGRAM

| Fáza | Úloha | Čas | Priorita | Kategória | Status |
|------|-------|-----|----------|-----------|--------|
| **1A** | Inteligentné nahrávanie fotiek | 4 hodiny | 🔴 Kritická | Core | ⏳ Pending |
| **1B** | Kategorizovaná PDF kompresia | 1 hodina | 🔴 Kritická | Core | ⏳ Pending |
| **1C** | Design System audit & cleanup | 3 hodiny | 🔴 Kritická | UI/UX | ⏳ Pending |
| **2A** | Disig TSA integrácia | 3 hodiny | 🟡 Vysoká | Legal | ⏳ Pending |
| **2B** | Autogram voliteľná integrácia | 6 hodín | 🟡 Vysoká | Legal | ⏳ Pending |
| **2C** | Konzistentné UI komponenty | 4 hodiny | 🟡 Vysoká | UI/UX | ⏳ Pending |
| **3A** | Vylepšená galéria | 4 hodiny | 🟢 Stredná | UX | ⏳ Pending |
| **3B** | Offline draft support | 2 hodiny | 🟢 Stredná | UX | ⏳ Pending |
| **3C** | Performance optimalizácie | 2 hodiny | 🟢 Stredná | Tech | ⏳ Pending |
| **4A** | V2 cleanup (postupne) | 2 hodiny | 🟢 Nízka | Cleanup | ⏳ Pending |
| **4B** | Finálne testovanie | 3 hodiny | 🟢 Nízka | QA | ⏳ Pending |

**CELKOVÝ ČAS: 34 hodín (4.5 dňa)**

### **📈 Rozdelenie času:**
- **Core funkcionalita:** 8 hodín (23%)
- **Legal & Security:** 9 hodín (26%) 
- **UI/UX vylepšenia:** 10 hodín (29%)
- **Performance & Tech:** 4 hodiny (12%)
- **QA & Cleanup:** 5 hodín (15%)

---

## 🔴 FÁZA 1A: Inteligentné nahrávanie fotiek (4 hodiny)

### **Problém:**
- Používateľ označí 30 fotiek, ale nevie či sa všetky nahrali
- Sekvenčné nahrávanie je pomalé
- Žiadne retry pri zlyhaní

### **Riešenie: "Fire & Forget" systém**

#### **1A.1 Smart Upload Queue Manager (2 hodiny)**
```typescript
// src/utils/smartUploadManager.ts
export class SmartUploadManager {
  private queue: UploadItem[] = [];
  private activeUploads = 0;
  private maxConcurrent = this.getOptimalConcurrency();
  
  // Adaptívny limit podľa network speed
  private getOptimalConcurrency(): number {
    const connection = (navigator as any).connection;
    if (!connection) return 3;
    
    switch (connection.effectiveType) {
      case 'slow-2g':
      case '2g': return 1;
      case '3g': return 2;
      case '4g': return 4;
      default: return 3;
    }
  }
  
  async processQueue(photos: File[], entityId: string): Promise<void> {
    // 1. Pridaj všetky fotky do queue
    this.queue = photos.map(photo => ({
      id: uuidv4(),
      file: photo,
      status: 'pending',
      retries: 0,
      maxRetries: 5,
      entityId,
      priority: this.calculatePriority(photo),
      createdAt: new Date()
    }));
    
    // 2. Ulož queue do IndexedDB (persistence)
    await this.persistQueue();
    
    // 3. Spusti upload worker
    this.startUploadWorker();
    
    // 4. Notifikuj používateľa
    this.notifyUser('info', `Nahrávanie ${photos.length} fotiek začalo na pozadí`);
  }
  
  private async startUploadWorker(): Promise<void> {
    while (this.hasPendingUploads()) {
      const availableSlots = this.maxConcurrent - this.activeUploads;
      const pendingItems = this.queue
        .filter(item => item.status === 'pending')
        .sort((a, b) => b.priority - a.priority) // Priorita: damage > vehicle > document
        .slice(0, availableSlots);
      
      // Spusti parallel uploady
      pendingItems.forEach(item => this.uploadWithRetry(item));
      
      // Čakaj kým sa niečo dokončí
      await this.waitForSlot();
    }
    
    // Finálna notifikácia
    const completed = this.queue.filter(i => i.status === 'completed').length;
    const failed = this.queue.filter(i => i.status === 'failed').length;
    
    if (failed === 0) {
      this.notifyUser('success', `✅ Všetkých ${completed} fotiek úspešne nahrané!`);
    } else {
      this.notifyUser('warning', `⚠️ ${completed} fotiek nahrané, ${failed} zlyhaných`);
    }
  }
  
  private async uploadWithRetry(item: UploadItem): Promise<void> {
    this.activeUploads++;
    item.status = 'uploading';
    
    try {
      // Kompresia podľa kategórie
      const compressedFile = await this.compressByCategory(item.file);
      
      // Upload cez React Query
      const result = await uploadFileMutation.mutateAsync({
        file: compressedFile,
        protocolId: item.entityId,
        category: this.detectCategory(item.file.name)
      });
      
      item.status = 'completed';
      item.url = result.url;
      item.completedAt = new Date();
      
      // Update progress
      this.updateProgress();
      
    } catch (error) {
      item.retries++;
      
      if (item.retries < item.maxRetries) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.min(1000 * Math.pow(2, item.retries), 30000);
        
        setTimeout(() => {
          item.status = 'pending';
        }, delay);
        
        console.log(`🔄 Retry ${item.retries}/${item.maxRetries} for ${item.file.name} in ${delay}ms`);
        
      } else {
        item.status = 'failed';
        item.error = error.message;
        
        // Pokús sa o fallback stratégie
        await this.tryFallbackStrategies(item);
      }
    } finally {
      this.activeUploads--;
      await this.persistQueue(); // Ulož stav
    }
  }
  
  private async tryFallbackStrategies(item: UploadItem): Promise<void> {
    try {
      // 1. Skús väčšiu kompresiu
      const heavilyCompressed = await this.compressAggressively(item.file);
      if (heavilyCompressed.size < item.file.size * 0.3) {
        item.file = heavilyCompressed;
        item.status = 'pending';
        item.retries = 0; // Reset retry count
        return;
      }
      
      // 2. Posledná možnosť: base64 storage v localStorage
      const base64 = await this.fileToBase64(item.file);
      localStorage.setItem(`failed_upload_${item.id}`, base64);
      
      item.status = 'stored_locally';
      this.notifyUser('warning', `Fotka ${item.file.name} uložená lokálne, nahrajte neskôr`);
      
    } catch (fallbackError) {
      console.error('All fallback strategies failed:', fallbackError);
    }
  }
}
```

#### **1A.2 Background Persistence (1 hodina)**
```typescript
// src/utils/uploadPersistence.ts
export class UploadPersistence {
  private dbName = 'BlackRentUploads';
  private storeName = 'uploadQueue';
  
  async saveQueue(queue: UploadItem[]): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    
    // Serialize files to base64 for storage
    const serializedQueue = await Promise.all(
      queue.map(async item => ({
        ...item,
        fileData: await this.fileToBase64(item.file),
        file: null // Remove file object
      }))
    );
    
    await store.put(serializedQueue, 'current_queue');
  }
  
  async restoreQueue(): Promise<UploadItem[]> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const saved = await store.get('current_queue');
      
      if (!saved) return [];
      
      // Restore files from base64
      return saved.map(item => ({
        ...item,
        file: this.base64ToFile(item.fileData, item.fileName)
      }));
      
    } catch (error) {
      console.error('Failed to restore queue:', error);
      return [];
    }
  }
  
  // Automatické obnovenie pri štarte aplikácie
  async resumeInterruptedUploads(): Promise<void> {
    const queue = await this.restoreQueue();
    const pendingUploads = queue.filter(item => 
      item.status === 'pending' || item.status === 'uploading'
    );
    
    if (pendingUploads.length > 0) {
      const manager = new SmartUploadManager();
      await manager.resumeQueue(pendingUploads);
      
      // Notifikácia používateľovi
      toast.info(`Obnovujem nahrávanie ${pendingUploads.length} fotiek z predchádzajúcej relácie`);
    }
  }
}
```

#### **1A.3 UX Integration (1 hodina)**
```typescript
// src/components/common/SmartPhotoUpload.tsx
export const SmartPhotoUpload: React.FC<Props> = ({ onComplete }) => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'completed'>('idle');
  const [progress, setProgress] = useState({ completed: 0, total: 0, failed: 0 });
  
  const handleFileSelect = async (files: File[]) => {
    // 1. Okamžite ukáž progress
    setUploadStatus('uploading');
    setProgress({ completed: 0, total: files.length, failed: 0 });
    
    // 2. Spusti smart upload
    const manager = new SmartUploadManager();
    manager.onProgress = (progress) => setProgress(progress);
    
    await manager.processQueue(files, entityId);
    
    // 3. Používateľ môže zatvoriť dialog - upload pokračuje
    toast.success('Nahrávanie začalo na pozadí, môžete pokračovať v práci');
    onComplete?.();
  };
  
  return (
    <Box>
      {/* File selector */}
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileSelect(Array.from(e.target.files || []))}
      />
      
      {/* Progress indicator */}
      {uploadStatus === 'uploading' && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            Nahrané: {progress.completed}/{progress.total}
            {progress.failed > 0 && ` (${progress.failed} zlyhaných)`}
          </Typography>
          
          <LinearProgress 
            variant="determinate" 
            value={(progress.completed / progress.total) * 100} 
            sx={{ mt: 1 }}
          />
          
          <Typography variant="caption" color="text.secondary">
            Nahrávanie pokračuje na pozadí, môžete zatvoriť toto okno
          </Typography>
        </Box>
      )}
    </Box>
  );
};
```

---

## 🔴 FÁZA 1B: Kategorizovaná PDF kompresia (1 hodina)

### **Aktualizované profily kompresie:**

```typescript
// src/utils/imageLint.ts - aktualizované
const COMPRESSION_PROFILES = {
  vehicle: { 
    quality: 1.0,           // 100% kvalita - dôležité detaily
    maxWidth: 1920,         // Plné rozlíšenie
    format: 'webp'          // WebP pre menšiu veľkosť
  },
  damage: { 
    quality: 1.0,           // 100% kvalita - kritické pre poistenie
    maxWidth: 1920,         // Plné rozlíšenie  
    format: 'webp'
  },
  document: { 
    quality: 0.7,           // 70% kvalita - stačí čitateľnosť
    maxWidth: 1200,         // Menšie rozlíšenie
    format: 'jpeg'          // JPEG lepšie pre text
  },
  odometer: { 
    quality: 0.8,           // 80% kvalita - čísla musia byť jasné
    maxWidth: 1000,
    format: 'jpeg'
  },
  fuel: { 
    quality: 0.6,           // 60% kvalita - najmenej dôležité
    maxWidth: 800,
    format: 'jpeg'
  }
} as const;

export async function compressByCategory(
  file: File, 
  category: keyof typeof COMPRESSION_PROFILES
): Promise<File> {
  const profile = COMPRESSION_PROFILES[category];
  
  return await lintImage(file, {
    preserveQuality: profile.quality === 1.0,
    targetFormat: profile.format,
    quality: profile.quality,
    maxWidth: profile.maxWidth
  });
}

// Automatická detekcia kategórie z názvu súboru
export function detectPhotoCategory(filename: string): keyof typeof COMPRESSION_PROFILES {
  const lower = filename.toLowerCase();
  
  if (lower.includes('damage') || lower.includes('scratch') || lower.includes('dent')) {
    return 'damage';
  }
  if (lower.includes('document') || lower.includes('key') || lower.includes('license')) {
    return 'document';
  }
  if (lower.includes('odometer') || lower.includes('km') || lower.includes('mileage')) {
    return 'odometer';
  }
  if (lower.includes('fuel') || lower.includes('tank') || lower.includes('gas')) {
    return 'fuel';
  }
  
  return 'vehicle'; // Default
}
```

---

## 🎨 FÁZA 1C: Design System audit & cleanup (3 hodiny)

### **Problém:**
- Nekonzistentné farby, fonty, spacing
- Duplicitné komponenty s rôznymi štýlmi
- Hardcoded hodnoty namiesto design tokens

### **Riešenie:**

#### **1C.1 Design Tokens Setup (1 hodina)**
```typescript
// src/design-system/tokens/colors.ts
export const colors = {
  // Primary palette
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe', 
    500: '#0ea5e9',
    600: '#0284c7',
    900: '#0c4a6e'
  },
  
  // Semantic colors
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a'
  },
  
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626'
  },
  
  // Neutral palette
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    500: '#6b7280',
    900: '#111827'
  }
} as const;

// src/design-system/tokens/spacing.ts
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
  16: '64px',
  20: '80px'
} as const;

// src/design-system/tokens/typography.ts
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace']
  },
  
  fontSize: {
    xs: ['12px', '16px'],
    sm: ['14px', '20px'],
    base: ['16px', '24px'],
    lg: ['18px', '28px'],
    xl: ['20px', '28px'],
    '2xl': ['24px', '32px'],
    '3xl': ['30px', '36px']
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  }
} as const;
```

#### **1C.2 Unified Component Library (1.5 hodiny)**
```typescript
// src/design-system/components/Button/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  onClick
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-primary-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
    disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
  }`;
  
  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};

// src/design-system/components/Input/Input.tsx
interface InputProps {
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'number';
  value?: string;
  onChange?: (value: string) => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  error,
  disabled = false,
  required = false,
  type = 'text',
  value,
  onChange
}) => {
  const inputClasses = `
    block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
    focus:outline-none focus:ring-primary-500 focus:border-primary-500
    ${error ? 'border-red-300' : 'border-gray-300'}
    ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
  `;
  
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        type={type}
        className={inputClasses}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// src/design-system/components/Card/Card.tsx
interface CardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
  border?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  shadow = 'md',
  border = true
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };
  
  const classes = `
    bg-white rounded-lg ${paddingClasses[padding]} ${shadowClasses[shadow]}
    ${border ? 'border border-gray-200' : ''}
  `;
  
  return (
    <div className={classes}>
      {children}
    </div>
  );
};
```

#### **1C.3 Component Migration Script (30 min)**
```typescript
// scripts/migrate-components.ts
import { promises as fs } from 'fs';
import { glob } from 'glob';

interface ComponentMigration {
  oldPattern: RegExp;
  newPattern: string;
  description: string;
}

const migrations: ComponentMigration[] = [
  {
    oldPattern: /<Button[^>]*variant="contained"[^>]*>/g,
    newPattern: '<Button variant="primary">',
    description: 'Migrate MUI contained buttons to primary'
  },
  {
    oldPattern: /<Button[^>]*variant="outlined"[^>]*>/g,
    newPattern: '<Button variant="outline">',
    description: 'Migrate MUI outlined buttons to outline'
  },
  {
    oldPattern: /<TextField[^>]*>/g,
    newPattern: '<Input>',
    description: 'Migrate MUI TextField to Input'
  },
  {
    oldPattern: /sx=\{\{[^}]*\}\}/g,
    newPattern: '',
    description: 'Remove MUI sx props'
  }
];

async function migrateComponents() {
  const files = await glob('src/**/*.{ts,tsx}');
  
  for (const file of files) {
    let content = await fs.readFile(file, 'utf-8');
    let changed = false;
    
    for (const migration of migrations) {
      if (migration.oldPattern.test(content)) {
        content = content.replace(migration.oldPattern, migration.newPattern);
        changed = true;
        console.log(`✅ ${file}: ${migration.description}`);
      }
    }
    
    if (changed) {
      await fs.writeFile(file, content);
    }
  }
  
  console.log('🎉 Component migration completed!');
}

// Run migration
migrateComponents().catch(console.error);
```

---

## 🔐 FÁZA 2A: Disig TSA integrácia (3 hodiny)

### **Cieľ: Pokročilé elektronické podpisy s kvalifikovanou časovou pečiatkou**

#### **2A.1 Disig TSA Service (1.5 hodiny)**
```typescript
// src/services/disigTSA.ts
export class DisigTSAService {
  private tsaUrl = 'https://tsa.disig.sk/tsa';
  private apiKey = process.env.REACT_APP_DISIG_API_KEY; // Z .env
  
  async addQualifiedTimestamp(dataHash: string): Promise<QualifiedTimestamp> {
    try {
      // 1. Vytvor TSA request (RFC 3161)
      const tsaRequest = this.createTSARequest(dataHash);
      
      // 2. Pošli na Disig TSA server
      const response = await fetch(this.tsaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/timestamp-query',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': tsaRequest.byteLength.toString()
        },
        body: tsaRequest
      });
      
      if (!response.ok) {
        throw new Error(`TSA request failed: ${response.status}`);
      }
      
      // 3. Spracuj TSA response
      const tsaResponse = await response.arrayBuffer();
      const timestamp = this.parseTSAResponse(new Uint8Array(tsaResponse));
      
      return {
        token: timestamp.token,
        authority: 'ca.disig.sk',
        certificate: timestamp.certificate,
        validationUrl: 'https://www.disig.sk/verify',
        issuedAt: timestamp.timestamp,
        serialNumber: timestamp.serialNumber,
        cost: 0.02 // €0.02 za pečiatku
      };
      
    } catch (error) {
      console.error('Disig TSA failed:', error);
      throw new Error(`Kvalifikovaná časová pečiatka zlyhala: ${error.message}`);
    }
  }
  
  private createTSARequest(dataHash: string): ArrayBuffer {
    // RFC 3161 TSA Request implementation
    // Použiť crypto-js alebo node-forge pre ASN.1 encoding
    
    const hashAlgorithm = 'SHA-256';
    const hashValue = new TextEncoder().encode(dataHash);
    
    // Simplified TSA request structure
    const tsaRequest = {
      version: 1,
      messageImprint: {
        hashAlgorithm: { algorithm: '2.16.840.1.101.3.4.2.1' }, // SHA-256 OID
        hashedMessage: hashValue
      },
      reqPolicy: '1.3.6.1.4.1.10015.1.1.1', // Disig policy OID
      nonce: this.generateNonce(),
      certReq: true,
      extensions: []
    };
    
    // Convert to DER encoding (ASN.1)
    return this.encodeTSARequest(tsaRequest);
  }
  
  private parseTSAResponse(response: Uint8Array): TSAResponseData {
    // Parse DER encoded TSA response
    // Extract timestamp token, certificate, etc.
    
    // Simplified parsing - in reality use proper ASN.1 parser
    return {
      token: this.extractToken(response),
      certificate: this.extractCertificate(response),
      timestamp: new Date(),
      serialNumber: this.extractSerialNumber(response)
    };
  }
  
  // Overenie platnosti časovej pečiatky
  async verifyTimestamp(timestamp: QualifiedTimestamp): Promise<boolean> {
    try {
      const response = await fetch(`${timestamp.validationUrl}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: timestamp.token,
          serialNumber: timestamp.serialNumber
        })
      });
      
      const result = await response.json();
      return result.valid === true;
      
    } catch (error) {
      console.error('Timestamp verification failed:', error);
      return false;
    }
  }
}
```

#### **2A.2 Enhanced Signature Component (1 hodina)**
```typescript
// src/components/common/EnhancedSignaturePad.tsx
interface EnhancedSignatureProps {
  onSave: (signature: EnhancedSignature) => void;
  signerName: string;
  signerRole: 'customer' | 'employee';
  protocolHash: string; // Hash celého protokolu
}

export const EnhancedSignaturePad: React.FC<EnhancedSignatureProps> = ({
  onSave,
  signerName,
  signerRole,
  protocolHash
}) => {
  const [isAddingTimestamp, setIsAddingTimestamp] = useState(false);
  const [biometrics, setBiometrics] = useState<BiometricData>({
    pressure: [],
    velocity: [],
    startTime: 0,
    points: 0
  });
  
  const disigTSA = new DisigTSAService();
  
  const handleSignatureSave = async (canvasData: string) => {
    try {
      setIsAddingTimestamp(true);
      
      // 1. Vytvor hash podpisu
      const signatureHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(canvasData)
      );
      
      // 2. Pridaj Disig kvalifikovanú časovú pečiatku
      const qualifiedTimestamp = await disigTSA.addQualifiedTimestamp(
        Array.from(new Uint8Array(signatureHash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      );
      
      // 3. Zbieranie audit trail dát
      const auditTrail = await this.collectAuditTrail();
      
      // 4. Vytvor enhanced signature
      const enhancedSignature: EnhancedSignature = {
        // Základné dáta (zachované)
        id: uuidv4(),
        signerName,
        signerRole,
        signatureData: canvasData,
        timestamp: new Date(),
        location: '', // Vyplní sa z props
        
        // NOVÉ: Disig kvalifikovaná časová pečiatka
        qualifiedTimestamp,
        
        // Kryptografické zabezpečenie
        cryptography: {
          signatureHash: Array.from(new Uint8Array(signatureHash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join(''),
          protocolHash,
          algorithm: 'SHA-256',
          keyLength: 256
        },
        
        // Biometrické dáta
        biometrics,
        
        // Audit trail
        auditTrail,
        
        // Právna platnosť
        legalCompliance: {
          eIDAS: true,
          level: 'advanced', // Pokročilý elektronický podpis
          qualified: false,  // Nie je kvalifikovaný (bez eID karty)
          jurisdiction: 'SK'
        }
      };
      
      onSave(enhancedSignature);
      
    } catch (error) {
      console.error('Enhanced signature failed:', error);
      
      // Fallback na základný podpis
      const basicSignature = {
        id: uuidv4(),
        signerName,
        signerRole,
        signatureData: canvasData,
        timestamp: new Date(),
        location: '',
        legalCompliance: {
          eIDAS: false,
          level: 'basic',
          qualified: false,
          jurisdiction: 'SK'
        }
      };
      
      onSave(basicSignature);
      
    } finally {
      setIsAddingTimestamp(false);
    }
  };
  
  const collectAuditTrail = async (): Promise<AuditTrail> => {
    // Zbieranie kontextových dát
    const position = await this.getCurrentPosition();
    
    return {
      ipAddress: await this.getPublicIP(),
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      geolocation: position ? {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      } : undefined,
      deviceInfo: {
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      }
    };
  };
  
  return (
    <Box>
      {/* Základný SignaturePad (zachovaný) */}
      <SignaturePad
        onSave={handleSignatureSave}
        onBiometricData={setBiometrics} // Nový prop pre biometrické dáta
      />
      
      {/* Loading indicator pre TSA */}
      {isAddingTimestamp && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2">
            Pridávam kvalifikovanú časovú pečiatku...
          </Typography>
        </Box>
      )}
      
      {/* Info o právnej platnosti */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          ✅ Podpis bude mať <strong>pokročilú právnu platnosť</strong> s kvalifikovanou časovou pečiatkou od Disig.
        </Typography>
        <Typography variant="caption">
          Náklady: €0.02 za podpis | Platnosť: 20 rokov
        </Typography>
      </Alert>
    </Box>
  );
};
```

#### **2A.3 Cost Management (30 min)**
```typescript
// src/services/signatureCostManager.ts
export class SignatureCostManager {
  private monthlyBudget = 50; // €50/mesiac limit
  private costPerSignature = 0.02; // €0.02 za Disig TSA
  
  async checkBudget(): Promise<{ canSign: boolean; remaining: number; used: number }> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const usedThisMonth = await this.getMonthlyUsage(currentMonth);
    const remaining = this.monthlyBudget - usedThisMonth;
    
    return {
      canSign: remaining >= this.costPerSignature,
      remaining,
      used: usedThisMonth
    };
  }
  
  async recordSignature(signatureId: string, cost: number): Promise<void> {
    const record = {
      id: signatureId,
      cost,
      timestamp: new Date(),
      month: new Date().toISOString().slice(0, 7)
    };
    
    // Ulož do localStorage alebo backend
    const existing = JSON.parse(localStorage.getItem('signature_costs') || '[]');
    existing.push(record);
    localStorage.setItem('signature_costs', JSON.stringify(existing));
  }
  
  async getMonthlyReport(): Promise<CostReport> {
    const costs = JSON.parse(localStorage.getItem('signature_costs') || '[]');
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const thisMonth = costs.filter(c => c.month === currentMonth);
    const totalCost = thisMonth.reduce((sum, c) => sum + c.cost, 0);
    const signatureCount = thisMonth.length;
    
    return {
      month: currentMonth,
      totalCost,
      signatureCount,
      averageCostPerSignature: signatureCount > 0 ? totalCost / signatureCount : 0,
      budgetUsed: (totalCost / this.monthlyBudget) * 100
    };
  }
}
```

---

## 🔐 FÁZA 2B: Autogram voliteľná integrácia (6 hodín)

### **Cieľ: Kvalifikované elektronické podpisy pre dôležité protokoly**

#### **2B.1 Autogram Detection & Integration (3 hodiny)**
```typescript
// src/services/autogramService.ts
export class AutogramService {
  private autogramUrl = 'http://localhost:37200';
  private protocolScheme = 'autogram://';
  
  async checkAvailability(): Promise<AutogramStatus> {
    try {
      // 1. Skús HTTP API
      const response = await fetch(`${this.autogramUrl}/info`, {
        method: 'GET',
        timeout: 2000 // 2s timeout
      });
      
      if (response.ok) {
        const info = await response.json();
        return {
          available: true,
          version: info.version,
          method: 'http_api',
          supportedCards: info.supportedCards || []
        };
      }
      
    } catch (httpError) {
      // 2. Skús protocol handler
      try {
        const protocolSupported = await this.testProtocolHandler();
        if (protocolSupported) {
          return {
            available: true,
            version: 'unknown',
            method: 'protocol_handler',
            supportedCards: ['slovak_eid', 'czech_eid', 'pkcs11']
          };
        }
      } catch (protocolError) {
        // Autogram nie je dostupný
      }
    }
    
    return {
      available: false,
      method: null,
      installUrl: 'https://github.com/slovensko-digital/autogram/releases'
    };
  }
  
  async signDocument(documentHash: string, format: 'XAdES' | 'PAdES' = 'XAdES'): Promise<AutogramSignature> {
    const status = await this.checkAvailability();
    
    if (!status.available) {
      throw new Error('Autogram nie je nainštalovaný');
    }
    
    if (status.method === 'http_api') {
      return await this.signViaAPI(documentHash, format);
    } else {
      return await this.signViaProtocol(documentHash, format);
    }
  }
  
  private async signViaAPI(documentHash: string, format: string): Promise<AutogramSignature> {
    const response = await fetch(`${this.autogramUrl}/api/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: {
          hash: documentHash,
          hashAlgorithm: 'SHA-256'
        },
        parameters: {
          format,
          level: 'XL', // XAdES-X-L (s časovou pečiatkou)
          packaging: 'ENVELOPED'
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Autogram signing failed: ${error.message}`);
    }
    
    const result = await response.json();
    
    return {
      signature: result.signature,
      certificate: result.certificate,
      timestamp: result.timestamp,
      algorithm: format,
      level: 'qualified'
    };
  }
  
  private async signViaProtocol(documentHash: string, format: string): Promise<AutogramSignature> {
    return new Promise((resolve, reject) => {
      // 1. Vytvor callback URL
      const callbackUrl = `${window.location.origin}/autogram-callback`;
      
      // 2. Registruj message listener
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'autogram_signature') {
          window.removeEventListener('message', handleMessage);
          resolve(event.data.signature);
        } else if (event.data.type === 'autogram_error') {
          window.removeEventListener('message', handleMessage);
          reject(new Error(event.data.error));
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // 3. Spusti Autogram
      const params = new URLSearchParams({
        document: documentHash,
        format,
        callback: callbackUrl
      });
      
      window.location.href = `${this.protocolScheme}sign?${params}`;
      
      // 4. Timeout po 5 minútach
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        reject(new Error('Autogram signing timeout'));
      }, 5 * 60 * 1000);
    });
  }
}
```

#### **2B.2 Signature Selection UI (2 hodiny)**
```typescript
// src/components/common/SignatureSelector.tsx
export const SignatureSelector: React.FC<Props> = ({ 
  protocolHash, 
  onSignatureComplete 
}) => {
  const [autogramStatus, setAutogramStatus] = useState<AutogramStatus | null>(null);
  const [signingMethod, setSigningMethod] = useState<'basic' | 'qualified' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const autogramService = new AutogramService();
  const costManager = new SignatureCostManager();
  
  useEffect(() => {
    // Skontroluj dostupnosť Autogram pri načítaní
    autogramService.checkAvailability().then(setAutogramStatus);
  }, []);
  
  const handleBasicSign = async () => {
    setIsLoading(true);
    setSigningMethod('basic');
    
    try {
      // Použiť enhanced signature pad s Disig TSA
      // (implementované v FÁZA 2A)
      
    } catch (error) {
      console.error('Basic signing failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleQualifiedSign = async () => {
    if (!autogramStatus?.available) {
      setShowInstallDialog(true);
      return;
    }
    
    setIsLoading(true);
    setSigningMethod('qualified');
    
    try {
      // 1. Skontroluj budget
      const budget = await costManager.checkBudget();
      if (!budget.canSign) {
        throw new Error(`Mesačný budget vyčerpaný. Zostáva: €${budget.remaining}`);
      }
      
      // 2. Podpíš cez Autogram
      const signature = await autogramService.signDocument(protocolHash);
      
      // 3. Pridaj Disig TSA pre extra validitu
      const disigTSA = new DisigTSAService();
      const qualifiedTimestamp = await disigTSA.addQualifiedTimestamp(signature.signature);
      
      // 4. Vytvor kvalifikovaný podpis
      const qualifiedSignature: QualifiedSignature = {
        id: uuidv4(),
        autogramSignature: signature,
        disigTimestamp: qualifiedTimestamp,
        legalCompliance: {
          eIDAS: true,
          level: 'qualified',
          qualified: true,
          jurisdiction: 'SK'
        },
        cost: 0.02 // Disig TSA cost
      };
      
      // 5. Zaznamenaj náklady
      await costManager.recordSignature(qualifiedSignature.id, qualifiedSignature.cost);
      
      onSignatureComplete(qualifiedSignature);
      
    } catch (error) {
      console.error('Qualified signing failed:', error);
      
      // Fallback na basic signing
      toast.error(`Kvalifikovaný podpis zlyhal: ${error.message}. Použijem základný podpis.`);
      await handleBasicSign();
      
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Vyberte typ podpisu
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Pre bežné použitie stačí rýchly podpis. Kvalifikovaný podpis použite len pri sporoch 
        alebo dôležitých protokoloch.
      </Alert>
      
      <Grid container spacing={3}>
        {/* Rýchly podpis - odporúčaný */}
        <Grid item xs={12} md={6}>
          <Card 
            variant="outlined" 
            sx={{ 
              border: '2px solid',
              borderColor: 'success.main',
              position: 'relative'
            }}
          >
            <Chip 
              label="ODPORÚČANÉ" 
              color="success" 
              size="small"
              sx={{ position: 'absolute', top: 8, right: 8 }}
            />
            
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Edit sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">
                  Rýchly podpis
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                • Okamžité podpísanie na mobile/desktop<br/>
                • Pokročilá právna platnosť (Disig TSA)<br/>
                • Stačí pre 99% prípadov<br/>
                • Náklady: €0.02
              </Typography>
              
              <Button 
                variant="contained" 
                color="success"
                fullWidth
                onClick={handleBasicSign}
                disabled={isLoading}
                startIcon={isLoading && signingMethod === 'basic' ? <CircularProgress size={16} /> : <Edit />}
              >
                {isLoading && signingMethod === 'basic' ? 'Podpisujem...' : 'Podpísať teraz'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Kvalifikovaný podpis */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Kvalifikovaný podpis
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                • Plná súdna platnosť (eIDAS)<br/>
                • Vyžaduje eID kartu + Autogram<br/>
                • Pre spory a dôležité protokoly<br/>
                • Náklady: €0.02
              </Typography>
              
              {autogramStatus?.available ? (
                <Button 
                  variant="outlined" 
                  color="primary"
                  fullWidth
                  onClick={handleQualifiedSign}
                  disabled={isLoading}
                  startIcon={isLoading && signingMethod === 'qualified' ? <CircularProgress size={16} /> : <Security />}
                >
                  {isLoading && signingMethod === 'qualified' ? 'Podpisujem...' : 'Podpísať s eID'}
                </Button>
              ) : (
                <Button 
                  variant="outlined" 
                  color="warning"
                  fullWidth
                  onClick={() => setShowInstallDialog(true)}
                  startIcon={<Download />}
                >
                  Nainštalovať Autogram
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Autogram Installation Dialog */}
      <AutogramInstallDialog 
        open={showInstallDialog}
        onClose={() => setShowInstallDialog(false)}
        autogramStatus={autogramStatus}
      />
    </Box>
  );
};
```

#### **2B.3 Installation Helper (1 hodina)**
```typescript
// src/components/common/AutogramInstallDialog.tsx
export const AutogramInstallDialog: React.FC<Props> = ({ 
  open, 
  onClose, 
  autogramStatus 
}) => {
  const [installStep, setInstallStep] = useState(1);
  
  const getDownloadUrl = () => {
    const platform = navigator.platform.toLowerCase();
    const baseUrl = 'https://github.com/slovensko-digital/autogram/releases/latest/download/';
    
    if (platform.includes('win')) {
      return `${baseUrl}autogram-setup.exe`;
    } else if (platform.includes('mac')) {
      return `${baseUrl}autogram.dmg`;
    } else {
      return `${baseUrl}autogram.deb`; // Linux
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Download sx={{ mr: 1 }} />
          Inštalácia Autogram
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={installStep - 1} orientation="vertical">
          <Step>
            <StepLabel>Stiahnuť Autogram</StepLabel>
            <StepContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Autogram je bezplatná aplikácia od Slovensko.Digital pre elektronické podpisovanie.
              </Typography>
              
              <Button 
                variant="contained" 
                href={getDownloadUrl()}
                target="_blank"
                startIcon={<Download />}
                onClick={() => setInstallStep(2)}
              >
                Stiahnuť pre {navigator.platform}
              </Button>
            </StepContent>
          </Step>
          
          <Step>
            <StepLabel>Nainštalovať aplikáciu</StepLabel>
            <StepContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Spustite stiahnutý súbor a postupujte podľa inštrukcií inštalátora.
              </Typography>
              
              <Button 
                variant="outlined"
                onClick={() => setInstallStep(3)}
              >
                Hotovo, pokračovať
              </Button>
            </StepContent>
          </Step>
          
          <Step>
            <StepLabel>Testovať pripojenie</StepLabel>
            <StepContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Skontrolujeme či Autogram beží a je dostupný.
              </Typography>
              
              <Button 
                variant="contained"
                onClick={async () => {
                  const status = await new AutogramService().checkAvailability();
                  if (status.available) {
                    toast.success('Autogram úspešne nainštalovaný!');
                    onClose();
                  } else {
                    toast.error('Autogram sa nepodarilo nájsť. Skúste reštartovať prehliadač.');
                  }
                }}
              >
                Otestovať pripojenie
              </Button>
            </StepContent>
          </Step>
        </Stepper>
        
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Potrebujete eID kartu:</strong> Pre kvalifikované podpisy potrebujete slovenskú 
            alebo českú eID kartu s platným certifikátom.
          </Typography>
        </Alert>
      </DialogContent>
    </Dialog>
  );
};
```

---

## 🎨 FÁZA 2C: Konzistentné UI komponenty (4 hodiny)

### **Cieľ: Jednotný design language pre všetky protokoly**

#### **2C.1 Protocol-specific Components (2 hodiny)**
```typescript
// src/design-system/components/ProtocolCard/ProtocolCard.tsx
interface ProtocolCardProps {
  type: 'handover' | 'return';
  title: string;
  customer: string;
  vehicle: string;
  date: Date;
  status: 'draft' | 'completed' | 'signed';
  photos?: number;
  onEdit?: () => void;
  onView?: () => void;
  onSign?: () => void;
}

export const ProtocolCard: React.FC<ProtocolCardProps> = ({
  type,
  title,
  customer,
  vehicle,
  date,
  status,
  photos = 0,
  onEdit,
  onView,
  onSign
}) => {
  const statusConfig = {
    draft: { color: 'bg-yellow-100 text-yellow-800', label: 'Rozpracovaný' },
    completed: { color: 'bg-blue-100 text-blue-800', label: 'Dokončený' },
    signed: { color: 'bg-green-100 text-green-800', label: 'Podpísaný' }
  };
  
  const typeConfig = {
    handover: { icon: '🚗', label: 'Odovzdávací', color: 'text-blue-600' },
    return: { icon: '🔄', label: 'Preberací', color: 'text-green-600' }
  };
  
  return (
    <Card padding="md" shadow="md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{typeConfig[type].icon}</span>
            <h3 className={`font-semibold text-lg ${typeConfig[type].color}`}>
              {typeConfig[type].label} protokol
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status].color}`}>
              {statusConfig[status].label}
            </span>
          </div>
          
          {/* Details */}
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-medium">Zákazník:</span>
              <span>{customer}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Vozidlo:</span>
              <span>{vehicle}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Dátum:</span>
              <span>{date.toLocaleDateString('sk-SK')}</span>
            </div>
            {photos > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-medium">📸 Fotky:</span>
                <span>{photos}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-2">
          {status === 'draft' && onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Upraviť
            </Button>
          )}
          {(status === 'completed' || status === 'signed') && onView && (
            <Button variant="outline" size="sm" onClick={onView}>
              Zobraziť
            </Button>
          )}
          {status === 'completed' && onSign && (
            <Button variant="primary" size="sm" onClick={onSign}>
              Podpísať
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

// src/design-system/components/PhotoGrid/PhotoGrid.tsx
interface PhotoGridProps {
  photos: Array<{
    id: string;
    url: string;
    category: 'vehicle' | 'damage' | 'document' | 'odometer' | 'fuel';
    description?: string;
  }>;
  onPhotoClick?: (photo: any, index: number) => void;
  onAddPhoto?: (category: string) => void;
  maxPhotos?: number;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  onPhotoClick,
  onAddPhoto,
  maxPhotos = 50
}) => {
  const categoryConfig = {
    vehicle: { label: 'Vozidlo', color: 'bg-blue-100 text-blue-800', icon: '🚗' },
    damage: { label: 'Poškodenie', color: 'bg-red-100 text-red-800', icon: '⚠️' },
    document: { label: 'Doklady', color: 'bg-green-100 text-green-800', icon: '📄' },
    odometer: { label: 'Tachometer', color: 'bg-purple-100 text-purple-800', icon: '📊' },
    fuel: { label: 'Palivo', color: 'bg-orange-100 text-orange-800', icon: '⛽' }
  };
  
  const groupedPhotos = photos.reduce((acc, photo) => {
    if (!acc[photo.category]) acc[photo.category] = [];
    acc[photo.category].push(photo);
    return acc;
  }, {} as Record<string, typeof photos>);
  
  return (
    <div className="space-y-6">
      {Object.entries(categoryConfig).map(([category, config]) => (
        <div key={category}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{config.icon}</span>
              <h4 className="font-medium text-gray-900">{config.label}</h4>
              <span className={`px-2 py-1 rounded-full text-xs ${config.color}`}>
                {groupedPhotos[category]?.length || 0} fotiek
              </span>
            </div>
            
            {onAddPhoto && (groupedPhotos[category]?.length || 0) < maxPhotos && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onAddPhoto(category)}
              >
                + Pridať fotku
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {groupedPhotos[category]?.map((photo, index) => (
              <div
                key={photo.id}
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onPhotoClick?.(photo, index)}
              >
                <img
                  src={photo.url}
                  alt={photo.description || `${config.label} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )) || (
              <div className="col-span-full text-center py-8 text-gray-500">
                Žiadne fotky v kategórii {config.label}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

#### **2C.2 Signature Components (1 hodina)**
```typescript
// src/design-system/components/SignatureSection/SignatureSection.tsx
interface SignatureSectionProps {
  signatures: Array<{
    id: string;
    signerName: string;
    signerRole: 'customer' | 'employee';
    signatureData: string;
    timestamp: Date;
    legalLevel?: 'basic' | 'advanced' | 'qualified';
  }>;
  onAddSignature?: (role: 'customer' | 'employee') => void;
  onRemoveSignature?: (id: string) => void;
  required?: boolean;
}

export const SignatureSection: React.FC<SignatureSectionProps> = ({
  signatures,
  onAddSignature,
  onRemoveSignature,
  required = true
}) => {
  const hasCustomerSignature = signatures.some(s => s.signerRole === 'customer');
  const hasEmployeeSignature = signatures.some(s => s.signerRole === 'employee');
  
  const legalLevelConfig = {
    basic: { label: 'Základný', color: 'bg-gray-100 text-gray-800' },
    advanced: { label: 'Pokročilý', color: 'bg-blue-100 text-blue-800' },
    qualified: { label: 'Kvalifikovaný', color: 'bg-green-100 text-green-800' }
  };
  
  return (
    <Card padding="md">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Podpisy {required && <span className="text-red-500">*</span>}
          </h3>
          <div className="text-sm text-gray-500">
            {signatures.length}/2 podpisy
          </div>
        </div>
        
        {/* Existing signatures */}
        {signatures.length > 0 && (
          <div className="space-y-3">
            {signatures.map(signature => (
              <div key={signature.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{signature.signerName}</span>
                      <span className="text-sm text-gray-500">
                        ({signature.signerRole === 'customer' ? 'Zákazník' : 'Zamestnanec'})
                      </span>
                      {signature.legalLevel && (
                        <span className={`px-2 py-1 rounded-full text-xs ${legalLevelConfig[signature.legalLevel].color}`}>
                          {legalLevelConfig[signature.legalLevel].label}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <img
                        src={signature.signatureData}
                        alt={`Podpis ${signature.signerName}`}
                        className="h-16 border rounded bg-white"
                      />
                      <div className="text-sm text-gray-500">
                        Podpísané: {signature.timestamp.toLocaleString('sk-SK')}
                      </div>
                    </div>
                  </div>
                  
                  {onRemoveSignature && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveSignature(signature.id)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Add signature buttons */}
        {onAddSignature && (
          <div className="flex gap-3">
            {!hasCustomerSignature && (
              <Button
                variant="outline"
                onClick={() => onAddSignature('customer')}
                className="flex-1"
              >
                👤 Podpis zákazníka
              </Button>
            )}
            
            {!hasEmployeeSignature && (
              <Button
                variant="outline"
                onClick={() => onAddSignature('employee')}
                className="flex-1"
              >
                👨‍💼 Podpis zamestnanca
              </Button>
            )}
          </div>
        )}
        
        {required && (!hasCustomerSignature || !hasEmployeeSignature) && (
          <div className="text-sm text-red-600">
            ⚠️ Vyžadujú sa podpisy zákazníka aj zamestnanca
          </div>
        )}
      </div>
    </Card>
  );
};
```

#### **2C.3 Form Layout Components (1 hodina)**
```typescript
// src/design-system/components/ProtocolForm/ProtocolForm.tsx
interface ProtocolFormProps {
  title: string;
  type: 'handover' | 'return';
  children: React.ReactNode;
  onSave?: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  saving?: boolean;
  canSave?: boolean;
}

export const ProtocolForm: React.FC<ProtocolFormProps> = ({
  title,
  type,
  children,
  onSave,
  onCancel,
  saveLabel = 'Uložiť protokol',
  saving = false,
  canSave = true
}) => {
  const typeConfig = {
    handover: { icon: '🚗', color: 'text-blue-600', bg: 'bg-blue-50' },
    return: { icon: '🔄', color: 'text-green-600', bg: 'bg-green-50' }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className={`${typeConfig[type].bg} rounded-lg p-4`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{typeConfig[type].icon}</span>
          <div>
            <h1 className={`text-2xl font-bold ${typeConfig[type].color}`}>
              {title}
            </h1>
            <p className="text-gray-600">
              {type === 'handover' ? 'Odovzdávanie vozidla zákazníkovi' : 'Preberanie vozidla od zákazníka'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Form content */}
      <div className="space-y-6">
        {children}
      </div>
      
      {/* Actions */}
      {(onSave || onCancel) && (
        <div className="flex justify-end gap-3 pt-6 border-t">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={saving}>
              Zrušiť
            </Button>
          )}
          {onSave && (
            <Button
              variant="primary"
              onClick={onSave}
              disabled={!canSave || saving}
              loading={saving}
            >
              {saveLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// src/design-system/components/FormSection/FormSection.tsx
interface FormSectionProps {
  title: string;
  description?: string;
  icon?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  icon,
  children,
  collapsible = false,
  defaultExpanded = true
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  return (
    <Card padding="md">
      <div
        className={`flex items-center justify-between mb-4 ${
          collapsible ? 'cursor-pointer' : ''
        }`}
        onClick={collapsible ? () => setExpanded(!expanded) : undefined}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
          </div>
        </div>
        
        {collapsible && (
          <Button variant="ghost" size="sm">
            {expanded ? '▼' : '▶'}
          </Button>
        )}
      </div>
      
      {expanded && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </Card>
  );
};
```

---

## 🖼️ FÁZA 3A: Vylepšená galéria (4 hodiny)

### **Cieľ: Profesionálna galéria bez extra závislostí**

#### **3A.1 CSS Transform Gallery (2 hodiny)**
```typescript
// src/components/common/EnhancedProtocolGallery.tsx
export const EnhancedProtocolGallery: React.FC<Props> = ({
  images,
  videos,
  open,
  onClose,
  initialIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const allMedia = [...images, ...videos];
  const currentMedia = allMedia[currentIndex];
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!open) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          previousImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          setZoom(prev => Math.min(prev * 1.2, 5));
          break;
        case '-':
          setZoom(prev => Math.max(prev / 1.2, 0.5));
          break;
        case '0':
          resetZoomAndPan();
          break;
        case 'Home':
          setCurrentIndex(0);
          break;
        case 'End':
          setCurrentIndex(allMedia.length - 1);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [open, allMedia.length]);
  
  // Touch/Mouse gestures
  const handlePointerDown = (event: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ 
      x: event.clientX - pan.x, 
      y: event.clientY - pan.y 
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  
  const handlePointerMove = (event: React.PointerEvent) => {
    if (!isDragging) return;
    
    setPan({
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y
    });
  };
  
  const handlePointerUp = (event: React.PointerEvent) => {
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };
  
  // Pinch to zoom (touch devices)
  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.5), 5);
    
    setZoom(newZoom);
  };
  
  const resetZoomAndPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  
  const previousImage = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : allMedia.length - 1;
    setCurrentIndex(newIndex);
    resetZoomAndPan();
  };
  
  const nextImage = () => {
    const newIndex = currentIndex < allMedia.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    resetZoomAndPan();
  };
  
  const downloadImage = async () => {
    try {
      const response = await fetch(currentMedia.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `blackrent-photo-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Sťahovanie zlyhalo');
    }
  };
  
  if (!open) return null;
  
  return (
    <Dialog 
      fullScreen 
      open={open} 
      onClose={onClose}
      sx={{ 
        '& .MuiDialog-paper': { 
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          color: 'white'
        }
      }}
    >
      {/* Header */}
      <Box sx={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6">
          Fotka {currentIndex + 1} z {allMedia.length}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Zoom controls */}
          <IconButton onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.5))} sx={{ color: 'white' }}>
            <ZoomOut />
          </IconButton>
          <Typography variant="body2" sx={{ alignSelf: 'center', minWidth: 40, textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </Typography>
          <IconButton onClick={() => setZoom(prev => Math.min(prev * 1.2, 5))} sx={{ color: 'white' }}>
            <ZoomIn />
          </IconButton>
          
          <Divider orientation="vertical" sx={{ bgcolor: 'white', mx: 1 }} />
          
          {/* Actions */}
          <IconButton onClick={downloadImage} sx={{ color: 'white' }}>
            <Download />
          </IconButton>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
      </Box>
      
      {/* Main Image Area */}
      <Box sx={{ 
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pt: 8,
        pb: 12,
        overflow: 'hidden'
      }}>
        {/* Navigation Arrows */}
        <IconButton
          onClick={previousImage}
          sx={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
          }}
        >
          <ArrowBack />
        </IconButton>
        
        <IconButton
          onClick={nextImage}
          sx={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
          }}
        >
          <ArrowForward />
        </IconButton>
        
        {/* Zoomable Image */}
        <Box
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
            touchAction: 'none' // Prevent browser zoom
          }}
        >
          <img
            src={currentMedia.url}
            alt={`Fotka ${currentIndex + 1}`}
            style={{
              maxWidth: zoom > 1 ? 'none' : '100%',
              maxHeight: zoom > 1 ? 'none' : '100%',
              width: zoom > 1 ? `${zoom * 100}%` : 'auto',
              height: zoom > 1 ? `${zoom * 100}%` : 'auto',
              objectFit: 'contain',
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
          />
        </Box>
      </Box>
      
      {/* Thumbnails */}
      <Box sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
        p: 2,
        display: 'flex',
        justifyContent: 'center',
        overflowX: 'auto',
        gap: 1
      }}>
        {allMedia.map((media, index) => (
          <Box
            key={media.id}
            onClick={() => {
              setCurrentIndex(index);
              resetZoomAndPan();
            }}
            sx={{
              width: 80,
              height: 60,
              flexShrink: 0,
              cursor: 'pointer',
              border: index === currentIndex ? '2px solid white' : '2px solid transparent',
              borderRadius: 1,
              overflow: 'hidden',
              opacity: index === currentIndex ? 1 : 0.7,
              transition: 'all 0.2s ease',
              '&:hover': { opacity: 1 }
            }}
          >
            <img
              src={media.url}
              alt={`Thumbnail ${index + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </Box>
        ))}
      </Box>
      
      {/* Help overlay */}
      <Box sx={{
        position: 'fixed',
        bottom: 100,
        left: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 1,
        p: 1,
        fontSize: '0.75rem'
      }}>
        <Typography variant="caption">
          ← → Navigácia | + - Zoom | 0 Reset | Esc Zavrieť
        </Typography>
      </Box>
    </Dialog>
  );
};
```

#### **3A.2 Lazy Loading & Preloading (1 hodina)**
```typescript
// src/hooks/useImagePreloader.ts
export const useImagePreloader = (
  images: string[],
  currentIndex: number,
  preloadRange: number = 2
) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const imagesToPreload = [];
    
    // Preload current and nearby images
    for (let i = Math.max(0, currentIndex - preloadRange); 
         i <= Math.min(images.length - 1, currentIndex + preloadRange); 
         i++) {
      if (!loadedImages.has(images[i]) && !loadingImages.has(images[i])) {
        imagesToPreload.push(images[i]);
      }
    }
    
    if (imagesToPreload.length === 0) return;
    
    // Mark as loading
    setLoadingImages(prev => new Set([...prev, ...imagesToPreload]));
    
    // Preload images
    imagesToPreload.forEach(src => {
      const img = new Image();
      
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(src));
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
      };
      
      img.onerror = () => {
        console.warn(`Failed to preload image: ${src}`);
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
      };
      
      img.src = src;
    });
  }, [currentIndex, images, preloadRange, loadedImages, loadingImages]);
  
  return { loadedImages, loadingImages };
};

// Progressive loading component
export const ProgressiveImage: React.FC<{
  src: string;
  alt: string;
  style?: React.CSSProperties;
}> = ({ src, alt, style }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  return (
    <Box sx={{ position: 'relative', ...style }}>
      {!loaded && !error && (
        <Box sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.1)'
        }}>
          <CircularProgress size={40} />
        </Box>
      )}
      
      {error && (
        <Box sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: 'text.secondary'
        }}>
          <ErrorOutline sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="caption">
            Obrázok sa nepodarilo načítať
          </Typography>
        </Box>
      )}
      
      <img
        src={src}
        alt={alt}
        style={{
          ...style,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </Box>
  );
};
```

#### **3A.3 Touch Gestures (1 hodina)**
```typescript
// src/hooks/useGestures.ts
export const useGestures = (
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  onPinchZoom: (scale: number) => void,
  threshold: number = 50
) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  
  const getTouchDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };
  
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - swipe gesture
      setTouchEnd(null);
      setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      });
    } else if (e.touches.length === 2) {
      // Two touches - pinch gesture
      const distance = getTouchDistance(e.touches);
      setInitialPinchDistance(distance);
    }
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStart) {
      // Single touch - track for swipe
      setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      });
    } else if (e.touches.length === 2 && initialPinchDistance) {
      // Two touches - pinch zoom
      const currentDistance = getTouchDistance(e.touches);
      const scale = currentDistance / initialPinchDistance;
      onPinchZoom(scale);
    }
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    
    // Check if it's a horizontal swipe (not vertical scroll)
    if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > threshold) {
      if (distanceX > 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }
    
    // Reset
    setTouchStart(null);
    setTouchEnd(null);
    setInitialPinchDistance(null);
  };
  
  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
};
```

---

## 💾 FÁZA 3B: Offline draft support (2 hodiny)

### **Cieľ: Ukladanie rozpracovaných protokolov offline**

#### **3B.1 Draft Manager (1 hodina)**
```typescript
// src/services/draftManager.ts
export class DraftManager {
  private dbName = 'BlackRentDrafts';
  private storeName = 'protocolDrafts';
  
  async saveDraft(protocolData: Partial<HandoverProtocol | ReturnProtocol>): Promise<string> {
    const draftId = protocolData.id || uuidv4();
    
    const draft: ProtocolDraft = {
      id: draftId,
      type: protocolData.type || 'handover',
      data: protocolData,
      lastModified: new Date(),
      autoSaved: true,
      photos: await this.serializePhotos(protocolData.vehicleImages || []),
      signatures: protocolData.signatures || []
    };
    
    const db = await this.openDB();
    const tx = db.transaction(this.storeName, 'readwrite');
    await tx.objectStore(this.storeName).put(draft);
    
    console.log(`📝 Draft saved: ${draftId}`);
    return draftId;
  }
  
  async loadDraft(draftId: string): Promise<ProtocolDraft | null> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.storeName, 'readonly');
      const draft = await tx.objectStore(this.storeName).get(draftId);
      
      if (draft) {
        // Deserialize photos
        draft.photos = await this.deserializePhotos(draft.photos);
      }
      
      return draft || null;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }
  
  async getAllDrafts(): Promise<ProtocolDraft[]> {
    const db = await this.openDB();
    const tx = db.transaction(this.storeName, 'readonly');
    const drafts = await tx.objectStore(this.storeName).getAll();
    
    // Sort by last modified (newest first)
    return drafts.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
  }
  
  async deleteDraft(draftId: string): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction(this.storeName, 'readwrite');
    await tx.objectStore(this.storeName).delete(draftId);
    
    console.log(`🗑️ Draft deleted: ${draftId}`);
  }
  
  // Auto-save every 30 seconds
  startAutoSave(
    getDraftData: () => Partial<HandoverProtocol | ReturnProtocol>,
    interval: number = 30000
  ): () => void {
    const intervalId = setInterval(async () => {
      try {
        const data = getDraftData();
        if (this.hasChanges(data)) {
          await this.saveDraft(data);
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, interval);
    
    return () => clearInterval(intervalId);
  }
  
  private async serializePhotos(photos: ProtocolImage[]): Promise<SerializedPhoto[]> {
    return Promise.all(photos.map(async photo => {
      if (photo.url.startsWith('blob:')) {
        // Convert blob to base64 for storage
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const base64 = await this.blobToBase64(blob);
        
        return {
          ...photo,
          url: base64,
          isBlob: true
        };
      }
      
      return {
        ...photo,
        isBlob: false
      };
    }));
  }
  
  private async deserializePhotos(serializedPhotos: SerializedPhoto[]): Promise<ProtocolImage[]> {
    return serializedPhotos.map(photo => {
      if (photo.isBlob && photo.url.startsWith('data:')) {
        // Convert base64 back to blob URL
        const blob = this.base64ToBlob(photo.url);
        const blobUrl = URL.createObjectURL(blob);
        
        return {
          ...photo,
          url: blobUrl
        };
      }
      
      return photo as ProtocolImage;
    });
  }
}
```

#### **3B.2 Draft UI Integration (1 hodina)**
```typescript
// src/components/common/DraftManager.tsx
export const DraftManagerDialog: React.FC<Props> = ({ open, onClose, onLoadDraft }) => {
  const [drafts, setDrafts] = useState<ProtocolDraft[]>([]);
  const [loading, setLoading] = useState(true);
  
  const draftManager = new DraftManager();
  
  useEffect(() => {
    if (open) {
      loadDrafts();
    }
  }, [open]);
  
  const loadDrafts = async () => {
    setLoading(true);
    try {
      const allDrafts = await draftManager.getAllDrafts();
      setDrafts(allDrafts);
    } catch (error) {
      console.error('Failed to load drafts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLoadDraft = async (draft: ProtocolDraft) => {
    try {
      onLoadDraft(draft);
      onClose();
      toast.success('Draft načítaný');
    } catch (error) {
      toast.error('Chyba pri načítaní draft-u');
    }
  };
  
  const handleDeleteDraft = async (draftId: string) => {
    try {
      await draftManager.deleteDraft(draftId);
      setDrafts(prev => prev.filter(d => d.id !== draftId));
      toast.success('Draft zmazaný');
    } catch (error) {
      toast.error('Chyba pri mazaní draft-u');
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Save sx={{ mr: 1 }} />
          Rozpracované protokoly
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : drafts.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="body1" color="text.secondary">
              Žiadne rozpracované protokoly
            </Typography>
          </Box>
        ) : (
          <List>
            {drafts.map(draft => (
              <ListItem key={draft.id} divider>
                <ListItemIcon>
                  {draft.type === 'handover' ? <DirectionsCar /> : <AssignmentReturn />}
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">
                        {draft.type === 'handover' ? 'Odovzdávací' : 'Preberací'} protokol
                      </Typography>
                      {draft.autoSaved && (
                        <Chip label="Auto-save" size="small" color="primary" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Posledná úprava: {formatDistanceToNow(new Date(draft.lastModified), { 
                          addSuffix: true, 
                          locale: sk 
                        })}
                      </Typography>
                      {draft.data.customer && (
                        <Typography variant="body2">
                          Zákazník: {draft.data.customer.name || draft.data.customerName}
                        </Typography>
                      )}
                      {draft.photos.length > 0 && (
                        <Typography variant="body2">
                          📸 {draft.photos.length} fotiek
                        </Typography>
                      )}
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction>
                  <IconButton 
                    onClick={() => handleLoadDraft(draft)}
                    color="primary"
                  >
                    <OpenInNew />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDeleteDraft(draft.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Auto-save hook pre protokoly
export const useAutoSave = (
  formData: Partial<HandoverProtocol | ReturnProtocol>,
  enabled: boolean = true
) => {
  const draftManager = new DraftManager();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  useEffect(() => {
    if (!enabled) return;
    
    const stopAutoSave = draftManager.startAutoSave(
      () => formData,
      30000 // 30 sekúnd
    );
    
    return stopAutoSave;
  }, [formData, enabled]);
  
  const manualSave = async () => {
    try {
      await draftManager.saveDraft(formData);
      setLastSaved(new Date());
      toast.success('Draft uložený');
    } catch (error) {
      toast.error('Chyba pri ukladaní draft-u');
    }
  };
  
  return { lastSaved, manualSave };
};
```

---

## 🧹 FÁZA 4: V2 Cleanup (postupne - 2 hodiny)

### **Stratégia: Deprecate → Monitor → Remove**

#### **4.1 Deprecation Warnings (30 min)**
```typescript
// src/components/protocols/v2/DeprecationWarning.tsx
export const V2DeprecationWarning: React.FC = () => {
  const [dismissed, setDismissed] = useState(
    localStorage.getItem('v2_deprecation_dismissed') === 'true'
  );
  
  if (dismissed) return null;
  
  const handleDismiss = () => {
    localStorage.setItem('v2_deprecation_dismissed', 'true');
    setDismissed(true);
  };
  
  return (
    <Alert 
      severity="warning" 
      sx={{ mb: 2 }}
      action={
        <IconButton size="small" onClick={handleDismiss}>
          <Close />
        </IconButton>
      }
    >
      <AlertTitle>Zastaralá funkcia</AlertTitle>
      <Typography variant="body2">
        Protocol V2 je označený ako zastaralý a bude odstránený v budúcej verzii. 
        Prosím, používajte nový vylepšený systém protokolov.
      </Typography>
      <Button 
        size="small" 
        href="mailto:support@blackrent.sk?subject=Protocol V2 Usage"
        sx={{ mt: 1 }}
      >
        Nahlásiť použitie
      </Button>
    </Alert>
  );
};
```

#### **4.2 Usage Monitoring (30 min)**
```typescript
// src/utils/usageMonitor.ts
export class UsageMonitor {
  private static logV2Usage(component: string, action: string) {
    const usage = {
      component,
      action,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Log to console
    console.warn('🚨 V2 Component Usage:', usage);
    
    // Send to backend (optional)
    fetch('/api/usage/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usage)
    }).catch(() => {}); // Ignore errors
    
    // Store locally
    const existing = JSON.parse(localStorage.getItem('v2_usage') || '[]');
    existing.push(usage);
    localStorage.setItem('v2_usage', JSON.stringify(existing.slice(-100))); // Keep last 100
  }
  
  static wrapV2Component<T extends React.ComponentType<any>>(
    Component: T,
    componentName: string
  ): T {
    return ((props: any) => {
      useEffect(() => {
        UsageMonitor.logV2Usage(componentName, 'render');
      }, []);
      
      return (
        <>
          <V2DeprecationWarning />
          <Component {...props} />
        </>
      );
    }) as T;
  }
}

// Wrap V2 components
export const HandoverProtocolFormV2Monitored = UsageMonitor.wrapV2Component(
  HandoverProtocolFormV2,
  'HandoverProtocolFormV2'
);
```

#### **4.3 Gradual Removal (1 hodina)**
```typescript
// src/config/featureFlags.ts - aktualizácia
export const V2_REMOVAL_SCHEDULE = {
  // Fáza 1: Deprecation warnings (2 týždne)
  deprecationStart: new Date('2024-01-15'),
  
  // Fáza 2: Disable by default (1 týždeň)  
  disableByDefault: new Date('2024-01-29'),
  
  // Fáza 3: Complete removal
  completeRemoval: new Date('2024-02-05')
};

export const shouldShowV2Components = (): boolean => {
  const now = new Date();
  
  // Po complete removal - nikdy neukazovať
  if (now >= V2_REMOVAL_SCHEDULE.completeRemoval) {
    return false;
  }
  
  // Po disable by default - len ak explicitne povolené
  if (now >= V2_REMOVAL_SCHEDULE.disableByDefault) {
    return localStorage.getItem('FORCE_ENABLE_V2') === 'true';
  }
  
  // Pred disable by default - normálne feature flag
  return featureManager.isEnabled('PROTOCOL_V2_ENABLED');
};

// Removal script
export const removeV2Components = async (): Promise<void> => {
  const filesToRemove = [
    'src/components/protocols/v2/',
    'src/components/common/v2/',
    'src/utils/v2TestData.ts'
  ];
  
  console.log('🗑️ Removing V2 components:', filesToRemove);
  
  // V skutočnosti by toto robil build script alebo CI/CD
  // Toto je len pre dokumentáciu
};
```

---

## 📊 FINÁLNE OČAKÁVANÉ VÝSLEDKY

| Metrika | Súčasný stav | Po implementácii | Zlepšenie |
|---------|-------------|------------------|-----------|
| **Upload spoľahlivosť** | 85% | 99.9% | +17% |
| **Upload rýchlosť** | 30s (5 fotiek) | 8s (5 fotiek) | 4x rýchlejšie |
| **PDF veľkosť** | 2.5MB | 1.0MB | 60% menšie |
| **UX hodnotenie** | 6/10 | 9/10 | +50% |
| **Právna platnosť** | Základná | Pokročilá/Kvalifikovaná | eIDAS compliant |
| **Offline podpora** | ❌ | ✅ | Nová funkcia |
| **Kód čistota** | 7/10 | 10/10 | +43% |

### **Náklady:**
- **Disig TSA:** €0.02 za podpis × 2 podpisy = €0.04 za protokol
- **Mesačný budget:** €50 = 1,250 protokolov/mesiac
- **Implementácia:** 22 hodín práce

### **ROI:**
- **Úspora času:** 5x rýchlejšie nahrávanie = 75% úspora času
- **Právna ochrana:** Súdne uznateľné podpisy
- **Používateľská spokojnosť:** Dramatické zlepšenie UX
- **Konkurenčná výhoda:** Najmodernejší systém protokolov

---

## 🚀 IMPLEMENTAČNÁ STRATÉGIA

### **Týždeň 1: Kritické vylepšenia**
- ✅ Inteligentné nahrávanie fotiek (4h)
- ✅ Kategorizovaná kompresia (1h)
- ✅ Disig TSA integrácia (3h)

### **Týždeň 2: UX vylepšenia**
- ✅ Autogram integrácia (6h)
- ✅ Vylepšená galéria (4h)
- ✅ Offline drafts (2h)

### **Týždeň 3: Finalizácia**
- ✅ Testovanie na rôznych zariadeniach
- ✅ V2 deprecation warnings
- ✅ Dokumentácia pre právne účely

### **Týždeň 4: Monitoring**
- ✅ V2 usage monitoring
- ✅ Performance metriky
- ✅ Postupné odstránenie V2 kódu

**Celkový čas: 34 hodín = 4.5 pracovných dní**

---

## 🎉 ZHRNUTIE ZJEDNOTENÉHO PLÁNU

### **📋 Čo obsahuje tento plán:**

✅ **Z R1_PROTOCOL_IMPROVEMENT_PLAN.md:**
- Retry mechanizmus pre fotky
- Paralelné nahrávanie 
- PDF optimalizácia
- Vylepšená galéria
- V2 cleanup

✅ **Z PROTOCOL_ANALYSIS_AND_RECOMMENDATIONS.md:**
- Analýza súčasného stavu
- Identifikácia problémov
- Disig TSA integrácia
- Autogram podpora
- Offline drafts

✅ **Z IMPLEMENTATION_PLAN_PERFECT_UI.md:**
- Design System audit
- Konzistentné UI komponenty
- Performance optimalizácie
- Component migration
- Memory management

### **🗂️ Môžete odstrániť tieto súbory:**
- ❌ `R1_PROTOCOL_IMPROVEMENT_PLAN.md`
- ❌ `PROTOCOL_ANALYSIS_AND_RECOMMENDATIONS.md` 
- ❌ `IMPLEMENTATION_PLAN_PERFECT_UI.md`

**Tento súbor obsahuje všetko potrebné pre kompletný upgrade protokolov!**

---

## 🏆 FINÁLNY VÝSLEDOK

**Najmodernejší systém protokolov s:**
- 🚀 **100% spoľahlivé nahrávanie** s inteligentným queue systémom
- ⚡ **5x rýchlejšie** paralelné spracovanie fotiek
- 📄 **60% menšie PDF** s kategorizovanou kompresiou
- 🔐 **Súdne uznateľné podpisy** s Disig TSA + Autogram
- 🎨 **Dokonalý design systém** s konzistentnými komponentmi
- 💾 **Offline podpora** s draft protokolmi
- ⚡ **Optimalizovaný výkon** s lazy loading a virtualizáciou
- 🧹 **Čistý kód** bez zastaralých závislostí

### **💰 Investícia vs. Výnos:**
- **Čas:** 34 hodín (4.5 dňa)
- **Náklady:** €0.04 za protokol (Disig TSA)
- **ROI:** Dramatické zlepšenie UX + právna ochrana + konkurenčná výhoda

**Výsledok: Najlepší systém protokolov v automotive rental industrii!** 🏆
