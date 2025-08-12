'use client'

import TFrame71Frame78Frame72Frame74Frame from './TFrame71Frame78Frame72Frame74Frame'

export default function FAQSectionFirejet({
  className = "",
}: FAQSectionFirejetProps) {
  return (
    <section className={`bg-blackrent-dark py-20 ${className}`}>
      <div className="container mx-auto px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-sf-pro text-4xl font-bold text-blackrent-accent mb-4">
            Často kladené otázky
          </h2>
          <p className="text-blackrent-text-secondary text-lg">
            Odpovede na najčastejšie otázky o prenájme vozidiel
          </p>
        </div>

        {/* FAQ Content */}
        <div className="max-w-4xl mx-auto">
          <TFrame71Frame78Frame72Frame74Frame
            container1=""
            text="Čo je zahrnuté v cene prenájmu?"
            container2=""
            container3=""
            text1="V akom stave je vozidlo pri odovzdaní nájomcovi?"
            container4=""
            container5=""
            text2="Do ktorých krajín môžem s vozidlom vycestovať?"
            container6=""
            container7=""
            text3="Môžem cestovať aj do krajín mimo Európskej Únie?"
            container8=""
            container9=""
            text4="Môžem vozidlo prevziať / odovzdať aj mimo otváracích hodín?"
          />
        </div>
      </div>
    </section>
  )
}

interface FAQSectionFirejetProps {
  className?: string;
}
