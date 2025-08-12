import TFrame71Frame78Frame72Frame74Frame from "./TFrame71Frame78Frame72Frame74Frame";
import Icon24PxFilled from "./assets/Icon24PxFilled";

export default function FAQ({ className = "" }: FAQProps) {
  return (
    <div
      className={`font-poppins flex w-full flex-col items-start gap-4 rounded-t-[40px] bg-zinc-950 px-72 pb-60 pt-52 text-sm font-semibold leading-[normal] text-gray-100 ${className}`}
    >
      <div className="font-sf-pro flex h-6 w-[300px] self-center items-center justify-center text-center text-[40px] font-[650] leading-[24px] text-blackrent-accent" >
        Časté otázky
      </div>
      <div className="flex flex-wrap items-center justify-center gap-8 pt-[104px] min-[1718px]:flex-nowrap" >
        <TFrame71Frame78Frame72Frame74Frame
          className="w-[567px]"
          container1="w-60"
          text="Čo je zahrnuté v cene prenájmu?"
          container2="gap-x-36 justify-center w-[567px]"
          container3="w-[355px]"
          text1="V akom stave je vozidlo pri odovzdaní nájomcovi?"
          container4="gap-x-40"
          container5="w-[347px]"
          text2="Do ktorých krajín môžem s vozidlom vycestovať?"
          container6="gap-x-36 justify-center w-[567px]"
          container7="w-[361px]"
          text3="Môžem cestovať aj do krajín mimo Európskej Únie?"
          container8="gap-x-16 justify-center w-[567px]"
          container9="w-[442px]"
          text4="Môžem vozidlo prevziať / odovzdať aj mimo otváracích hodín?"
         />
        <TFrame71Frame78Frame72Frame74Frame
          className="w-[567px]"
          container1="w-56"
          text="Majú vozidlá diaľničnú známku?"
          container2="gap-x-16 self-stretch justify-between"
          container3="w-48"
          text1="Je možná preprava zvierat?"
          container4="gap-x-[135px]"
          container5="w-96"
          text2="Ako mám postupovať keď viem, že budem meškať?"
          container6="gap-x-16 self-stretch justify-between"
          container7="w-60"
          text3="Čo znamená jeden deň prenájmu?"
          container8="gap-x-20 self-stretch justify-between"
          container9="w-44"
          text4="Čo ak dostanem pokutu?"
         />
      </div>
      <div className="flex items-center">
        <div className="flex flex-grow flex-wrap items-center justify-between gap-x-12 gap-y-[5px] rounded-lg bg-zinc-900 py-4 pl-6 pr-4 [max-width:567px] min-[1718px]:flex-nowrap" >
          <div className="flex h-2.5 w-72 items-center">
            <p>Ako môžem platiť za prenájom vozidla?</p>
          </div>
          <Icon24PxFilled className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

interface FAQProps {
  className?: string;
}
