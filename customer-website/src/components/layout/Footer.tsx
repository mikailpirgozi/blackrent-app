'use client'

import { Icon } from '@/components/ui/Icon'
import Pattern from '@/components/firejet/assets/Pattern'
import Pattern1 from '@/components/firejet/assets/Pattern1'

export default function Footer() {
  return (
    <footer className="bg-blackrent-dark">
      {/* Pattern Background - layout_PF6YK3 (umiestnený dole vo footeri) */}
      <div className="absolute right-0 bottom-24 z-0 opacity-10 select-none pointer-events-none">
        <div className="relative w-[476px] h-[448px]">
          <Pattern className="absolute inset-0" />
        </div>
        {/* dolný rohový blok vzoru podľa figmy */}
        <div className="absolute bottom-0 right-0 w-[200px] h-[200px]">
          <Pattern1 className="w-full h-full" />
        </div>
      </div>

      {/* Main Footer Content - layout_LC6NU4 */}
      <div className="relative z-10 flex flex-col gap-20 w-fit mx-auto pt-[336px] px-[200px]">
        {/* Blackrent Logo - layout_Z30DZD */}
        <div className="w-[214px] h-8">
          <svg width="214" height="32" viewBox="0 0 670 100" fill="none" className="w-full h-full">
            <path d="M80 27.87L57.87 50L80 72.13L52.13 100H0V68H38.87L56.87 50L38.87 32H0V0H52.13L80 27.87ZM173.25 59.81C173.25 68.69 166.06 72.5 152.19 72.5H112V27.5H148.88C164.38 27.5 169.76 32 169.76 39C169.76 43.88 166.57 47.38 162.2 49.25C169.62 50.69 173.25 54.19 173.25 59.81ZM124.5 45.5H149.12C154.5 45.5 157.24 44.75 157.24 41.38C157.24 37.38 153.49 37.38 148.74 37.38H124.5V45.5ZM160.75 58.5C160.75 54.88 157.44 54.25 151.94 54.25H124.5V62.63H153.44C158.31 62.62 160.75 61.5 160.75 58.5ZM191.38 27.5H178.88V72.5H223.88V62.5H191.38V27.5ZM291.12 50C291.12 63.12 302.37 72.5 319.24 72.5H346.12V62.38H319.37C310.12 62.38 303.62 57 303.62 50C303.62 43 310.12 37.62 319.37 37.62H346.12V27.5H319.24C302.38 27.5 291.12 36.88 291.12 50ZM591.12 59.38L554.88 27.5H541.13V72.5H553.63V41.25L589.25 72.5H603.63V27.5H591.13V59.38H591.12ZM479.88 72.5H532.38V62.5H492.38V54.5H529.88V45.12H492.38V37.37H532.38V27.5H479.88V72.5ZM608.62 27.5V37.5H633.12V72.5H645.62V37.5H670V27.5H608.62ZM266.81 27.5L293.87 72.5H279.75L274.75 63.75H245.63L240.51 72.5H226.39L254.33 27.5H266.81ZM269.44 54.38L260.44 38.57L251.13 54.38H269.44ZM409.25 27.81V27.5H390.5L365.5 44.5V27.5H353V72.5H365.5V54.5L391.12 72.5H410.5V72.19L376.75 49.25L409.25 27.81ZM456.88 57.12L473 72.19V72.5H456.75L441.87 58.25H426.75V72.5H414.25V27.5H448.25C463.37 27.5 471.75 32.88 471.75 42.75C471.75 50.5 466.5 55.5 456.88 57.12ZM459.38 42.62C459.38 38.12 455.88 37.37 447.88 37.37H426.76V48.5H447.88C455.88 48.5 459.38 47.12 459.38 42.62Z" fill="#1E1E23"/>
          </svg>
        </div>

        {/* Footer Content Grid - layout_66N2EZ */}
        <div className="font-poppins flex flex-wrap items-start justify-between gap-y-[88px] w-1328 min-[1318px]:flex-nowrap">
          {/* Newsletter Section - layout_NO2BUA */}
          <div className="flex flex-col gap-10 w-[422px]">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-8">
                <h3 className="font-poppins font-semibold text-xl leading-[1.2] text-gray-100 w-[109px] h-4">
                  Newsletter
                </h3>
                <p className="font-poppins font-normal text-sm leading-[1.43] text-zinc-400 h-8">
                  Prihláste sa na newsletter a získajte 5€ voucher na prenájom vozidla z našej autopožičovne.
                </p>
              </div>

              {/* Newsletter Input - layout_CNPFH5 */}
              <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-2 pr-2 rounded-[99px] bg-zinc-900 w-[422px] min-[1318px]:flex-nowrap">
                <div className="flex items-center gap-2 flex-1">
                  <Icon name="message" className="w-6 h-6 text-blackrent-text-secondary" />
                  <input 
                    type="email" 
                    placeholder="Váš e-mail"
                    className="flex-1 bg-transparent text-zinc-500 text-sm font-poppins font-medium leading-[1.71] outline-none placeholder:text-zinc-500"
                  />
                </div>
                <button
                  className="flex h-10 items-center justify-center gap-1.5 rounded-[99px] bg-blackrent-green px-4 pl-5 pr-4 transition-colors hover:bg-blackrent-accent"
                >
                  <span className="text-sm font-semibold leading-6 text-blackrent-green-text">Potvrdiť</span>
                  <Icon name="arrow-right" className="w-4 h-4 text-blackrent-green-text" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Content - layout_THXRZA */}
          <div className="flex flex-row items-start justify-between gap-[32px] w-[648px]">
            {/* Site Map - layout_MAGVCB */}
            <div className="flex flex-col gap-8 w-[195px]">
              <h3 className="font-poppins font-semibold text-xl leading-[1.2] text-gray-100 h-4">
                Mapa stránok
              </h3>
              <div className="font-poppins font-normal text-sm leading-[1.71] text-zinc-400 w-[173px]">
                <p>Ponuka vozidiel</p>
                <p>Služby</p>
                <p>Store</p>
                <p>Kontakt</p>
                <p className="text-lime-200">O nás</p>
                <p>Prihlásenie a Registrácia</p>
              </div>
            </div>

            {/* Company Info - layout_Q6Q5L5 */}
            <div className="flex flex-col gap-8 w-[195px]">
              <h3 className="font-poppins font-semibold text-xl leading-[1.2] text-gray-100 h-4">
                Sídlo spoločnosti
              </h3>
              <div className="font-poppins font-normal text-sm leading-[1.71] text-zinc-400 w-[173px]">
                <p>Rozmarínová 211/3</p>
                <p>91101 Trenčín</p>
                <p>+421 910 666 949</p>
                <p>info@blackrent.sk</p>
              </div>
            </div>

            {/* Social Media - layout_MAGVCB */}
            <div className="flex flex-col gap-8 w-[195px]">
              <h3 className="font-poppins font-semibold text-xl leading-[1.2] text-gray-100 h-4">
                Sledujte nás
              </h3>
              <div className="flex gap-4">
                <Icon name="facebook" className="w-6 h-6 text-blackrent-text-secondary hover:text-blackrent-accent transition-colors cursor-pointer" />
                <Icon name="instagram" className="w-6 h-6 text-blackrent-text-secondary hover:text-blackrent-accent transition-colors cursor-pointer" />
                <Icon name="tiktok" className="w-6 h-6 text-blackrent-text-secondary hover:text-blackrent-accent transition-colors cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Under Footer - layout_52KY5B */}
      <div className="flex items-center gap-2 px-[200px] w-1728 h-24 mx-auto bg-black">
        <p className="font-poppins font-normal text-xs leading-8 text-blackrent-border w-[855px] h-2">
          © 2024 blackrent.sk | Obchodné podmienky | Pravidlá pre súbory cookies | Reklamačný poriadok | Ochrana osobných údajov
        </p>
      </div>
    </footer>
  )
}