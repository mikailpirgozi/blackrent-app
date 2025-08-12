import Icon32Px from "./assets/Icon32Px";

export default function KartaVozidlaHomepage({
  className = "",
  attr1 = "/assets/nh-ad-vozidla-5.jpeg",
}: KartaVozidlaHomepageProps) {
  return (
    <div
      className={`group flex flex-col items-end justify-center gap-2 rounded-3xl bg-zinc-900 p-4 transition-colors ${className}`}
    >
      <img
        className="h-64 w-96 rounded-lg object-cover object-center"
        src={attr1}
        loading="lazy"
       />
      <div className="flex flex-col items-end self-stretch pt-4 [max-width:390px]" >
        <div className="font-sf-pro flex h-4 w-96 items-center overflow-ellipsis text-2xl font-[650] leading-7 text-lime-200" >
          Názov vozidla
        </div>
      </div>
      <div className="flex items-end self-stretch pl-4 pt-2 [max-width:390px]" >
        <div className="flex h-2 w-96 items-center text-xs leading-6 text-[silver]" >
          <p>123 kW ∙ Palivo ∙ Prevodovka ∙ Náhon</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 min-[1818px]:flex-nowrap" >
        <div className="flex w-72 flex-col items-center pt-[15px]">
          <div className="flex h-[17px] w-72 items-center">
            <p>
              <span className="font-semibold leading-6 text-zinc-400">
                {"od "}
              </span>
              <span className="text-2xl font-semibold leading-6 text-gray-100" >
                123€
              </span>
              <span className="text-2xl leading-6 text-zinc-400">
                /deň
              </span>
            </p>
          </div>
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 p-4 group-hover:bg-lime-950 transition-colors" >
          <Icon32Px className="h-8 w-8 text-blackrent-text-secondary group-hover:text-blackrent-green transition-colors" />
        </div>
      </div>
    </div>
  );
}

interface KartaVozidlaHomepageProps {
  className?: string;
  attr1: string;
}
