import Icon24Px from "./assets/Icon24Px";
import Icon24Px1 from "./assets/Icon24Px1";
import Icon24Px2 from "./assets/Icon24Px2";
import Icon24Px3 from "./assets/Icon24Px3";

export default function FilterHomepage({
  className = "",
}: FilterHomepageProps) {
  return (
    <div
      className={`relative z-[10] font-poppins flex h-[232px] w-[1102px] flex-col justify-end items-center gap-6 rounded-3xl border border-solid border-[#1E1E23] px-20 pt-10 pb-6 text-sm leading-[normal] bg-blackrent-card ${className}`}
    >
      <div className="flex flex-col self-stretch gap-4">
        <div className="flex h-6 items-center text-[32px] font-semibold leading-6 text-[#F0F0F5]">
          Požičajte si auto už dnes
        </div>
        <div className="flex items-center text-sm font-normal leading-6 text-[#BEBEC3]">
          <p>✅ Rýchlo, jednoducho a bez skyrytých poplatkov</p>
        </div>
      </div>
      <div className="flex flex-row items-center self-stretch gap-4">
        <div className="flex flex-row items-center gap-2 rounded-lg bg-zinc-900 p-4 flex-1">
          <Icon24Px className="h-6 w-6" />
          <div className="flex items-center text-sm font-medium leading-6 text-[#BEBEC3]">
            <p>Miesto vyzdvihnutia</p>
          </div>
        </div>
        <div className="flex flex-row items-center gap-2 rounded-lg bg-zinc-900 p-4 flex-1">
          <Icon24Px1 className="h-6 w-6" />
          <div className="flex items-center text-sm font-medium leading-6 text-[#BEBEC3]">
            <p>Dátum vyzdvihnutia</p>
          </div>
        </div>
        <div className="flex flex-row items-center gap-2 rounded-lg bg-zinc-900 p-4 flex-1">
          <Icon24Px2 className="h-6 w-6" />
          <div className="flex items-center text-sm font-medium leading-6 text-[#BEBEC3]">
            <p>Dátum vrátenia</p>
          </div>
        </div>
        <button className="group inline-flex flex-row items-center gap-1.5 rounded-[99px] bg-blackrent-green px-6 py-2 transition-colors hover:bg-blackrent-accent">
          <span className="text-sm font-semibold leading-6 text-blackrent-green-text">Vyhľadať</span>
          <Icon24Px3 className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

interface FilterHomepageProps {
  className?: string;
}
