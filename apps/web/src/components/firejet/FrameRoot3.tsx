'use client';

import Icon24Px1Root3 from './assets/Icon24Px1Root3';

export default function FrameRoot3({ className = '' }: FrameRoot3Props) {
  return (
    <div className={`flex w-full flex-col leading-[normal] ${className}`}>
      <div className="flex flex-grow flex-wrap justify-center gap-14 min-[1718px]:flex-nowrap">
        {/* Ľavá strana s obrázkami */}
        <div className="flex items-center justify-center gap-8">
          <div className="flex flex-col gap-8 self-stretch">
            {/* Placeholder pre obrázky - nahradím skutočnými obrázkami */}
            <div className="h-36 max-h-full w-32 max-w-full rounded-lg bg-blackrent-card" />
            <div className="h-48 max-h-full w-44 max-w-full rounded-lg bg-blackrent-card" />
            <div className="h-36 max-h-full w-32 max-w-full rounded-lg bg-blackrent-card" />
          </div>
          <div className="flex flex-col items-center justify-end pt-8">
            <div className="flex flex-col gap-8">
              <div className="h-36 w-36 rounded-lg bg-blackrent-card" />
              <div className="h-[104px] w-[104px] rounded-lg bg-blackrent-card" />
            </div>
          </div>
        </div>

        {/* Stredná časť s hlavným textom */}
        <div className="flex flex-grow flex-wrap items-start justify-center gap-14 min-[1718px]:flex-nowrap">
          <div className="flex flex-col items-center justify-end pt-8">
            <div className="flex w-[928px] flex-col items-start gap-10 text-center">
              {/* Hlavný nadpis */}
              <div className="font-sf-pro flex h-[103px] w-[928px] items-center justify-center text-[56px] font-[540] leading-[64px] text-lime-200">
                <span className="text-center">
                  <p>Autá pre každodennú potrebu,</p>
                  <p>aj nezabudnuteľný zážitok</p>
                </span>
              </div>

              {/* Podnadpis a tlačidlá */}
              <div className="font-poppins flex flex-col items-center gap-10 px-44">
                <div className="flex h-9 w-[562px] items-center justify-center text-center leading-6 text-[silver]">
                  <span>
                    Spolupracujeme s desiatkami preverených autopožičovní na
                    slovensku s ponukou vyše 100+ vozidiel
                  </span>
                </div>

                {/* Tlačidlá */}
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-5 text-sm leading-8 min-[1718px]:flex-nowrap">
                  {/* Ponuka vozidiel tlačidlo */}
                  <div className="flex flex-grow items-center justify-end gap-2 rounded-[99px] bg-lime-200 py-1 pl-6 pr-1 backdrop-blur-[24] [max-width:178px]">
                    <div className="flex h-2.5 w-28 items-center font-semibold text-lime-950">
                      <p>Ponuka vozidiel</p>
                    </div>
                    <div className="flex h-8 w-8 flex-col items-center justify-center rounded-full bg-lime-950 p-1">
                      <Icon24Px1Root3 className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Naše služby tlačidlo */}
                  <div className="flex w-32 items-center rounded-[99px] bg-zinc-800 px-6 py-[15px] backdrop-blur-[24]">
                    <div className="flex h-2.5 w-20 items-center font-medium text-gray-100">
                      <p>Naše služby</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pravá strana s obrázkami */}
          <div className="flex flex-col items-end self-stretch">
            <div className="relative flex flex-grow justify-end pb-8 pl-10">
              <div className="z-[1] flex items-center justify-center gap-8">
                <div className="flex flex-col items-center pb-8">
                  <div className="h-[104px] w-[104px] rounded-lg bg-blackrent-card" />
                </div>
                <div className="flex flex-col items-end gap-8 self-stretch">
                  <div className="h-36 max-h-full w-32 max-w-full rounded-lg bg-blackrent-card" />
                  <div className="h-48 max-h-full w-44 max-w-full rounded-lg bg-blackrent-card" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 z-[2] flex h-36 w-36 flex-col items-center">
                <div className="h-36 w-36 rounded-lg bg-blackrent-card" />
              </div>
            </div>
            <div className="h-36 max-h-full w-32 max-w-full rounded-lg bg-blackrent-card" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface FrameRoot3Props {
  className?: string;
}
