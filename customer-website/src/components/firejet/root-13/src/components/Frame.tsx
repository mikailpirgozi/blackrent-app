import BlackrentLogo from "./assets/BlackrentLogo";
import Icon24Px from "./assets/Icon24Px";
import Icon16Px from "./assets/Icon16Px";
import Icon24Px1 from "./assets/Icon24Px1";
import Icon24Px2 from "./assets/Icon24Px2";
import Icon24Px3 from "./assets/Icon24Px3";

export default function Frame({ className = "" }: FrameProps) {
  return (
    <div
      className={`flex w-full flex-col gap-20 pr-[70px] leading-[normal] ${className}`}
    >
      <BlackrentLogo className="h-8 w-52" />
      <div className="font-poppins flex max-h-44 flex-grow flex-wrap items-center justify-center gap-x-64 gap-y-[88px] text-sm min-[1318px]:flex-nowrap" >
        <div className="flex w-[422px] flex-col items-start justify-between gap-1.5 self-stretch" >
          <div className="flex h-4 w-28 items-center text-xl font-semibold leading-6 text-gray-100" >
            Newsletter
          </div>
          <div className="flex h-8 w-[422px] items-center leading-5 text-zinc-400" >
            <p>
              {"Prihláste sa na newsletter a získajte "}
              <span className="font-semibold">{"5€ voucher "}</span>
              na prenájom vozidla z našej autopožičovňe.
            </p>
          </div>
          <div className="flex flex-col items-center justify-end pt-2">
            <div className="flex flex-wrap items-center justify-center gap-2 rounded-[99px] bg-zinc-900 py-2 pl-4 pr-2 min-[1318px]:flex-nowrap" >
              <Icon24Px className="h-6 w-6" />
              <div className="flex flex-grow items-center justify-center leading-6 [max-width:366px]" >
                <div className="line-clamp-[1] flex h-2.5 w-64 items-center overflow-ellipsis font-medium text-[dimgray]" >
                  <p>Váš e-mail</p>
                </div>
                <div className="flex flex-grow items-center justify-end gap-1.5 rounded-[99px] bg-[greenyellow] px-4 py-3 [max-width:114px]" >
                  <div className="flex h-2.5 w-14 items-center font-semibold text-lime-950" >
                    <p>Potvrdiť</p>
                  </div>
                  <Icon16Px className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-start justify-center gap-x-14 gap-y-9 leading-6 min-[1318px]:flex-nowrap" >
          <div className="flex flex-col items-start gap-8">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xl font-semibold leading-6 text-gray-100 min-[1318px]:flex-nowrap" >
              <div className="flex h-4 w-48 items-center">
                Mapa stránok
              </div>
              <div className="flex h-4 w-44 items-center">
                Sídlo spoločnosti
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-8 self-stretch text-zinc-400 [max-width:400px] min-[1318px]:flex-nowrap" >
              <div className="flex h-32 w-48 items-center">
                <span>
                  <p>{"Ponuka vozidiel "}</p>
                  <p>Služby</p>
                  <p>Store</p>
                  <p>Kontakt</p>
                  <p className="text-lime-200">
                    {"O nás  "}
                    <span className="text-zinc-400" />
                  </p>
                  <p>Prihlásenie a Registrácia</p>
                </span>
              </div>
              <div className="flex h-20 w-44 items-center">
                <span>
                  <p>Rozmarínová 211/3</p>
                  <p>91101 Trenčín</p>
                  <p>+421 910 666 949</p>
                  <p>info@blackrent.sk</p>
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start gap-8">
            <div className="flex h-4 w-32 items-center justify-center text-center text-xl font-semibold leading-6 text-gray-100" >
              Sledujte nás
            </div>
            <div className="flex items-center gap-4">
              <Icon24Px1 className="h-6 w-6" />
              <Icon24Px2 className="h-6 w-6" />
              <Icon24Px3 className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FrameProps {
  className?: string;
}
