"use client";

import React from "react";
import { PageFooter, FAQ, QuickContact, MainFooter, CopyrightBar } from "../../components/shared";

export default function DemoFooterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🚀 Modulárny Footer Systém - Demo
          </h1>
          <p className="text-gray-600 mt-2">
            Ukážka všetkých komponentov ktoré som vytvoril
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-16">
        
        {/* 1. Kompletný PageFooter s FAQ a kontaktom */}
        <section className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              1. 🎯 PageFooter - Kompletný s FAQ a Quick Contact
            </h2>
            <p className="text-gray-600 mb-4">
              Kompletný footer systém s FAQ sekciou ako v ElementDetailVozidla
            </p>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono text-gray-700 mb-4">
              {`<PageFooter variant="full" faqVariant="desktop-1728" contactVariant="desktop-1728" footerVariant="desktop" />`}
            </div>
          </div>
          <div className="bg-[#0f0f14] rounded-lg overflow-hidden">
            <PageFooter 
              variant="full"
              faqVariant="desktop-1728"
              contactVariant="desktop-1728"
              footerVariant="desktop"
            />
          </div>
        </section>

        {/* 1b. PageFooter len s FAQ */}
        <section className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              1b. ❓ PageFooter - Len s FAQ
            </h2>
            <p className="text-gray-600 mb-4">
              Footer systém len s FAQ sekciou (bez Quick Contact)
            </p>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono text-gray-700 mb-4">
              {`<PageFooter variant="with-faq" faqVariant="desktop-1728" footerVariant="desktop" />`}
            </div>
          </div>
          <div className="bg-[#0f0f14] rounded-lg overflow-hidden">
            <PageFooter 
              variant="with-faq"
              faqVariant="desktop-1728"
              footerVariant="desktop"
            />
          </div>
        </section>

        {/* 1c. PageFooter - Desktop s kontaktom */}
        <section className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              1c. 🎯 PageFooter - Desktop s Quick Contact
            </h2>
            <p className="text-gray-600 mb-4">
              Footer systém len s Quick Contact (bez FAQ)
            </p>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono text-gray-700 mb-4">
              {`<PageFooter variant="with-contact" contactVariant="desktop-1728" footerVariant="desktop" />`}
            </div>
          </div>
          <div className="bg-[#0f0f14] rounded-lg overflow-hidden">
            <PageFooter 
              variant="with-contact"
              contactVariant="desktop-1728"
              footerVariant="desktop"
            />
          </div>
        </section>

        {/* 2. PageFooter bez kontaktu */}
        <section className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              2. 🏢 PageFooter - Len hlavný footer
            </h2>
            <p className="text-gray-600 mb-4">
              Footer bez Quick Contact sekcie
            </p>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono text-gray-700 mb-4">
              {`<PageFooter variant="simple" footerVariant="desktop" />`}
            </div>
          </div>
          <div className="bg-[#0f0f14] rounded-lg overflow-hidden">
            <PageFooter 
              variant="simple"
              footerVariant="desktop"
            />
          </div>
        </section>

        {/* 3. FAQ komponenty */}
        <section className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              3. ❓ FAQ - Rôzne varianty
            </h2>
            <p className="text-gray-600 mb-4">
              Responzívne varianty FAQ komponentu s dátami z ElementDetailVozidla
            </p>
          </div>

          {/* Mobile FAQ */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-700 mb-2">📱 FAQ Mobile (328px)</h3>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono text-gray-700 mb-4">
              {`<FAQ variant="mobile" />`}
            </div>
            <div className="flex justify-center bg-[#0F0F14] p-8 rounded-lg">
              <FAQ variant="mobile" />
            </div>
          </div>

          {/* Tablet FAQ */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-700 mb-2">📟 FAQ Tablet (680px)</h3>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono text-gray-700 mb-4">
              {`<FAQ variant="tablet" />`}
            </div>
            <div className="flex justify-center bg-[#0F0F14] p-8 rounded-lg">
              <FAQ variant="tablet" />
            </div>
          </div>

          {/* Desktop 1440 FAQ */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-700 mb-2">💻 FAQ Desktop 1440px</h3>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono text-gray-700 mb-4">
              {`<FAQ variant="desktop-1440" />`}
            </div>
            <div className="flex justify-center bg-[#0F0F14] p-8 rounded-lg overflow-x-auto">
              <FAQ variant="desktop-1440" />
            </div>
          </div>

          {/* Desktop 1728 FAQ */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-700 mb-2">🖥️ FAQ Desktop 1728px (2 stĺpce)</h3>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono text-gray-700 mb-4">
              {`<FAQ variant="desktop-1728" />`}
            </div>
            <div className="flex justify-center bg-[#0F0F14] p-8 rounded-lg overflow-x-auto">
              <FAQ variant="desktop-1728" />
            </div>
          </div>
        </section>

        {/* 4. Rôzne varianty Quick Contact */}
        <section className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              4. 📱 QuickContact - Rôzne varianty
            </h2>
            <p className="text-gray-600 mb-4">
              Responzívne varianty Quick Contact komponentu
            </p>
          </div>

          {/* Mobile variant */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-700 mb-2">📱 Mobile (328px)</h3>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono text-gray-700 mb-4">
              {`<QuickContact variant="mobile" />`}
            </div>
            <div className="flex justify-center bg-gray-100 p-8 rounded-lg">
              <QuickContact variant="mobile" />
            </div>
          </div>

          {/* Tablet variant */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-700 mb-2">📟 Tablet (680px)</h3>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono text-gray-700 mb-4">
              {`<QuickContact variant="tablet" />`}
            </div>
            <div className="flex justify-center bg-gray-100 p-8 rounded-lg">
              <QuickContact variant="tablet" />
            </div>
          </div>

          {/* Desktop 1440 variant */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-700 mb-2">💻 Desktop 1440px</h3>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono text-gray-700 mb-4">
              {`<QuickContact variant="desktop-1440" />`}
            </div>
            <div className="flex justify-center bg-gray-100 p-8 rounded-lg overflow-x-auto">
              <QuickContact variant="desktop-1440" />
            </div>
          </div>

          {/* Desktop 1728 variant */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-700 mb-2">🖥️ Desktop 1728px (s pattern)</h3>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono text-gray-700 mb-4">
              {`<QuickContact variant="desktop-1728" />`}
            </div>
            <div className="flex justify-center bg-gray-100 p-8 rounded-lg overflow-x-auto">
              <QuickContact variant="desktop-1728" />
            </div>
          </div>
        </section>

        {/* 5. MainFooter samostatne */}
        <section className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              5. 🏢 MainFooter - Samostatný komponent
            </h2>
            <p className="text-gray-600 mb-4">
              Hlavný footer s newsletter, navigáciou a sociálnymi sieťami
            </p>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono text-gray-700 mb-4">
              {`<MainFooter variant="desktop" />`}
            </div>
          </div>
          <div className="bg-[#05050A] rounded-lg overflow-hidden">
            <MainFooter variant="desktop" />
          </div>
        </section>

        {/* 6. CopyrightBar */}
        <section className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              6. ©️ CopyrightBar - Copyright lišta
            </h2>
            <p className="text-gray-600 mb-4">
              Spodná lišta s copyright a legal linkmi
            </p>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono text-gray-700 mb-4">
              {`<CopyrightBar variant="desktop" />`}
            </div>
          </div>
          <div className="bg-black rounded-lg overflow-hidden">
            <CopyrightBar variant="desktop" />
          </div>
        </section>

        {/* 7. Mobile PageFooter */}
        <section className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              7. 📱 PageFooter - Mobile verzia
            </h2>
            <p className="text-gray-600 mb-4">
              Kompletný footer optimalizovaný pre mobilné zariadenia
            </p>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono text-gray-700 mb-4">
              {`<PageFooter variant="with-contact" contactVariant="mobile" footerVariant="mobile" />`}
            </div>
          </div>
          <div className="bg-[#0f0f14] rounded-lg overflow-hidden max-w-md mx-auto">
            <PageFooter 
              variant="with-contact"
              contactVariant="mobile"
              footerVariant="mobile"
            />
          </div>
        </section>

        {/* Použitie v kóde */}
        <section className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              8. 💻 Ako to použiť v kóde
            </h2>
            <p className="text-gray-600 mb-4">
              Ukážky importu a použitia komponentov
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Import:</h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
                  {`import { PageFooter, FAQ } from "@/components/shared";`}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">Základné použitie:</h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono whitespace-pre">
{`// Kompletný s FAQ + Quick Contact
<PageFooter 
  variant="full"
  faqVariant="desktop-1728"
  contactVariant="desktop-1728"
  footerVariant="desktop"
/>

// Len s FAQ
<PageFooter 
  variant="with-faq"
  faqVariant="desktop-1728"
  footerVariant="desktop"
/>

// Len s Quick Contact
<PageFooter 
  variant="with-contact"
  contactVariant="desktop-1728"
  footerVariant="desktop"
/>

// Len základný footer
<PageFooter variant="simple" />

// FAQ samostatne
<FAQ variant="desktop-1728" />`}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">Nahradenie v ElementDetailVozidla:</h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono whitespace-pre">
{`// Namiesto 500+ riadkov FAQ + footer kódu:
<PageFooter 
  variant="full"
  faqVariant="desktop-1728"
  contactVariant="desktop-1728"
  footerVariant="desktop"
/>`}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Výhody */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            ✨ Výhody nového systému
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span className="font-medium">DRY princíp</span>
              </div>
              <p className="text-sm text-gray-600 ml-6">
                Žiadne duplikovanie kódu - jeden komponent pre všetky stránky
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span className="font-medium">Centralizované dáta</span>
              </div>
              <p className="text-sm text-gray-600 ml-6">
                Jedna zmena = všade aktualizované (sociálne siete, kontakty, atď.)
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span className="font-medium">4 responzívne varianty</span>
              </div>
              <p className="text-sm text-gray-600 ml-6">
                Mobile, Tablet, Desktop 1440px, Desktop 1728px (FAQ aj Quick Contact)
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span className="font-medium">Interaktívne FAQ</span>
              </div>
              <p className="text-sm text-gray-600 ml-6">
                12 otázok s odpoveďami, expand/collapse animácie
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span className="font-medium">TypeScript podpora</span>
              </div>
              <p className="text-sm text-gray-600 ml-6">
                Plná typová bezpečnosť a IntelliSense
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span className="font-medium">Modulárnosť</span>
              </div>
              <p className="text-sm text-gray-600 ml-6">
                Komponenty sa dajú použiť samostatne alebo kombinovať
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span className="font-medium">Accessibility</span>
              </div>
              <p className="text-sm text-gray-600 ml-6">
                Správne aria-labels, semantic HTML, keyboard navigation
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
