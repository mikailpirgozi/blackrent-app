'use client'

import Icon24Px from './assets/Icon24Px'

export default function HeroSectionFirejet({
  className = "",
}: HeroSectionFirejetProps) {
  return (
    <section className={`relative bg-blackrent-dark ${className}`}>
      {/* Hero Content */}
      <div className="flex flex-col items-center justify-end self-stretch pt-8">
        <div className="flex w-[1128px] flex-col items-start gap-[9px]">
          {/* Main Heading */}
          <div className="flex items-center justify-center self-stretch pl-52">
            <div className="font-sf-pro flex h-[103px] w-[928px] items-center justify-center text-center text-[56px] font-[540] leading-[64px] text-blackrent-accent">
              <span>
                <p className="text-center">
                  Autá pre každodennú potrebu,
                </p>
                <p className="text-center">
                  aj nezabudnuteľný zážitok
                </p>
              </span>
            </div>
          </div>

          {/* Content Row */}
          <div className="flex items-end">
            <div className="flex flex-wrap items-center justify-center gap-x-60 gap-y-10 min-[1818px]:flex-nowrap">
              {/* Hero Image */}
              <img
                className="h-36 w-36 rounded-lg object-cover object-center"
                src="/figma-assets/hero-image-1.jpg"
                alt="BlackRent vozidlo"
                loading="lazy"
              />
              
              {/* Description */}
              <div className="flex flex-col items-center pb-12">
                <div className="flex h-9 w-[562px] items-center leading-6 text-blackrent-text-secondary">
                  <span>
                    Spolupracujeme s desiatkami preverených autopožičovní na slovensku
                    s ponukou vyše 100+ vozidiel
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex h-[38px] w-0 items-center justify-end gap-6 text-sm leading-8">
              {/* Primary CTA */}
              <div className="flex h-10 w-44 items-center justify-end gap-2 rounded-full bg-blackrent-accent p-1 backdrop-blur-[24] [max-width:178px]">
                <div className="flex h-2.5 w-28 items-center font-semibold text-blackrent-green-text">
                  <p>Ponuka vozidiel</p>
                </div>
                <div className="flex h-8 w-8 flex-col items-center justify-center rounded-full bg-blackrent-green-text p-1">
                  <Icon24Px className="h-6 w-6" />
                </div>
              </div>

              {/* Secondary CTA */}
              <div className="flex h-10 w-32 items-center rounded-full bg-blackrent-card px-6 py-[15px] backdrop-blur-[24] [max-width:131px]">
                <div className="flex h-2.5 w-20 items-center font-semibold text-blackrent-text-secondary">
                  <p>Kontakt</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

interface HeroSectionFirejetProps {
  className?: string;
}
