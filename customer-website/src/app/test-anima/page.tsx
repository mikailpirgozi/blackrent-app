import React from 'react';

// Anima komponenty - skutočná homepage
const TestAnimaPage = () => {
  return (
    <div className="w-full flex flex-col bg-[#05050a]" data-model-id="10392:19171">
      {/* Background blur effect */}
      <div className="absolute w-[800px] h-[800px] top-0 left-1/2 transform -translate-x-1/2 bg-[#1e1e23] rounded-[400px] blur-[250px]" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <h1 className="text-4xl font-bold mb-8 text-center text-white">
          🧪 Anima Homepage Test
        </h1>
        
        <div className="grid gap-8">
          {/* Anima Hero Section */}
          <section className="w-full max-w-[1328px] mx-auto bg-[#fafaff] rounded-3xl overflow-hidden">
            <div className="flex items-center justify-between p-0 min-h-[424px]">
              <div className="flex flex-col w-full max-w-[454px] items-start justify-center gap-12 pl-[113px] py-12">
                <div className="flex flex-col items-start gap-10 w-full">
                  <div className="font-medium text-[#3c3c41] text-xl tracking-[0] leading-6 whitespace-nowrap">
                    🔥 Obľúbené u nás
                  </div>

                  <div className="flex flex-col items-start gap-6 w-full">
                    <h1 className="font-normal text-[#1e1e23] text-[40px] tracking-[0] leading-6 whitespace-nowrap">
                      TESLA Model S
                    </h1>

                    <p className="font-normal text-[#646469] text-base tracking-[0] leading-6 max-w-[461px]">
                      Ako jedna z mála autopožičovní na slovensku máme v ponuke 2
                      Tesly Model S. Tesly sú dostupné k prenájmu už od jedného dňa.
                      Či už ste priaznovcom elektromobility alebo nie, vyskúšajte si
                      jazdu v najznámejšom elektromobile sveta.
                    </p>
                  </div>
                </div>

                <button className="inline-flex h-12 items-center gap-1.5 px-6 py-2 bg-[#d7ff14] hover:bg-[#c5e612] rounded-[99px]">
                  <span className="font-semibold text-[#283002] text-base tracking-[0] leading-6 whitespace-nowrap">
                    Detail ponuky
                  </span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </button>
              </div>

              <div className="flex-1 self-stretch min-h-[424px] rounded-[32px] bg-blend-multiply bg-cover bg-center relative"
                   style={{ backgroundImage: 'url(https://c.animaapp.com/me95zzp7lVICYW/img/frame-968.png)' }}>
                <div className="absolute bottom-7 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-[#a0a0a5] rounded-full"></div>
                  <div className="w-2 h-2 bg-[#bebec3] rounded-full"></div>
                  <div className="w-2 h-2 bg-[#bebec3] rounded-full"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Items Test */}
          <section className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-[#1e1e23] rounded-lg p-6 border border-gray-700">
                <div className="w-full h-48 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg mb-4"></div>
                <h3 className="text-xl font-semibold mb-2">Vozidlo {item}</h3>
                <p className="text-gray-400">Popis vozidla a jeho vlastnosti</p>
              </div>
            ))}
          </section>

          {/* Gallery Test */}
          <section className="relative">
            <h3 className="text-2xl font-bold mb-6 text-center">Galéria</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="aspect-square bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg"></div>
              ))}
            </div>
          </section>

          {/* Contact Section Test */}
          <section className="bg-[#1e1e23] rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-6 text-center">Kontakt</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4">Rýchly kontakt</h4>
                <div className="space-y-2 text-gray-300">
                  <p>📞 +421 123 456 789</p>
                  <p>✉️ info@blackrent.sk</p>
                  <p>📍 Bratislava, Slovensko</p>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Otváracie hodiny</h4>
                <div className="space-y-2 text-gray-300">
                  <p>Po-Pi: 8:00 - 18:00</p>
                  <p>So: 9:00 - 16:00</p>
                  <p>Ne: Zatvorené</p>
                </div>
              </div>
            </div>
          </section>

          {/* Safari Test Section */}
          <section className="bg-gradient-to-r from-[#d7ff14] to-[#f0ff98] text-[#141900] rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-4">🧪 Safari Compatibility Test</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">CSS Features:</h4>
                <ul className="space-y-1 text-sm">
                  <li>✅ Flexbox layout</li>
                  <li>✅ CSS Grid</li>
                  <li>✅ Border radius</li>
                  <li>✅ Gradients</li>
                  <li>✅ Backdrop blur</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Responsive:</h4>
                <ul className="space-y-1 text-sm">
                  <li>✅ Mobile first</li>
                  <li>✅ Tablet layout</li>
                  <li>✅ Desktop layout</li>
                  <li>✅ Safari viewport units</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TestAnimaPage;
