# 🚀 Modulárny Footer Systém

Tento systém umožňuje znovupoužitie footer komponentov na všetkých stránkach bez duplikovania kódu.

## 📦 Komponenty

### 1. `PageFooter` - Hlavný layout komponent
Kombinuje všetky footer komponenty do jedného celku.

```tsx
import { PageFooter } from "@/components/shared";

// S Quick Contact
<PageFooter 
  variant="with-contact"
  contactVariant="desktop-1728"
  footerVariant="desktop"
/>

// Bez Quick Contact
<PageFooter 
  variant="simple"
  footerVariant="desktop"
/>
```

### 2. `QuickContact` - Rýchly kontakt sekcia
Responzívny komponent s operátorom a kontaktnými údajmi.

**Varianty:**
- `mobile` - 328px šírka
- `tablet` - 680px šírka  
- `desktop-1440` - 1120px šírka
- `desktop-1728` - 1328px šírka (s pattern pozadím)

### 3. `MainFooter` - Hlavný footer
Newsletter, navigácia, kontakty, sociálne siete.

**Varianty:**
- `mobile` - Mobilná verzia
- `desktop` - Desktop verzia (1728px)

### 4. `CopyrightBar` - Copyright lišta
Spodná lišta s copyright a legal linkmi.

## 🎯 Použitie v existujúcich stránkach

### ElementDetailVozidla
```tsx
// Namiesto celej footer sekcie (riadky 4244-4612):
<PageFooter 
  variant="with-contact"
  contactVariant="desktop-1728"
  footerVariant="desktop"
/>
```

### Homepage
```tsx
<PageFooter 
  variant="with-contact"
  contactVariant="desktop-1728"
  footerVariant="desktop"
/>
```

### Ponuka vozidiel
```tsx
<PageFooter 
  variant="with-contact"
  contactVariant="desktop-1728"
  footerVariant="desktop"
/>
```

## 📱 Responzívne použitie

```tsx
// Responzívny footer pre všetky breakpointy
<div className="w-full">
  {/* Mobile */}
  <div className="block md:hidden">
    <PageFooter 
      variant="with-contact"
      contactVariant="mobile"
      footerVariant="mobile"
    />
  </div>

  {/* Tablet */}
  <div className="hidden md:block lg:hidden">
    <PageFooter 
      variant="with-contact"
      contactVariant="tablet"
      footerVariant="desktop"
    />
  </div>

  {/* Desktop 1440 */}
  <div className="hidden lg:block xl:hidden">
    <PageFooter 
      variant="with-contact"
      contactVariant="desktop-1440"
      footerVariant="desktop"
    />
  </div>

  {/* Desktop 1728+ */}
  <div className="hidden xl:block">
    <PageFooter 
      variant="with-contact"
      contactVariant="desktop-1728"
      footerVariant="desktop"
    />
  </div>
</div>
```

## 🔧 Konfigurácia

Všetky dáta sú centralizované v `constants/footerData.ts`:

- `navigationLinks` - Menu odkazy
- `socialMediaLinks` - Sociálne siete
- `footerLinks` - Legal odkazy
- `contactInfo` - Kontaktné údaje
- `operatorAvatar` - Avatar operátora

## ✅ Výhody

1. **DRY princíp** - Žiadne duplikovanie kódu
2. **Centralizované dáta** - Jedna zmena = všade aktualizované
3. **Responzívnosť** - Automatické prispôsobenie breakpointom
4. **Modulárnosť** - Komponenty sa dajú použiť samostatne
5. **TypeScript** - Plná typová podpora
6. **Accessibility** - Správne aria-labels a semantic HTML

## 🚀 Migrácia existujúcich stránok

1. Import nového systému:
```tsx
import { PageFooter } from "@/components/shared";
```

2. Nahradiť existujúci footer kód:
```tsx
// Staré (vymazať):
{/* Celá footer sekcia s Quick Contact, Main Footer, Copyright */}

// Nové (pridať):
<PageFooter 
  variant="with-contact"
  contactVariant="desktop-1728"
  footerVariant="desktop"
/>
```

3. Odstrániť lokálne dáta (socialMediaLinks, footerLinks, atď.)

4. Otestovať všetky breakpointy

## 🎨 Customizácia

Pre špecifické potreby stránky:

```tsx
<PageFooter 
  variant="with-contact"
  contactVariant="desktop-1728"
  footerVariant="desktop"
  className="custom-footer-styles"
  showQuickContact={true}
  showFAQ={false}
/>
```
