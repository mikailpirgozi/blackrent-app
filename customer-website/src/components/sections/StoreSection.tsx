'use client'

import { Icon } from '@/components/ui/Icon'
import Pattern from '@/components/firejet/assets/Pattern'

export default function StoreSection() {
  return (
    <section className="bg-blackrent-dark">
      {/* Frame 134 – presný layout zo Figmy */}
      <div className="relative w-1728 h-[1568px] rounded-t-[40px] bg-blackrent-white-1000 mx-auto">
        {/* Pattern (ľavý pás) – pozícia (x:0, y:586), rozmery 476x982 */}
        <Pattern className="absolute top-[586px] left-0 w-[476px] h-[982px]" />

        {/* Nadpis + popis – centrované, šírka 1084px, offset y=200 */}
        <div className="absolute top-[200px] left-[322px] w-[1084px] flex flex-col items-center gap-12">
          <h2 className="w-[439px] h-8 text-center font-sf-pro text-[48px] font-extrabold leading-[1] text-blackrent-card-hover">
            Blackrent store
          </h2>
          <p className="w-[650px] h-12 text-center font-poppins text-[24px] leading-[1.333] text-blackrent-text-muted">
            Vyber si svoj kúsok z našej štýlovej kolekcie oblečenia alebo venuj darčekový poukaz 😎
          </p>
        </div>

        {/* CTA Všetky produkty – pozícia x:760, y:1320 */}
        <button className="absolute left-[760px] top-[1320px] inline-flex items-center gap-1.5 h-12 rounded-full bg-blackrent-green px-6 py-2 pr-5 font-poppins font-semibold leading-6 text-blackrent-green-text hover:bg-blackrent-accent transition-colors">
          Všetky produkty
          <Icon name="bag" className="h-6 w-6" />
        </button>

        {/* Grid placeholder boxov – pozícia a rozmery podľa Figmy */}
        <div className="absolute left-[540px] top-[448px] w-[648px] h-[688px]">
          <div className="relative w-full h-full">
            <div className="absolute left-[62px] top-[80px] h-[200px] w-[200px] rounded-2xl bg-blackrent-text-secondary" />
            <div className="absolute left-0 top-[328px] h-[360px] w-[360px] rounded-2xl bg-blackrent-text-secondary" />
            <div className="absolute right-0 top-0 h-[280px] w-[280px] rounded-2xl bg-blackrent-text-secondary" />
            <div className="absolute right-0 bottom-0 h-[240px] w-[240px] rounded-2xl bg-blackrent-text-secondary" />
          </div>
        </div>
      </div>
    </section>
  )
}