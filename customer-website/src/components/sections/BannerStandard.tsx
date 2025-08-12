'use client'

import { Icon } from '@/components/ui/Icon'

export default function BannerStandard() {
  return (
    <section className="bg-blackrent-dark py-28">
      {/* Banner standard – presne podľa Figmy (1328x424, ľavý blok 454px, padding-left 113px) */}
      <div className="mx-auto flex h-424 w-1328 items-center justify-between gap-2 rounded-3xl bg-blackrent-white pl-[113px]">
        {/* Ľavý obsah */}
        <div className="flex w-[454px] flex-col justify-center gap-12">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-6">
              <p className="font-poppins text-[20px] leading-[1.2] text-blackrent-text-dark">
                🔥 Obľúbené u nás
              </p>
              <div className="flex flex-col gap-6">
                <h2 className="font-sf-pro text-[40px] font-extrabold leading-[0.6] text-blackrent-card-hover">
                  TESLA Model S
                </h2>
                <p className="font-poppins text-[16px] leading-6 text-blackrent-text-muted w-[461px]">
                  Ako jedna z mála autopožičovní na slovensku máme v ponuke 2 Tesly Model S. Tesly sú dostupné k prenájmu už od jedného dňa. Či už ste priaznovcom elektromobility alebo nie, vyskúšajte si jazdu v najznámejšom elektromobile sveta.
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <button className="flex h-12 items-center gap-1.5 rounded-full bg-blackrent-green px-6 py-2 pr-5 font-poppins font-semibold leading-6 text-blackrent-green-text hover:bg-blackrent-accent transition-colors">
              Detail ponuky
              <Icon name="arrow-right" className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Pravá strana – pozadie */}
        <div
          className="relative h-full flex-1 rounded-[32px] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/figma-assets/tesla-banner-bg-42bc2b.png')" }}
        />
      </div>
    </section>
  )
}


