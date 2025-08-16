import React from "react";
import { useWindowWidth } from "../../breakpoints";
import { AlIeSluBy } from "../../components/AlIeSluBy";
import { BlackrentLogo } from "../../components/BlackrentLogo";
import { CheckBoxy } from "../../components/CheckBoxy";
import { ElementIconsDarkBig } from "../../components/ElementIconsDarkBig";
import { ElementIconsDarkSmall } from "../../components/ElementIconsDarkSmall";
import { FaqRychlyKontakt } from "../../components/FaqRychlyKontakt";
import { FaqRychlyKontaktFooter1728 } from "../../components/FaqRychlyKontaktFooter1728";
import { FooterTablet } from "../../components/FooterTablet";
import { IconColor } from "../../components/IconColor";
import { Mapa } from "../../components/Mapa";
import { Menu } from "../../components/Menu";
import { Menu1 } from "../../components/Menu1";
import { NavigationButtons } from "../../components/NavigationButtons";
import { PrimaryButtons } from "../../components/PrimaryButtons";
import { SecondaryButtons } from "../../components/SecondaryButtons";
import { TabulkaObjednavky } from "../../components/TabulkaObjednavky";
import { TypeDefaultWrapper } from "../../components/TypeDefaultWrapper";
import { CheckBoxy24_1 } from "../../icons/CheckBoxy24_1";
import { Icon16Px27 } from "../../icons/Icon16Px27";
import { Icon16Px28 } from "../../icons/Icon16Px28";
import { Icon16Px29 } from "../../icons/Icon16Px29";
import { Icon16Px30 } from "../../icons/Icon16Px30";
import { Icon16Px31 } from "../../icons/Icon16Px31";
import { Icon16Px87 } from "../../icons/Icon16Px87";
import { Icon16Px109 } from "../../icons/Icon16Px109";
import { Icon16Px113 } from "../../icons/Icon16Px113";
import { Icon24Px27 } from "../../icons/Icon24Px27";
import { Icon24Px69 } from "../../icons/Icon24Px69";
import { Icon24Px102 } from "../../icons/Icon24Px102";
import { Icon24Px129 } from "../../icons/Icon24Px129";
import { IconsEmoji2 } from "../../icons/IconsEmoji2";
import { MobilnaPredvolba } from "../../icons/MobilnaPredvolba";
import { MobilnaPredvolba1 } from "../../icons/MobilnaPredvolba1";
import { TypKidCarSeat } from "../../icons/TypKidCarSeat";
import { TypeArrowDown } from "../../icons/TypeArrowDown";
import { Div } from "./sections/Div";
import { DivWrapper } from "./sections/DivWrapper";
import { FooterMobile } from "./sections/FooterMobile";
import { Frame } from "./sections/Frame";
import { FrameWrapper } from "./sections/FrameWrapper";
import { Group } from "./sections/Group";
import { PredstavenieVozidla } from "./sections/PredstavenieVozidla";
import { TabulkaObjednvky } from "./sections/TabulkaObjednvky";

export const ElementAlieSluby = (): JSX.Element => {
  const screenWidth = useWindowWidth();

  return (
    <div
      className="w-screen grid [align-items:start] bg-[#05050a] justify-items-center"
      data-model-id="4076:10412"
    >
      <div
        className={`bg-colors-black-100 relative ${screenWidth < 744 ? "w-[360px]" : (screenWidth >= 744 && screenWidth < 1440) ? "w-[744px]" : screenWidth >= 1440 && screenWidth < 1728 ? "w-[1440px]" : screenWidth >= 1728 ? "w-[1728px]" : ""} ${screenWidth < 744 ? "h-[4754px]" : (screenWidth >= 744 && screenWidth < 1440) ? "h-[3104px]" : screenWidth >= 1440 && screenWidth < 1728 ? "h-[5368px]" : screenWidth >= 1728 ? "h-[5354px]" : ""}`}
      >
        {screenWidth < 744 && (
          <>
            <Group />
            <PredstavenieVozidla />
            <Frame />
            <FrameWrapper />
            <DivWrapper />
            <TabulkaObjednvky />
            <Menu className="!absolute !left-0 !top-0" type="default" />
            <Div />
            <FooterMobile />
          </>
        )}

        {screenWidth >= 744 && screenWidth < 1440 && (
          <TypeDefaultWrapper
            className="!absolute !left-0 !top-0"
            type="default"
          />
        )}

        {((screenWidth >= 1440 && screenWidth < 1728) ||
          screenWidth >= 1728 ||
          (screenWidth >= 744 && screenWidth < 1440)) && (
          <div
            className={`absolute ${screenWidth >= 744 && screenWidth < 1440 ? "w-[680px]" : (screenWidth >= 1440 && screenWidth < 1728) ? "w-[1120px]" : screenWidth >= 1728 ? "w-[1329px]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "left-8" : (screenWidth >= 1440 && screenWidth < 1728) ? "left-40" : screenWidth >= 1728 ? "left-[200px]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "top-[104px]" : ((screenWidth >= 1440 && screenWidth < 1728) || screenWidth >= 1728) ? "top-32" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "h-[77px]" : ((screenWidth >= 1440 && screenWidth < 1728) || screenWidth >= 1728) ? "h-[152px]" : ""}`}
          >
            {(screenWidth >= 1728 ||
              (screenWidth >= 744 && screenWidth < 1440)) && (
              <div
                className={`relative ${screenWidth >= 744 && screenWidth < 1440 ? "h-[77px]" : (screenWidth >= 1728) ? "h-[152px]" : ""}`}
              >
                <img
                  className={`h-0.5 absolute ${screenWidth >= 744 && screenWidth < 1440 ? "w-[402px]" : (screenWidth >= 1728) ? "w-[756px]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "left-[39px]" : (screenWidth >= 1728) ? "left-[97px]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "top-[19px]" : (screenWidth >= 1728) ? "top-[43px]" : ""}`}
                  alt="Line"
                  src={
                    screenWidth >= 744 && screenWidth < 1440
                      ? "/img/line-14-1.svg"
                      : screenWidth >= 1728
                        ? "/img/line-14-2.svg"
                        : undefined
                  }
                />

                <img
                  className={`h-0.5 absolute ${screenWidth >= 744 && screenWidth < 1440 ? "w-[206px]" : (screenWidth >= 1728) ? "w-[378px]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "left-[439px]" : (screenWidth >= 1728) ? "left-[853px]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "top-[19px]" : (screenWidth >= 1728) ? "top-[43px]" : ""}`}
                  alt="Line"
                  src={
                    screenWidth >= 744 && screenWidth < 1440
                      ? "/img/line-15-1.svg"
                      : screenWidth >= 1728
                        ? "/img/line-15-2.svg"
                        : undefined
                  }
                />

                <div
                  className={`flex left-0 items-start top-0 justify-between absolute ${screenWidth >= 744 && screenWidth < 1440 ? "w-[680px]" : (screenWidth >= 1728) ? "w-[1329px]" : ""}`}
                >
                  <div
                    className={`flex flex-col items-center relative ${screenWidth >= 744 && screenWidth < 1440 ? "w-20" : (screenWidth >= 1728) ? "w-[195px]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "gap-4" : (screenWidth >= 1728) ? "gap-[29px]" : ""}`}
                  >
                    {screenWidth >= 744 && screenWidth < 1440 && (
                      <>
                        <ElementIconsDarkSmall
                          className="bg-[url(/img/ellipse-2-4.svg)]"
                          divClassName=""
                          type="check-selected"
                        />
                        <div className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-[10px] text-center tracking-[0] leading-[14px]">
                          Ponuka <br />
                          vozidiel
                        </div>
                      </>
                    )}

                    {screenWidth >= 1728 && (
                      <>
                        <ElementIconsDarkBig
                          className="bg-[url(/img/ellipse-2-6.svg)]"
                          type="check-selected"
                        />
                        <div className="w-fit text-colors-ligh-gray-800 text-base relative [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                          Ponuka <br />
                          vozidiel
                        </div>
                      </>
                    )}
                  </div>

                  <div
                    className={`flex flex-col items-center relative ${screenWidth >= 744 && screenWidth < 1440 ? "w-20" : (screenWidth >= 1728) ? "w-[195px]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "gap-4" : (screenWidth >= 1728) ? "gap-[29px]" : ""} ${screenWidth >= 1728 ? "justify-center" : ""}`}
                  >
                    {screenWidth >= 744 && screenWidth < 1440 && (
                      <>
                        <ElementIconsDarkSmall
                          className="bg-[url(/img/ellipse-2-5.svg)]"
                          type="check-selected"
                        />
                        <div className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-[10px] text-center tracking-[0] leading-[14px]">
                          BMW 440i
                        </div>
                      </>
                    )}

                    {screenWidth >= 1728 && (
                      <>
                        <ElementIconsDarkBig
                          className="bg-[url(/img/ellipse-2-7.svg)]"
                          type="check-selected"
                        />
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                          BMW 303i
                        </div>
                      </>
                    )}
                  </div>

                  <div
                    className={`flex flex-col items-center relative ${screenWidth >= 744 && screenWidth < 1440 ? "w-20" : (screenWidth >= 1728) ? "w-[195px]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "gap-4" : (screenWidth >= 1728) ? "gap-[29px]" : ""}`}
                  >
                    {screenWidth >= 744 && screenWidth < 1440 && (
                      <>
                        <ElementIconsDarkSmall
                          className="bg-[url(/img/ellipse-1-6.svg)]"
                          divClassName="!text-colors-white-800"
                          type="three-selected"
                        />
                        <div className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-[10px] text-center tracking-[0] leading-[14px]">
                          Ďalšie služby
                        </div>
                      </>
                    )}

                    {screenWidth >= 1728 && (
                      <>
                        <ElementIconsDarkBig
                          className="bg-[url(/img/ellipse-1-8.svg)]"
                          type="three-selected"
                        />
                        <p className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-base text-center tracking-[0] leading-6">
                          Ďalšie služby <br />a osobné údaje
                        </p>
                      </>
                    )}
                  </div>

                  <div
                    className={`flex flex-col items-center relative ${screenWidth >= 744 && screenWidth < 1440 ? "w-20" : (screenWidth >= 1728) ? "w-[195px]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "gap-4" : (screenWidth >= 1728) ? "gap-[29px]" : ""}`}
                  >
                    {screenWidth >= 744 && screenWidth < 1440 && (
                      <>
                        <ElementIconsDarkSmall
                          className="bg-[url(/img/ellipse-1-7.svg)]"
                          type="four-disabled"
                        />
                        <div className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-dark-gray-900 text-[10px] text-center tracking-[0] leading-[14px]">
                          Osobné údaje
                          <br />a platba
                        </div>
                      </>
                    )}

                    {screenWidth >= 1728 && (
                      <>
                        <ElementIconsDarkBig
                          className="bg-[url(/img/ellipse-1-9.svg)]"
                          type="four-disabled"
                        />
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-dark-gray-900 text-base text-center tracking-[0] leading-6">
                          Potvrdenie
                          <br />a platba
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {screenWidth >= 1440 && screenWidth < 1728 && (
              <>
                <img
                  className="absolute w-[619px] h-0.5 top-[59px] left-24"
                  alt="Line"
                  src="/img/line-14-3.svg"
                />

                <img
                  className="absolute w-[309px] h-0.5 top-[59px] left-[715px]"
                  alt="Line"
                  src="/img/line-15-3.svg"
                />

                <div className="flex w-[1120px] items-start justify-between absolute top-0 left-0">
                  <div className="flex flex-col w-48 items-center gap-[29px] relative">
                    <ElementIconsDarkBig
                      className="bg-[url(/img/ellipse-2-8.svg)]"
                      type="check-selected"
                    />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-base tracking-[0] leading-6">
                      Ponuka <br />
                      vozidiel
                    </div>
                  </div>

                  <div className="flex-col w-48 justify-center gap-[29px] flex items-center relative">
                    <ElementIconsDarkBig
                      className="bg-[url(/img/ellipse-2-9.svg)]"
                      type="check-selected"
                    />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                      BMW 303i
                    </div>
                  </div>

                  <div className="flex flex-col w-48 items-center gap-[29px] relative">
                    <ElementIconsDarkBig
                      className="bg-[url(/img/ellipse-1-10.svg)]"
                      type="three-selected"
                    />
                    <p className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-base text-center tracking-[0] leading-6">
                      Ďalšie služby <br />a osobné údaje
                    </p>
                  </div>

                  <div className="flex flex-col w-48 items-center gap-[29px] relative">
                    <ElementIconsDarkBig
                      className="bg-[url(/img/ellipse-1-11.svg)]"
                      type="four-disabled"
                    />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-dark-gray-900 text-base text-center tracking-[0] leading-6">
                      Potvrdenie
                      <br />a platba
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {screenWidth >= 744 && screenWidth < 1440 && (
          <>
            <div className="flex flex-col w-[680px] items-start gap-10 px-8 py-0 absolute top-[261px] left-8">
              <div className="h-4 items-start gap-2 flex relative self-stretch w-full">
                <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                  Poistenie vozidla
                </div>
              </div>

              <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6">
                Všetky naše vozidlá sú automaticky poistené. Poskytujeme však
                možnosť pripoistenia ktoré základné poistenie nepokrýva.
              </p>
            </div>

            <div className="flex w-[680px] items-start gap-4 absolute top-[416px] left-8">
              <div className="flex flex-col items-center relative flex-1 grow rounded-2xl overflow-hidden">
                <div className="relative self-stretch w-full h-[59px]" />

                <div className="flex flex-col items-center gap-6 px-3.5 py-8 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-300 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-center gap-2 px-2 py-0 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-6 whitespace-nowrap">
                      Základné
                    </div>
                  </div>

                  <img
                    className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                    alt="Line"
                    src="/img/line-10-5.svg"
                  />

                  <div className="flex flex-col items-center gap-8 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex gap-4 self-stretch w-full flex-col items-center relative flex-[0_0_auto]">
                      <IconColor className="!flex-[0_0_auto]" type="warring" />
                      <p className="text-colors-white-800 relative self-stretch h-[98px] [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-[22px]">
                        <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                          V případě poškození auta je pojištění karoserie  v
                          omezeném rozsahu. Zaplatíte až{" "}
                        </span>

                        <span className="font-semibold">10%</span>

                        <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                          {" "}
                          z ceny vozu (spoluúčast).
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-4 self-stretch w-full flex-col items-center relative flex-[0_0_auto]">
                      <IconColor className="!flex-[0_0_auto]" type="warring" />
                      <p className="text-colors-white-800 relative self-stretch h-[76px] [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-[22px]">
                        <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                          V případě odcizení auta platí omezené krytí. Zaplatíte
                          až{" "}
                        </span>

                        <span className="font-semibold">10%</span>

                        <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                          {" "}
                          z ceny vozu (spoluúčast).
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-4 self-stretch w-full flex-col items-center relative flex-[0_0_auto]">
                      <IconColor className="!flex-[0_0_auto]" type="warring" />
                      <p className="text-colors-white-800 relative self-stretch h-[98px] [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-[22px]">
                        <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                          Odtah, ztráta klíčů,  a administrativní poplatky{" "}
                        </span>

                        <span className="font-semibold">
                          nejsou součástí pojištění.{" "}
                        </span>

                        <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                          Zaplatíte v plné výši.
                          <br />
                        </span>
                      </p>
                    </div>
                  </div>

                  <img
                    className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                    alt="Line"
                    src="/img/line-10-5.svg"
                  />

                  <div className="flex items-start justify-center gap-2 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-light-yellow-accent-400 text-sm text-center tracking-[0] leading-5">
                      Už zahrnuté <br />v cene
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center relative flex-1 grow bg-[#6e5af0] rounded-2xl overflow-hidden">
                <div className="flex h-[59px] items-center justify-center gap-2 px-2 py-6 relative self-stretch w-full">
                  <div className="inline-flex items-center justify-center gap-0.5 relative flex-[0_0_auto] mt-[-6.50px] mb-[-6.50px]">
                    <IconsEmoji2
                      className="!relative !w-6 !h-6"
                      color="url(#pattern0_10970_23883)"
                    />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                      Najobľúbenejšie
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-6 pt-8 pb-12 px-3.5 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-300 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-center gap-2 px-2 py-0 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-6 whitespace-nowrap">
                      Štandardné
                    </div>
                  </div>

                  <img
                    className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                    alt="Line"
                    src="/img/line-10-5.svg"
                  />

                  <div className="flex flex-col items-center gap-8 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex gap-4 self-stretch w-full flex-col items-center relative flex-[0_0_auto]">
                      <IconColor
                        className="!flex-[0_0_auto]"
                        type="check-lime"
                      />
                      <p className="text-colors-white-1000 relative self-stretch h-[98px] [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-[22px]">
                        <span className="text-[#f0f0f5]">
                          V případě poškození auta je pojištění karoserie v
                          omezeném rozsahu. Zaplatíte až
                        </span>

                        <span className="font-semibold text-[#f0f0f5]">
                          {" "}
                          5%
                        </span>

                        <span className="text-[#f0f0f5]">
                          {"  "}z ceny vozu (spoluúčast).
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-4 self-stretch w-full flex-col items-center relative flex-[0_0_auto]">
                      <IconColor
                        className="!flex-[0_0_auto]"
                        type="check-lime"
                      />
                      <p className="text-colors-white-1000 relative self-stretch h-[76px] [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-[22px]">
                        <span className="text-[#f0f0f5]">
                          V případě odcizení auta platí omezené krytí. Zaplatíte
                          až{" "}
                        </span>

                        <span className="font-semibold text-[#f0f0f5]">5%</span>

                        <span className="text-[#f0f0f5]">
                          {" "}
                          z ceny vozu (spoluúčast).
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-col h-[146px] items-center gap-4 relative self-stretch w-full">
                      <IconColor
                        className="!flex-[0_0_auto]"
                        type="check-lime"
                      />
                      <p className="text-colors-white-1000 relative self-stretch h-[98px] [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-[22px]">
                        <span className="text-[#f0f0f5]">
                          Odtah, ztráta klíčů,  a administrativní poplatky{" "}
                        </span>

                        <span className="font-semibold text-[#f0f0f5]">
                          nejsou součástí pojištění.{" "}
                        </span>

                        <span className="text-[#f0f0f5]">
                          Zaplatíte v plné výši.
                          <br />
                        </span>
                      </p>
                    </div>
                  </div>

                  <img
                    className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                    alt="Line"
                    src="/img/line-10-5.svg"
                  />

                  <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                    <p className="relative w-[178px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-light-yellow-accent-100 text-sm text-center tracking-[0] leading-6">
                      <span className="text-[#a0a0a5]">
                        Cena auta +<br />
                      </span>

                      <span className="font-bold text-[#f0f0f5] text-base">
                        123 €
                      </span>
                    </p>
                  </div>

                  <SecondaryButtons
                    className="!self-stretch !flex !w-full"
                    secondaryBig="secondary"
                    text="Pridať poistenie"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center relative flex-1 grow rounded-2xl overflow-hidden">
                <div className="relative self-stretch w-full h-[59px]" />

                <div className="flex flex-col items-center gap-6 pt-8 pb-12 px-3.5 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-300 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-center gap-2 px-2 py-0 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-6 whitespace-nowrap">
                      Kompletné
                    </div>
                  </div>

                  <img
                    className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                    alt="Line"
                    src="/img/line-10-5.svg"
                  />

                  <div className="flex flex-col items-center gap-8 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex gap-4 self-stretch w-full flex-col items-center relative flex-[0_0_auto]">
                      <IconColor
                        className="!flex-[0_0_auto]"
                        type="check-green"
                      />
                      <p className="h-[98px] relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-1000 text-sm tracking-[0] leading-[22px]">
                        <span className="font-semibold text-[#f0f0f5]">
                          Kryje všechny náklady  a poplatky.
                        </span>

                        <span className="text-[#f0f0f5]">
                          {" "}
                          Výdaje vám budou v plné výši proplaceny.
                          <br />
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-4 self-stretch w-full flex-col items-center relative flex-[0_0_auto]">
                      <IconColor
                        className="!flex-[0_0_auto]"
                        type="check-green"
                      />
                      <p className="h-[76px] relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-1000 text-sm tracking-[0] leading-[22px]">
                        <span className="font-semibold text-[#f0f0f5]">
                          Kryje všechny náklady  a poplatky.
                        </span>

                        <span className="text-[#f0f0f5]">
                          {" "}
                          Výdaje vám budou v plné výši proplaceny.
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-4 self-stretch w-full flex-col items-center relative flex-[0_0_auto]">
                      <IconColor
                        className="!flex-[0_0_auto]"
                        type="check-green"
                      />
                      <p className="h-[98px] relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-1000 text-sm tracking-[0] leading-[22px]">
                        <span className="font-semibold text-[#f0f0f5]">
                          Kryje všechny náklady  a poplatky.{" "}
                        </span>

                        <span className="text-[#f0f0f5]">
                          Výdaje vám budou v plné výši proplaceny.
                          <br />
                        </span>
                      </p>
                    </div>
                  </div>

                  <img
                    className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                    alt="Line"
                    src="/img/line-10-5.svg"
                  />

                  <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                    <p className="relative w-[178px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-light-yellow-accent-100 text-sm text-center tracking-[0] leading-6">
                      <span className="text-[#a0a0a5]">
                        Cena auta +<br />
                      </span>

                      <span className="font-bold text-[#f0f0f5] text-base">
                        123 €
                      </span>
                    </p>
                  </div>

                  <SecondaryButtons
                    className="!self-stretch !flex !w-full"
                    secondaryBig="secondary"
                    text="Pridať poistenie"
                  />
                </div>
              </div>
            </div>

            <TabulkaObjednavky
              className="!absolute !left-0 !top-[1707px]"
              primaryButtons={
                <Icon24Px69 className="!relative !w-6 !h-6" color="#141900" />
              }
              typ="po-vyplnen-short"
            />
            <FooterTablet
              className="!absolute !left-0 !top-[2035px]"
              href="tel:+421 910 666 949"
              type="b"
            />
          </>
        )}

        {((screenWidth >= 1440 && screenWidth < 1728) ||
          screenWidth >= 1728) && (
          <Menu1
            className={
              screenWidth >= 1728
                ? "!absolute !left-0 !top-0"
                : screenWidth >= 1440 && screenWidth < 1728
                  ? "!absolute !left-0 !w-[1440px] !top-0"
                  : undefined
            }
            type="default"
          />
        )}

        {((screenWidth >= 1440 && screenWidth < 1728) ||
          (screenWidth >= 744 && screenWidth < 1440)) && (
          <div
            className={`flex flex-col items-start absolute ${screenWidth >= 744 && screenWidth < 1440 ? "w-[680px]" : (screenWidth >= 1440 && screenWidth < 1728) ? "w-[640px]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "left-8" : (screenWidth >= 1440 && screenWidth < 1728) ? "left-40" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "top-[1315px]" : (screenWidth >= 1440 && screenWidth < 1728) ? "top-[400px]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "gap-8" : (screenWidth >= 1440 && screenWidth < 1728) ? "gap-10" : ""}`}
          >
            {screenWidth >= 744 && screenWidth < 1440 && (
              <div className="h-10 items-center justify-between flex relative self-stretch w-full">
                <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                  Ďalšie služby
                </div>

                <NavigationButtons property1="type-6" />
              </div>
            )}

            {screenWidth >= 1440 && screenWidth < 1728 && (
              <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="inline-flex h-4 justify-center gap-2 items-center relative">
                    <div className="relative w-[204px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7">
                      Poistenie vozidla
                    </div>
                  </div>

                  <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6">
                    Všetky naše vozidlá sú automaticky poistené. Poskytujeme
                    však možnosti pripoistenia ktoré základné poistenie
                    nepokrýva.
                  </p>
                </div>
              </div>
            )}

            <div
              className={`w-full flex self-stretch items-start flex-[0_0_auto] relative ${screenWidth >= 744 && screenWidth < 1440 ? "gap-6" : (screenWidth >= 1440 && screenWidth < 1728) ? "gap-4" : ""}`}
            >
              {screenWidth >= 744 && screenWidth < 1440 && (
                <>
                  <AlIeSluBy
                    className="!flex-1 !grow !w-[unset]"
                    type="al-vodi-defautl"
                    vector="/img/vector-64-6.svg"
                  />
                  <AlIeSluBy
                    className="!flex-1 !grow !w-[unset]"
                    icon={<Icon24Px102 className="!relative !w-6 !h-6" />}
                    type="autoseda-ka-selected"
                    vector="/img/vector-64-7.svg"
                  />
                  <AlIeSluBy
                    className="!flex-1 !grow !w-[unset]"
                    type="bicykle-defautl"
                    vector="/img/vector-64-8.svg"
                  />
                </>
              )}

              {screenWidth >= 1440 && screenWidth < 1728 && (
                <>
                  <div className="flex flex-col w-[202px] items-center relative rounded-2xl overflow-hidden">
                    <div className="h-[59px] relative self-stretch w-full" />

                    <div className="flex flex-col items-center gap-6 px-4 py-8 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-300 rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-center gap-2 px-2 py-0 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-6 whitespace-nowrap">
                          Základné
                        </div>
                      </div>

                      <img
                        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                        alt="Line"
                        src="/img/line-10-11.svg"
                      />

                      <div className="flex flex-col items-center gap-8 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                          <IconColor
                            className="!flex-[0_0_auto]"
                            type="warring"
                          />
                          <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              V případě poškození auta je pojištění karoserie  v
                              omezeném rozsahu. Zaplatíte až{" "}
                            </span>

                            <span className="font-semibold">10%</span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              {" "}
                              z ceny vozu (spoluúčast).
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                          <IconColor
                            className="!flex-[0_0_auto]"
                            type="warring"
                          />
                          <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              V případě odcizení auta platí omezené krytí.
                              Zaplatíte až{" "}
                            </span>

                            <span className="font-semibold">10%</span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              {" "}
                              z ceny vozu (spoluúčast).
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                          <IconColor
                            className="!flex-[0_0_auto]"
                            type="warring"
                          />
                          <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              Odtah, ztráta klíčů,  a administrativní poplatky{" "}
                            </span>

                            <span className="font-semibold">
                              nejsou součástí pojištění.{" "}
                            </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              Zaplatíte v plné výši.
                            </span>
                          </p>
                        </div>
                      </div>

                      <img
                        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                        alt="Line"
                        src="/img/line-10-11.svg"
                      />

                      <div className="flex items-start justify-center gap-2 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-light-yellow-accent-400 text-sm text-center tracking-[0] leading-5">
                          Už zahrnuté <br />v cene
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col w-[202px] items-center relative bg-[#6e5af0] rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-center gap-2 px-2 py-6 flex-[0_0_auto] relative self-stretch w-full">
                      <div className="inline-flex items-center justify-center gap-0.5 relative flex-[0_0_auto]">
                        <IconsEmoji2
                          className="!relative !w-6 !h-6"
                          color="url(#pattern0_10955_23872)"
                        />
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                          Najobľúbenejšie
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-6 pt-8 pb-10 px-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-300 rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-center gap-2 px-2 py-0 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-6 whitespace-nowrap">
                          Štandardné
                        </div>
                      </div>

                      <img
                        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                        alt="Line"
                        src="/img/line-10-11.svg"
                      />

                      <div className="flex flex-col items-center gap-8 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                          <IconColor
                            className="!flex-[0_0_auto]"
                            type="check-lime"
                          />
                          <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              V případě poškození auta je pojištění karoserie v
                              omezeném rozsahu. Zaplatíte až
                            </span>

                            <span className="font-semibold"> 5%</span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              {" "}
                              z ceny vozu (spoluúčast).
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                          <IconColor
                            className="!flex-[0_0_auto]"
                            type="check-lime"
                          />
                          <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              V případě odcizení auta platí omezené krytí.
                              Zaplatíte až{" "}
                            </span>

                            <span className="font-semibold">5%</span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              {" "}
                              z ceny vozu (spoluúčast).
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col h-[146px] items-center gap-4 relative self-stretch w-full">
                          <IconColor
                            className="!flex-[0_0_auto]"
                            type="check-lime"
                          />
                          <p className="h-[120px] mb-[-21.00px] relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              Odtah, ztráta klíčů,  a administrativní poplatky{" "}
                            </span>

                            <span className="font-semibold">
                              nejsou součástí pojištění.{" "}
                            </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              Zaplatíte v plné výši.
                              <br />
                            </span>
                          </p>
                        </div>
                      </div>

                      <img
                        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                        alt="Line"
                        src="/img/line-10-11.svg"
                      />

                      <div className="inline-flex flex-col items-center relative flex-[0_0_auto] ml-[-4.00px] mr-[-4.00px]">
                        <p className="relative w-[178px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-light-yellow-accent-100 text-sm text-center tracking-[0] leading-6">
                          <span className="text-[#a0a0a5]">
                            Cena auta +<br />
                          </span>

                          <span className="font-bold text-[#f0f0f5] text-base">
                            32 €
                          </span>
                        </p>
                      </div>

                      <SecondaryButtons
                        className="!self-stretch !flex !w-full"
                        divClassName="!mr-[-7.50px]"
                        icon24Px27StyleOverrideClassName="!relative !ml-[-7.50px] !w-6 !h-6"
                        secondaryBig="secondary"
                        text="Pridať poistenie"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col w-[202px] items-center relative rounded-2xl overflow-hidden">
                    <div className="h-[59px] relative self-stretch w-full" />

                    <div className="flex flex-col items-center gap-6 pt-8 pb-10 px-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-300 rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-center gap-2 px-2 py-0 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-6 whitespace-nowrap">
                          Kompletné
                        </div>
                      </div>

                      <img
                        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                        alt="Line"
                        src="/img/line-10-11.svg"
                      />

                      <div className="flex flex-col items-center gap-8 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex flex-col h-[168px] items-center gap-4 relative self-stretch w-full">
                          <IconColor
                            className="!flex-[0_0_auto]"
                            type="check-green"
                          />
                          <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                            <span className="font-semibold">
                              Kryje všechny náklady  a poplatky.
                            </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              {" "}
                              Výdaje vám budou v plné výši proplaceny.
                              <br />
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                          <IconColor
                            className="!flex-[0_0_auto]"
                            type="check-green"
                          />
                          <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                            <span className="font-semibold">
                              Kryje všechny náklady  a poplatky.
                            </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              {" "}
                              Výdaje vám budou v plné výši proplaceny.
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                          <IconColor
                            className="!flex-[0_0_auto]"
                            type="check-green"
                          />
                          <p className="h-[98px] relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                            <span className="font-semibold">
                              Kryje všechny náklady  a poplatky.{" "}
                            </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              Výdaje vám budou v plné výši proplaceny.
                              <br />
                            </span>
                          </p>
                        </div>
                      </div>

                      <img
                        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                        alt="Line"
                        src="/img/line-10-11.svg"
                      />

                      <div className="inline-flex flex-col items-center relative flex-[0_0_auto] ml-[-4.00px] mr-[-4.00px]">
                        <p className="relative w-[178px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-light-yellow-accent-100 text-sm text-center tracking-[0] leading-6">
                          <span className="text-[#a0a0a5]">
                            Cena auta +<br />
                          </span>

                          <span className="font-bold text-[#f0f0f5] text-base">
                            58 €
                          </span>
                        </p>
                      </div>

                      <div className="bg-colors-red-accent-100 flex h-12 items-center justify-center gap-1.5 pl-5 pr-6 py-3 relative self-stretch w-full rounded-[99px]">
                        <Icon24Px129 className="!relative !w-6 !h-6" />
                        <button className="all-[unset] box-border font-medium text-colors-red-accent-300 text-sm relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                          Zrušiť
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {screenWidth >= 1440 && screenWidth < 1728 && (
              <>
                <img
                  className="object-cover relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                  alt="Line"
                  src="/img/line-17-1.svg"
                />

                <div className="flex flex-col items-start gap-8 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex h-10 justify-between self-stretch w-full items-center relative">
                    <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                      Ďalšie služby
                    </div>

                    <NavigationButtons property1="type-6" />
                  </div>

                  <div className="flex items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                    <AlIeSluBy
                      className="!flex-1 !grow !w-[unset]"
                      type="al-vodi-defautl"
                      vector="/img/vector-64-13.svg"
                    />
                    <AlIeSluBy
                      className="!flex-1 !grow !w-[unset]"
                      icon={
                        <TypKidCarSeat
                          className="!relative !w-6 !h-6"
                          color="#BEBEC3"
                        />
                      }
                      type="autoseda-ka-selected"
                      vector="/img/vector-64-13.svg"
                    />
                  </div>
                </div>

                <img
                  className="object-cover relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                  alt="Line"
                  src="/img/line-18-4.svg"
                />

                <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex h-4 items-center gap-2 relative self-stretch w-full">
                    <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                      Osobné údaje
                    </div>
                  </div>

                  <div className="flex-wrap gap-[24px_16px] self-stretch w-full flex-[0_0_auto] flex items-center relative">
                    <div className="flex flex-col items-start gap-6 relative flex-1 grow">
                      <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex h-14 items-center gap-0.5 pl-4 pr-3.5 py-3 relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                          <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              Meno *
                            </div>
                          </div>
                        </div>

                        <div className="h-14 gap-0.5 pl-4 pr-3.5 pt-2.5 pb-3.5 flex-1 grow rounded-lg border border-solid border-colors-dark-gray-900 flex items-center relative">
                          <div className="justify-center gap-3 inline-flex flex-col items-start relative flex-[0_0_auto]">
                            <div className="relative w-[67px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-xs tracking-[0] leading-6">
                              Priezvisko *
                            </div>

                            <div className="relative w-[66px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                              Šufliarsky
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex h-14 items-center gap-0.5 pl-4 pr-3.5 pt-3 pb-3.5 relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                          <div className="inline-flex flex-col items-start gap-3 relative flex-[0_0_auto]">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-xs tracking-[0] leading-6 whitespace-nowrap">
                              Telefón *
                            </div>

                            <div className="inline-flex h-2.5 items-center gap-2 relative">
                              <div className="inline-flex items-center gap-1 relative flex-[0_0_auto] mt-[-3.00px] mb-[-3.00px]">
                                <MobilnaPredvolba1 className="!relative !w-4 !h-4" />
                                <TypeArrowDown className="!relative !w-2 !h-2" />
                              </div>

                              <div className="relative w-[31px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                                +421
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex h-14 items-center gap-0.5 pl-4 pr-3.5 py-3 relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                          <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              E-mail *
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex h-14 items-center gap-0.5 pl-4 pr-3.5 py-3 relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                          <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              Číslo občianského preukazu *
                            </div>
                          </div>
                        </div>

                        <div className="flex h-14 items-center gap-0.5 pl-4 pr-3.5 py-3 relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                          <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              Rodné číslo *
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex h-14 items-center gap-0.5 pl-4 pr-3.5 py-3 relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                          <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              Číslo vodičského preukazu *
                            </div>
                          </div>
                        </div>

                        <div className="h-14 gap-0.5 pl-4 pr-3.5 pt-2.5 pb-3.5 flex-1 grow rounded-lg border border-solid border-colors-black-800 flex items-center relative">
                          <div className="inline-flex flex-col items-start gap-3 relative flex-[0_0_auto]">
                            <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-xs tracking-[0] leading-6 whitespace-nowrap">
                              Platnosť vodičského preukazu od *
                            </p>

                            <div className="relative w-[75px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                              dd.mm.rrrr
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="h-6 rounded-lg flex items-center justify-between relative self-stretch w-full">
                      <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                          Kontaktné údaje *
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                        <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Pridať firemné údaje
                          </div>
                        </div>

                        <CheckBoxy stav="switch-default" />
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex h-14 items-center gap-0.5 pl-4 pr-3.5 py-3 relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                          <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              Adresa *
                            </div>
                          </div>
                        </div>

                        <div className="flex h-14 items-center gap-0.5 pl-4 pr-3.5 py-3 relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                          <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              Mesto *
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex h-14 items-center gap-0.5 pl-4 pr-3.5 py-3 relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                          <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              PSČ *
                            </div>
                          </div>
                        </div>

                        <div className="h-14 justify-between pl-4 pr-3.5 py-3 flex-1 grow rounded-lg border border-solid border-colors-black-800 flex items-center relative">
                          <div className="gap-2.5 inline-flex flex-col items-start relative flex-[0_0_auto]">
                            <div className="relative w-[75px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                              Krajina *
                            </div>
                          </div>

                          <Icon16Px109 className="!relative !w-4 !h-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex w-[648px] h-6 items-center gap-2 relative mr-[-8.00px] rounded-lg">
                      <div className="flex items-center gap-2 relative flex-1 grow">
                        <div className="relative w-[265px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6">
                          Identifikačné údaje
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="h-14 justify-between p-4 rounded-lg border border-solid border-colors-black-800 flex items-center relative self-stretch w-full">
                        <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                          <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Občianský preukaz – predná strana
                          </p>
                        </div>

                        <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-light-yellow-accent-100 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Vybrať súbor
                          </div>
                        </div>
                      </div>

                      <div className="h-14 justify-between p-4 rounded-lg border border-solid border-colors-black-800 flex items-center relative self-stretch w-full">
                        <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                          <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Občianský preukaz – zadná strana
                          </p>
                        </div>

                        <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-light-yellow-accent-100 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Vybrať súbor
                          </div>
                        </div>
                      </div>

                      <div className="h-14 justify-between p-4 rounded-lg border border-solid border-colors-black-800 flex items-center relative self-stretch w-full">
                        <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                          <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Vodičský preukaz – predná strana
                          </p>
                        </div>

                        <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-light-yellow-accent-100 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Vybrať súbor
                          </div>
                        </div>
                      </div>

                      <div className="h-14 justify-between p-4 rounded-lg border border-solid border-colors-black-800 flex items-center relative self-stretch w-full">
                        <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                          <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Vodičský preukaz – zadná strana
                          </p>
                        </div>

                        <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-light-yellow-accent-100 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Vybrať súbor
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex h-10 items-center pl-2 pr-4 py-4 relative self-stretch w-full rounded-lg">
                      <div className="inline-flex gap-1.5 flex-[0_0_auto] mt-[-8.00px] mb-[-8.00px] items-center relative">
                        <CheckBoxy stav="square-default" />
                        <div className="inline-flex flex-[0_0_auto] items-center gap-[151px] relative">
                          <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            <span className="text-[#f0f0f5]">Súhlasím so </span>

                            <span className="text-[#f0ff98] underline">
                              všeobecnými obchodnými podmienkami
                            </span>

                            <span className="text-[#f0f0f5]"> *</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex h-10 items-center gap-2 pl-2 pr-4 py-4 relative self-stretch w-full rounded-lg">
                      <div className="flex gap-1.5 flex-1 grow mt-[-8.00px] mb-[-8.00px] items-center relative">
                        <CheckBoxy stav="square-default" />
                        <div className="flex flex-1 grow items-center gap-[151px] relative">
                          <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            <span className="text-[#f0f0f5]">Súhlasím so </span>

                            <span className="text-[#f0ff98] underline">
                              spracovaním osobných údajov
                            </span>

                            <span className="text-[#f0f0f5]"> *</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex h-10 items-center gap-2 pl-2 pr-4 py-4 relative self-stretch w-full rounded-lg">
                      <div className="flex gap-1.5 flex-1 grow mt-[-8.00px] mb-[-8.00px] items-center relative">
                        <CheckBoxy stav="square-default" />
                        <div className="flex flex-1 grow items-center gap-[151px] relative">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Chcem pridať poznámku
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {screenWidth >= 1440 && screenWidth < 1728 && (
          <>
            <div className="flex flex-col w-[448px] items-center gap-6 pt-0 pb-6 px-0 absolute top-[400px] left-[831px] bg-colors-black-200 rounded-3xl overflow-hidden border-2 border-solid border-colors-black-600">
              <div className="flex flex-col items-start gap-6 pt-6 pb-8 px-6 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-400 rounded-3xl overflow-hidden">
                <div className="flex h-[216px] items-start justify-around gap-[76px] p-6 relative self-stretch w-full bg-colors-black-200 rounded-2xl overflow-hidden">
                  <div className="flex items-start gap-4 relative flex-1 self-stretch grow">
                    <div className="flex flex-col items-start justify-between relative flex-1 self-stretch grow">
                      <div className="flex flex-col h-[87px] items-start gap-4 relative self-stretch w-full">
                        <div className="relative self-stretch mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-base tracking-[0] leading-5 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                          Porsche Panamera Turbo
                        </div>

                        <div className="flex flex-wrap items-start gap-[8px_8px] relative self-stretch w-full flex-[0_0_auto]">
                          <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                            <div className="inline-flex flex-wrap items-center gap-[0px_0px] relative flex-[0_0_auto]">
                              <Icon16Px27 className="!relative !w-4 !h-4" />
                              <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-xs tracking-[0] leading-6 whitespace-nowrap">
                                123 kW
                              </div>
                            </div>

                            <div className="inline-flex flex-wrap items-center gap-[4px_4px] relative flex-[0_0_auto]">
                              <Icon16Px28 className="!relative !w-4 !h-4" />
                              <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-xs tracking-[0] leading-6 whitespace-nowrap">
                                Automat
                              </div>
                            </div>
                          </div>

                          <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                            <div className="inline-flex flex-wrap items-center gap-[4px_4px] relative flex-[0_0_auto]">
                              <Icon16Px29 className="!relative !w-4 !h-4" />
                              <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-xs tracking-[0] leading-6 whitespace-nowrap">
                                Benzín
                              </div>
                            </div>

                            <div className="inline-flex flex-wrap items-center gap-[4px_4px] relative flex-[0_0_auto]">
                              <Icon16Px30 className="!relative !w-4 !h-4" />
                              <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-xs tracking-[0] leading-6 whitespace-nowrap">
                                Predný
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="inline-flex items-start gap-1.5 relative flex-[0_0_auto]">
                        <BlackrentLogo className="!h-4 bg-[url(/img/vector-31.svg)] !relative !w-[107.2px]" />
                        <Icon16Px31 className="!relative !w-4 !h-4" />
                      </div>
                    </div>

                    <div className="relative flex-1 self-stretch grow rounded-lg bg-[url(/img/frame-170-1.png)] bg-cover bg-[50%_50%]" />
                  </div>
                </div>

                <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-3 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex gap-1 flex-1 grow items-center relative">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Trenčín
                          </div>

                          <div className="flex-1 font-normal text-colors-white-800 text-sm relative mt-[-1.00px] [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            {""}
                          </div>
                        </div>

                        <Icon16Px109 className="!relative !w-5 !h-5 !mt-[-2.00px] !mb-[-2.00px]" />
                      </div>

                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-3 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex gap-1 flex-1 grow items-center relative">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Bratislava
                          </div>

                          <div className="flex-1 font-normal text-colors-white-800 text-sm relative mt-[-1.00px] [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            {""}
                          </div>
                        </div>

                        <Icon16Px109 className="!relative !w-5 !h-5 !mt-[-2.00px] !mb-[-2.00px]" />
                      </div>
                    </div>

                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-3 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex gap-1 flex-1 grow items-center relative">
                          <div className="text-colors-white-800 text-sm relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium tracking-[0] leading-6 whitespace-nowrap">
                            8. 11. 2023
                          </div>

                          <div className="flex-1 font-normal text-colors-white-800 text-sm relative mt-[-1.00px] [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            {""}
                          </div>
                        </div>

                        <Icon16Px109 className="!relative !w-5 !h-5 !mt-[-2.00px] !mb-[-2.00px]" />
                      </div>

                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-3 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex gap-1 flex-1 grow items-center relative">
                          <div className="text-colors-white-800 text-sm relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium tracking-[0] leading-6 whitespace-nowrap">
                            10. 11. 2023
                          </div>

                          <div className="flex-1 font-normal text-colors-white-800 text-sm relative mt-[-1.00px] [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            {""}
                          </div>
                        </div>

                        <Icon16Px109 className="!relative !w-5 !h-5 !mt-[-2.00px] !mb-[-2.00px]" />
                      </div>
                    </div>

                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-3 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex gap-1 flex-1 grow items-center relative">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            14:00
                          </div>

                          <div className="flex-1 font-normal text-colors-white-800 text-sm relative mt-[-1.00px] [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            {""}
                          </div>
                        </div>

                        <Icon16Px109 className="!relative !w-5 !h-5 !mt-[-2.00px] !mb-[-2.00px]" />
                      </div>

                      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-3 relative flex-1 grow bg-colors-black-600 rounded-lg">
                        <div className="flex gap-1 flex-1 grow items-center relative">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            18:00
                          </div>

                          <div className="flex-1 font-normal text-colors-white-800 text-sm relative mt-[-1.00px] [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            {""}
                          </div>
                        </div>

                        <Icon16Px109 className="!relative !w-5 !h-5 !mt-[-2.00px] !mb-[-2.00px]" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full">
                        <div className="flex justify-between flex-1 grow mt-[-5.50px] mb-[-5.50px] items-center relative">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            Počet povolených km
                          </div>

                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            1700 km
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col h-8 items-start justify-around gap-2 p-4 relative self-stretch w-full">
                        <div className="flex justify-between self-stretch w-full flex-[0_0_auto] mt-[-5.50px] mb-[-5.50px] items-center relative">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            Cena prenájmu
                          </div>

                          <div className="w-fit font-semibold text-colors-white-800 text-base whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            {""}
                          </div>

                          <div className="mt-[-1.00px] text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 tracking-[0] leading-6 whitespace-nowrap">
                            890 €
                          </div>
                        </div>
                      </div>

                      <div className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full">
                        <div className="flex justify-between flex-1 grow mt-[-5.50px] mb-[-5.50px] items-center relative">
                          <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            <span className="font-semibold">Poistenie </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                              (základné)
                            </span>
                          </p>

                          <div className="w-fit font-semibold text-colors-white-800 text-base whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            {""}
                          </div>

                          <div className="mt-[-1.00px] text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 tracking-[0] leading-6 whitespace-nowrap">
                            123 €
                          </div>
                        </div>
                      </div>

                      <div className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full">
                        <div className="flex justify-between flex-1 grow mt-[-5.50px] mb-[-5.50px] items-center relative">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            Ďalšie služby
                          </div>

                          <div className="w-fit font-semibold text-colors-white-800 text-base whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            {""}
                          </div>

                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            6 €
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-col items-start gap-4 p-4 bg-colors-black-600 rounded-lg flex relative self-stretch w-full flex-[0_0_auto]">
                      <div className="items-center gap-1.5 flex relative self-stretch w-full flex-[0_0_auto]">
                        <Icon24Px27
                          className="!relative !w-4 !h-4"
                          color="#D7FF14"
                        />
                        <div className="flex justify-between flex-1 grow items-center relative">
                          <div className="relative w-fit mt-[-0.50px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Mám promokód
                          </div>

                          <div className="w-fit font-semibold text-colors-white-800 text-base whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            {""}
                          </div>

                          <div className="w-fit font-semibold text-colors-green-accent-500 text-base whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            {""}
                          </div>

                          <div className="relative w-fit mt-[-0.50px] [font-family:'Poppins',Helvetica] font-semibold text-colors-green-accent-500 text-sm tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                            -20 €
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="h-8 px-4 py-0 flex items-center justify-between relative self-stretch w-full">
                        <div className="flex items-center gap-2 relative flex-1 grow">
                          <p className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            <span className="font-semibold">Depozit</span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                              {" "}
                              (vratná záloha)
                            </span>
                          </p>

                          <Icon16Px87 className="!relative !w-4 !h-4" />
                        </div>

                        <div className="text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 tracking-[0] leading-6 whitespace-nowrap">
                          1000 €
                        </div>
                      </div>

                      <div className="flex h-8 items-center justify-around gap-2 pl-4 pr-0 py-0 relative self-stretch w-full">
                        <div className="flex items-center gap-1.5 relative flex-1 grow">
                          <CheckBoxy stav="radio-selected" />
                          <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6">
                            Slovensko, Česko, Rakúsko
                          </div>
                        </div>
                      </div>

                      <div className="flex h-8 items-center justify-around gap-2 pl-4 pr-0 py-0 relative self-stretch w-full">
                        <div className="flex items-center gap-1.5 relative flex-1 grow">
                          <CheckBoxy24_1 className="!w-6 !h-6 !relative" />
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

                      <div className="flex h-8 items-center justify-around gap-2 pl-4 pr-0 py-0 relative self-stretch w-full">
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

                      <div className="flex h-8 items-center justify-around gap-2 pl-4 pr-0 py-0 relative self-stretch w-full">
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

              <div className="flex flex-col items-center gap-4 px-6 py-0 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex h-10 justify-between px-2 py-0 self-stretch w-full items-center relative">
                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-2xl tracking-[0] leading-6 whitespace-nowrap">
                    Cena
                  </div>

                  <div className="inline-flex flex-col items-end gap-3 relative flex-[0_0_auto]">
                    <div className="mt-[-1.00px] text-2xl text-right relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 tracking-[0] leading-6 whitespace-nowrap">
                      1208 €
                    </div>

                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-dark-gray-900 text-xs text-right tracking-[0] leading-6 whitespace-nowrap">
                      vrátane DPH
                    </div>
                  </div>
                </div>

                <img
                  className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                  alt="Line"
                  src="/img/line-18-1.svg"
                />

                <div className="flex flex-col items-start gap-2 pl-2 pr-0 py-0 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="h-8 gap-2 flex items-center relative self-stretch w-full">
                    <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        Možnosť platby
                      </div>
                    </div>
                  </div>

                  <div className="flex items-end gap-6 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col items-start gap-2 relative flex-1 grow">
                      <div className="h-8 gap-2 flex items-center relative self-stretch w-full">
                        <div className="flex w-[77px] items-center gap-1.5 relative">
                          <CheckBoxy stav="radio-default" />
                          <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6">
                            Kartou
                          </div>
                        </div>
                      </div>

                      <div className="h-8 gap-2 flex items-center relative self-stretch w-full">
                        <div className="flex w-[181px] items-center gap-1.5 relative">
                          <CheckBoxy stav="radio-default" />
                          <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6">
                            Hotovosť (na mieste)
                          </div>
                        </div>
                      </div>
                    </div>

                    <PrimaryButtons
                      className="!flex-[0_0_auto]"
                      override={
                        <Icon24Px69
                          className="!relative !w-6 !h-6"
                          color="#141900"
                        />
                      }
                      text="Potvrdiť"
                      tlacitkoNaTmavem="normal"
                    />
                  </div>
                </div>
              </div>
            </div>

            <FaqRychlyKontakt
              className="!absolute !left-0 !top-[4232px]"
              footerBlackrentLogoClassName="!bg-[unset] !bg-[unset]"
              footerVector="/img/vector-49.svg"
              href="tel:+421 910 666 949"
              rychlyKontaktFotkaOperToraClassName="bg-[url(/img/fotka-oper-tora-11.png)]"
              rychlyKontaktLine="/img/line-9-8.svg"
              rychlyKontaktVector="/img/vector-50.svg"
              type="b"
            />
            <div className="flex flex-col w-[1366px] items-center gap-20 absolute top-[3092px] left-[42px]">
              <div className="inline-flex flex-col items-center gap-10 relative flex-[0_0_auto]">
                <div className="inline-flex flex-col items-center gap-6 relative flex-[0_0_auto]">
                  <div className="inline-flex flex-col items-center gap-20 relative flex-[0_0_auto]">
                    <ElementIconsDarkBig
                      ellipse="/img/ellipse-79-2.svg"
                      overlapGroupClassName="bg-[url(/img/ellipse-80-2.svg)]"
                      type="pin"
                      vector="/img/vector-51.svg"
                    />
                    <div className="inline-flex flex-col items-center gap-8 relative flex-[0_0_auto]">
                      <div className="relative w-fit mt-[-1.00px] font-desktop-titulok-40 font-[number:var(--desktop-titulok-40-font-weight)] text-colors-light-yellow-accent-700 text-[length:var(--desktop-titulok-40-font-size)] text-center tracking-[var(--desktop-titulok-40-letter-spacing)] leading-[var(--desktop-titulok-40-line-height)] whitespace-nowrap [font-style:var(--desktop-titulok-40-font-style)]">
                        Kde sa auto nachádza?
                      </div>
                    </div>
                  </div>
                </div>

                <div className="inline-flex flex-col items-center gap-4 relative flex-[0_0_auto]">
                  <div className="relative w-[386px] h-4 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-2xl text-center tracking-[0] leading-6 whitespace-nowrap">
                    Bratislava – Záhorská Bystrica
                  </div>

                  <p className="relative self-stretch h-4 [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm text-center tracking-[0] leading-[30px] whitespace-nowrap">
                    Pobočka Avis cars, Rozmarínova 23 Trenčín
                  </p>
                </div>
              </div>

              <Mapa
                className="!self-stretch !bg-[50%_50%] !bg-cover bg-[url(/img/mapa-1.png)] !w-full"
                property1="a"
              />
              <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-dark-gray-900 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Zobraziť na mape
                </div>

                <Icon16Px113 className="!relative !w-4 !h-4" />
              </div>
            </div>
          </>
        )}

        {screenWidth >= 1728 && (
          <>
            <FaqRychlyKontaktFooter1728
              className="!absolute !left-0 !top-[4210px]"
              footerWrapperBlackrentLogoClassName="bg-[url(/img/vector-43.svg)]"
              footerWrapperVector="/img/vector-42.svg"
              href="tel:+421 910 666 949"
              testDWrapperFotkaOperToraClassName="bg-[url(/img/fotka-oper-tora-11.png)]"
              testDWrapperLine="/img/line-9-8.svg"
              testDWrapperVector="/img/vector-50.svg"
              type="b"
            />
            <div className="inline-flex flex-col items-start gap-10 absolute top-[400px] left-[200px]">
              <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex flex-col w-[762px] items-start gap-10 relative flex-[0_0_auto]">
                  <div className="inline-flex h-4 justify-center gap-2 items-center relative">
                    <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                      Poistenie vozidla
                    </div>
                  </div>

                  <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6">
                    Všetky naše vozidlá sú automaticky poistené. Poskytujeme
                    však možnosti pripoistenia ktoré základné poistenie
                    nepokrýva.
                  </p>
                </div>

                <div className="w-[762px] gap-6 flex items-start relative flex-[0_0_auto]">
                  <div className="flex flex-col items-center relative flex-1 grow rounded-2xl overflow-hidden">
                    <div className="relative self-stretch w-full h-[59px]" />

                    <div className="flex flex-col items-center gap-6 px-6 py-8 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-300 rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-center gap-2 px-2 py-0 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-6 whitespace-nowrap">
                          Základné
                        </div>
                      </div>

                      <img
                        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                        alt="Line"
                        src="/img/line-10-8.svg"
                      />

                      <div className="flex flex-col items-center gap-8 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                          <IconColor
                            className="!flex-[0_0_auto]"
                            type="warring"
                          />
                          <p className="relative self-stretch h-[98px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              V případě poškození auta je pojištění karoserie  v
                              omezeném rozsahu. Zaplatíte až{" "}
                            </span>

                            <span className="font-semibold">10%</span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              {" "}
                              z ceny vozu (spoluúčast).
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                          <IconColor
                            className="!flex-[0_0_auto]"
                            type="warring"
                          />
                          <p className="relative self-stretch h-[76px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              V případě odcizení auta platí omezené krytí.
                              Zaplatíte až{" "}
                            </span>

                            <span className="font-semibold">10%</span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              {" "}
                              z ceny vozu (spoluúčast).
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                          <IconColor
                            className="!flex-[0_0_auto]"
                            type="warring"
                          />
                          <p className="relative self-stretch h-[98px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              Odtah, ztráta klíčů,  a administrativní poplatky{" "}
                            </span>

                            <span className="font-semibold">
                              nejsou součástí pojištění.{" "}
                            </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              Zaplatíte v plné výši.
                              <br />
                            </span>
                          </p>
                        </div>
                      </div>

                      <img
                        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                        alt="Line"
                        src="/img/line-10-8.svg"
                      />

                      <div className="flex items-start justify-center gap-2 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-light-yellow-accent-400 text-sm text-center tracking-[0] leading-5">
                          Už zahrnuté <br />v cene
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center relative flex-1 grow bg-[#6e5af0] rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-center gap-2 px-2 py-6 relative self-stretch w-full h-[59px]">
                      <div className="inline-flex items-center justify-center gap-0.5 relative flex-[0_0_auto] mt-[-6.50px] mb-[-6.50px]">
                        <IconsEmoji2
                          className="!relative !w-6 !h-6"
                          color="url(#pattern0_10955_23868)"
                        />
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                          Najobľúbenejšie
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-6 pt-8 pb-10 px-6 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-300 rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-center gap-2 px-2 py-0 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-6 whitespace-nowrap">
                          Štandardné
                        </div>
                      </div>

                      <img
                        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                        alt="Line"
                        src="/img/line-10-8.svg"
                      />

                      <div className="flex flex-col items-center gap-8 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                          <IconColor
                            className="!flex-[0_0_auto]"
                            type="check-lime"
                          />
                          <p className="relative self-stretch h-[98px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              V případě poškození auta je pojištění karoserie v
                              omezeném rozsahu. Zaplatíte až
                            </span>

                            <span className="font-semibold"> 5%</span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              {" "}
                              z ceny vozu (spoluúčast).
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                          <IconColor
                            className="!flex-[0_0_auto]"
                            type="check-lime"
                          />
                          <p className="relative self-stretch h-[76px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              V případě odcizení auta platí omezené krytí.
                              Zaplatíte až{" "}
                            </span>

                            <span className="font-semibold">5%</span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              {" "}
                              z ceny vozu (spoluúčast).
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col h-[146px] items-center gap-4 relative self-stretch w-full">
                          <IconColor
                            className="!flex-[0_0_auto]"
                            type="check-lime"
                          />
                          <p className="relative self-stretch h-[98px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              Odtah, ztráta klíčů,  a administrativní poplatky{" "}
                            </span>

                            <span className="font-semibold">
                              nejsou součástí pojištění.{" "}
                            </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              Zaplatíte v plné výši.
                              <br />
                            </span>
                          </p>
                        </div>
                      </div>

                      <img
                        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                        alt="Line"
                        src="/img/line-10-8.svg"
                      />

                      <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                        <p className="w-[178px] mt-[-1.00px] font-normal text-colors-light-yellow-accent-100 text-sm text-center relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6">
                          <span className="text-[#a0a0a5]">
                            Cena auta +<br />
                          </span>

                          <span className="font-bold text-[#f0f0f5] text-base">
                            32 €
                          </span>
                        </p>
                      </div>

                      <SecondaryButtons
                        className="!self-stretch !flex !w-full"
                        icon24Px27StyleOverrideClassName="!relative !w-6 !h-6"
                        secondaryBig="secondary"
                        text="Pridať poistenie"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-center relative flex-1 grow rounded-2xl overflow-hidden">
                    <div className="relative self-stretch w-full h-[59px]" />

                    <div className="flex flex-col items-center gap-6 pt-8 pb-10 px-6 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-300 rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-center gap-2 px-2 py-0 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-6 whitespace-nowrap">
                          Kompletné
                        </div>
                      </div>

                      <img
                        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                        alt="Line"
                        src="/img/line-10-8.svg"
                      />

                      <div className="flex flex-col items-center gap-8 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                          <IconColor
                            className="!flex-[0_0_auto]"
                            type="check-green"
                          />
                          <p className="h-[98px] relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                            <span className="font-semibold">
                              Kryje všechny náklady  a poplatky.
                            </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              {" "}
                              Výdaje vám budou v plné výši proplaceny.
                              <br />
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                          <IconColor
                            className="!flex-[0_0_auto]"
                            type="check-green"
                          />
                          <p className="h-[76px] relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                            <span className="font-semibold">
                              Kryje všechny náklady  a poplatky.
                            </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              {" "}
                              Výdaje vám budou v plné výši proplaceny.
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                          <IconColor
                            className="!flex-[0_0_auto]"
                            type="check-green"
                          />
                          <p className="h-[98px] relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                            <span className="font-semibold">
                              Kryje všechny náklady  a poplatky.{" "}
                            </span>

                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
                              Výdaje vám budou v plné výši proplaceny.
                              <br />
                            </span>
                          </p>
                        </div>
                      </div>

                      <img
                        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                        alt="Line"
                        src="/img/line-10-8.svg"
                      />

                      <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                        <p className="w-[178px] mt-[-1.00px] font-normal text-colors-light-yellow-accent-100 text-sm text-center relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6">
                          <span className="text-[#a0a0a5]">
                            Cena auta +<br />
                          </span>

                          <span className="font-bold text-[#f0f0f5] text-base">
                            123 €
                          </span>
                        </p>
                      </div>

                      <div className="bg-colors-red-accent-100 flex h-12 items-center justify-center gap-1.5 pl-5 pr-6 py-3 relative self-stretch w-full rounded-[99px]">
                        <img
                          className="relative w-6 h-6"
                          alt="Icon px"
                          src="/img/icon-24-px-116.png"
                        />

                        <button className="all-[unset] box-border font-medium text-colors-red-accent-300 text-sm relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                          Zrušiť
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <img
                className="object-cover relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                alt="Line"
                src="/img/line-17.svg"
              />

              <div className="flex flex-col items-start gap-8 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex w-[761px] h-10 justify-between items-center relative">
                  <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                    Ďalšie služby
                  </div>

                  <NavigationButtons property1="type-6" />
                </div>

                <div className="w-[762px] gap-6 flex items-start relative flex-[0_0_auto]">
                  <AlIeSluBy
                    className="!flex-1 !grow !w-[unset]"
                    type="al-vodi-defautl"
                    vector="/img/vector-64-2.svg"
                  />
                  <AlIeSluBy
                    className="!flex-1 !grow !w-[unset]"
                    icon={
                      <TypKidCarSeat
                        className="!relative !w-6 !h-6"
                        color="#BEBEC3"
                      />
                    }
                    type="autoseda-ka-selected"
                    vector="/img/vector-64-2.svg"
                  />
                  <AlIeSluBy
                    type="bicykle-defautl"
                    vector="/img/vector-64-2.svg"
                  />
                </div>
              </div>

              <img
                className="object-cover relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                alt="Line"
                src="/img/line-18-2.svg"
              />

              <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex w-[762px] h-4 items-center gap-2 relative">
                  <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                    Osobné údaje
                  </div>
                </div>

                <div className="flex flex-wrap w-[762px] items-center gap-[24px_16px] relative flex-[0_0_auto]">
                  <div className="flex flex-col items-start gap-6 relative flex-1 grow">
                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-14 items-center gap-0.5 pl-4 pr-3.5 py-3 relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                        <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Meno *
                          </div>
                        </div>
                      </div>

                      <div className="flex h-14 items-center gap-0.5 pl-4 pr-3.5 pt-2.5 pb-3.5 relative flex-1 grow rounded-lg border border-solid border-colors-dark-gray-900">
                        <div className="inline-flex flex-col items-start justify-center gap-3 relative flex-[0_0_auto]">
                          <div className="relative w-[67px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-xs tracking-[0] leading-6">
                            Priezvisko *
                          </div>

                          <div className="relative w-[66px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                            Šufliarsky
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-14 items-center gap-0.5 pl-4 pr-3.5 pt-3 pb-3.5 relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                        <div className="inline-flex flex-col items-start gap-3 relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-xs tracking-[0] leading-6 whitespace-nowrap">
                            Telefón *
                          </div>

                          <div className="inline-flex h-2.5 items-center gap-2 relative">
                            <div className="inline-flex items-center gap-1 relative flex-[0_0_auto] mt-[-3.00px] mb-[-3.00px]">
                              <MobilnaPredvolba className="!relative !w-4 !h-4" />
                              <TypeArrowDown className="!relative !w-2 !h-2" />
                            </div>

                            <div className="w-[31px] mt-[-1.00px] font-normal text-colors-white-800 text-sm relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6">
                              +421
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex h-14 items-center gap-0.5 pl-4 pr-3.5 py-3 relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                        <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            E-mail *
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-14 items-center gap-0.5 pl-4 pr-3.5 py-3 relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                        <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Číslo občianského preukazu *
                          </div>
                        </div>
                      </div>

                      <div className="flex h-14 items-center gap-0.5 pl-4 pr-3.5 py-3 relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                        <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Rodné číslo *
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-14 items-center gap-0.5 pl-4 pr-3.5 py-3 relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                        <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Číslo vodičského preukazu *
                          </div>
                        </div>
                      </div>

                      <div className="gap-0.5 pl-4 pr-3.5 pt-2.5 pb-3.5 flex h-14 items-center relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                        <div className="inline-flex flex-col items-start gap-3 relative flex-[0_0_auto]">
                          <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-xs tracking-[0] leading-6 whitespace-nowrap">
                            Platnosť vodičského preukazu od *
                          </p>

                          <div className="relative w-[75px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                            dd.mm.rrrr
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col w-[762px] items-start gap-6 relative flex-[0_0_auto]">
                  <div className="flex h-6 items-center justify-between relative self-stretch w-full rounded-lg">
                    <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        Kontaktné údaje *
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                      <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Pridať firemné údaje
                        </div>
                      </div>

                      <CheckBoxy stav="switch-default" />
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-14 items-center gap-0.5 pl-4 pr-3.5 py-3 relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                        <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Adresa *
                          </div>
                        </div>
                      </div>

                      <div className="flex h-14 items-center gap-0.5 pl-4 pr-3.5 py-3 relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                        <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Mesto *
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex h-14 items-center gap-0.5 pl-4 pr-3.5 py-3 relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                        <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            PSČ *
                          </div>
                        </div>
                      </div>

                      <div className="justify-between pl-4 pr-3.5 py-3 flex h-14 items-center relative flex-1 grow rounded-lg border border-solid border-colors-black-800">
                        <div className="inline-flex flex-col items-start gap-2.5 relative flex-[0_0_auto]">
                          <div className="relative w-[75px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                            Krajina *
                          </div>
                        </div>

                        <Icon16Px109 className="!relative !w-4 !h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col w-[762px] items-start gap-6 relative flex-[0_0_auto]">
                  <div className="flex w-[648px] h-6 items-center gap-2 relative rounded-lg">
                    <div className="flex items-center gap-2 relative flex-1 grow">
                      <div className="relative w-[265px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6">
                        Identifikačné údaje
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="h-14 justify-between p-4 rounded-lg border border-solid border-colors-black-800 flex items-center relative self-stretch w-full">
                      <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                        <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Občianský preukaz – predná strana
                        </p>
                      </div>

                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-light-yellow-accent-100 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Vybrať súbor
                        </div>
                      </div>
                    </div>

                    <div className="h-14 justify-between p-4 rounded-lg border border-solid border-colors-black-800 flex items-center relative self-stretch w-full">
                      <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                        <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Občianský preukaz – zadná strana
                        </p>
                      </div>

                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-light-yellow-accent-100 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Vybrať súbor
                        </div>
                      </div>
                    </div>

                    <div className="h-14 justify-between p-4 rounded-lg border border-solid border-colors-black-800 flex items-center relative self-stretch w-full">
                      <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                        <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Vodičský preukaz – predná strana
                        </p>
                      </div>

                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-light-yellow-accent-100 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Vybrať súbor
                        </div>
                      </div>
                    </div>

                    <div className="h-14 justify-between p-4 rounded-lg border border-solid border-colors-black-800 flex items-center relative self-stretch w-full">
                      <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                        <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Vodičský preukaz – zadná strana
                        </p>
                      </div>

                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-light-yellow-accent-100 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Vybrať súbor
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col w-[762px] items-start relative flex-[0_0_auto]">
                  <div className="flex h-10 items-center pl-2 pr-4 py-4 relative self-stretch w-full rounded-lg">
                    <div className="inline-flex gap-1.5 flex-[0_0_auto] mt-[-8.00px] mb-[-8.00px] items-center relative">
                      <CheckBoxy stav="square-default" />
                      <div className="inline-flex items-center gap-[151px] relative flex-[0_0_auto]">
                        <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          <span className="text-[#f0f0f5]">Súhlasím so </span>

                          <span className="text-[#f0ff98] underline">
                            všeobecnými obchodnými podmienkami
                          </span>

                          <span className="text-[#f0f0f5]"> *</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex h-10 items-center gap-2 pl-2 pr-4 py-4 relative self-stretch w-full rounded-lg">
                    <div className="flex gap-1.5 flex-1 grow mt-[-8.00px] mb-[-8.00px] items-center relative">
                      <CheckBoxy stav="square-default" />
                      <div className="flex items-center gap-[151px] relative flex-1 grow">
                        <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          <span className="text-[#f0f0f5]">Súhlasím so </span>

                          <span className="text-[#f0ff98] underline">
                            spracovaním osobných údajov
                          </span>

                          <span className="text-[#f0f0f5]"> *</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex h-10 items-center gap-2 pl-2 pr-4 py-4 relative self-stretch w-full rounded-lg">
                    <div className="flex gap-1.5 flex-1 grow mt-[-8.00px] mb-[-8.00px] items-center relative">
                      <CheckBoxy stav="square-default" />
                      <div className="flex items-center gap-[151px] relative flex-1 grow">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Chcem pridať poznámku
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col w-[536px] items-center gap-6 pt-0 pb-8 px-0 absolute top-[400px] left-[993px] bg-colors-black-200 rounded-3xl overflow-hidden border-2 border-solid border-colors-black-400">
              <div className="flex flex-col items-start gap-6 pt-6 pb-8 px-6 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-400 rounded-3xl overflow-hidden">
                <div className="flex h-[216px] items-start justify-around gap-[76px] p-6 relative self-stretch w-full bg-colors-black-200 rounded-2xl overflow-hidden">
                  <div className="flex items-start gap-4 relative flex-1 self-stretch grow">
                    <div className="flex flex-col items-start justify-between relative flex-1 self-stretch grow">
                      <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="relative self-stretch mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-6">
                          Porsche Panamera Turbo
                        </div>

                        <div className="flex flex-wrap items-start gap-[16px_16px] relative self-stretch w-full flex-[0_0_auto]">
                          <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                            <div className="inline-flex flex-wrap items-center gap-[0px_0px] relative flex-[0_0_auto]">
                              <Icon16Px27 className="!relative !w-4 !h-4" />
                              <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-xs tracking-[0] leading-6 whitespace-nowrap">
                                123 kW
                              </div>
                            </div>

                            <div className="inline-flex flex-wrap items-center gap-[4px_4px] relative flex-[0_0_auto]">
                              <Icon16Px28 className="!relative !w-4 !h-4" />
                              <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-xs tracking-[0] leading-6 whitespace-nowrap">
                                Automat
                              </div>
                            </div>
                          </div>

                          <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                            <div className="inline-flex flex-wrap items-center gap-[4px_4px] relative flex-[0_0_auto]">
                              <Icon16Px29 className="!relative !w-4 !h-4" />
                              <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-xs tracking-[0] leading-6 whitespace-nowrap">
                                Benzín
                              </div>
                            </div>

                            <div className="inline-flex flex-wrap items-center gap-[4px_4px] relative flex-[0_0_auto]">
                              <Icon16Px30 className="!relative !w-4 !h-4" />
                              <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-xs tracking-[0] leading-6 whitespace-nowrap">
                                Predný
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="inline-flex items-start gap-1.5 relative flex-[0_0_auto]">
                        <BlackrentLogo className="!h-4 bg-[url(/img/vector-31.svg)] !relative !w-[107.2px]" />
                        <Icon16Px31 className="!relative !w-4 !h-4" />
                      </div>
                    </div>

                    <div className="relative flex-1 self-stretch grow rounded-lg bg-[url(/img/frame-170.png)] bg-cover bg-[50%_50%]" />
                  </div>
                </div>

                <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                      <div className="flex gap-1 flex-1 grow items-center relative">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Trenčín
                        </div>

                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                          {""}
                        </div>
                      </div>

                      <Icon16Px109 className="!relative !w-5 !h-5" />
                    </div>

                    <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                      <div className="flex gap-1 flex-1 grow items-center relative">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Bratislava
                        </div>

                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                          {""}
                        </div>
                      </div>

                      <Icon16Px109 className="!relative !w-5 !h-5" />
                    </div>
                  </div>

                  <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                      <div className="flex gap-1 flex-1 grow items-center relative">
                        <div className="text-colors-white-800 text-sm relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium tracking-[0] leading-6 whitespace-nowrap">
                          8. 11. 2023
                        </div>

                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                          {""}
                        </div>
                      </div>

                      <Icon16Px109 className="!relative !w-5 !h-5" />
                    </div>

                    <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                      <div className="flex gap-1 flex-1 grow items-center relative">
                        <div className="text-colors-white-800 text-sm relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium tracking-[0] leading-6 whitespace-nowrap">
                          10. 11. 2023
                        </div>

                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                          {""}
                        </div>
                      </div>

                      <Icon16Px109 className="!relative !w-5 !h-5" />
                    </div>
                  </div>

                  <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                      <div className="flex gap-1 flex-1 grow items-center relative">
                        <div className="w-fit mt-[-1.00px] font-medium text-colors-white-800 text-sm whitespace-nowrap relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6">
                          14:00
                        </div>

                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                          {""}
                        </div>
                      </div>

                      <Icon16Px109 className="!relative !w-5 !h-5" />
                    </div>

                    <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                      <div className="flex gap-1 flex-1 grow items-center relative">
                        <div className="w-fit mt-[-1.00px] font-medium text-colors-white-800 text-sm whitespace-nowrap relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6">
                          18:00
                        </div>

                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                          {""}
                        </div>
                      </div>

                      <Icon16Px109 className="!relative !w-5 !h-5" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full">
                      <div className="flex justify-between flex-1 grow mt-[-5.50px] mb-[-5.50px] items-center relative">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                          Počet povolených km
                        </div>

                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                          1700 km
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col h-8 items-start justify-around gap-2 p-4 relative self-stretch w-full">
                      <div className="flex justify-between self-stretch w-full flex-[0_0_auto] mt-[-5.50px] mb-[-5.50px] items-center relative">
                        <div className="w-fit mt-[-1.00px] font-semibold text-colors-white-800 text-base whitespace-nowrap relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6">
                          Cena prenájmu
                        </div>

                        <div className="w-fit mt-[-1.00px] font-semibold text-colors-white-800 text-base whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6">
                          {""}
                        </div>

                        <div className="mt-[-1.00px] text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 tracking-[0] leading-6 whitespace-nowrap">
                          890 €
                        </div>
                      </div>
                    </div>

                    <div className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full">
                      <div className="flex justify-between flex-1 grow mt-[-5.50px] mb-[-5.50px] items-center relative">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                          Poistenie Kompletné
                        </div>

                        <div className="w-fit mt-[-1.00px] font-semibold text-colors-white-800 text-base whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6">
                          {""}
                        </div>

                        <div className="mt-[-1.00px] text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 tracking-[0] leading-6 whitespace-nowrap">
                          123 €
                        </div>
                      </div>
                    </div>

                    <div className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full">
                      <div className="flex justify-between flex-1 grow mt-[-5.50px] mb-[-5.50px] items-center relative">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                          Ďalšie služby
                        </div>

                        <div className="w-fit mt-[-1.00px] font-semibold text-colors-white-800 text-base whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6">
                          {""}
                        </div>

                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                          6 €
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-4 p-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                    <div className="flex items-center gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                      <Icon24Px27
                        className="!relative !w-4 !h-4"
                        color="#D7FF14"
                      />
                      <div className="flex justify-between flex-1 grow items-center relative">
                        <div className="relative w-fit mt-[-0.50px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Mám promokód
                        </div>

                        <div className="w-fit mt-[-1.00px] font-semibold text-colors-white-800 text-base whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6">
                          {""}
                        </div>

                        <div className="w-fit mt-[-1.00px] font-semibold text-colors-green-accent-500 text-base whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6">
                          {""}
                        </div>

                        <div className="relative w-fit mt-[-0.50px] [font-family:'Poppins',Helvetica] font-semibold text-colors-green-accent-500 text-sm tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                          -20 €
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex h-8 items-center justify-between px-4 py-0 relative self-stretch w-full">
                      <div className="flex items-center gap-2 relative flex-1 grow">
                        <p className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                          <span className="font-semibold">Depozit</span>

                          <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                            {" "}
                            (vratná záloha)
                          </span>
                        </p>

                        <Icon16Px87 className="!relative !w-4 !h-4" />
                      </div>

                      <div className="text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 tracking-[0] leading-6 whitespace-nowrap">
                        1000 €
                      </div>
                    </div>

                    <div className="flex h-8 items-center justify-around gap-2 pl-4 pr-0 py-0 relative self-stretch w-full">
                      <div className="flex items-center gap-1.5 relative flex-1 grow">
                        <CheckBoxy stav="radio-selected" />
                        <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6">
                          Slovensko, Česko, Rakúsko
                        </div>
                      </div>
                    </div>

                    <div className="flex h-8 items-center justify-around gap-2 pl-4 pr-0 py-0 relative self-stretch w-full">
                      <div className="flex items-center gap-1.5 relative flex-1 grow">
                        <CheckBoxy24_1 className="!relative !w-6 !h-6" />
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

                    <div className="flex h-8 items-center justify-around gap-2 pl-4 pr-0 py-0 relative self-stretch w-full">
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

                    <div className="flex h-8 items-center justify-around gap-2 pl-4 pr-0 py-0 relative self-stretch w-full">
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

              <div className="flex flex-col items-center gap-4 px-8 py-0 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex h-10 justify-between px-2 py-0 self-stretch w-full items-center relative">
                  <div className="w-fit font-semibold text-colors-white-800 text-2xl whitespace-nowrap relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6">
                    Cena
                  </div>

                  <div className="inline-flex flex-col items-end gap-3 relative flex-[0_0_auto]">
                    <div className="mt-[-1.00px] text-2xl text-right relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 tracking-[0] leading-6 whitespace-nowrap">
                      1208 €
                    </div>

                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-dark-gray-900 text-xs text-right tracking-[0] leading-6 whitespace-nowrap">
                      vrátane DPH
                    </div>
                  </div>
                </div>

                <img
                  className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
                  alt="Line"
                  src="/img/line-18.svg"
                />

                <div className="flex flex-col items-start gap-2 pl-2 pr-0 py-0 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="h-8 gap-2 flex items-center relative self-stretch w-full">
                    <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        Možnosť platby
                      </div>
                    </div>
                  </div>

                  <div className="flex items-end gap-6 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col items-start gap-2 relative flex-1 grow">
                      <div className="h-8 gap-2 flex items-center relative self-stretch w-full">
                        <div className="flex w-[77px] items-center gap-1.5 relative">
                          <CheckBoxy stav="radio-default" />
                          <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6">
                            Kartou
                          </div>
                        </div>
                      </div>

                      <div className="h-8 gap-2 flex items-center relative self-stretch w-full">
                        <div className="flex w-[181px] items-center gap-1.5 relative">
                          <CheckBoxy stav="radio-default" />
                          <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6">
                            Hotovosť (na mieste)
                          </div>
                        </div>
                      </div>
                    </div>

                    <PrimaryButtons
                      className="!flex-[0_0_auto]"
                      override={
                        <Icon24Px69
                          className="!relative !w-6 !h-6"
                          color="#141900"
                        />
                      }
                      text="Potvrdiť"
                      tlacitkoNaTmavem="normal"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col w-[1664px] items-center gap-20 absolute top-[3070px] left-8">
              <div className="inline-flex flex-col items-center gap-10 relative flex-[0_0_auto]">
                <div className="inline-flex flex-col items-center gap-6 relative flex-[0_0_auto]">
                  <div className="inline-flex flex-col items-center gap-20 relative flex-[0_0_auto]">
                    <ElementIconsDarkBig
                      ellipse="/img/ellipse-79-1.svg"
                      overlapGroupClassName="bg-[url(/img/ellipse-80-1.svg)]"
                      type="pin"
                      vector="/img/vector-46.svg"
                    />
                    <div className="inline-flex flex-col items-center gap-8 relative flex-[0_0_auto]">
                      <div className="relative w-fit mt-[-1.00px] font-desktop-titulok-40 font-[number:var(--desktop-titulok-40-font-weight)] text-colors-light-yellow-accent-700 text-[length:var(--desktop-titulok-40-font-size)] text-center tracking-[var(--desktop-titulok-40-letter-spacing)] leading-[var(--desktop-titulok-40-line-height)] whitespace-nowrap [font-style:var(--desktop-titulok-40-font-style)]">
                        Kde sa auto nachádza?
                      </div>
                    </div>
                  </div>
                </div>

                <div className="inline-flex flex-col items-center gap-4 relative flex-[0_0_auto]">
                  <div className="relative w-[386px] h-4 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-2xl text-center tracking-[0] leading-6 whitespace-nowrap">
                    Bratislava – Záhorská Bystrica
                  </div>

                  <p className="relative self-stretch h-4 [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm text-center tracking-[0] leading-[30px] whitespace-nowrap">
                    Pobočka Avis cars, Rozmarínova 23 Trenčín
                  </p>
                </div>
              </div>

              <Mapa
                className="!self-stretch !bg-[50%_50%] !bg-cover bg-[url(/img/mapa-1.png)] !w-full"
                property1="a"
              />
              <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-dark-gray-900 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Zobraziť na mape
                </div>

                <Icon16Px113 className="!relative !w-4 !h-4" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
