'use client'

import BlackrentLogo from './assets/BlackrentLogo'
import Icon24Px from './assets/Icon24Px'

export default function HeaderFirejet({
  className = "",
}: HeaderFirejetProps) {
  return (
    <header className={`relative ${className}`}>
      {/* Hero Background with Logo */}
      <div className="relative flex flex-grow flex-col items-center">
        {/* Background Hero Images */}
        <div className="z-[1] self-stretch">
          {/* Placeholder for hero background */}
          <div className="h-[900px] w-[1550px] bg-gradient-to-b from-blackrent-dark to-blackrent-surface rounded-full opacity-20" />
        </div>
        
        {/* BlackRent Logo */}
        <div className="absolute left-8 top-7 z-[2] flex h-8 w-52 flex-col items-center">
          <BlackrentLogo className="h-8 w-52" />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="absolute top-7 right-8 z-[3] flex items-center gap-4">
        {/* Ponuka vozidiel Button */}
        <div className="flex h-10 w-44 items-center justify-end gap-2 rounded-full bg-blackrent-accent p-1 backdrop-blur-[24] [max-width:178px]">
          <div className="flex h-2.5 w-28 items-center font-semibold text-blackrent-green-text">
            <p>Ponuka vozidiel</p>
          </div>
          <div className="flex h-8 w-8 flex-col items-center justify-center rounded-full bg-blackrent-green-text p-1">
            <Icon24Px className="h-6 w-6" />
          </div>
        </div>

        {/* Secondary Button */}
        <div className="flex h-10 w-32 items-center rounded-full bg-blackrent-card px-6 py-[15px] backdrop-blur-[24] [max-width:131px]">
          <div className="flex h-2.5 w-20 items-center font-semibold text-blackrent-text-secondary">
            <p>Kontakt</p>
          </div>
        </div>
      </div>
    </header>
  )
}

interface HeaderFirejetProps {
  className?: string;
}
