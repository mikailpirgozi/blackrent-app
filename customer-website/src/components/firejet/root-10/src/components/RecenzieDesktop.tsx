import Icon32Px from "./assets/Icon32Px";
import Icon16Px from "./assets/Icon16Px";
import KartaRecenzieMobil from "./KartaRecenzieMobil";

export default function RecenzieDesktop({
  className = "",
}: RecenzieDesktopProps) {
  return (
    <div className={`flex w-full pl-52 leading-[normal] ${className}`}>
      <div className="font-poppins flex w-[1528px] flex-wrap gap-8 text-sm leading-5 text-[ghostwhite] min-[1718px]:flex-nowrap" >
        <div className="relative flex flex-grow flex-col items-start justify-center gap-2 rounded-3xl px-6 pb-[17px] pt-6 drop-shadow-lg [max-width:308px]" >
          <div className="bg-background absolute inset-0 z-0 rounded-3xl bg-cover bg-center" />
          <div className="absolute inset-0 z-0 rounded-3xl [background-image:linear-gradient(180deg,_transparent,_#00000033)]" />
          <div className="z-[1] flex items-center justify-end self-stretch">
            <Icon32Px className="h-8 w-8" />
          </div>
          <div className="z-[2] flex items-end pt-36">
            <Icon16Px className="h-4 w-4" />
          </div>
          <div className="z-[3] flex h-[11px] w-64 items-center font-semibold leading-6" >
            <p>Lucia Dubecká</p>
          </div>
          <div className="z-[4] flex flex-col items-center self-stretch pt-4 [max-width:261px]" >
            <div className="flex h-[104px] w-64 items-center">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
            </div>
          </div>
        </div>
        <KartaRecenzieMobil
          className="relative w-80"
          container1="bg-[url(/assets/background-2.jpeg)]"
          text="Jakub B."
         />
        <KartaRecenzieMobil
          className="relative w-80"
          container1="bg-[url(/assets/background-4.jpeg)]"
          text="Tibor Straka"
         />
        <KartaRecenzieMobil
          className="relative w-80"
          container1="bg-[url(/assets/background-6.jpeg)]"
          text="Michal Stanko"
         />
        <div className="relative flex w-80 flex-col items-start justify-end gap-2 rounded-3xl p-6 drop-shadow-lg" >
          <div className="bg-background- absolute inset-0 z-0 rounded-3xl bg-cover bg-center" />
          <div className="absolute inset-0 z-0 rounded-3xl [background-image:linear-gradient(180deg,_transparent,_#00000033)]" />
          <Icon16Px className="z-[1] h-4 w-4" />
          <div className="z-[2] flex h-[11px] w-64 items-center font-semibold leading-6" >
            <p>Ondrej</p>
          </div>
          <div className="z-[3] flex flex-col items-center self-stretch pt-4 [max-width:261px]" >
            <div className="flex h-[90px] w-64 items-center">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RecenzieDesktopProps {
  className?: string;
}
