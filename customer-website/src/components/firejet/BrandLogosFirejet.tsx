'use client'

import LogaAut8 from './assets/LogaAut8'
import LogaAut9 from './assets/LogaAut9'
import LogaAut from './assets/LogaAut'
import LogaAut1 from './assets/LogaAut1'
import LogaAut2 from './assets/LogaAut2'
import LogaAut3 from './assets/LogaAut3'
import LogaAut4 from './assets/LogaAut4'
import LogaAut5 from './assets/LogaAut5'
import LogaAut6 from './assets/LogaAut6'
import LogaAut7 from './assets/LogaAut7'
import LogaAut10 from './assets/LogaAut10'
import LogaAut11 from './assets/LogaAut11'

export default function BrandLogosFirejet({
  className = "",
}: BrandLogosFirejetProps) {
  
  const handleLogoClick = (brandName: string) => {
    console.log(`Clicked on ${brandName} logo`)
    // Tu môžete pridať navigáciu alebo filter pre konkrétnu značku
  }

  // Jeden rad logotypov – presne zachované rozostupy a separátory
  const LogosRow = () => (
    <div className="flex items-center justify-center gap-12 h-[104px] w-1/2 flex-none">
      <div className="flex items-center justify-center">
        <button onClick={() => handleLogoClick('Mercedes')} className="cursor-pointer hover:scale-110 transition-transform duration-200" aria-label="Filter by Mercedes">
          <LogaAut8 className="h-24 w-24" />
        </button>
        <div className="flex w-[68px] flex-col items-end">
          <div className="h-24 w-44 [background-image:linear-gradient(90deg,_#05050a,_transparent)]" />
        </div>
        <div className="flex w-20 flex-col items-end">
          <button onClick={() => handleLogoClick('Mustang')} className="cursor-pointer hover:scale-110 transition-transform duration-200" aria-label="Filter by Mustang">
            <LogaAut9 className="h-24 w-24" />
          </button>
        </div>
      </div>
      <button onClick={() => handleLogoClick('Audi')} className="cursor-pointer hover:scale-110 transition-transform duration-200" aria-label="Filter by Audi">
        <LogaAut className="h-24 w-24" />
      </button>
      <button onClick={() => handleLogoClick('BMW')} className="cursor-pointer hover:scale-110 transition-transform duration-200" aria-label="Filter by BMW">
        <LogaAut1 className="h-24 w-24" />
      </button>
      <button onClick={() => handleLogoClick('Chevrolet')} className="cursor-pointer hover:scale-110 transition-transform duration-200" aria-label="Filter by Chevrolet">
        <LogaAut2 className="h-24 w-24" />
      </button>
      <button onClick={() => handleLogoClick('Dodge')} className="cursor-pointer hover:scale-110 transition-transform duration-200" aria-label="Filter by Dodge">
        <LogaAut3 className="h-24 w-24" />
      </button>
      <button onClick={() => handleLogoClick('Ford')} className="cursor-pointer hover:scale-110 transition-transform duration-200" aria-label="Filter by Ford">
        <LogaAut4 className="h-24 w-24" />
      </button>
      <button onClick={() => handleLogoClick('Hyundai')} className="cursor-pointer hover:scale-110 transition-transform duration-200" aria-label="Filter by Hyundai">
        <LogaAut5 className="h-24 w-24" />
      </button>
      <button onClick={() => handleLogoClick('Iveco')} className="cursor-pointer hover:scale-110 transition-transform duration-200" aria-label="Filter by Iveco">
        <LogaAut6 className="h-24 w-24" />
      </button>
      <button onClick={() => handleLogoClick('Jaguar')} className="cursor-pointer hover:scale-110 transition-transform duration-200" aria-label="Filter by Jaguar">
        <LogaAut7 className="h-24 w-24" />
      </button>
      <div className="flex items-center justify-center">
        <button onClick={() => handleLogoClick('Nissan')} className="cursor-pointer hover:scale-110 transition-transform duration-200" aria-label="Filter by Nissan">
          <LogaAut10 className="h-24 w-24" />
        </button>
        <div className="flex w-36 flex-col items-end">
          <div className="h-24 w-44 [background-image:linear-gradient(90deg,_transparent,_#05050a)]" />
        </div>
        <div className="flex w-0 flex-col items-end">
          <button onClick={() => handleLogoClick('Opel')} className="cursor-pointer hover:scale-110 transition-transform duration-200" aria-label="Filter by Opel">
            <LogaAut11 className="h-24 w-24" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <section className={`relative bg-blackrent-dark overflow-hidden py-12 ${className}`}>
      <div className="relative w-full h-full">
        {/* Ľavý gradient fade */}
        <div className="pointer-events-none absolute left-0 top-0 w-16 h-full bg-gradient-to-r from-[#05050A] to-transparent z-10" />
        
        {/* Pravý gradient fade */}
        <div className="overflow-hidden">
          {/* Dvojité zreťazenie pre nekonečný loop bez medzery */}
          <div className="animate-scroll flex w-[200%] items-center" style={{ animationDuration: '60s' }}>
            <LogosRow />
            <LogosRow />
          </div>
        </div>
      </div>
    </section>
  )
}

interface BrandLogosFirejetProps {
  className?: string;
}
