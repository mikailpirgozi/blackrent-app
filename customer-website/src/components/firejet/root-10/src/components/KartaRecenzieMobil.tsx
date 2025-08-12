import Icon32Px1 from "./assets/Icon32Px1";
import Icon16Px from "./assets/Icon16Px";

export default function KartaRecenzieMobil({
  className = "",
  container1 = "",
  text = "Jakub B.",
}: KartaRecenzieMobilProps) {
  return (
    <div
      className={`flex flex-col items-start justify-end gap-2 rounded-3xl p-6 drop-shadow-lg ${className}`}
    >
      <div
        className={`absolute inset-0 z-0 rounded-3xl bg-cover bg-center ${container1}`}
       />
      <div className="absolute inset-0 z-0 rounded-3xl [background-image:linear-gradient(180deg,_transparent,_#00000033)]" />
      <Icon32Px1 className="absolute right-4 top-4 z-[1] h-8 w-8" />
      <Icon16Px className="z-[2] h-4 w-4" />
      <div className="z-[3] flex h-[11px] w-64 items-center font-semibold leading-6" >
        <p>{text}</p>
      </div>
      <div className="z-[4] flex flex-col items-center self-stretch pt-4 [max-width:261px]" >
        <div className="flex h-[90px] w-64 items-center">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        </div>
      </div>
    </div>
  );
}

interface KartaRecenzieMobilProps {
  className?: string;
  container1: string;
  text: string;
}
