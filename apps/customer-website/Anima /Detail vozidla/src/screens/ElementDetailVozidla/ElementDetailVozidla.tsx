import React from "react";
import { useWindowWidth } from "../../breakpoints";
import { CheckBoxy } from "../../components/CheckBoxy";
import { ElementIconsDarkBig } from "../../components/ElementIconsDarkBig";
import { ElementIconsDarkMedium } from "../../components/ElementIconsDarkMedium";
import { FaqRychlyKontakt } from "../../components/FaqRychlyKontakt";
import { FaqRychlyKontaktFooter1728 } from "../../components/FaqRychlyKontaktFooter1728";
import { FooterTablet } from "../../components/FooterTablet";
import { Frame263 } from "../../components/Frame263";
import { Icon16Px } from "../../components/Icon16Px";
import { IconPx } from "../../components/IconPx";
import { Menu } from "../../components/Menu";
import { Menu1 } from "../../components/Menu1";
import { PoskytovateVozidla } from "../../components/PoskytovateVozidla";
import { StaviTlaTiekShare } from "../../components/StaviTlaTiekShare";
import { TypeDefaultWrapper } from "../../components/TypeDefaultWrapper";
import { CheckBoxy24_2 } from "../../icons/CheckBoxy24_2";
import { Icon16Px44 } from "../../icons/Icon16Px44";
import { Icon16Px64 } from "../../icons/Icon16Px64";
import { Icon16Px75 } from "../../icons/Icon16Px75";
import { Icon16Px83 } from "../../icons/Icon16Px83";
import { Icon24Px14 } from "../../icons/Icon24Px14";
import { Icon24Px81 } from "../../icons/Icon24Px81";
import { Icon24Px94 } from "../../icons/Icon24Px94";
import { Icon24Px103 } from "../../icons/Icon24Px103";
import { Icon24Px118 } from "../../icons/Icon24Px118";
import { Icon24Px123 } from "../../icons/Icon24Px123";
import { Icon24Px124 } from "../../icons/Icon24Px124";
import { Icon24Px125 } from "../../icons/Icon24Px125";
import { Icon24Px127 } from "../../icons/Icon24Px127";
import { Ikony25_4 } from "../../icons/Ikony25_4";
import { Ikony25_5 } from "../../icons/Ikony25_5";
import { Ikony25_7 } from "../../icons/Ikony25_7";
import { TypKaroseria } from "../../icons/TypKaroseria";
import { TypNahon } from "../../icons/TypNahon";
import { TypPhoto } from "../../icons/TypPhoto";
import { TypPlus } from "../../icons/TypPlus";
import { TypShare } from "../../icons/TypShare";
import { DivWrapper } from "./sections/DivWrapper";
import { FooterMobile } from "./sections/FooterMobile";
import { Frame } from "./sections/Frame";
import { FrameWrapper } from "./sections/FrameWrapper";
import { TabulkaObjednvky } from "./sections/TabulkaObjednvky";

export const ElementDetailVozidla = (): JSX.Element => {
  const screenWidth = useWindowWidth();

  return (
    <div
      className="w-screen grid [align-items:start] bg-[#05050a] justify-items-center"
      data-model-id="10778:32619"
    >
      <div
        className={`bg-colors-black-100 relative ${screenWidth < 744 ? "w-[360px]" : (screenWidth >= 744 && screenWidth < 1440) ? "w-[744px]" : screenWidth >= 1440 && screenWidth < 1728 ? "w-[1440px]" : screenWidth >= 1728 ? "w-[1728px]" : ""} ${screenWidth < 744 ? "h-[6009px]" : (screenWidth >= 744 && screenWidth < 1440) ? "h-[6019px]" : screenWidth >= 1440 && screenWidth < 1728 ? "h-[5356px]" : screenWidth >= 1728 ? "h-[5192px]" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "overflow-hidden" : ""}`}
      >
        {screenWidth < 744 && (
          <>
            <div className="flex w-[328px] h-64 items-end justify-end gap-2 p-4 absolute top-48 left-4 rounded-2xl overflow-hidden bg-[url(/img/frame-170.png)] bg-cover bg-[50%_50%]">
              <div className="inline-flex items-center gap-1 px-4 py-2 relative flex-[0_0_auto] bg-[#00000080] rounded-lg">
                <TypPhoto className="!relative !w-6 !h-6" />
                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
                  16
                </div>
              </div>
            </div>

            <TabulkaObjednvky />
            <Frame />
            <FrameWrapper />
            <DivWrapper />
            <Menu className="!absolute !left-0 !top-0" type="default" />
            <FooterMobile />
          </>
        )}

        {screenWidth >= 744 && screenWidth < 1440 && (
          <>
            <TypeDefaultWrapper
              className="!absolute !left-0 !top-0"
              type="default"
            />
            <FooterTablet
              className="!absolute !left-0 !top-[3690px]"
              href="tel:+421 910 666 949"
              type="a"
            />
            <div className="flex flex-col w-[680px] items-start justify-end gap-2 absolute top-[104px] left-8">
              <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                <div className="relative self-stretch h-8 mt-[-1.00px] [font-family:'SF_Pro-ExpandedMedium',Helvetica] font-medium text-colors-light-yellow-accent-700 text-[40px] tracking-[0] leading-[64px] whitespace-nowrap">
                  Ford Mustang
                </div>
              </div>

              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <Frame263
                  className="!flex-[0_0_auto]"
                  divClassName="!text-colors-ligh-gray-800"
                  divClassNameOverride="!text-colors-ligh-gray-800"
                  icon16Px100Color="#BEBEC3"
                  icon16Px101Color="#BEBEC3"
                  icon16Px4Color="#BEBEC3"
                  icon16Px5Color="#BEBEC3"
                  popisClassName="!text-colors-ligh-gray-800"
                  popisClassNameOverride="!text-colors-ligh-gray-800"
                />
                <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                  <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                    <img
                      className="relative w-[107.2px] h-4"
                      alt="Vector"
                      src="/img/vector-41.svg"
                    />

                    <Icon16Px64
                      className="!relative !w-4 !h-4"
                      color="#BEBEC3"
                    />
                  </div>

                  <img
                    className="relative w-px h-[25px] object-cover"
                    alt="Line"
                    src="/img/line-3.svg"
                  />

                  <div className="inline-flex items-start gap-1 relative flex-[0_0_auto]">
                    <div className="flex w-8 h-8 items-center justify-center gap-2 p-2 relative rounded-lg">
                      <TypShare
                        className="!relative !w-4 !h-4"
                        color="#BEBEC3"
                      />
                    </div>

                    <div className="flex w-8 h-8 items-center justify-center gap-2 p-2 relative rounded-lg">
                      <Icon16Px75
                        className="!relative !w-4 !h-4"
                        color="#BEBEC3"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col w-[680px] items-start gap-6 px-8 py-10 absolute top-[1552px] left-8 bg-colors-black-300 rounded-2xl">
              <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                Cenové relácie
              </div>

              <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                  <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                      Počet dní prenájmu
                    </div>
                  </div>

                  <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                      Nájazd km/deň
                    </div>
                  </div>

                  <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                      Cena prenájmu/deň
                    </div>
                  </div>
                </div>

                <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                  <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                      0–1 dní
                    </div>
                  </div>

                  <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                      300 km
                    </div>
                  </div>

                  <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                      200 €
                    </div>
                  </div>
                </div>

                <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                  <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                      2–3 dní
                    </div>
                  </div>

                  <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                      250 km
                    </div>
                  </div>

                  <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                      175 €
                    </div>
                  </div>
                </div>

                <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                  <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                      4–7 dní
                    </div>
                  </div>

                  <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                      210 km
                    </div>
                  </div>

                  <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                      150 €
                    </div>
                  </div>
                </div>

                <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                  <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                      8–14 dní
                    </div>
                  </div>

                  <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="w-[123px] text-colors-white-800 text-base text-right relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                      170 km
                    </div>
                  </div>

                  <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                      130 €
                    </div>
                  </div>
                </div>

                <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                  <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                      15–22 dní
                    </div>
                  </div>

                  <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                      150 km
                    </div>
                  </div>

                  <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                      120 €
                    </div>
                  </div>
                </div>

                <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                  <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                      23–30 dní
                    </div>
                  </div>

                  <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                      130 km
                    </div>
                  </div>

                  <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                      110 €
                    </div>
                  </div>
                </div>

                <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                  <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="w-fit text-colors-white-800 text-base whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                      31 a viac dní
                    </div>
                  </div>

                  <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                      115 km
                    </div>
                  </div>

                  <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                      100 €
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {screenWidth >= 1440 && screenWidth < 1728 && (
          <>
            <div className="flex flex-col w-[640px] items-start gap-20 absolute top-[280px] left-40">
              <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex flex-col items-start gap-8 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="self-stretch w-full h-[432px] rounded-2xl bg-[url(/img/frame-170-3.png)] relative bg-cover bg-[50%_50%]" />

                  <div className="flex flex-wrap items-center gap-[36px_24px] relative self-stretch w-full flex-[0_0_auto]">
                    <div className="relative flex-1 grow h-24 rounded-lg bg-[url(/img/frame-169-1.png)] bg-cover bg-[50%_50%]" />

                    <div className="flex-1 grow h-24 rounded-lg bg-[url(/img/frame-170-4.png)] relative bg-cover bg-[50%_50%]" />

                    <div className="relative flex-1 grow h-24 rounded-lg bg-[url(/img/frame-167-1.png)] bg-cover bg-[50%_50%]" />

                    <div className="relative flex-1 grow h-24 rounded-lg overflow-hidden bg-[url(/img/frame-168-2.png)] bg-cover bg-[50%_50%]">
                      <div className="inline-flex items-center justify-center gap-1 relative top-9 left-[57px]">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-1000 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          viac
                        </div>

                        <IconPx typ="photo" />
                      </div>
                    </div>
                  </div>
                </div>

                <img
                  className="object-cover relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                  alt="Line"
                  src="/img/line-8-3.svg"
                />

                <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex w-[260px] h-4 items-center relative">
                    <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                      Predstavenie vozidla
                    </div>
                  </div>

                  <div className="relative self-stretch w-full h-[306px] mr-[-6.00px]">
                    <p className="absolute w-[640px] top-0 left-0 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                      Zažite skutočnú jazdu plnú luxusu a výkonu s naším novým
                      prírastkom do flotily - BMW M440i xDrive. Tento výnimočný
                      model z roku 2022 a má výkon 275 kW. Je poháňaný benzínom,
                      čo vám zaručuje adrenalínovú jazdu vždy, keď sadnete za
                      volant.
                    </p>

                    <p className="absolute w-[567px] top-[120px] left-[51px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                      Čo robí tento model ešte výnimočnejším, je jeho matná šedá
                      farba. Táto farba dodáva vozidlu elegantný a sofistikovaný
                      vzhľad, ktorý zaujme na každej ceste.
                    </p>

                    <p className="absolute w-[567px] top-[217px] left-[51px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                      Ak hľadáte auto na prenájom, ktoré kombinuje štýl, výkon a
                      moderné technológie, BMW M440i je jednoznačne tou správnou
                      voľbou. Moderné technológie a prvotriedne materiály
                      vytvárajú interiér, ktorý je rovnako pohodlný ako
                      atraktívny.
                    </p>

                    <img
                      className="absolute w-[26px] h-0.5 top-[222px] left-[9px]"
                      alt="Vector"
                      src="/img/vector-23-3.svg"
                    />

                    <img
                      className="absolute w-[26px] h-0.5 top-[125px] left-[9px]"
                      alt="Vector"
                      src="/img/vector-23-3.svg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-6 px-8 py-10 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-300 rounded-2xl">
                <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                  Cenové relácie
                </div>

                <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                    <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        Počet dní prenájmu
                      </div>
                    </div>

                    <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                        Nájazd km/deň
                      </div>
                    </div>

                    <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                        Cena prenájmu/deň
                      </div>
                    </div>
                  </div>

                  <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                    <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        0–1 dní
                      </div>
                    </div>

                    <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                        300 km
                      </div>
                    </div>

                    <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                        200 €
                      </div>
                    </div>
                  </div>

                  <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                    <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        2–3 dní
                      </div>
                    </div>

                    <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                        250 km
                      </div>
                    </div>

                    <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                        175 €
                      </div>
                    </div>
                  </div>

                  <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                    <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        4–7 dní
                      </div>
                    </div>

                    <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                        210 km
                      </div>
                    </div>

                    <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                        150 €
                      </div>
                    </div>
                  </div>

                  <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                    <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        8–14 dní
                      </div>
                    </div>

                    <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="w-[123px] text-colors-white-800 text-base text-right relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                        170 km
                      </div>
                    </div>

                    <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                        130 €
                      </div>
                    </div>
                  </div>

                  <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                    <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        15–22 dní
                      </div>
                    </div>

                    <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                        150 km
                      </div>
                    </div>

                    <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                        120 €
                      </div>
                    </div>
                  </div>

                  <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                    <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        23–30 dní
                      </div>
                    </div>

                    <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                        130 km
                      </div>
                    </div>

                    <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                        110 €
                      </div>
                    </div>
                  </div>

                  <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                    <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="w-fit text-colors-white-800 text-base whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                        31 a viac dní
                      </div>
                    </div>

                    <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                        115 km
                      </div>
                    </div>

                    <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                        100 €
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="inline-flex h-4 items-center justify-center gap-2 px-0 py-4 relative">
                    <div className="relative w-fit mt-[-16.00px] mb-[-14.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                      Technické parametre
                    </div>
                  </div>

                  <div className="flex items-start justify-between relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex-col items-start flex-1 grow flex gap-2 relative">
                      <div className="px-2 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <TypKaroseria
                          className="!relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Karoséria:
                          </div>

                          <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            SUV
                          </div>
                        </div>
                      </div>

                      <div className="px-2 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <Icon24Px123
                          className="!relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Počet dverí:
                          </div>

                          <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            4+1
                          </div>
                        </div>
                      </div>

                      <div className="px-2 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <Icon24Px124
                          className="!relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Výkon:
                          </div>

                          <div className="flex-1 text-colors-ligh-gray-800 text-sm overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                            275 kw
                          </div>
                        </div>
                      </div>

                      <div className="px-2 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <Icon24Px125
                          className="!relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Objem valcov:
                          </div>

                          <div className="flex-1 text-colors-ligh-gray-400 text-sm overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                            2998 cm3
                          </div>
                        </div>
                      </div>

                      <div className="h-8 items-center px-2 py-0 self-stretch w-full rounded-lg flex gap-2 relative">
                        <Icon24Px94
                          className="!relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Spotreba:
                          </div>

                          <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            5.4l/100km
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-col items-start flex-1 grow flex gap-2 relative">
                      <div className="h-8 items-center px-2 py-0 self-stretch w-full rounded-lg flex gap-2 relative">
                        <Ikony25_4
                          className="!relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Palivo:
                          </div>

                          <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            Benzín
                          </div>
                        </div>
                      </div>

                      <div className="h-8 items-center px-2 py-0 self-stretch w-full rounded-lg flex gap-2 relative">
                        <Ikony25_5
                          className="!relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Prevodovka:
                          </div>

                          <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            Automatická
                          </div>
                        </div>
                      </div>

                      <div className="h-8 items-center px-2 py-0 self-stretch w-full rounded-lg flex gap-2 relative">
                        <TypNahon
                          className="!relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Náhon:
                          </div>

                          <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            4×4
                          </div>
                        </div>
                      </div>

                      <div className="flex h-8 items-center gap-2 pl-2 pr-3.5 py-4 relative self-stretch w-full rounded-lg">
                        <Ikony25_7
                          className="!mt-[-12.00px] !mb-[-12.00px] !relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                        <div className="flex items-center gap-1 relative flex-1 grow mt-[-5.00px] mb-[-5.00px]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Rok výroby:
                          </div>

                          <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            2016
                          </div>
                        </div>
                      </div>

                      <div className="flex h-8 items-center gap-2 pl-2 pr-3.5 py-4 relative self-stretch w-full rounded-lg">
                        <div className="mt-[-12.00px] mb-[-12.00px] relative w-6 h-6">
                          <img
                            className="absolute w-5 h-5 top-0.5 left-0.5"
                            alt="Vector stroke"
                            src="/img/vector-24-stroke.png"
                          />
                        </div>

                        <div className="flex items-center gap-1 relative flex-1 grow mt-[-5.00px] mb-[-5.00px]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Nájazd km:
                          </div>

                          <div className="flex-1 text-colors-ligh-gray-800 text-sm overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                            91000 km
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <img
                  className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                  alt="Line"
                  src="/img/line-8-3.svg"
                />

                <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="inline-flex flex-col h-4 items-start gap-2 relative">
                    <div className="inline-flex items-center justify-center gap-2 relative flex-[0_0_auto]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                        Výbava vozidla
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-[16px_16px] relative self-stretch w-full flex-[0_0_auto]">
                    <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Bluetooth
                      </div>
                    </div>

                    <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        USB vstup
                      </div>
                    </div>

                    <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Klimatizácia
                      </div>
                    </div>

                    <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        GPS
                      </div>
                    </div>

                    <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Tempomat
                      </div>
                    </div>

                    <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        4×4
                      </div>
                    </div>

                    <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Lorem ipsum
                      </div>
                    </div>

                    <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Parkovacie senzory
                      </div>
                    </div>

                    <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Apple carplay
                      </div>
                    </div>

                    <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Lorem ipsum
                      </div>
                    </div>

                    <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Lorem ipsum
                      </div>
                    </div>

                    <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Lorem ipsum
                      </div>
                    </div>

                    <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Lorem ipsum
                      </div>
                    </div>

                    <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Lorem ipsum
                      </div>
                    </div>

                    <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Lorem ipsum
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Menu1
              className="!absolute !left-0 !w-[1440px] !top-0"
              type="default"
            />
            <div className="flex flex-col w-[448px] items-center gap-6 absolute top-[293px] left-[807px] bg-colors-black-200 rounded-3xl overflow-hidden border border-solid border-colors-black-600">
              <div className="flex flex-col items-start gap-8 px-6 py-8 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-400 rounded-3xl overflow-hidden">
                <div className="relative self-stretch h-4 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                  Prenájom vozidla
                </div>

                <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-3 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Miesto vyzdvihnutia
                          </div>
                        </div>

                        <Icon16Px44 className="!relative !w-5 !h-5 !mt-[-2.00px] !mb-[-2.00px]" />
                      </div>

                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-3 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Miesto vrátenia
                          </div>
                        </div>

                        <Icon16Px44 className="!relative !w-5 !h-5 !mt-[-2.00px] !mb-[-2.00px]" />
                      </div>
                    </div>

                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-3 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Deň vyzdvihnutia
                          </div>
                        </div>

                        <Icon16Px44 className="!relative !w-5 !h-5 !mt-[-2.00px] !mb-[-2.00px]" />
                      </div>

                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-3 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Deň vrátenia
                          </div>
                        </div>

                        <Icon16Px44 className="!relative !w-5 !h-5 !mt-[-2.00px] !mb-[-2.00px]" />
                      </div>
                    </div>

                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-3 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Čas vyzdvihnutia
                          </div>
                        </div>

                        <Icon16Px44 className="!relative !w-5 !h-5 !mt-[-2.00px] !mb-[-2.00px]" />
                      </div>

                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-3 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Čas vrátenia
                          </div>
                        </div>

                        <Icon16Px44 className="!relative !w-5 !h-5 !mt-[-2.00px] !mb-[-2.00px]" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full">
                        <div className="flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            Počet povolených km
                          </div>

                          <div className="mt-[-1.00px] mr-[-1.00px] font-semibold text-colors-white-800 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                            {""}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col h-8 items-start justify-around gap-2 p-4 relative self-stretch w-full">
                        <div className="self-stretch w-full flex-[0_0_auto] mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            Cena prenájmu
                          </div>

                          <div className="mt-[-1.00px] font-semibold text-colors-white-800 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                            {""}
                          </div>

                          <div className="mt-[-1.00px] mr-[-1.00px] font-semibold text-colors-white-800 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                            {""}
                          </div>
                        </div>
                      </div>

                      <div className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full">
                        <div className="flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                          <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            <span className="font-semibold">Poistenie </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                              (základné)
                            </span>
                          </p>

                          <div className="mt-[-1.00px] font-semibold text-colors-white-800 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                            {""}
                          </div>

                          <div className="mt-[-1.00px] mr-[-1.00px] font-semibold text-colors-white-800 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                            {""}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col h-10 items-start justify-center gap-4 p-4 relative self-stretch w-full bg-colors-black-600 rounded-lg">
                      <div className="gap-1.5 flex-[0_0_auto] mt-[-4.00px] mb-[-4.00px] flex items-center relative self-stretch w-full">
                        <TypPlus
                          className="!relative !w-4 !h-4"
                          color="#D7FF14"
                        />
                        <div className="flex-1 grow flex items-center justify-between relative">
                          <div className="relative w-fit mt-[-0.50px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Mám promokód
                          </div>

                          <div className="mt-[-1.00px] font-semibold text-colors-white-800 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                            {""}
                          </div>

                          <div className="mt-[-1.00px] mr-[-1.00px] font-semibold text-colors-green-accent-500 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                            {""}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="h-8 justify-between px-4 py-0 flex items-center relative self-stretch w-full">
                        <div className="flex items-center gap-2 relative flex-1 grow">
                          <p className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            <span className="font-semibold">Depozit</span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                              {" "}
                              (vratná záloha)
                            </span>
                          </p>

                          <Icon16Px typ="info" />
                        </div>

                        <div className="mr-[-1.00px] font-semibold text-colors-white-800 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                          {""}
                        </div>
                      </div>

                      <div className="justify-around pl-4 pr-0 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <div className="flex items-center gap-1.5 relative flex-1 grow">
                          <CheckBoxy stav="radio-selected" />
                          <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6">
                            Slovensko, Česko, Rakúsko
                          </div>
                        </div>
                      </div>

                      <div className="justify-around pl-4 pr-0 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <div className="flex items-center gap-1.5 relative flex-1 grow">
                          <CheckBoxy24_2 className="!relative !w-6 !h-6" />
                          <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                            <span className="font-medium">
                              +Poľsko, Nemecko, Maďarsko{" "}
                            </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
                              (+30% depozit)
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="justify-around pl-4 pr-0 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <div className="flex items-center gap-1.5 relative flex-1 grow">
                          <CheckBoxy stav="radio-default" />
                          <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                            <span className="font-medium">
                              Celá EU okrem Rumunska{" "}
                            </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
                              (+60% depozit)
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="justify-around pl-4 pr-0 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <div className="flex items-center gap-1.5 relative flex-1 grow">
                          <CheckBoxy stav="radio-default" />
                          <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                            <span className="font-medium">Mimo EU </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
                              (individuálne posúdenie, kontaktujte nás)
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {((screenWidth >= 1440 && screenWidth < 1728) ||
          screenWidth >= 1728) && (
          <div
            className={`flex flex-col items-start gap-2 overflow-hidden rounded-2xl bg-colors-black-300 absolute ${screenWidth >= 1440 && screenWidth < 1728 ? "w-[1120px]" : (screenWidth >= 1728) ? "w-[1328px]" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "left-40" : (screenWidth >= 1728) ? "left-[200px]" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "top-[2584px]" : (screenWidth >= 1728) ? "top-[2464px]" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "pt-12 pb-20 px-16" : (screenWidth >= 1728) ? "pt-12 pb-20 px-28" : ""}`}
          >
            <div className="w-full flex self-stretch items-start gap-10 flex-[0_0_auto] relative">
              <ElementIconsDarkBig
                ellipse={
                  screenWidth >= 1440 && screenWidth < 1728
                    ? "/img/ellipse-1-5.svg"
                    : screenWidth >= 1728
                      ? "/img/ellipse-1-6.svg"
                      : undefined
                }
                overlapGroupClassName={
                  screenWidth >= 1440 && screenWidth < 1728
                    ? "bg-[url(/img/union-14.svg)]"
                    : screenWidth >= 1728
                      ? "bg-[url(/img/union-17.svg)]"
                      : undefined
                }
                type="check"
                union={
                  screenWidth >= 1440 && screenWidth < 1728
                    ? "/img/union-15.svg"
                    : screenWidth >= 1728
                      ? "/img/union-18.svg"
                      : undefined
                }
              />
              <div className="flex flex-col items-start grow gap-4 flex-1 relative">
                <div className="inline-flex items-center gap-2 h-[88px] justify-center relative">
                  <div className="[font-family:'SF_Pro-ExpandedSemibold',Helvetica] w-fit tracking-[0] text-2xl text-colors-light-yellow-accent-700 font-normal leading-7 whitespace-nowrap relative">
                    V cene je zahrnuté
                  </div>
                </div>

                <div className="w-full flex self-stretch items-start flex-[0_0_auto] justify-between relative">
                  <div className="flex flex-col items-start grow gap-8 flex-1 relative">
                    <div className="w-full flex self-stretch items-center gap-4 flex-[0_0_auto] relative">
                      <div className="inline-flex items-start flex-[0_0_auto] gap-2 p-2 rounded-[99px] bg-colors-dark-yellow-accent-200 relative">
                        <Icon24Px118 className="!relative !w-6 !h-6" />
                      </div>

                      <div className="[font-family:'Poppins',Helvetica] tracking-[0] text-base flex-1 text-colors-white-800 font-normal leading-6 relative">
                        Slovenská&nbsp;&nbsp;
                        <br />
                        dialničná známka
                      </div>
                    </div>

                    <div className="w-full flex self-stretch items-center gap-4 flex-[0_0_auto] relative">
                      <div className="inline-flex items-start flex-[0_0_auto] gap-2 p-2 rounded-[99px] bg-colors-dark-yellow-accent-200 relative">
                        <Icon24Px118 className="!relative !w-6 !h-6" />
                      </div>

                      <div className="[font-family:'Poppins',Helvetica] tracking-[0] text-base flex-1 text-colors-white-800 font-normal leading-6 relative">
                        Havaríjne poistenie
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start grow gap-8 flex-1 relative">
                    <div className="w-full flex self-stretch items-center gap-4 flex-[0_0_auto] relative">
                      <div className="inline-flex items-start flex-[0_0_auto] gap-2 p-2 rounded-[99px] bg-colors-dark-yellow-accent-200 relative">
                        {screenWidth >= 1440 && screenWidth < 1728 && (
                          <Icon24Px103 className="!relative !w-6 !h-6" />
                        )}

                        {screenWidth >= 1728 && (
                          <Icon24Px118 className="!relative !w-6 !h-6" />
                        )}
                      </div>

                      <div className="[font-family:'Poppins',Helvetica] tracking-[0] text-base flex-1 text-colors-white-800 font-normal leading-6 relative">
                        Dane a poplatky
                      </div>
                    </div>

                    <div className="w-full flex self-stretch items-center gap-4 flex-[0_0_auto] relative">
                      <div className="inline-flex items-start flex-[0_0_auto] gap-2 p-2 rounded-[99px] bg-colors-dark-yellow-accent-200 relative">
                        {screenWidth >= 1440 && screenWidth < 1728 && (
                          <Icon24Px103 className="!relative !w-6 !h-6" />
                        )}

                        {screenWidth >= 1728 && (
                          <Icon24Px118 className="!relative !w-6 !h-6" />
                        )}
                      </div>

                      <div className="[font-family:'Poppins',Helvetica] tracking-[0] text-base flex-1 text-colors-white-800 font-normal leading-6 relative">
                        Poistenie
                        <br />
                        zodpovednosti za škody
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start grow gap-8 flex-1 relative">
                    <div className="w-full flex self-stretch items-center gap-4 flex-[0_0_auto] relative">
                      <div className="inline-flex items-start flex-[0_0_auto] gap-2 p-2 rounded-[99px] bg-colors-dark-yellow-accent-200 relative">
                        {screenWidth >= 1440 && screenWidth < 1728 && (
                          <Icon24Px103 className="!relative !w-6 !h-6" />
                        )}

                        {screenWidth >= 1728 && (
                          <Icon24Px118 className="!relative !w-6 !h-6" />
                        )}
                      </div>

                      <div className="[font-family:'Poppins',Helvetica] tracking-[0] text-base flex-1 text-colors-white-800 font-normal leading-6 relative">
                        Letné a zimné
                        <br />
                        pneumatiky
                      </div>
                    </div>

                    <div className="w-full flex self-stretch items-center gap-4 flex-[0_0_auto] relative">
                      <div className="inline-flex items-start flex-[0_0_auto] gap-2 p-2 rounded-[99px] bg-colors-dark-yellow-accent-200 relative">
                        {screenWidth >= 1440 && screenWidth < 1728 && (
                          <Icon24Px103 className="!relative !w-6 !h-6" />
                        )}

                        {screenWidth >= 1728 && (
                          <Icon24Px118 className="!relative !w-6 !h-6" />
                        )}
                      </div>

                      <div className="[font-family:'Poppins',Helvetica] tracking-[0] text-base flex-1 text-colors-white-800 font-normal leading-6 relative">
                        Servisné náklady
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {screenWidth >= 1440 && screenWidth < 1728 && (
          <>
            <FaqRychlyKontakt
              className="!absolute !left-0 !top-[3168px]"
              href="tel:+421 910 666 949"
              type="a"
            />
            <div className="flex flex-col w-[1120px] absolute top-[168px] left-40 items-start gap-2">
              <div className="relative w-[375px] h-10 mt-[-1.00px] [font-family:'SF_Pro-ExpandedMedium',Helvetica] font-medium text-colors-light-yellow-accent-700 text-5xl tracking-[0] leading-[64px] whitespace-nowrap">
                Ford Mustang
              </div>

              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <Frame263
                  className="!flex-[0_0_auto]"
                  divClassName="!text-colors-ligh-gray-800"
                  divClassNameOverride="!text-colors-ligh-gray-800"
                  icon16Px100Color="#BEBEC3"
                  icon16Px101Color="#BEBEC3"
                  icon16Px4Color="#BEBEC3"
                  icon16Px5Color="#BEBEC3"
                  popisClassName="!text-colors-ligh-gray-800"
                  popisClassNameOverride="!text-colors-ligh-gray-800"
                />
                <PoskytovateVozidla
                  className="!flex-[0_0_auto]"
                  type="blackrent"
                  union="/img/union-20.svg"
                />
              </div>
            </div>
          </>
        )}

        {screenWidth >= 1728 && (
          <>
            <Menu1 className="!absolute !left-0 !top-0" type="default" />
            <div className="flex flex-col w-[1328px] items-start gap-2 absolute top-[168px] left-[200px]">
              <div className="relative w-[375px] h-10 mt-[-1.00px] [font-family:'SF_Pro-ExpandedMedium',Helvetica] font-medium text-colors-light-yellow-accent-700 text-5xl tracking-[0] leading-[64px] whitespace-nowrap">
                Ford Mustang
              </div>

              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <Frame263
                  className="!flex-[0_0_auto]"
                  divClassName="!text-colors-ligh-gray-800"
                  divClassNameOverride="!text-colors-ligh-gray-800"
                  icon16Px100Color="#BEBEC3"
                  icon16Px101Color="#BEBEC3"
                  icon16Px4Color="#BEBEC3"
                  icon16Px5Color="#BEBEC3"
                  popisClassName="!text-colors-ligh-gray-800"
                  popisClassNameOverride="!text-colors-ligh-gray-800"
                />
                <div className="inline-flex items-center justify-center gap-2 relative flex-[0_0_auto]">
                  <div className="inline-flex items-center justify-center gap-1.5 relative flex-[0_0_auto]">
                    <img
                      className="relative w-[52.42px] h-4"
                      alt="Vector"
                      src="/img/vector-48.svg"
                    />

                    <Icon16Px64
                      className="!relative !w-4 !h-4"
                      color="#BEBEC3"
                    />
                  </div>

                  <img
                    className="relative w-px h-[25px] object-cover"
                    alt="Line"
                    src="/img/line-3.svg"
                  />

                  <div className="inline-flex items-center justify-center gap-1 relative flex-[0_0_auto]">
                    <div className="flex w-10 h-10 items-center justify-center gap-2 p-2 relative rounded-lg">
                      <Icon24Px14 className="!relative !w-6 !h-6" />
                    </div>

                    <StaviTlaTiekShare
                      detailVozidlaIkonyHornaLiTa="default"
                      union="/img/union-20.svg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {(screenWidth >= 1728 ||
          (screenWidth >= 744 && screenWidth < 1440)) && (
          <div
            className={`inline-flex flex-col items-start absolute ${screenWidth >= 1728 ? "left-[200px]" : (screenWidth >= 744 && screenWidth < 1440) ? "left-16" : ""} ${screenWidth >= 1728 ? "top-[280px]" : (screenWidth >= 744 && screenWidth < 1440) ? "top-[2118px]" : ""} ${screenWidth >= 1728 ? "gap-20" : (screenWidth >= 744 && screenWidth < 1440) ? "gap-10" : ""}`}
          >
            {screenWidth >= 1728 && (
              <>
                <div className="inline-flex flex-col items-start gap-10 relative flex-[0_0_auto]">
                  <div className="inline-flex flex-col items-start gap-8 relative flex-[0_0_auto]">
                    <div className="w-[761px] h-[432px] rounded-2xl bg-[url(/img/frame-170-5.png)] relative bg-cover bg-[50%_50%]" />

                    <div className="flex flex-wrap w-[761px] items-center gap-[36px_24px] relative flex-[0_0_auto]">
                      <div className="relative flex-1 grow h-24 rounded-lg bg-[url(/img/frame-169-2.png)] bg-cover bg-[50%_50%]" />

                      <div className="flex-1 grow h-24 rounded-lg bg-[url(/img/frame-170-6.png)] relative bg-cover bg-[50%_50%]" />

                      <div className="relative flex-1 grow h-24 rounded-lg bg-[url(/img/frame-167-2.png)] bg-cover bg-[50%_50%]" />

                      <div className="relative flex-1 grow h-24 rounded-lg overflow-hidden bg-[url(/img/frame-168-2.png)] bg-cover bg-[50%_50%]">
                        <div className="inline-flex items-center justify-center gap-1 relative top-9 left-[57px]">
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-1000 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            viac
                          </div>

                          <TypPhoto className="!relative !w-6 !h-6" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <img
                    className="object-cover relative w-[762px] h-px ml-[-0.50px] mr-[-0.50px]"
                    alt="Line"
                    src="/img/line-8-5.svg"
                  />

                  <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex w-[260px] h-4 items-center relative">
                      <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                        Predstavenie vozidla
                      </div>
                    </div>

                    <div className="relative w-[725px] h-[274px]">
                      <p className="absolute w-[719px] top-0 left-0 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                        Zažite skutočnú jazdu plnú luxusu a výkonu s naším novým
                        prírastkom do flotily - BMW M440i xDrive. Tento
                        výnimočný model z roku 2022 a má výkon 275 kW. Je
                        poháňaný benzínom, čo vám zaručuje adrenalínovú jazdu
                        vždy, keď sadnete za volant.
                      </p>

                      <p className="absolute w-[638px] top-[120px] left-[58px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                        Čo robí tento model ešte výnimočnejším, je jeho matná
                        šedá farba. Táto farba dodáva vozidlu elegantný a
                        sofistikovaný vzhľad, ktorý zaujme na každej ceste.
                      </p>

                      <p className="absolute w-[638px] top-[185px] left-[58px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                        Ak hľadáte auto na prenájom, ktoré kombinuje štýl, výkon
                        a moderné technológie, BMW M440i je jednoznačne tou
                        správnou voľbou. Moderné technológie a prvotriedne
                        materiály vytvárajú interiér, ktorý je rovnako pohodlný
                        ako atraktívny.
                      </p>

                      <img
                        className="absolute w-[29px] h-0.5 top-[190px] left-2.5"
                        alt="Vector"
                        src="/img/vector-23-4.svg"
                      />

                      <img
                        className="absolute w-[29px] h-0.5 top-[125px] left-2.5"
                        alt="Vector"
                        src="/img/vector-23-4.svg"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col w-[761px] items-start gap-6 px-8 py-10 relative flex-[0_0_auto] bg-colors-black-300 rounded-2xl">
                  <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                    Cenové relácie
                  </div>

                  <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                      <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                          Počet dní prenájmu
                        </div>
                      </div>

                      <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                          Nájazd km/deň
                        </div>
                      </div>

                      <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                          Cena prenájmu/deň
                        </div>
                      </div>
                    </div>

                    <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                      <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                          0–1 dní
                        </div>
                      </div>

                      <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                          300 km
                        </div>
                      </div>

                      <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                          200 €
                        </div>
                      </div>
                    </div>

                    <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                      <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                          2–3 dní
                        </div>
                      </div>

                      <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                          250 km
                        </div>
                      </div>

                      <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                          175 €
                        </div>
                      </div>
                    </div>

                    <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                      <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                          4–7 dní
                        </div>
                      </div>

                      <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                          210 km
                        </div>
                      </div>

                      <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                          150 €
                        </div>
                      </div>
                    </div>

                    <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                      <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                          8–14 dní
                        </div>
                      </div>

                      <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="w-[123px] text-colors-white-800 text-base text-right relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                          170 km
                        </div>
                      </div>

                      <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                          130 €
                        </div>
                      </div>
                    </div>

                    <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                      <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                          15–22 dní
                        </div>
                      </div>

                      <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                          150 km
                        </div>
                      </div>

                      <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                          120 €
                        </div>
                      </div>
                    </div>

                    <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                      <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                          23–30 dní
                        </div>
                      </div>

                      <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                          130 km
                        </div>
                      </div>

                      <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                          110 €
                        </div>
                      </div>
                    </div>

                    <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                      <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="w-fit text-colors-white-800 text-base whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                          31 a viac dní
                        </div>
                      </div>

                      <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                          115 km
                        </div>
                      </div>

                      <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                          100 €
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="inline-flex flex-col items-start gap-10 relative flex-[0_0_auto]">
                  <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="inline-flex h-4 items-center justify-center gap-2 px-0 py-4 relative">
                      <div className="relative w-fit mt-[-16.00px] mb-[-14.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                        Technické parametre
                      </div>
                    </div>

                    <div className="flex w-[761px] items-start justify-between relative flex-[0_0_auto]">
                      <div className="flex flex-col items-start gap-2 relative flex-1 grow">
                        <div className="px-2 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                          <TypKaroseria
                            className="!relative !w-6 !h-6"
                            color="#E4FF56"
                          />
                          <div className="flex items-center gap-1 relative flex-1 grow">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              Karoséria:
                            </div>

                            <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                              SUV
                            </div>
                          </div>
                        </div>

                        <div className="px-2 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                          <Icon24Px123
                            className="!relative !w-6 !h-6"
                            color="#E4FF56"
                          />
                          <div className="flex items-center gap-1 relative flex-1 grow">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              Počet dverí:
                            </div>

                            <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                              4+1
                            </div>
                          </div>
                        </div>

                        <div className="px-2 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                          <Icon24Px124
                            className="!relative !w-6 !h-6"
                            color="#E4FF56"
                          />
                          <div className="flex items-center gap-1 relative flex-1 grow">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              Výkon:
                            </div>

                            <div className="flex-1 text-colors-ligh-gray-800 text-sm overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                              275 kw
                            </div>
                          </div>
                        </div>

                        <div className="px-2 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                          <Icon24Px125
                            className="!relative !w-6 !h-6"
                            color="#E4FF56"
                          />
                          <div className="flex items-center gap-1 relative flex-1 grow">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              Objem valcov:
                            </div>

                            <div className="flex-1 text-colors-ligh-gray-400 text-sm overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                              2998 cm3
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-2 relative flex-1 grow">
                        <div className="flex h-8 items-center gap-2 px-2 py-0 relative self-stretch w-full rounded-lg">
                          <Icon24Px94
                            className="!relative !w-6 !h-6"
                            color="#E4FF56"
                          />
                          <div className="flex items-center gap-1 relative flex-1 grow">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              Spotreba:
                            </div>

                            <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                              5.4l/100km
                            </div>
                          </div>
                        </div>

                        <div className="flex h-8 items-center gap-2 px-2 py-0 relative self-stretch w-full rounded-lg">
                          <Icon24Px127 className="!relative !w-6 !h-6" />
                          <div className="flex items-center gap-1 relative flex-1 grow">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              Palivo:
                            </div>

                            <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                              Benzín
                            </div>
                          </div>
                        </div>

                        <div className="flex h-8 items-center gap-2 px-2 py-0 relative self-stretch w-full rounded-lg">
                          <Ikony25_5
                            className="!relative !w-6 !h-6"
                            color="#E4FF56"
                          />
                          <div className="flex items-center gap-1 relative flex-1 grow">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              Prevodovka:
                            </div>

                            <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                              Automatická
                            </div>
                          </div>
                        </div>

                        <div className="flex h-8 items-center gap-2 px-2 py-0 relative self-stretch w-full rounded-lg">
                          <TypNahon
                            className="!relative !w-6 !h-6"
                            color="#E4FF56"
                          />
                          <div className="flex items-center gap-1 relative flex-1 grow">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              Náhon:
                            </div>

                            <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                              4×4
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-2 relative flex-1 grow">
                        <div className="flex h-8 items-center gap-2 pl-2 pr-3.5 py-4 relative self-stretch w-full rounded-lg">
                          <Ikony25_7
                            className="!mt-[-12.00px] !mb-[-12.00px] !relative !w-6 !h-6"
                            color="#E4FF56"
                          />
                          <div className="flex items-center gap-1 relative flex-1 grow mt-[-5.00px] mb-[-5.00px]">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              Rok výroby:
                            </div>

                            <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                              2016
                            </div>
                          </div>
                        </div>

                        <div className="flex h-8 items-center gap-2 pl-2 pr-3.5 py-4 relative self-stretch w-full rounded-lg">
                          <Icon24Px81
                            className="!mt-[-12.00px] !mb-[-12.00px] !relative !w-6 !h-6"
                            color="#E4FF56"
                          />
                          <div className="flex items-center gap-1 relative flex-1 grow mt-[-5.00px] mb-[-5.00px]">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              Nájazd km:
                            </div>

                            <div className="flex-1 text-colors-ligh-gray-800 text-sm overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                              91000 km
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <img
                    className="relative w-[762px] h-px ml-[-0.50px] mr-[-0.50px]"
                    alt="Line"
                    src="/img/line-8-5.svg"
                  />

                  <div className="flex flex-col w-[761px] items-start gap-10 relative flex-[0_0_auto]">
                    <div className="inline-flex flex-col h-4 items-start gap-2 relative">
                      <div className="inline-flex items-center justify-center gap-2 relative flex-[0_0_auto]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                          Výbava vozidla
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap w-[761px] items-center gap-[16px_16px] relative flex-[0_0_auto]">
                      <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Bluetooth
                        </div>
                      </div>

                      <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          USB vstup
                        </div>
                      </div>

                      <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Klimatizácia
                        </div>
                      </div>

                      <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          GPS
                        </div>
                      </div>

                      <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Tempomat
                        </div>
                      </div>

                      <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          4×4
                        </div>
                      </div>

                      <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Lorem ipsum
                        </div>
                      </div>

                      <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Parkovacie senzory
                        </div>
                      </div>

                      <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Apple carplay
                        </div>
                      </div>

                      <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Lorem ipsum
                        </div>
                      </div>

                      <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Lorem ipsum
                        </div>
                      </div>

                      <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Lorem ipsum
                        </div>
                      </div>

                      <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Lorem ipsum
                        </div>
                      </div>

                      <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Lorem ipsum
                        </div>
                      </div>

                      <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Lorem ipsum
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {screenWidth >= 744 && screenWidth < 1440 && (
              <>
                <div className="flex flex-col w-[616px] items-start gap-10 relative flex-[0_0_auto]">
                  <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex w-[260px] h-4 items-center relative">
                      <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                        Predstavenie vozidla
                      </div>
                    </div>

                    <div className="relative self-stretch w-full h-[306px] mr-[-6.00px]">
                      <p className="absolute w-[616px] top-0 left-0 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                        Zažite skutočnú jazdu plnú luxusu a výkonu s naším novým
                        prírastkom do flotily - BMW M440i xDrive. Tento
                        výnimočný model z roku 2022 a má výkon 275 kW. Je
                        poháňaný benzínom, čo vám zaručuje adrenalínovú jazdu
                        vždy, keď sadnete za volant.
                      </p>

                      <p className="absolute w-[546px] top-[120px] left-[49px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                        Čo robí tento model ešte výnimočnejším, je jeho matná
                        šedá farba. Táto farba dodáva vozidlu elegantný a
                        sofistikovaný vzhľad, ktorý zaujme na každej ceste.
                      </p>

                      <p className="absolute w-[546px] top-[217px] left-[49px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                        Ak hľadáte auto na prenájom, ktoré kombinuje štýl, výkon
                        a moderné technológie, BMW M440i je jednoznačne tou
                        správnou voľbou. Moderné technológie a prvotriedne
                        materiály vytvárajú interiér, ktorý je rovnako pohodlný
                        ako atraktívny.
                      </p>

                      <img
                        className="absolute w-[25px] h-0.5 top-[222px] left-2"
                        alt="Vector"
                        src="/img/vector-23-2.svg"
                      />

                      <img
                        className="absolute w-[25px] h-0.5 top-[125px] left-2"
                        alt="Vector"
                        src="/img/vector-23-2.svg"
                      />
                    </div>
                  </div>
                </div>

                <img
                  className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                  alt="Line"
                  src="/img/line-8-1.svg"
                />

                <div className="flex flex-col w-[616px] items-start gap-10 relative flex-[0_0_auto]">
                  <div className="inline-flex h-4 items-center justify-center gap-2 px-0 py-4 relative">
                    <div className="relative w-fit mt-[-16.00px] mb-[-14.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                      Technické parametre
                    </div>
                  </div>

                  <div className="items-start justify-between self-stretch w-full flex-[0_0_auto] flex relative">
                    <div className="flex-col items-start gap-2 flex-1 grow flex relative">
                      <div className="px-2 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <TypKaroseria
                          className="!relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Karoséria:
                          </div>

                          <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            SUV
                          </div>
                        </div>
                      </div>

                      <div className="px-2 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <Icon24Px123
                          className="!relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Počet dverí:
                          </div>

                          <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            4+1
                          </div>
                        </div>
                      </div>

                      <div className="px-2 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <Icon24Px124
                          className="!relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Výkon:
                          </div>

                          <div className="flex-1 text-colors-ligh-gray-800 text-sm overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                            275 kw
                          </div>
                        </div>
                      </div>

                      <div className="px-2 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <Icon24Px125
                          className="!relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Objem valcov:
                          </div>

                          <div className="flex-1 text-colors-ligh-gray-400 text-sm overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                            2998 cm3
                          </div>
                        </div>
                      </div>

                      <div className="h-8 items-center gap-2 px-2 py-0 self-stretch w-full rounded-lg flex relative">
                        <Icon24Px94
                          className="!relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Spotreba:
                          </div>

                          <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            5.4l/100km
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-col items-start gap-2 flex-1 grow flex relative">
                      <div className="h-8 items-center gap-2 px-2 py-0 self-stretch w-full rounded-lg flex relative">
                        <Ikony25_4
                          className="!relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Palivo:
                          </div>

                          <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            Benzín
                          </div>
                        </div>
                      </div>

                      <div className="h-8 items-center gap-2 px-2 py-0 self-stretch w-full rounded-lg flex relative">
                        <Ikony25_5
                          className="!relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Prevodovka:
                          </div>

                          <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            Automatická
                          </div>
                        </div>
                      </div>

                      <div className="h-8 items-center gap-2 px-2 py-0 self-stretch w-full rounded-lg flex relative">
                        <TypNahon
                          className="!relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Náhon:
                          </div>

                          <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            4×4
                          </div>
                        </div>
                      </div>

                      <div className="flex h-8 items-center gap-2 pl-2 pr-3.5 py-4 relative self-stretch w-full rounded-lg">
                        <Ikony25_7
                          className="!mt-[-12.00px] !mb-[-12.00px] !relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                        <div className="flex items-center gap-1 relative flex-1 grow mt-[-5.00px] mb-[-5.00px]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Rok výroby:
                          </div>

                          <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            2016
                          </div>
                        </div>
                      </div>

                      <div className="flex h-8 items-center gap-2 pl-2 pr-3.5 py-4 relative self-stretch w-full rounded-lg">
                        <Icon24Px81
                          className="!mt-[-12.00px] !mb-[-12.00px] !relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                        <div className="flex items-center gap-1 relative flex-1 grow mt-[-5.00px] mb-[-5.00px]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Nájazd km:
                          </div>

                          <div className="flex-1 text-colors-ligh-gray-800 text-sm overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                            91000 km
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <img
                  className="relative w-[617px] h-px ml-[-0.50px] mr-[-0.50px]"
                  alt="Line"
                  src="/img/line-8-1.svg"
                />

                <div className="flex flex-col w-[616px] items-start gap-10 relative flex-[0_0_auto]">
                  <div className="inline-flex flex-col h-4 items-start gap-2 relative">
                    <div className="gap-2 inline-flex items-center justify-center relative flex-[0_0_auto]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                        Výbava vozidla
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-[16px_16px] relative self-stretch w-full flex-[0_0_auto]">
                    <div className="h-8 gap-4 px-4 py-2 bg-colors-black-600 rounded-lg inline-flex items-center justify-center relative flex-[0_0_auto]">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Bluetooth
                      </div>
                    </div>

                    <div className="h-8 gap-4 px-4 py-2 bg-colors-black-600 rounded-lg inline-flex items-center justify-center relative flex-[0_0_auto]">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        USB vstup
                      </div>
                    </div>

                    <div className="h-8 gap-4 px-4 py-2 bg-colors-black-600 rounded-lg inline-flex items-center justify-center relative flex-[0_0_auto]">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Klimatizácia
                      </div>
                    </div>

                    <div className="h-8 gap-4 px-4 py-2 bg-colors-black-600 rounded-lg inline-flex items-center justify-center relative flex-[0_0_auto]">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        GPS
                      </div>
                    </div>

                    <div className="h-8 gap-4 px-4 py-2 bg-colors-black-600 rounded-lg inline-flex items-center justify-center relative flex-[0_0_auto]">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Tempomat
                      </div>
                    </div>

                    <div className="h-8 gap-4 px-4 py-2 bg-colors-black-600 rounded-lg inline-flex items-center justify-center relative flex-[0_0_auto]">
                      <div className="font-normal text-colors-white-800 text-sm relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                        4×4
                      </div>
                    </div>

                    <div className="h-8 gap-4 px-4 py-2 bg-colors-black-600 rounded-lg inline-flex items-center justify-center relative flex-[0_0_auto]">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Lorem ipsum
                      </div>
                    </div>

                    <div className="h-8 gap-4 px-4 py-2 bg-colors-black-600 rounded-lg inline-flex items-center justify-center relative flex-[0_0_auto]">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Parkovacie senzory
                      </div>
                    </div>

                    <div className="h-8 gap-4 px-4 py-2 bg-colors-black-600 rounded-lg inline-flex items-center justify-center relative flex-[0_0_auto]">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Apple carplay
                      </div>
                    </div>

                    <div className="h-8 gap-4 px-4 py-2 bg-colors-black-600 rounded-lg inline-flex items-center justify-center relative flex-[0_0_auto]">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Lorem ipsum
                      </div>
                    </div>

                    <div className="h-8 gap-4 px-4 py-2 bg-colors-black-600 rounded-lg inline-flex items-center justify-center relative flex-[0_0_auto]">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Lorem ipsum
                      </div>
                    </div>

                    <div className="h-8 gap-4 px-4 py-2 bg-colors-black-600 rounded-lg inline-flex items-center justify-center relative flex-[0_0_auto]">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Lorem ipsum
                      </div>
                    </div>

                    <div className="h-8 gap-4 px-4 py-2 bg-colors-black-600 rounded-lg inline-flex items-center justify-center relative flex-[0_0_auto]">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Lorem ipsum
                      </div>
                    </div>

                    <div className="h-8 gap-4 px-4 py-2 bg-colors-black-600 rounded-lg inline-flex items-center justify-center relative flex-[0_0_auto]">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Lorem ipsum
                      </div>
                    </div>

                    <div className="h-8 gap-4 px-4 py-2 bg-colors-black-600 rounded-lg inline-flex items-center justify-center relative flex-[0_0_auto]">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Lorem ipsum
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {screenWidth >= 1728 && (
          <>
            <FaqRychlyKontaktFooter1728
              className="!absolute !left-0 !top-[3048px]"
              href="tel:+421 910 666 949"
              type="a"
            />
            <div className="flex flex-col w-[536px] items-center gap-6 absolute top-[280px] left-[993px] bg-colors-black-600 rounded-3xl overflow-hidden">
              <div className="flex flex-col items-start gap-8 px-6 py-8 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-400 rounded-3xl overflow-hidden">
                <div className="relative w-[206px] h-4 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                  Prenájom vozidla
                </div>

                <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Miesto vyzdvihnutia
                          </div>
                        </div>

                        <Icon16Px44 className="!relative !w-5 !h-5" />
                      </div>

                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Miesto vrátenia
                          </div>
                        </div>

                        <Icon16Px44 className="!relative !w-5 !h-5" />
                      </div>
                    </div>

                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Deň vyzdvihnutia
                          </div>
                        </div>

                        <Icon16Px44 className="!relative !w-5 !h-5" />
                      </div>

                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Deň vrátenia
                          </div>
                        </div>

                        <Icon16Px44 className="!relative !w-5 !h-5" />
                      </div>
                    </div>

                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Čas vyzdvihnutia
                          </div>
                        </div>

                        <Icon16Px44 className="!relative !w-5 !h-5" />
                      </div>

                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Čas vrátenia
                          </div>
                        </div>

                        <Icon16Px44 className="!relative !w-5 !h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full">
                        <div className="flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            Počet povolených km
                          </div>

                          <div className="mt-[-1.00px] mr-[-1.00px] text-colors-white-800 relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            {""}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col h-8 items-start justify-around gap-2 p-4 relative self-stretch w-full">
                        <div className="self-stretch w-full flex-[0_0_auto] mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            Cena prenájmu
                          </div>

                          <div className="mt-[-1.00px] text-colors-white-800 relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            {""}
                          </div>

                          <div className="mt-[-1.00px] mr-[-1.00px] text-colors-white-800 relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            {""}
                          </div>
                        </div>
                      </div>

                      <div className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full">
                        <div className="flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                          <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            <span className="font-semibold">Poistenie </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                              (základné)
                            </span>
                          </p>

                          <div className="mt-[-1.00px] text-colors-white-800 relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            {""}
                          </div>

                          <div className="mt-[-1.00px] mr-[-1.00px] text-colors-white-800 relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            {""}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col h-10 items-start justify-center gap-4 p-4 relative self-stretch w-full bg-colors-black-600 rounded-lg">
                      <div className="gap-1.5 flex-[0_0_auto] mt-[-4.00px] mb-[-4.00px] flex items-center relative self-stretch w-full">
                        <TypPlus
                          className="!relative !w-4 !h-4"
                          color="#D7FF14"
                        />
                        <div className="flex-1 grow flex items-center justify-between relative">
                          <div className="relative w-fit mt-[-0.50px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Mám promokód
                          </div>

                          <div className="mt-[-1.00px] text-colors-white-800 relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            {""}
                          </div>

                          <div className="mt-[-1.00px] mr-[-1.00px] text-colors-green-accent-500 relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            {""}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="h-8 justify-between px-4 py-0 flex items-center relative self-stretch w-full">
                        <div className="flex items-center gap-2 relative flex-1 grow">
                          <p className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            <span className="font-semibold">Depozit</span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                              {" "}
                              (vratná záloha)
                            </span>
                          </p>

                          <Icon16Px83
                            className="!relative !w-4 !h-4"
                            color="#646469"
                          />
                        </div>

                        <div className="mr-[-1.00px] text-colors-white-800 relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                          {""}
                        </div>
                      </div>

                      <div className="justify-around pl-4 pr-0 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <div className="flex items-center gap-1.5 relative flex-1 grow">
                          <CheckBoxy stav="radio-selected" />
                          <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6">
                            Slovensko, Česko, Rakúsko
                          </div>
                        </div>
                      </div>

                      <div className="justify-around pl-4 pr-0 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <div className="flex items-center gap-1.5 relative flex-1 grow">
                          <CheckBoxy24_2 className="!relative !w-6 !h-6" />
                          <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                            <span className="font-medium">
                              +Poľsko, Nemecko, Maďarsko{" "}
                            </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
                              (+30% depozit)
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="justify-around pl-4 pr-0 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <div className="flex items-center gap-1.5 relative flex-1 grow">
                          <CheckBoxy stav="radio-default" />
                          <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                            <span className="font-medium">
                              Celá EU okrem Rumunska{" "}
                            </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
                              (+60% depozit)
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="justify-around pl-4 pr-0 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <div className="flex items-center gap-1.5 relative flex-1 grow">
                          <CheckBoxy stav="radio-default" />
                          <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                            <span className="font-medium">Mimo EU </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
                              (individuálne posúdenie, kontaktujte nás)
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {screenWidth >= 744 && screenWidth < 1440 && (
          <>
            <div className="flex flex-col w-[680px] items-start gap-8 absolute top-[200px] left-8">
              <div className="self-stretch w-full h-[432px] rounded-2xl bg-[url(/img/frame-170-1.png)] relative bg-cover bg-[50%_50%]" />

              <div className="flex flex-wrap items-center gap-[36px_24px] relative self-stretch w-full flex-[0_0_auto]">
                <div className="relative flex-1 grow h-24 rounded-lg bg-[url(/img/frame-169.png)] bg-cover bg-[50%_50%]" />

                <div className="flex-1 grow h-24 rounded-lg bg-[url(/img/frame-170-2.png)] relative bg-cover bg-[50%_50%]" />

                <div className="relative flex-1 grow h-24 rounded-lg bg-[url(/img/frame-167.png)] bg-cover bg-[50%_50%]" />

                <div className="relative flex-1 grow h-24 rounded-lg overflow-hidden bg-[url(/img/frame-168-2.png)] bg-cover bg-[50%_50%]">
                  <div className="inline-flex items-center justify-center gap-1 relative top-9 left-[57px]">
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-1000 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      viac
                    </div>

                    <TypPhoto className="!relative !w-6 !h-6" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col w-[680px] items-center gap-2 pt-10 pb-16 px-16 absolute top-[3184px] left-8 bg-colors-black-300 rounded-2xl overflow-hidden">
              <div className="flex flex-col w-[552px] items-start gap-10 relative flex-[0_0_auto]">
                <div className="inline-flex items-center justify-center gap-6 relative flex-[0_0_auto]">
                  <ElementIconsDarkMedium
                    ellipse="/img/ellipse-1-4.svg"
                    overlapGroupClassName="bg-[url(/img/union-11.svg)]"
                    type="check"
                    union="/img/union-12.svg"
                  />
                  <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-2xl tracking-[0] leading-7 whitespace-nowrap">
                    V cene je zahrnuté
                  </div>
                </div>

                <div className="flex items-start justify-between pl-2 pr-0 py-0 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col items-start gap-8 relative flex-1 grow">
                    <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-start gap-2 p-2 relative flex-[0_0_auto] bg-colors-dark-yellow-accent-200 rounded-[99px]">
                        <Icon24Px118 className="!relative !w-6 !h-6" />
                      </div>

                      <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6">
                        Slovenská&nbsp;&nbsp;
                        <br />
                        dialničná známka
                      </div>
                    </div>

                    <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-start gap-2 p-2 relative flex-[0_0_auto] bg-colors-dark-yellow-accent-200 rounded-[99px]">
                        <Icon24Px118 className="!relative !w-6 !h-6" />
                      </div>

                      <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6">
                        Havaríjne poistenie
                      </div>
                    </div>

                    <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-start gap-2 p-2 relative flex-[0_0_auto] bg-colors-dark-yellow-accent-200 rounded-[99px]">
                        <Icon24Px118 className="!relative !w-6 !h-6" />
                      </div>

                      <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6">
                        Letné a zimné
                        <br />
                        pneumatiky
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-8 relative flex-1 grow">
                    <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-start gap-2 p-2 relative flex-[0_0_auto] bg-colors-dark-yellow-accent-200 rounded-[99px]">
                        <Icon24Px118 className="!relative !w-6 !h-6" />
                      </div>

                      <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6">
                        Dane a poplatky
                      </div>
                    </div>

                    <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-start gap-2 p-2 relative flex-[0_0_auto] bg-colors-dark-yellow-accent-200 rounded-[99px]">
                        <Icon24Px118 className="!relative !w-6 !h-6" />
                      </div>

                      <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6">
                        Poistenie
                        <br />
                        zodpovednosti za škody
                      </div>
                    </div>

                    <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-start gap-2 p-2 relative flex-[0_0_auto] bg-colors-dark-yellow-accent-200 rounded-[99px]">
                        <Icon24Px118 className="!relative !w-6 !h-6" />
                      </div>

                      <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6">
                        Servisné náklady
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col w-[680px] items-center gap-8 absolute top-[824px] left-8 bg-colors-black-200 rounded-3xl overflow-hidden border border-solid border-colors-black-600">
              <div className="flex flex-col items-start gap-8 p-8 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-400">
                <div className="relative w-[206px] h-4 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                  Prenájom vozidla
                </div>

                <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Miesto vyzdvihnutia
                          </div>
                        </div>

                        <Icon16Px44 className="!relative !w-5 !h-5" />
                      </div>

                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Miesto vrátenia
                          </div>
                        </div>

                        <Icon16Px44 className="!relative !w-5 !h-5" />
                      </div>
                    </div>

                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Deň vyzdvihnutia
                          </div>
                        </div>

                        <Icon16Px44 className="!relative !w-5 !h-5" />
                      </div>

                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Deň vrátenia
                          </div>
                        </div>

                        <Icon16Px44 className="!relative !w-5 !h-5" />
                      </div>
                    </div>

                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Čas vyzdvihnutia
                          </div>
                        </div>

                        <Icon16Px44 className="!relative !w-5 !h-5" />
                      </div>

                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Čas vrátenia
                          </div>
                        </div>

                        <Icon16Px44 className="!relative !w-5 !h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full">
                        <div className="flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            Počet povolených km
                          </div>

                          <div className="mt-[-1.00px] mr-[-1.00px] font-semibold text-colors-white-800 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                            {""}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col h-8 items-start justify-around gap-2 p-4 relative self-stretch w-full">
                        <div className="self-stretch w-full flex-[0_0_auto] mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            Cena prenájmu
                          </div>

                          <div className="mt-[-1.00px] font-semibold text-colors-white-800 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                            {""}
                          </div>

                          <div className="mt-[-1.00px] mr-[-1.00px] font-semibold text-colors-white-800 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                            {""}
                          </div>
                        </div>
                      </div>

                      <div className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full">
                        <div className="flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                          <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            <span className="font-semibold">Poistenie </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                              (základné)
                            </span>
                          </p>

                          <div className="mt-[-1.00px] font-semibold text-colors-white-800 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                            {""}
                          </div>

                          <div className="mt-[-1.00px] mr-[-1.00px] font-semibold text-colors-white-800 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                            {""}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col h-10 items-start justify-center gap-4 p-4 relative self-stretch w-full bg-colors-black-600 rounded-lg">
                      <div className="gap-1.5 flex-[0_0_auto] mt-[-4.00px] mb-[-4.00px] flex items-center relative self-stretch w-full">
                        <TypPlus
                          className="!relative !w-4 !h-4"
                          color="#D7FF14"
                        />
                        <div className="flex-1 grow flex items-center justify-between relative">
                          <div className="relative w-fit mt-[-0.50px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Mám promokód
                          </div>

                          <div className="mt-[-1.00px] font-semibold text-colors-white-800 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                            {""}
                          </div>

                          <div className="mt-[-1.00px] mr-[-1.00px] font-semibold text-colors-green-accent-500 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                            {""}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="h-8 justify-between px-4 py-0 flex items-center relative self-stretch w-full">
                        <div className="flex items-center gap-2 relative flex-1 grow">
                          <p className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            <span className="font-semibold">Depozit</span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                              {" "}
                              (vratná záloha)
                            </span>
                          </p>

                          <Icon16Px83
                            className="!relative !w-4 !h-4"
                            color="#646469"
                          />
                        </div>

                        <div className="mr-[-1.00px] font-semibold text-colors-white-800 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                          {""}
                        </div>
                      </div>

                      <div className="justify-around pl-4 pr-0 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <div className="flex items-center gap-1.5 relative flex-1 grow">
                          <CheckBoxy stav="radio-selected" />
                          <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6">
                            Slovensko, Česko, Rakúsko
                          </div>
                        </div>
                      </div>

                      <div className="justify-around pl-4 pr-0 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <div className="flex items-center gap-1.5 relative flex-1 grow">
                          <CheckBoxy24_2 className="!relative !w-6 !h-6" />
                          <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                            <span className="font-medium">
                              +Poľsko, Nemecko, Maďarsko{" "}
                            </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
                              (+30% depozit)
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="justify-around pl-4 pr-0 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <div className="flex items-center gap-1.5 relative flex-1 grow">
                          <CheckBoxy stav="radio-default" />
                          <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                            <span className="font-medium">
                              Celá EU okrem Rumunska{" "}
                            </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
                              (+60% depozit)
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="justify-around pl-4 pr-0 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                        <div className="flex items-center gap-1.5 relative flex-1 grow">
                          <CheckBoxy stav="radio-default" />
                          <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                            <span className="font-medium">Mimo EU </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
                              (individuálne posúdenie, kontaktujte nás)
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
