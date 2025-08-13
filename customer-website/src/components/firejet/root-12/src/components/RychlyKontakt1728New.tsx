import Ellipse from "./assets/Ellipse";
import Icon24Px from "./assets/Icon24Px";
import Line from "./assets/Line";
import Icon24Px1 from "./assets/Icon24Px1";

export default function RychlyKontakt1728New({
  className = "",
}: RychlyKontakt1728NewProps) {
  return (
    <div
      className={`relative mx-auto flex w-[1328px] flex-col items-center gap-4 rounded-3xl bg-blackrent-white-800 px-0 pt-24 pb-[72px] leading-[normal] ${className}`}
    >
      {/* Operator avatar - 96px nad kartou podľa 1728 new layout */}
      <div 
        className="absolute z-[6] w-[104px] h-[104px] p-2 flex flex-col items-start gap-2 rounded-[99px] border border-[#F0F0F5] overflow-hidden"
        style={{
          position: 'absolute',
          left: '612px',
          top: '-96px',
          display: 'flex',
          width: '104px',
          height: '104px',
          padding: '8px',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '8px',
          borderRadius: '99px',
          border: '1px solid var(--White-800, #F0F0F5)',
          background: 'url(/assets/fotka-oper-tora.jpeg) lightgray 0px -7.084px / 100% 149.982% no-repeat'
        }}
      >
        <Ellipse className="absolute right-2 bottom-2 h-3.5 w-3.5" />
      </div>
      <div className="z-[2] flex flex-col items-center justify-center self-stretch pt-6 [max-width:874px]" >
        <div className="font-sf-pro flex h-6 w-[874px] items-center justify-center text-center text-[32px] font-[650] leading-6 text-lime-950" >
          Potrebujete poradiť? Sme tu pre vás.
        </div>
      </div>
      <div className="font-poppins z-[3] flex h-4 w-[874px] items-center justify-center text-center font-medium leading-6 text-zinc-400" >
        Sme na príjme Po–Pia 08:00–17:00
      </div>
      <div className="font-poppins z-[4] flex flex-wrap items-center justify-center gap-[7px] pt-6 text-xl font-medium leading-6 text-[dimgray] min-[1318px]:flex-nowrap" >
        <Icon24Px className="h-6 w-6" />
        <div className="flex h-3.5 w-44 items-center">
          <a href="tel:+421 910 666 949">+421 910 666 949</a>
        </div>
        <div className="flex max-h-10 items-center justify-end self-stretch pl-[7.5px] [min-height:41px]" >
          <Line className="h-10 w-px" />
        </div>
        <div className="flex items-center justify-end pl-[7.5px]">
          <Icon24Px1 className="h-6 w-6" />
        </div>
        <div className="flex h-3.5 w-44 items-center">
          info@blackrent.sk
        </div>
      </div>
    </div>
  );
}

interface RychlyKontakt1728NewProps {
  className?: string;
}
