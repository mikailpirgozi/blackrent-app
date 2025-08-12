import Icon24PxFilled from "./assets/Icon24PxFilled";

export default function TFrame71Frame78Frame72Frame74Frame({
  className = "",
  container1 = "",
  text = "Čo je zahrnuté v cene prenájmu?",
  container2 = "",
  container3 = "",
  text1 = "V akom stave je vozidlo pri odovzdaní nájomcovi?",
  container4 = "",
  container5 = "",
  text2 = "Do ktorých krajín môžem s vozidlom vycestovať?",
  container6 = "",
  container7 = "",
  text3 = "Môžem cestovať aj do krajín mimo Európskej Únie?",
  container8 = "",
  container9 = "",
  text4 = "Môžem vozidlo prevziať / odovzdať aj mimo otváracích hodín?",
}: TFrame71Frame78Frame72Frame74FrameProps) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-16 gap-y-[5px] self-stretch rounded-lg bg-zinc-900 py-4 pl-6 pr-4 min-[1718px]:flex-nowrap" >
        <div className={`flex h-2.5 items-center ${container1}`}>
          <p>{text}</p>
        </div>
        <Icon24PxFilled className="h-6 w-6" />
      </div>
      <div
        className={`flex flex-wrap items-center gap-y-[5px] rounded-lg bg-zinc-900 py-4 pl-6 pr-4 min-[1718px]:flex-nowrap ${container2}`}
      >
        <div className={`flex h-2.5 items-center ${container3}`}>
          <p>{text1}</p>
        </div>
        <Icon24PxFilled className="h-6 w-6" />
      </div>
      <div
        className={`flex w-[567px] flex-wrap items-center justify-center gap-y-[5px] rounded-lg bg-zinc-900 py-4 pl-6 pr-4 min-[1718px]:flex-nowrap ${container4}`}
      >
        <div className={`flex h-2.5 items-center ${container5}`}>
          <p>{text2}</p>
        </div>
        <Icon24PxFilled className="h-6 w-6" />
      </div>
      <div
        className={`flex flex-wrap items-center gap-y-[5px] rounded-lg bg-zinc-900 py-4 pl-6 pr-4 min-[1718px]:flex-nowrap ${container6}`}
      >
        <div className={`flex h-2.5 items-center ${container7}`}>
          <p>{text3}</p>
        </div>
        <Icon24PxFilled className="h-6 w-6" />
      </div>
      <div
        className={`flex flex-wrap items-center gap-y-[5px] rounded-lg bg-zinc-900 py-4 pl-6 pr-4 min-[1718px]:flex-nowrap ${container8}`}
      >
        <div className={`flex h-2.5 items-center ${container9}`}>
          <p>{text4}</p>
        </div>
        <Icon24PxFilled className="h-6 w-6" />
      </div>
    </div>
  );
}

interface TFrame71Frame78Frame72Frame74FrameProps {
  className?: string;
  container1: string;
  text: string;
  container2: string;
  container3: string;
  text1: string;
  container4: string;
  container5: string;
  text2: string;
  container6: string;
  container7: string;
  text3: string;
  container8: string;
  container9: string;
  text4: string;
}
