# 🚀 BlackRent MUI → shadcn/ui - PRAKTICKÝ MIGRAČNÝ GUIDE

## 🔒 KRITICKÉ UPOZORNENIE
**ŽIADNE COMMITY BEZ POVOLENIA POUŽÍVATEĽA!**
Všetky zmeny musia byť na 100% dokončené a skontrolované pred akýmkoľvek commitom.

## ⚠️ ABSOLÚTNE PRAVIDLÁ

### 🚨 KRITICKÉ ZÁKAZY
1. **🔥 PRAVIDLO Č. 1: NIKDY nevytvárať zjednodušené verzie súborov** - VŽDY opraviť postupne v pôvodnom súbore so 100% zachovanou funkcionalitou
2. **NIKDY nerobiť backup automaticky** - vždy sa najprv spýtať používateľa
3. **NIKDY nepreskakovať súbory** - dokončiť každý na 100%
4. **NIKDY nezjednodušovať** - zachovať všetku funkcionalitu, všetky komponenty, všetky features
5. **NIKDY nevynechávať chyby** - opraviť VŠETKY chyby v súbore
6. **🔒 NIKDY NECOMMITOVAŤ BEZ POVOLENIA** - používateľ musí všetko skontrolovať na 100%

### ✅ POVINNÉ PRAVIDLÁ
1. **JEDEN SÚBOR ZA ČAS** - kompletne dokončiť pred prechodom na ďalší
2. **VŠETKY CHYBY** - opraviť každú chybu v súbore
3. **0 CHÝB POLICY** - `npm run build` musí byť bez chýb
4. **SYSTEMATICKÝ POSTUP** - postupovať podľa tohto plánu
5. **🔒 ŽIADNE COMMITY** - len po úplnom dokončení a schválení používateľom

---

## 🎯 MIGRAČNÝ WORKFLOW (OVERENÝ)

### KROK 1: Príprava (5 min)
```bash
# Stiahni všetky shadcn komponenty
npx shadcn@latest add --all --yes

# Skontroluj aktuálny stav
npm run build
```

### KROK 2: Vyber súbor na migráciu
```bash
# Analyzuj súbor
grep -c "@mui" src/components/[súbor].tsx
grep -c "Box\|TextField\|Button" src/components/[súbor].tsx
```

### KROK 3: Systematická migrácia súboru
1. **Importy** - pridaj shadcn importy, ponechaj MUI dočasne
2. **Komponenty postupne** - jeden komponent za čas
3. **Test po každom komponente** - `npm run build`
4. **Oprav všetky chyby** - pred prechodom na ďalší komponent
5. **Odstráň MUI importy** - až keď je všetko hotové

### KROK 4: Finalizácia súboru
```bash
# Test
npm run build  # MUSÍ byť 0 chýb

# 🔒 COMMIT LEN PO SCHVÁLENÍ POUŽÍVATEĽOM
# NIKDY necommitovať automaticky!
# Používateľ musí všetko skontrolovať na 100%
```

---

## 📋 MUI → SHADCN MAPOVANIE

### 🔧 PRIAME SHADCN MAPOVANIE
```tsx
// TextField → Input + Label
<TextField label="Názov" value={value} onChange={e => setValue(e.target.value)} />
↓
<div>
  <Label>Názov</Label>
  <Input value={value} onChange={e => setValue(e.target.value)} />
</div>

// Select → shadcn Select
<FormControl>
  <InputLabel>Typ</InputLabel>
  <Select value={type} onChange={e => setType(e.target.value)}>
    <MenuItem value="a">A</MenuItem>
  </Select>
</FormControl>
↓
<div>
  <Label>Typ</Label>
  <Select value={type} onValueChange={setType}>
    <SelectTrigger><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="a">A</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### 🎨 LAYOUT KOMPONENTY
```tsx
// Box → div + Tailwind
<Box sx={{ display: 'flex', gap: 2, p: 3 }}>
↓
<div className="flex gap-4 p-6">

// Grid → CSS Grid
<Grid container spacing={2}>
  <Grid item xs={12} md={6}>
↓
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
```

### 🎭 UI KOMPONENTY
```tsx
// Button variants
<Button variant="contained" color="primary">Text</Button>
↓
<Button variant="default">Text</Button>

<Button variant="outlined">Text</Button>
↓
<Button variant="outline">Text</Button>

<Button variant="text">Text</Button>
↓
<Button variant="ghost">Text</Button>

// Chip → Badge
<Chip label="Status" color="primary" />
↓
<Badge variant="default">Status</Badge>

// Dialog → shadcn Dialog
<Dialog open={open} onClose={handleClose}>
  <DialogTitle>Nadpis</DialogTitle>
  <DialogContent>Obsah</DialogContent>
</Dialog>
↓
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Nadpis</DialogTitle>
    </DialogHeader>
    Obsah
  </DialogContent>
</Dialog>

// Typography → HTML elementy + Tailwind
<Typography variant="h1">Nadpis</Typography>
↓
<h1 className="text-4xl font-bold">Nadpis</h1>

<Typography variant="body1">Text</Typography>
↓
<p className="text-base">Text</p>
```

### 📊 DATATABLE KOMPONENTY
```tsx
// DataGrid → Table
<DataGrid 
  rows={rows} 
  columns={columns}
  pageSize={10}
  checkboxSelection
/>
↓
<Table>
  <TableHeader>
    <TableRow>
      {columns.map(col => (
        <TableHead key={col.field}>{col.headerName}</TableHead>
      ))}
    </TableRow>
  </TableHeader>
  <TableBody>
    {rows.map(row => (
      <TableRow key={row.id}>
        {columns.map(col => (
          <TableCell key={col.field}>{row[col.field]}</TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
</Table>

// DatePicker → Calendar + Popover
<DatePicker 
  value={date} 
  onChange={setDate}
  label="Dátum"
/>
↓
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      {date ? format(date, "dd.MM.yyyy") : "Vyberte dátum"}
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
    />
  </PopoverContent>
</Popover>
```

---

## 🔥 PRIORITNÉ SÚBORY (TOP 10)

### 📊 Veľké súbory (1500+ riadkov)
1. **RentalForm.tsx** - 2134 riadkov, 85% hotové
2. **RentalList.tsx** - 1500+ riadkov, DataGrid
3. **VehicleForm.tsx** - 1200+ riadkov, komplexný formulár
4. **CustomerListNew.tsx** - 1000+ riadkov, tabuľky

### 🎯 Stredné súbory (500-1000 riadkov)
5. **AvailabilityPageNew.tsx** - 900+ riadkov
6. **VehicleCardLazy.tsx** - 800+ riadkov
7. **Statistics.tsx** - ✅ DOKONČENÉ
8. **ExpenseListNew.tsx** - ✅ DOKONČENÉ

### ⚡ Malé súbory (< 500 riadkov)
9. **Všetky *Dialog.tsx súbory**
10. **Všetky *Form.tsx súbory**

---

## 🛠️ PRAKTICKÉ NÁSTROJE

### ✅ SHADCN KOMPONENTY
```tsx
// Import shadcn komponentov
import { 
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui';

// VÝHODY SHADCN:
// ✅ Moderný dizajn s Tailwind CSS
// ✅ Plná kontrola nad komponentmi
// ✅ Žiadne závislosti na UI knižniciach
// ✅ Customizovateľné komponenty
// ✅ Lepší performance
// ✅ Menší bundle size
```

### ✅ FUNGUJÚCE PRÍKAZY
```bash
# Migračné skripty (OVERENÉ)
npm run migrate:icons          # Icon migrácia
npm run migrate:typography     # Typography migrácia
npm run fix:import-paths       # Oprava import ciest

# Kontrolné príkazy
npm run build                  # POVINNÉ po každom súbore
grep -c "@mui" [súbor]        # Počet MUI komponentov
```

### ❌ NEPOUŽÍVAŤ
```bash
# Tieto skripty robia chaos:
npm run migrate:box           # Poškodzuje JSX
npm run fix:jsx              # Ničí syntax
# Automatické sx → Tailwind   # Príliš komplexné
```

---

## 📝 COPY-PASTE RIEŠENIA

### 🔧 Najčastejšie chyby a opravy
```tsx
// ❌ CHYBA: Box is not defined
// ✅ OPRAVA: Pridaj import alebo nahraď za div
import { Box } from '@mui/material';
// ALEBO
<div className="flex gap-4">

// ❌ CHYBA: variant="contained" not assignable
// ✅ OPRAVA: Zmeň na shadcn variant
variant="default"

// ❌ CHYBA: onChange does not exist on Select
// ✅ OPRAVA: Použiť onValueChange
onValueChange={setValue}

// ❌ CHYBA: sx prop does not exist
// ✅ OPRAVA: Nahradiť za className
className="mt-4 p-6"
```

### 🎨 Spacing konverzia (MUI → Tailwind)
```tsx
mt: 1 → mt-2    // 8px
mt: 2 → mt-4    // 16px
mt: 3 → mt-6    // 24px
p: 1  → p-2     // 8px
p: 2  → p-4     // 16px
p: 3  → p-6     // 24px
gap: 1 → gap-2  // 8px
gap: 2 → gap-4  // 16px
```

---

## 🎯 SYSTEMATICKÝ POSTUP PRE KAŽDÝ SÚBOR

### 1️⃣ ANALÝZA (5 min)
```bash
# Zisti čo treba migrovať
grep "@mui" [súbor] | wc -l
grep "Box\|TextField\|Button\|Select\|Dialog" [súbor]
```

### 2️⃣ PRÍPRAVA (5 min)
```tsx
// Pridaj shadcn importy
import { 
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Card,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui';

// Ponechaj MUI importy dočasne
import { Box, TextField, Dialog } from '@mui/material';
```

### 3️⃣ MIGRÁCIA PO KOMPONENTOCH (45-90 min)
```
1. Button komponenty (10 min) - jednoduché
2. TextField → Input + Label (20 min) - rozložiť na časti
3. Select komponenty (20 min) - komplexnejšie API
4. DataGrid → Table (30 min) - najkomplexnejšie
5. Dialog komponenty (15 min) - nová štruktúra
6. Box → div + Tailwind (10 min) - styling zmeny
```

### 4️⃣ TESTOVANIE A CLEANUP (10 min)
```bash
# Test po každom komponente
npm run build

# Finálny cleanup
# Odstráň nepoužívané MUI importy
# Formátovanie
npx prettier [súbor] --write
```

### 5️⃣ KONTROLA A SCHVÁLENIE (používateľom)
```bash
# 🔒 COMMIT LEN PO SCHVÁLENÍ!
# Používateľ musí:
# 1. Skontrolovať všetky zmeny
# 2. Otestovať funkcionalitu
# 3. Schváliť commit
# NIKDY necommitovať bez povolenia!
```

---

## 🚀 QUICK START

### Pre začiatok vyber JEDEN z týchto súborov:
1. **Malý Dialog súbor** - rýchly úspech s shadcn
2. **Súbor s najmenej MUI** - jednoduchý štart
3. **RentalForm.tsx** - komplexnejší, ale už čiastočne hotový

### Postup s SHADCN komponentmi:
1. Otvor súbor
2. Spusti analýzu: `grep "@mui" [súbor]`
3. **Pridaj shadcn importy** (pozri vyššie)
4. **Nahraď MUI komponenty za SHADCN** - API sa zmení!
5. **NIKDY neodíď od súboru kým nie je 100% hotový**
6. Test: `npm run build` - MUSÍ byť 0 chýb
7. **🔒 ŽIADNY COMMIT** - len po schválení používateľom!

### ⚡ SHADCN MIGRÁCIA:
```tsx
// PRED migráciou (MUI)
import { TextField, Button, Select, MenuItem } from '@mui/material';

<TextField label="Názov" value={value} onChange={e => setValue(e.target.value)} />
<Button variant="contained" color="primary">Klikni</Button>

// PO migrácii (SHADCN) - nové API!
import { Input, Label, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';

<div className="space-y-2">
  <Label htmlFor="nazov">Názov</Label>
  <Input id="nazov" value={value} onChange={e => setValue(e.target.value)} />
</div>
<Button>Klikni</Button>
```

---

## 📊 CIEĽ MIGRÁCIE

### ✅ Po dokončení:
- **0 MUI dependencies** v package.json
- **0 TypeScript chýb** vo všetkých súboroch
- **Všetky súbory** používajú len shadcn komponenty
- **Bundle size** znížený o 40%
- **Konzistentný dizajn** vo všetkých komponentoch

### 🎯 Odhadovaný čas: **25-40 hodín** (1-2 súbory denne)

### 💪 SHADCN MIGRÁCIA VYŽADUJE VIAC PRÁCE, ALE VÝSLEDOK STOJÍ ZA TO!

---

*Vytvorené: September 2025*  
*Verzia: 1.0 - Praktický guide*
