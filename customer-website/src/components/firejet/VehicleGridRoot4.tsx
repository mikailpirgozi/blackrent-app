import KartaVozidlaHomepageRoot4 from "./KartaVozidlaHomepageRoot4";
import Icon32Px1 from "./assets/Icon32Px1";
import Icon32Px from "./assets/Icon32Px";

export default function VehicleGridRoot4({ className = "" }: VehicleGridRoot4Props) {
  return (
    <div className={`flex w-full px-52 leading-[normal] ${className}`}>
      <div className="font-poppins flex flex-grow flex-wrap justify-center gap-[31px] leading-6 min-[1718px]:flex-nowrap" >
        <div className="flex flex-col items-start gap-16">
          <KartaVozidlaHomepageRoot4 attr1="/images/nh-ad-vozidla-5.jpeg" />
          <KartaVozidlaHomepageRoot4 attr1="/images/nh-ad-vozidla-5.jpeg" />
        </div>
        <div className="flex flex-col items-start gap-16">
        <div className="group flex flex-col items-end justify-center gap-2 rounded-3xl bg-zinc-900 p-4" >
            <img
              className="h-64 w-96 rounded-lg object-cover object-center"
              src="/images/nh-ad-vozidla-5.jpeg"
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
              <div className="group flex flex-wrap items-center justify-end gap-2 min-[1718px]:flex-nowrap" >
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
                {/* default biela šípka, na hover žltá */}
                <Icon32Px className="h-8 w-8 text-blackrent-text-secondary group-hover:text-blackrent-green transition-colors" />
              </div>
            </div>
          </div>
          <div className="group flex flex-col items-end justify-center gap-2 self-stretch rounded-3xl bg-zinc-900 p-4 [max-width:422px]" >
            <div className="relative self-stretch rounded-lg overflow-hidden">
              <img
                className="w-full h-64 object-cover object-center rounded-lg"
                src="/images/nh-ad-vozidla-5.jpeg"
                loading="lazy"
              />
              <div className="absolute top-2 left-2 flex items-center justify-start gap-2 text-xs font-medium leading-6">
                <div className="flex flex-grow items-center rounded-[99px] bg-[#D7FF14] px-3 py-2 [max-width:56px]">
                  <div className="flex h-2 w-8 items-center text-lime-950">
                    <p>-25%</p>
                  </div>
                </div>
                <div className="flex flex-grow items-center rounded-[99px] bg-gray-100 px-3 py-2 [max-width:144px]">
                  <div className="flex h-2 w-[120px] items-center text-zinc-900">
                    <p>Možný odpočet DPH</p>
                  </div>
                </div>
              </div>
            </div>
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
            <div className="group flex flex-wrap items-center justify-end gap-2 min-[1718px]:flex-nowrap" >
              <div className="flex w-72 flex-col items-center pt-[15px]">
                <div className="flex h-[17px] w-72 items-center text-2xl leading-6" >
                  <p>
                    <span className="font-semibold leading-6 text-zinc-400">
                      {"od "}
                    </span>
                    <span className="font-semibold text-[dimgray] line-through" >
                      {"123€ "}
                    </span>
                    <span className="font-semibold text-[#D7FF14]">
                      89€
                    </span>
                    <span className="text-zinc-400">/deň</span>
                  </p>
                </div>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 p-4 group-hover:bg-lime-950 transition-colors" >
                <Icon32Px className="h-8 w-8 text-blackrent-text-secondary group-hover:text-blackrent-green transition-colors" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start gap-16">
          <div className="group flex flex-col items-end justify-center gap-2 self-stretch rounded-3xl bg-zinc-900 p-4 [max-width:422px]" >
            <div className="relative self-stretch rounded-lg overflow-hidden">
              <img
                className="w-full h-64 object-cover object-center rounded-lg"
                src="/images/nh-ad-vozidla-5.jpeg"
                loading="lazy"
              />
              <div className="absolute top-2 left-2 flex items-center justify-start">
                <div className="flex flex-grow items-center rounded-[99px] bg-gray-100 px-3 py-2 [max-width:144px]">
                  <div className="flex h-2 w-[120px] items-center text-xs font-medium leading-6 text-zinc-900">
                    <p>Možný odpočet DPH</p>
                  </div>
                </div>
              </div>
            </div>
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
            <div className="group flex flex-wrap items-center justify-end gap-2 min-[1718px]:flex-nowrap" >
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
          <KartaVozidlaHomepageRoot4 attr1="/images/nh-ad-vozidla-5.jpeg" />
        </div>
      </div>
    </div>
  );
}

interface VehicleGridRoot4Props {
  className?: string;
}
