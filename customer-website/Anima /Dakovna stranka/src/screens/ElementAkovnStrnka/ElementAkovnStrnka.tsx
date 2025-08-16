import React from "react";
import { useWindowWidth } from "../../breakpoints";
import { BlackrentLogo } from "../../components/BlackrentLogo";
import { ElementIconsDarkBig } from "../../components/ElementIconsDarkBig";
import { ElementIkonyCheck } from "../../components/ElementIkonyCheck";
import { FaqRychlyKontakt } from "../../components/FaqRychlyKontakt";
import { FaqRychlyKontaktFooter1728 } from "../../components/FaqRychlyKontaktFooter1728";
import { FooterTablet } from "../../components/FooterTablet";
import { Mapa } from "../../components/Mapa";
import { Menu } from "../../components/Menu";
import { Menu1 } from "../../components/Menu1";
import { TypeDefaultWrapper } from "../../components/TypeDefaultWrapper";
import { Icon16Px20 } from "../../icons/Icon16Px20";
import { Icon16Px30 } from "../../icons/Icon16Px30";
import { Icon16Px31 } from "../../icons/Icon16Px31";
import { Icon16Px32 } from "../../icons/Icon16Px32";
import { Icon16Px33 } from "../../icons/Icon16Px33";
import { Icon24Px40 } from "../../icons/Icon24Px40";
import { Icon24Px73 } from "../../icons/Icon24Px73";
import { Ikony25_19 } from "../../icons/Ikony25_19";
import { Ikony25_21 } from "../../icons/Ikony25_21";
import { Ikony25_22 } from "../../icons/Ikony25_22";
import { Ikony25_23 } from "../../icons/Ikony25_23";
import { TypTime } from "../../icons/TypTime";
import { DivWrapper } from "./sections/DivWrapper";
import { FooterMobile } from "./sections/FooterMobile";
import { Frame } from "./sections/Frame";
import { FrameWrapper } from "./sections/FrameWrapper";

export const ElementAkovnStrnka = (): JSX.Element => {
  const screenWidth = useWindowWidth();

  return (
    <div
      className="w-screen grid [align-items:start] bg-[#05050a] justify-items-center"
      data-model-id="4136:9111"
    >
      <div
        className={`bg-colors-black-100 relative ${screenWidth < 744 ? "w-[360px]" : (screenWidth >= 744 && screenWidth < 1440) ? "w-[744px]" : screenWidth >= 1440 && screenWidth < 1728 ? "w-[1440px]" : screenWidth >= 1728 ? "w-[1728px]" : ""} ${screenWidth < 744 ? "h-[3690px]" : (screenWidth >= 744 && screenWidth < 1440) ? "h-[3130px]" : screenWidth >= 1440 && screenWidth < 1728 ? "h-[3755px]" : screenWidth >= 1728 ? "h-[3777px]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "overflow-hidden" : ""}`}
      >
        {screenWidth < 744 && (
          <>
            <Frame />
            <FrameWrapper />
            <Menu className="!absolute !left-0 !top-0" type="default" />
            <DivWrapper />
            <FooterMobile />
          </>
        )}

        {screenWidth >= 744 && screenWidth < 1440 && (
          <TypeDefaultWrapper
            className="!absolute !left-0 !top-0"
            type="default"
          />
        )}

        {screenWidth >= 1440 && screenWidth < 1728 && (
          <>
            <Menu1
              className="!h-24 !absolute !left-0 !w-[1440px] !top-0"
              sekcieVMenuBlackDivClassName="!text-colors-ligh-gray-200"
              sekcieVMenuBlackDivClassName1="!text-colors-ligh-gray-200"
              sekcieVMenuBlackDivClassName2="!text-colors-ligh-gray-200"
              sekcieVMenuBlackDivClassNameOverride="!text-colors-ligh-gray-200"
              storeDivClassName="!text-colors-ligh-gray-200"
              type="default"
            />
            <FaqRychlyKontakt
              className="!absolute !left-0 !top-[2843px]"
              footerBlackrentLogoClassName="bg-[url(/img/vector-38.svg)]"
              footerVector="/img/vector-33.svg"
              type="c"
            />
          </>
        )}

        {((screenWidth >= 1440 && screenWidth < 1728) ||
          screenWidth >= 1728 ||
          (screenWidth >= 744 && screenWidth < 1440)) && (
          <div
            className={`inline-flex flex-col items-center absolute ${screenWidth >= 744 && screenWidth < 1440 ? "left-[86px]" : (screenWidth >= 1728) ? "left-[575px]" : screenWidth >= 1440 && screenWidth < 1728 ? "left-[432px]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "top-[114px]" : ((screenWidth >= 1440 && screenWidth < 1728) || screenWidth >= 1728) ? "top-[168px]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "gap-16" : ((screenWidth >= 1440 && screenWidth < 1728) || screenWidth >= 1728) ? "gap-20" : ""}`}
          >
            <ElementIkonyCheck
              className="!w-[92.63px] !relative"
              ellipse={
                screenWidth >= 744 && screenWidth < 1440
                  ? "/img/ellipse-1-3.svg"
                  : screenWidth >= 1728
                    ? "/img/ellipse-1-5.svg"
                    : screenWidth >= 1440 && screenWidth < 1728
                      ? "/img/ellipse-1-4.svg"
                      : "/img/ellipse-1-3.svg"
              }
              overlapGroupClassName={
                screenWidth >= 744 && screenWidth < 1440
                  ? "bg-[url(/img/union-8.svg)]"
                  : screenWidth >= 1728
                    ? "bg-[url(/img/union-13.svg)]"
                    : screenWidth >= 1440 && screenWidth < 1728
                      ? "bg-[url(/img/union-11.svg)]"
                      : undefined
              }
              union={
                screenWidth >= 744 && screenWidth < 1440
                  ? "/img/union-9.svg"
                  : screenWidth >= 1728
                    ? "/img/union-14.svg"
                    : screenWidth >= 1440 && screenWidth < 1728
                      ? "/img/union-12.svg"
                      : "/img/union-9.svg"
              }
            />
            <div
              className={`inline-flex flex-col items-center flex-[0_0_auto] relative ${screenWidth >= 744 && screenWidth < 1440 ? "gap-8" : ((screenWidth >= 1440 && screenWidth < 1728) || screenWidth >= 1728) ? "gap-10" : ""}`}
            >
              <div className="font-desktop-titulok-40 w-fit mt-[-1.00px] tracking-[var(--desktop-titulok-40-letter-spacing)] text-[length:var(--desktop-titulok-40-font-size)] [font-style:var(--desktop-titulok-40-font-style)] text-colors-light-yellow-accent-700 relative font-[number:var(--desktop-titulok-40-font-weight)] whitespace-nowrap leading-[var(--desktop-titulok-40-line-height)]">
                Ďakujeme za objednávku!
              </div>

              <div
                className={`relative ${screenWidth >= 744 && screenWidth < 1440 ? "[font-family:'Poppins',Helvetica]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "w-fit" : ""} ${(screenWidth >= 1440 && screenWidth < 1728) || screenWidth >= 1728 ? "inline-flex" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "tracking-[0]" : ""} ${(screenWidth >= 1440 && screenWidth < 1728) || screenWidth >= 1728 ? "flex-col" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "text-base" : ""} ${(screenWidth >= 1440 && screenWidth < 1728) || screenWidth >= 1728 ? "items-center" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "text-colors-white-800" : ""} ${(screenWidth >= 1440 && screenWidth < 1728) || screenWidth >= 1728 ? "gap-4" : ""} ${(screenWidth >= 1440 && screenWidth < 1728) || screenWidth >= 1728 ? "flex-[0_0_auto]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "font-normal" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "text-center" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "whitespace-nowrap" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "leading-6" : ""}`}
              >
                {screenWidth >= 744 && screenWidth < 1440 && (
                  <>Číslo objednávky: 24-203-1667</>
                )}

                {((screenWidth >= 1440 && screenWidth < 1728) ||
                  screenWidth >= 1728) && (
                  <>
                    <p className="[font-family:'Poppins',Helvetica] w-fit mt-[-1.00px] tracking-[0] text-base text-colors-white-800 font-semibold text-center whitespace-nowrap leading-6 relative">
                      Vašu objednávku 242031667 sme prijali.
                    </p>

                    <p className="[font-family:'Poppins',Helvetica] w-[429px] tracking-[0] text-sm text-colors-ligh-gray-800 h-4 font-normal text-center whitespace-nowrap leading-6 relative">
                      Na e-mail Vám bude zaslané potvrdenie a súhrn objednávky.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {screenWidth >= 1440 && screenWidth < 1728 && (
          <div className="flex flex-col w-[1366px] items-center gap-20 absolute top-[1703px] left-[42px]">
            <div className="inline-flex flex-col items-center gap-10 relative flex-[0_0_auto]">
              <div className="inline-flex flex-col items-center gap-6 relative flex-[0_0_auto]">
                <div className="inline-flex flex-col items-center gap-20 relative flex-[0_0_auto]">
                  <ElementIconsDarkBig
                    ellipse="/img/ellipse-79-3.svg"
                    overlapGroupClassName="bg-[url(/img/ellipse-80-3.svg)]"
                    type="pin"
                    vector="/img/vector-35.svg"
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

                <p className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm text-center tracking-[0] leading-[30px] whitespace-nowrap">
                  Pobočka Avis cars, Rozmarínova 23 Trenčín
                </p>
              </div>
            </div>

            <Mapa
              className="!self-stretch !bg-[50%_50%] !bg-cover bg-[url(/img/mapa-3.png)] !w-full"
              property1="a"
            />
            <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
              <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-dark-gray-900 text-sm tracking-[0] leading-6 whitespace-nowrap">
                Zobraziť na mape
              </div>

              <Icon16Px20 className="!relative !w-4 !h-4" />
            </div>
          </div>
        )}

        {((screenWidth >= 1440 && screenWidth < 1728) ||
          (screenWidth >= 744 && screenWidth < 1440)) && (
          <div
            className={`flex flex-col items-center gap-6 pt-6 pb-8 px-6 rounded-[32px] bg-colors-black-300 absolute ${screenWidth >= 1440 && screenWidth < 1728 ? "bg-[linear-gradient(180deg,rgba(20,20,25,1)_0%,rgba(10,10,15,1)_100%),linear-gradient(0deg,rgba(15,15,20,1)_0%,rgba(15,15,20,1)_100%)]" : (screenWidth >= 744 && screenWidth < 1440) ? "bg-[linear-gradient(0deg,rgba(15,15,20,1)_0%,rgba(15,15,20,1)_100%)]" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "w-[736px]" : (screenWidth >= 744 && screenWidth < 1440) ? "w-[680px]" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "left-[352px]" : (screenWidth >= 744 && screenWidth < 1440) ? "left-8" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "top-[567px]" : (screenWidth >= 744 && screenWidth < 1440) ? "top-[434px]" : ""}`}
          >
            <div className="w-full flex self-stretch items-end bg-cover gap-6 p-6 h-96 overflow-hidden bg-[url(/img/frame-521-3.png)] rounded-2xl justify-around bg-[50%_50%] bg-colors-black-100 relative">
              <div className="flex items-end grow flex-1 justify-between relative">
                <div className="inline-flex flex-col items-start gap-4 flex-[0_0_auto] relative">
                  <div className="[font-family:'SF_Pro-ExpandedSemibold',Helvetica] w-[220px] mt-[-1.00px] tracking-[0] text-[28px] text-colors-light-yellow-accent-700 h-5 font-normal leading-9 whitespace-nowrap relative">
                    Názov Vozidla
                  </div>

                  <div className="inline-flex flex-wrap items-start gap-[8px_8px] flex-[0_0_auto] relative">
                    <div className="inline-flex flex-wrap items-center gap-[0px_0px] flex-[0_0_auto] relative">
                      <Icon16Px30 className="!relative !w-4 !h-4" />
                      <div className="[font-family:'Poppins',Helvetica] w-fit tracking-[0] text-sm text-colors-white-800 font-normal leading-6 whitespace-nowrap relative">
                        123 kW
                      </div>
                    </div>

                    <div className="inline-flex flex-wrap items-center gap-[4px_4px] flex-[0_0_auto] relative">
                      <Icon16Px31 className="!relative !w-4 !h-4" />
                      <div className="[font-family:'Poppins',Helvetica] w-fit tracking-[0] text-sm text-colors-white-800 font-normal leading-6 whitespace-nowrap relative">
                        Benzín
                      </div>
                    </div>

                    <div className="inline-flex flex-wrap items-center gap-[4px_4px] flex-[0_0_auto] relative">
                      <Icon16Px32 className="!relative !w-4 !h-4" />
                      <div className="[font-family:'Poppins',Helvetica] w-fit tracking-[0] text-sm text-colors-white-800 font-normal leading-6 whitespace-nowrap relative">
                        Automat
                      </div>
                    </div>

                    <div className="inline-flex flex-wrap items-center gap-[4px_4px] flex-[0_0_auto] relative">
                      <Icon16Px33 className="!relative !w-4 !h-4" />
                      <div className="[font-family:'Poppins',Helvetica] w-fit tracking-[0] text-sm text-colors-white-800 font-normal leading-6 whitespace-nowrap relative">
                        Predný
                      </div>
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 flex-[0_0_auto] h-4 relative">
                  <BlackrentLogo className="!h-4 bg-[url(/img/vector-41.svg)] !relative !w-[104px]" />
                </div>
              </div>
            </div>

            <div className="w-full flex self-stretch flex-col items-center gap-10 flex-[0_0_auto] relative">
              <div className="w-full flex self-stretch flex-col items-start gap-4 flex-[0_0_auto] px-6 py-0 relative">
                <div className="w-full flex self-stretch items-start gap-6 flex-[0_0_auto] relative">
                  <div className="flex flex-col items-start grow flex-1 relative">
                    <div className="w-full flex self-stretch items-center px-0 py-4 h-10 rounded-lg relative">
                      <div className="flex mt-[-1.00px] items-center grow gap-1 flex-1 mb-[-1.00px] relative">
                        <div className="[font-family:'Poppins',Helvetica] w-[186px] mt-[-1.00px] tracking-[0] text-sm text-colors-ligh-gray-200 font-semibold leading-6 relative">
                          Miesto vyzdvihnutia
                        </div>

                        <div className="[font-family:'Poppins',Helvetica] w-fit [display:-webkit-box] mt-[-1.00px] [-webkit-line-clamp:1] text-sm tracking-[0] text-colors-ligh-gray-200 font-normal overflow-hidden [-webkit-box-orient:vertical] whitespace-nowrap text-ellipsis leading-6 relative">
                          {""}
                        </div>
                      </div>
                    </div>

                    <div className="border border-solid border-colors-black-800 w-full flex self-stretch items-center gap-1.5 p-4 h-12 rounded-lg relative">
                      <Ikony25_19
                        className="!mt-[-4.00px] !mb-[-4.00px] !relative !w-6 !h-6"
                        color="#A0A0A5"
                      />
                      <div className="flex items-center grow gap-1 flex-1 relative">
                        <div className="[font-family:'Poppins',Helvetica] w-fit [display:-webkit-box] mt-[-1.00px] [-webkit-line-clamp:1] text-sm tracking-[0] text-colors-ligh-gray-200 font-normal overflow-hidden [-webkit-box-orient:vertical] whitespace-nowrap text-ellipsis leading-6 relative">
                          {""}
                        </div>

                        <div className="[font-family:'Poppins',Helvetica] mt-[-1.00px] tracking-[0] text-sm flex-1 text-colors-white-800 font-normal leading-6 relative">
                          Bánska Bystrica
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start grow flex-1 relative">
                    <div className="w-full flex self-stretch items-center px-0 py-4 h-10 rounded-lg relative">
                      <div className="flex mt-[-1.00px] items-center grow gap-1 flex-1 mb-[-1.00px] relative">
                        <div className="[font-family:'Poppins',Helvetica] mt-[-1.00px] tracking-[0] text-sm flex-1 text-colors-ligh-gray-200 font-semibold leading-6 relative">
                          Miesto vrátenia
                        </div>

                        <div className="[display:-webkit-box] mt-[-1.00px] [-webkit-line-clamp:1] text-colors-ligh-gray-200 [-webkit-box-orient:vertical] leading-6 [font-family:'Poppins',Helvetica] relative w-fit mr-[-1.00px] font-normal whitespace-nowrap text-sm tracking-[0] overflow-hidden text-ellipsis">
                          {""}
                        </div>
                      </div>
                    </div>

                    <div className="border border-solid border-colors-black-800 w-full flex self-stretch items-center gap-1.5 p-4 h-12 rounded-lg relative">
                      <Ikony25_19
                        className="!mt-[-4.00px] !mb-[-4.00px] !relative !w-6 !h-6"
                        color="#A0A0A5"
                      />
                      <div className="[font-family:'Poppins',Helvetica] [display:-webkit-box] tracking-[0] [-webkit-line-clamp:1] text-sm flex-1 text-colors-white-800 font-normal overflow-hidden leading-6 [-webkit-box-orient:vertical] text-ellipsis relative">
                        Bratislava
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full flex self-stretch items-start gap-6 flex-[0_0_auto] relative">
                  <div className="flex self-stretch flex-col items-start grow flex-1 relative">
                    <div className="w-full flex self-stretch items-center px-0 py-4 h-10 rounded-lg relative">
                      <div className="flex mt-[-1.00px] items-center grow gap-1 flex-1 mb-[-1.00px] relative">
                        <div className="[font-family:'Poppins',Helvetica] w-[186px] mt-[-1.00px] tracking-[0] text-sm text-colors-ligh-gray-200 font-semibold leading-6 relative">
                          Dátum a čas vyzdvihnutia
                        </div>

                        <div className="[font-family:'Poppins',Helvetica] w-fit [display:-webkit-box] mt-[-1.00px] [-webkit-line-clamp:1] text-sm tracking-[0] text-colors-ligh-gray-200 font-normal overflow-hidden [-webkit-box-orient:vertical] whitespace-nowrap text-ellipsis leading-6 relative">
                          {""}
                        </div>
                      </div>
                    </div>

                    <div className="border border-solid border-colors-black-800 w-full flex self-stretch items-center gap-4 p-4 h-12 rounded-lg relative">
                      <div className="inline-flex mt-[-4.00px] items-center gap-1.5 flex-[0_0_auto] mb-[-4.00px] relative">
                        <Ikony25_21
                          className="!relative !w-6 !h-6"
                          color="#A0A0A5"
                        />
                        <div className="[font-family:'Poppins',Helvetica] w-fit tracking-[0] text-sm text-colors-white-800 font-normal leading-6 whitespace-nowrap relative">
                          8. 2024
                        </div>
                      </div>

                      <img
                        className="w-px mt-[-4.50px] object-cover h-[25px] mb-[-4.50px] relative"
                        alt="Line"
                        src="/img/line-3-7.svg"
                      />

                      <div className="inline-flex mt-[-4.00px] items-center gap-1.5 flex-[0_0_auto] mb-[-4.00px] relative">
                        <TypTime
                          className="!relative !w-6 !h-6"
                          color="#A0A0A5"
                        />
                        <div className="[font-family:'Poppins',Helvetica] w-fit tracking-[0] text-sm text-colors-white-800 font-normal leading-6 whitespace-nowrap relative">
                          16:00
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex self-stretch flex-col items-start grow flex-1 relative">
                    <div className="w-full flex self-stretch items-center px-0 py-4 h-10 rounded-lg relative">
                      <div className="flex mt-[-1.00px] items-center grow gap-1 flex-1 mb-[-1.00px] relative">
                        <div className="[font-family:'Poppins',Helvetica] mt-[-1.00px] tracking-[0] text-sm flex-1 text-colors-ligh-gray-200 font-semibold leading-6 relative">
                          Dátum a čas vrátenia
                        </div>

                        <div className="[display:-webkit-box] mt-[-1.00px] [-webkit-line-clamp:1] text-colors-ligh-gray-200 [-webkit-box-orient:vertical] leading-6 [font-family:'Poppins',Helvetica] relative w-fit mr-[-1.00px] font-normal whitespace-nowrap text-sm tracking-[0] overflow-hidden text-ellipsis">
                          {""}
                        </div>
                      </div>
                    </div>

                    <div className="border border-solid border-colors-black-800 w-full flex self-stretch items-center gap-4 p-4 h-12 rounded-lg relative">
                      <div className="inline-flex mt-[-4.00px] items-center gap-1.5 flex-[0_0_auto] mb-[-4.00px] relative">
                        <Ikony25_21
                          className="!relative !w-6 !h-6"
                          color="#A0A0A5"
                        />
                        <div className="[font-family:'Poppins',Helvetica] w-fit tracking-[0] text-sm text-colors-white-800 font-normal leading-6 whitespace-nowrap relative">
                          8. 2024
                        </div>
                      </div>

                      <img
                        className="w-px mt-[-4.50px] object-cover h-[25px] mb-[-4.50px] relative"
                        alt="Line"
                        src="/img/line-3-7.svg"
                      />

                      <div className="inline-flex mt-[-4.00px] items-center gap-1.5 flex-[0_0_auto] mb-[-4.00px] relative">
                        <TypTime
                          className="!relative !w-6 !h-6"
                          color="#A0A0A5"
                        />
                        <div className="[font-family:'Poppins',Helvetica] w-fit tracking-[0] text-sm text-colors-white-800 font-normal leading-6 whitespace-nowrap relative">
                          12:00
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full flex self-stretch items-start gap-6 flex-[0_0_auto] relative">
                  <div className="flex self-stretch flex-col items-start grow flex-1 relative">
                    <div className="w-full flex self-stretch items-center px-0 py-4 h-10 rounded-lg relative">
                      <div className="flex mt-[-1.00px] items-center grow gap-1 flex-1 mb-[-1.00px] relative">
                        <div className="[font-family:'Poppins',Helvetica] mt-[-1.00px] tracking-[0] text-sm flex-1 text-colors-ligh-gray-200 font-semibold leading-6 relative">
                          Poistenie
                        </div>

                        <div className="[display:-webkit-box] mt-[-1.00px] [-webkit-line-clamp:1] text-colors-ligh-gray-200 [-webkit-box-orient:vertical] leading-6 [font-family:'Poppins',Helvetica] relative w-fit mr-[-1.00px] font-normal whitespace-nowrap text-sm tracking-[0] overflow-hidden text-ellipsis">
                          {""}
                        </div>
                      </div>
                    </div>

                    <div className="border border-solid border-colors-black-800 w-full flex self-stretch items-center gap-1.5 p-4 h-12 rounded-lg relative">
                      <Ikony25_22
                        className="!mt-[-4.00px] !mb-[-4.00px] !relative !w-6 !h-6"
                        color="#A0A0A5"
                      />
                      <div className="flex items-center grow gap-1 flex-1 relative">
                        <div className="[font-family:'Poppins',Helvetica] w-fit [display:-webkit-box] mt-[-1.00px] [-webkit-line-clamp:1] text-sm tracking-[0] text-colors-ligh-gray-200 font-normal overflow-hidden [-webkit-box-orient:vertical] whitespace-nowrap text-ellipsis leading-6 relative">
                          {""}
                        </div>

                        <div className="[font-family:'Poppins',Helvetica] mt-[-1.00px] tracking-[0] text-sm flex-1 text-colors-white-800 font-normal leading-6 relative">
                          Základné
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex self-stretch flex-col items-start grow flex-1 relative">
                    <div className="w-full flex self-stretch items-center px-0 py-4 h-10 rounded-lg relative">
                      <div className="flex mt-[-1.00px] items-center grow gap-1 flex-1 mb-[-1.00px] relative">
                        <div className="[font-family:'Poppins',Helvetica] mt-[-1.00px] tracking-[0] text-sm flex-1 text-colors-ligh-gray-200 font-semibold leading-6 relative">
                          Ďalšie služby
                        </div>

                        <div className="[display:-webkit-box] mt-[-1.00px] [-webkit-line-clamp:1] text-colors-ligh-gray-200 [-webkit-box-orient:vertical] leading-6 [font-family:'Poppins',Helvetica] relative w-fit mr-[-1.00px] font-normal whitespace-nowrap text-sm tracking-[0] overflow-hidden text-ellipsis">
                          {""}
                        </div>
                      </div>
                    </div>

                    <div className="border border-solid border-colors-black-800 w-full flex self-stretch items-center gap-1.5 p-4 h-12 rounded-lg relative">
                      <Icon24Px40
                        className="!mt-[-4.00px] !mb-[-4.00px] !relative !w-6 !h-6"
                        color="#A0A0A5"
                      />
                      <div className="[font-family:'Poppins',Helvetica] [display:-webkit-box] tracking-[0] [-webkit-line-clamp:1] text-sm flex-1 text-colors-white-800 font-normal overflow-hidden leading-6 [-webkit-box-orient:vertical] text-ellipsis relative">
                        Ďalší vodič, detská autosedačka
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full flex self-stretch items-start gap-6 flex-[0_0_auto] relative">
                  <div className="flex flex-col items-start grow flex-1 relative">
                    <div className="w-full flex self-stretch items-center px-0 py-4 h-10 rounded-lg relative">
                      <div className="flex mt-[-1.00px] items-center grow gap-1 flex-1 mb-[-1.00px] relative">
                        <div className="[font-family:'Poppins',Helvetica] mt-[-1.00px] tracking-[0] text-sm flex-1 text-colors-ligh-gray-200 font-semibold leading-6 relative">
                          Depozit
                        </div>

                        <div className="[display:-webkit-box] mt-[-1.00px] [-webkit-line-clamp:1] text-colors-ligh-gray-200 [-webkit-box-orient:vertical] leading-6 [font-family:'Poppins',Helvetica] relative w-fit mr-[-1.00px] font-normal whitespace-nowrap text-sm tracking-[0] overflow-hidden text-ellipsis">
                          {""}
                        </div>
                      </div>
                    </div>

                    <div className="border border-solid border-colors-black-800 w-full flex self-stretch items-center gap-1.5 p-4 h-12 rounded-lg relative">
                      <Icon24Px73
                        className="!mt-[-4.00px] !mb-[-4.00px] !relative !w-6 !h-6"
                        color="#A0A0A5"
                      />
                      <div className="flex items-center grow gap-1 flex-1 relative">
                        <div className="[font-family:'Poppins',Helvetica] w-fit [display:-webkit-box] mt-[-1.00px] [-webkit-line-clamp:1] text-sm tracking-[0] text-colors-ligh-gray-200 font-normal overflow-hidden [-webkit-box-orient:vertical] whitespace-nowrap text-ellipsis leading-6 relative">
                          {""}
                        </div>

                        <div className="[font-family:'Poppins',Helvetica] mt-[-1.00px] tracking-[0] text-sm flex-1 text-colors-white-800 font-normal leading-6 relative">
                          Slovensko, Česko
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start grow flex-1 relative">
                    <div className="w-full flex self-stretch items-center px-0 py-4 h-10 rounded-lg relative">
                      <div className="flex mt-[-1.00px] items-center grow gap-1 flex-1 mb-[-1.00px] relative">
                        <div className="[font-family:'Poppins',Helvetica] mt-[-1.00px] tracking-[0] text-sm flex-1 text-colors-ligh-gray-200 font-semibold leading-6 relative">
                          Počet povolených km
                        </div>

                        <div className="[display:-webkit-box] mt-[-1.00px] [-webkit-line-clamp:1] text-colors-ligh-gray-200 [-webkit-box-orient:vertical] leading-6 [font-family:'Poppins',Helvetica] relative w-fit mr-[-1.00px] font-normal whitespace-nowrap text-sm tracking-[0] overflow-hidden text-ellipsis">
                          {""}
                        </div>
                      </div>
                    </div>

                    <div className="border border-solid border-colors-black-800 w-full flex self-stretch items-center gap-1.5 p-4 h-12 rounded-lg relative">
                      <Ikony25_23
                        className="!mt-[-4.00px] !mb-[-4.00px] !relative !w-6 !h-6"
                        color="#A0A0A5"
                      />
                      <div className="[font-family:'Poppins',Helvetica] [display:-webkit-box] tracking-[0] [-webkit-line-clamp:1] text-sm flex-1 text-colors-white-800 font-normal overflow-hidden leading-6 [-webkit-box-orient:vertical] text-ellipsis relative">
                        230 km/deň
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full flex self-stretch items-center gap-2 px-4 py-0 h-8 relative">
                <p className="[font-family:'Poppins',Helvetica] tracking-[0] text-sm flex-1 text-colors-dark-gray-900 font-normal text-center leading-5 relative">
                  Pred vyzdvihnutím vozidla na vami zvolenej pobočke zavolajte
                  15 min. dopredu manažérovi vozového parku ktorý pripravaví
                  všetko potrebné k odovzdaniu vozidla.
                </p>
              </div>
            </div>
          </div>
        )}

        {screenWidth >= 1728 && (
          <>
            <FaqRychlyKontaktFooter1728
              className="!absolute !left-0 !top-[2843px]"
              footerWrapperBlackrentLogoClassName="bg-[url(/img/vector-38.svg)]"
              footerWrapperVector="/img/vector-37.svg"
              type="c"
            />
            <Menu1
              className="!absolute !left-0 !top-0"
              sekcieVMenuBlackDivClassName="!text-colors-ligh-gray-800"
              sekcieVMenuBlackDivClassName1="!text-colors-ligh-gray-800"
              sekcieVMenuBlackDivClassName2="!text-colors-ligh-gray-800"
              sekcieVMenuBlackDivClassNameOverride="!text-colors-ligh-gray-800"
              storeDivClassName=""
              type="default"
            />
          </>
        )}

        {(screenWidth >= 1728 ||
          (screenWidth >= 744 && screenWidth < 1440)) && (
          <div
            className={`flex left-8 flex-col items-center absolute ${screenWidth >= 1728 ? "w-[1664px]" : (screenWidth >= 744 && screenWidth < 1440) ? "w-[680px]" : ""} ${screenWidth >= 1728 ? "top-[1703px]" : (screenWidth >= 744 && screenWidth < 1440) ? "top-[1490px]" : ""} ${screenWidth >= 1728 ? "gap-20" : (screenWidth >= 744 && screenWidth < 1440) ? "gap-10" : ""}`}
          >
            {screenWidth >= 1728 && (
              <>
                <div className="inline-flex flex-col items-center gap-10 relative flex-[0_0_auto]">
                  <div className="inline-flex flex-col items-center gap-6 relative flex-[0_0_auto]">
                    <div className="inline-flex flex-col items-center gap-20 relative flex-[0_0_auto]">
                      <ElementIconsDarkBig
                        ellipse="/img/ellipse-79-4.svg"
                        overlapGroupClassName="bg-[url(/img/ellipse-80-4.svg)]"
                        type="pin"
                        vector="/img/vector-40.svg"
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
                  className="!self-stretch !bg-[50%_50%] !bg-cover bg-[url(/img/mapa-3.png)] !w-full"
                  property1="a"
                />
              </>
            )}

            {screenWidth >= 744 && screenWidth < 1440 && (
              <div className="flex flex-col items-center gap-16 relative self-stretch w-full flex-[0_0_auto]">
                <div className="inline-flex flex-col items-center gap-10 relative flex-[0_0_auto]">
                  <div className="relative w-[51px] h-[59px]">
                    <div className="w-28 h-28 -top-10 left-[-21px] bg-[url(/img/ellipse-80-2.svg)] relative bg-[100%_100%]">
                      <img
                        className="absolute w-[47px] h-[59px] top-10 left-[21px]"
                        alt="Vector"
                        src="/img/vector-29.svg"
                      />

                      <img
                        className="absolute w-4 h-4 top-[53px] left-9"
                        alt="Ellipse"
                        src="/img/ellipse-79-2.svg"
                      />
                    </div>
                  </div>

                  <div className="inline-flex flex-col items-center gap-6 relative flex-[0_0_auto]">
                    <div className="relative w-[420px] h-6 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-[32px] text-center tracking-[0] leading-7 whitespace-nowrap">
                      Kde sa auto nachádza?
                    </div>

                    <div className="flex flex-col w-[328px] items-center gap-4 relative flex-[0_0_auto]">
                      <div className="relative self-stretch h-4 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base text-center tracking-[0] leading-6 whitespace-nowrap">
                        Bratislava – Záhorská Bystrica
                      </div>

                      <p className="relative self-stretch h-2 [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-xs text-center tracking-[0] leading-[30px] whitespace-nowrap">
                        Pobočka Avis cars, Rozmarínova 23 Trenčín
                      </p>
                    </div>
                  </div>
                </div>

                <Mapa
                  className="!self-stretch !bg-[50%_50%] !bg-cover bg-[url(/img/mapa-3.png)] !w-full"
                  property1="a"
                />
              </div>
            )}

            <div className="inline-flex items-center gap-1 flex-[0_0_auto] relative">
              <div className="[font-family:'Poppins',Helvetica] w-fit tracking-[0] text-sm text-colors-dark-gray-900 font-medium leading-6 whitespace-nowrap relative">
                Zobraziť na mape
              </div>

              <Icon16Px20 className="!relative !w-4 !h-4" />
            </div>
          </div>
        )}

        {screenWidth >= 1728 && (
          <div className="flex flex-col w-[874px] items-center gap-6 pt-6 pb-8 px-6 absolute top-[567px] left-[427px] rounded-[32px] bg-[linear-gradient(0deg,rgba(15,15,20,1)_0%,rgba(15,15,20,1)_100%)] bg-colors-black-300">
            <div className="flex h-96 items-end justify-around gap-6 p-6 relative self-stretch w-full rounded-2xl overflow-hidden bg-[url(/img/frame-521-3.png)] bg-cover bg-[50%_50%] bg-colors-black-100">
              <div className="flex items-end justify-between relative flex-1 grow">
                <div className="flex flex-col items-start gap-4 relative flex-1 grow">
                  <div className="relative self-stretch mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-[32px] tracking-[0] leading-9">
                    Názov vozidla
                  </div>

                  <div className="inline-flex flex-wrap items-start gap-[8px_8px] relative flex-[0_0_auto]">
                    <div className="inline-flex flex-wrap items-center gap-[0px_0px] relative flex-[0_0_auto]">
                      <Icon16Px30 className="!relative !w-4 !h-4" />
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        123 kW
                      </div>
                    </div>

                    <div className="inline-flex flex-wrap items-center gap-[4px_4px] relative flex-[0_0_auto]">
                      <Icon16Px31 className="!relative !w-4 !h-4" />
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Benzín
                      </div>
                    </div>

                    <div className="inline-flex flex-wrap items-center gap-[4px_4px] relative flex-[0_0_auto]">
                      <Icon16Px32 className="!relative !w-4 !h-4" />
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Automat
                      </div>
                    </div>

                    <div className="inline-flex flex-wrap items-center gap-[4px_4px] relative flex-[0_0_auto]">
                      <Icon16Px33 className="!relative !w-4 !h-4" />
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Predný
                      </div>
                    </div>
                  </div>
                </div>

                <div className="inline-flex h-4 items-center gap-1.5 relative flex-[0_0_auto]">
                  <BlackrentLogo className="!h-4 bg-[url(/img/vector-41.svg)] !relative !w-[104px]" />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-10 relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex flex-col items-start gap-4 px-6 py-0 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col items-start relative flex-1 grow">
                    <div className="flex h-10 items-center px-0 py-4 relative self-stretch w-full rounded-lg">
                      <div className="mt-[-1.00px] mb-[-1.00px] flex items-center gap-1 relative flex-1 grow">
                        <div className="relative w-[186px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-ligh-gray-200 text-sm tracking-[0] leading-6">
                          Miesto vyzdvihnutia
                        </div>

                        <div className="mt-[-1.00px] text-colors-ligh-gray-200 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                          {""}
                        </div>
                      </div>
                    </div>

                    <div className="flex h-12 items-center gap-1.5 p-4 relative self-stretch w-full rounded-lg border border-solid border-colors-black-800">
                      <Ikony25_19
                        className="!mt-[-4.00px] !mb-[-4.00px] !relative !w-6 !h-6"
                        color="#A0A0A5"
                      />
                      <div className="flex items-center gap-1 relative flex-1 grow">
                        <div className="mt-[-1.00px] text-colors-ligh-gray-200 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                          {""}
                        </div>

                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                          Bánska Bystrica
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start relative flex-1 grow">
                    <div className="flex h-10 items-center px-0 py-4 relative self-stretch w-full rounded-lg">
                      <div className="mt-[-1.00px] mb-[-1.00px] flex items-center gap-1 relative flex-1 grow">
                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-ligh-gray-200 text-sm tracking-[0] leading-6">
                          Miesto vrátenia
                        </div>

                        <div className="mt-[-1.00px] mr-[-1.00px] text-colors-ligh-gray-200 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                          {""}
                        </div>
                      </div>
                    </div>

                    <div className="flex h-12 items-center gap-1.5 p-4 relative self-stretch w-full rounded-lg border border-solid border-colors-black-800">
                      <Ikony25_19
                        className="!mt-[-4.00px] !mb-[-4.00px] !relative !w-6 !h-6"
                        color="#A0A0A5"
                      />
                      <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                        Bratislava
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col items-start relative flex-1 self-stretch grow">
                    <div className="flex h-10 items-center px-0 py-4 relative self-stretch w-full rounded-lg">
                      <div className="mt-[-1.00px] mb-[-1.00px] flex items-center gap-1 relative flex-1 grow">
                        <div className="relative w-[186px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-ligh-gray-200 text-sm tracking-[0] leading-6">
                          Dátum a čas vyzdvihnutia
                        </div>

                        <div className="mt-[-1.00px] text-colors-ligh-gray-200 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                          {""}
                        </div>
                      </div>
                    </div>

                    <div className="flex h-12 items-center gap-4 p-4 relative self-stretch w-full rounded-lg border border-solid border-colors-black-800">
                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto] mt-[-4.00px] mb-[-4.00px]">
                        <Ikony25_21
                          className="!relative !w-6 !h-6"
                          color="#A0A0A5"
                        />
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          8. 2024
                        </div>
                      </div>

                      <img
                        className="relative w-px h-[25px] mt-[-4.50px] mb-[-4.50px] object-cover"
                        alt="Line"
                        src="/img/line-3-7.svg"
                      />

                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto] mt-[-4.00px] mb-[-4.00px]">
                        <TypTime
                          className="!relative !w-6 !h-6"
                          color="#A0A0A5"
                        />
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          16:00
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start relative flex-1 self-stretch grow">
                    <div className="flex h-10 items-center px-0 py-4 relative self-stretch w-full rounded-lg">
                      <div className="mt-[-1.00px] mb-[-1.00px] flex items-center gap-1 relative flex-1 grow">
                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-ligh-gray-200 text-sm tracking-[0] leading-6">
                          Dátum a čas vrátenia
                        </div>

                        <div className="mt-[-1.00px] mr-[-1.00px] text-colors-ligh-gray-200 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                          {""}
                        </div>
                      </div>
                    </div>

                    <div className="flex h-12 items-center gap-4 p-4 relative self-stretch w-full rounded-lg border border-solid border-colors-black-800">
                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto] mt-[-4.00px] mb-[-4.00px]">
                        <Ikony25_21
                          className="!relative !w-6 !h-6"
                          color="#A0A0A5"
                        />
                        <div className="text-colors-white-800 relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                          8. 2024
                        </div>
                      </div>

                      <img
                        className="relative w-px h-[25px] mt-[-4.50px] mb-[-4.50px] object-cover"
                        alt="Line"
                        src="/img/line-3-7.svg"
                      />

                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto] mt-[-4.00px] mb-[-4.00px]">
                        <TypTime
                          className="!relative !w-6 !h-6"
                          color="#A0A0A5"
                        />
                        <div className="text-colors-white-800 relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                          12:00
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col items-start relative flex-1 self-stretch grow">
                    <div className="flex h-10 items-center px-0 py-4 relative self-stretch w-full rounded-lg">
                      <div className="mt-[-1.00px] mb-[-1.00px] flex items-center gap-1 relative flex-1 grow">
                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-ligh-gray-200 text-sm tracking-[0] leading-6">
                          Poistenie
                        </div>

                        <div className="mt-[-1.00px] mr-[-1.00px] text-colors-ligh-gray-200 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                          {""}
                        </div>
                      </div>
                    </div>

                    <div className="flex h-12 items-center gap-1.5 p-4 relative self-stretch w-full rounded-lg border border-solid border-colors-black-800">
                      <Ikony25_22
                        className="!mt-[-4.00px] !mb-[-4.00px] !relative !w-6 !h-6"
                        color="#A0A0A5"
                      />
                      <div className="flex items-center gap-1 relative flex-1 grow">
                        <div className="mt-[-1.00px] text-colors-ligh-gray-200 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                          {""}
                        </div>

                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                          Základné
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start relative flex-1 self-stretch grow">
                    <div className="flex h-10 items-center px-0 py-4 relative self-stretch w-full rounded-lg">
                      <div className="mt-[-1.00px] mb-[-1.00px] flex items-center gap-1 relative flex-1 grow">
                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-ligh-gray-200 text-sm tracking-[0] leading-6">
                          Ďalšie služby
                        </div>

                        <div className="mt-[-1.00px] mr-[-1.00px] text-colors-ligh-gray-200 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                          {""}
                        </div>
                      </div>
                    </div>

                    <div className="flex h-12 items-center gap-1.5 p-4 relative self-stretch w-full rounded-lg border border-solid border-colors-black-800">
                      <Icon24Px40
                        className="!mt-[-4.00px] !mb-[-4.00px] !relative !w-6 !h-6"
                        color="#A0A0A5"
                      />
                      <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                        Ďalší vodič, detská autosedačka
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col items-start relative flex-1 grow">
                    <div className="flex h-10 items-center px-0 py-4 relative self-stretch w-full rounded-lg">
                      <div className="mt-[-1.00px] mb-[-1.00px] flex items-center gap-1 relative flex-1 grow">
                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-ligh-gray-200 text-sm tracking-[0] leading-6">
                          Depozit
                        </div>

                        <div className="mt-[-1.00px] mr-[-1.00px] text-colors-ligh-gray-200 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                          {""}
                        </div>
                      </div>
                    </div>

                    <div className="flex h-12 items-center gap-1.5 p-4 relative self-stretch w-full rounded-lg border border-solid border-colors-black-800">
                      <Icon24Px73
                        className="!mt-[-4.00px] !mb-[-4.00px] !relative !w-6 !h-6"
                        color="#A0A0A5"
                      />
                      <div className="flex items-center gap-1 relative flex-1 grow">
                        <div className="mt-[-1.00px] text-colors-ligh-gray-200 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                          {""}
                        </div>

                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                          Slovensko, Česko
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start relative flex-1 grow">
                    <div className="flex h-10 items-center px-0 py-4 relative self-stretch w-full rounded-lg">
                      <div className="mt-[-1.00px] mb-[-1.00px] flex items-center gap-1 relative flex-1 grow">
                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-ligh-gray-200 text-sm tracking-[0] leading-6">
                          Počet povolených km
                        </div>

                        <div className="mt-[-1.00px] mr-[-1.00px] text-colors-ligh-gray-200 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                          {""}
                        </div>
                      </div>
                    </div>

                    <div className="flex h-12 items-center gap-1.5 p-4 relative self-stretch w-full rounded-lg border border-solid border-colors-black-800">
                      <Ikony25_23
                        className="!mt-[-4.00px] !mb-[-4.00px] !relative !w-6 !h-6"
                        color="#A0A0A5"
                      />
                      <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                        230 km/deň
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex h-8 items-center gap-2 px-4 py-0 relative self-stretch w-full">
                <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-dark-gray-900 text-sm text-center tracking-[0] leading-5">
                  Pred vyzdvihnutím vozidla na vami zvolenej pobočke zavolajte
                  15 min. dopredu manažérovi vozového parku <br />
                  ktorý pripravaví všetko potrebné k odovzdaniu vozidla.
                </p>
              </div>
            </div>
          </div>
        )}

        {screenWidth >= 744 && screenWidth < 1440 && (
          <FooterTablet className="!absolute !left-0 !top-[2397px]" type="c" />
        )}
      </div>
    </div>
  );
};
