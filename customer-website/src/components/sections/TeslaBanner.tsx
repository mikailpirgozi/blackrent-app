'use client'

import Image from 'next/image'
import { Icon } from '@/components/ui/Icon'

export default function TeslaBanner() {
  return (
    <section className="bg-blackrent-dark py-28">
      {/* Tesla Banner - layout_4DGHNV */}
      <div className="flex justify-between items-center gap-2 px-0 pl-28 w-1328 h-424 mx-auto rounded-3xl bg-blackrent-card border border-blackrent-card-hover">
        {/* Left Content - layout_SURA88 */}
        <div className="flex flex-col justify-center gap-12 w-[454px]">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-6">
              <p className="font-poppins font-medium text-xl leading-[1.2] text-blackrent-text-muted">
                🔥 Obľúbené u nás
              </p>
              <div className="flex flex-col gap-6">
                <h2 className="font-sf-pro font-extrabold text-4xl leading-[0.6] text-blackrent-text-primary">
                  TESLA Model S
                </h2>
                <p className="font-poppins font-normal text-base leading-6 text-blackrent-text-secondary w-[461px]">
                  Ako jedna z mála autopožičovní na slovensku máme v ponuke 2 Tesly Model S. Tesly sú dostupné k prenájmu už od jedného dňa. Či už ste priaznovcom elektromobility alebo nie, vyskúšajte si jazdu v najznámejšom elektromobile sveta.
                </p>
              </div>
            </div>
            
            {/* CTA Button - layout_XF8LH3 */}
            <button className="flex items-center gap-1.5 px-6 py-2 pr-5 bg-blackrent-green text-blackrent-green-text rounded-full font-poppins font-semibold text-base leading-6 w-fit h-12 hover:bg-blackrent-accent transition-colors">
              Detail ponuky
              <Icon name="arrow-right" className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Right Image Container - layout_B45J9K */}
        <div className="flex flex-col justify-stretch items-stretch gap-2 px-28 py-13 flex-1 h-full rounded-[32px] bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url('/figma-assets/tesla-banner-bg-42bc2b.png')"}}>
          {/* Indicators odstránené na žiadosť – nechceme zobrazovať bodky */}
        </div>
      </div>
    </section>
  )
}