'use client'

import BlackrentLogoRoot3 from '@/components/firejet/assets/BlackrentLogoRoot3'
import IkonyRoot3 from '@/components/firejet/assets/IkonyRoot3'
import Icon24PxRoot3 from '@/components/firejet/assets/Icon24PxRoot3'

export default function Header() {
  return (
    <header className="sticky top-0 left-0 right-0 z-[1000] bg-blackrent-dark">
      <div className="flex w-full flex-wrap items-center gap-x-[816px] gap-y-4 px-8 py-6 leading-[normal] min-[1718px]:flex-nowrap">
        {/* BlackRent Logo */}
        <BlackrentLogoRoot3 className="h-8 w-52" />
        
        {/* Navigation Menu */}
        <div className="font-poppins flex w-[634px] flex-wrap items-center justify-center gap-x-2 gap-y-[5px] text-sm font-medium leading-6 text-[silver] min-[1718px]:flex-nowrap">
          
          {/* Ponuka vozidiel */}
          <div className="flex h-2.5 w-28 items-center">
            <p>Ponuka vozidiel</p>
          </div>
          
          {/* Služby */}
          <div className="flex w-16 items-center pl-4">
            <div className="flex h-2.5 w-12 items-center">
              <p>Služby</p>
            </div>
          </div>
          
          {/* Store */}
          <div className="flex w-[53px] items-center pl-4">
            <div className="flex h-2.5 w-9 items-center">
              <p>Store</p>
            </div>
          </div>
          
          {/* O nás */}
          <div className="flex w-16 items-center pl-4">
            <div className="flex h-2.5 w-12 items-center">
              <p>O nás</p>
            </div>
          </div>
          
          {/* Kontakt */}
          <div className="flex w-[71px] items-center pl-4">
            <div className="flex h-2.5 w-14 items-center">
              <p>Kontakt</p>
            </div>
          </div>
          
          {/* Language Icon */}
          <div className="flex items-center justify-end pl-4">
            <IkonyRoot3 className="h-6 w-6" />
          </div>
          
          {/* SK Language */}
          <div className="flex h-2.5 w-[18px] items-center justify-end text-right">
            <p>SK</p>
          </div>
          
          {/* Login Button */}
          <div className="flex items-center justify-end pl-4">
            <div className="flex flex-grow items-center justify-center gap-1.5 rounded-[99px] bg-lime-950 py-2 pl-5 pr-6 [max-width:151px]">
              <Icon24PxRoot3 className="h-6 w-6" />
              <div className="flex h-2.5 w-20 items-center text-[greenyellow]">
                <p>Prihlásiť sa</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </header>
  )
}