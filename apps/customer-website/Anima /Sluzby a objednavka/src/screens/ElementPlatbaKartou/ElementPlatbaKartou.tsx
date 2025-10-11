import React from "react";
import { useWindowWidth } from "../../breakpoints";
import { DivWrapper } from "../../components/DivWrapper";
import { ElementIconsDarkBig } from "../../components/ElementIconsDarkBig";
import { ElementIconsDarkSmall } from "../../components/ElementIconsDarkSmall";
import { FaqRychlyKontakt } from "../../components/FaqRychlyKontakt";
import { FooterMobile } from "../../components/FooterMobile";
import { FooterTablet } from "../../components/FooterTablet";
import { Menu } from "../../components/Menu";
import { TypeCWrapper } from "../../components/TypeCWrapper";
import { TypeDefaultWrapper } from "../../components/TypeDefaultWrapper";

export const ElementPlatbaKartou = (): JSX.Element => {
  const screenWidth = useWindowWidth();

  return (
    <div
      className="w-screen grid [align-items:start] bg-[#05050a] justify-items-center"
      data-model-id="4136:8385"
    >
      <div
        className={`bg-colors-black-100 relative ${screenWidth < 744 ? "w-[360px]" : (screenWidth >= 744 && screenWidth < 1440) ? "w-[744px]" : screenWidth >= 1440 && screenWidth < 1728 ? "w-[1440px]" : screenWidth >= 1728 ? "w-[1728px]" : ""} ${screenWidth < 744 ? "h-[1393px]" : (screenWidth >= 744 && screenWidth < 1440) ? "h-[1258px]" : screenWidth >= 1440 && screenWidth < 1728 ? "h-[1624px]" : screenWidth >= 1728 ? "h-[1632px]" : ""}`}
      >
        {screenWidth >= 744 && screenWidth < 1440 && (
          <TypeDefaultWrapper
            className="!absolute !left-0 !top-0"
            type="default"
          />
        )}

        {(screenWidth >= 1728 ||
          (screenWidth >= 744 && screenWidth < 1440)) && (
          <div
            className={`absolute ${screenWidth >= 744 && screenWidth < 1440 ? "w-[680px]" : (screenWidth >= 1728) ? "w-[1329px]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "left-8" : (screenWidth >= 1728) ? "left-[200px]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "top-[104px]" : (screenWidth >= 1728) ? "top-32" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "h-[77px]" : (screenWidth >= 1728) ? "h-[152px]" : ""}`}
          >
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
                      ? "/img/line-14-3.svg"
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
                      ? "/img/line-15-3.svg"
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
                        className="bg-[url(/img/ellipse-2-6.svg)]"
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
                        className="bg-[url(/img/ellipse-2-9.svg)]"
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
                        className="bg-[url(/img/ellipse-2-7.svg)]"
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
                        className="bg-[url(/img/ellipse-2-10.svg)]"
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
                        className="bg-[url(/img/ellipse-2-8.svg)]"
                        type="check-selected"
                      />
                      <div className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-[10px] text-center tracking-[0] leading-[14px]">
                        Ďalšie služby
                      </div>
                    </>
                  )}

                  {screenWidth >= 1728 && (
                    <>
                      <ElementIconsDarkBig
                        className="bg-[url(/img/ellipse-2-11.svg)]"
                        type="check-selected"
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
                      <div className="bg-[url(/img/ellipse-1-1.svg)] relative w-10 h-10 bg-[100%_100%]">
                        <div className="absolute h-[11px] top-3.5 left-[13px] [font-family:'SF_Pro-ExpandedRegular',Helvetica] font-normal text-colors-white-800 text-base text-center tracking-[0] leading-6 whitespace-nowrap">
                          4
                        </div>
                      </div>

                      <div className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-[10px] text-center tracking-[0] leading-[14px]">
                        Osobné údaje
                        <br />a platba
                      </div>
                    </>
                  )}

                  {screenWidth >= 1728 && (
                    <>
                      <ElementIconsDarkBig
                        className="bg-[url(/img/ellipse-1-2.svg)]"
                        type="four-selected"
                      />
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-base text-center tracking-[0] leading-6">
                        Potvrdenie
                        <br />a platba
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {screenWidth >= 744 && screenWidth < 1440 && (
          <>
            <div className="absolute w-[242px] h-6 top-[260px] left-[251px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-[32px] tracking-[0] leading-[48px] whitespace-nowrap">
              Platba kartou
            </div>

            <FooterTablet className="!absolute !left-0 !top-[445px]" type="c" />
          </>
        )}

        {((screenWidth >= 1440 && screenWidth < 1728) ||
          screenWidth >= 1728) && (
          <DivWrapper
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

        {screenWidth >= 1440 && screenWidth < 1728 && (
          <div className="absolute w-[1329px] h-[152px] top-32 left-[55px]">
            <div className="relative h-[152px]">
              <img
                className="absolute w-[756px] h-0.5 top-[43px] left-[97px]"
                alt="Line"
                src="/img/line-14-3.svg"
              />

              <img
                className="absolute w-[378px] h-0.5 top-[43px] left-[853px]"
                alt="Line"
                src="/img/line-15-3.svg"
              />

              <div className="flex w-[1329px] items-start justify-between absolute top-0 left-0">
                <div className="flex flex-col w-[195px] items-center gap-[29px] relative">
                  <ElementIconsDarkBig
                    className="bg-[url(/img/ellipse-2-12.svg)]"
                    type="check-selected"
                  />
                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-base tracking-[0] leading-6">
                    Ponuka <br />
                    vozidiel
                  </div>
                </div>

                <div className="flex flex-col w-[195px] items-center justify-center gap-[29px] relative">
                  <ElementIconsDarkBig
                    className="bg-[url(/img/ellipse-2-13.svg)]"
                    type="check-selected"
                  />
                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                    BMW 303i
                  </div>
                </div>

                <div className="flex flex-col w-[195px] items-center gap-[29px] relative">
                  <ElementIconsDarkBig
                    className="bg-[url(/img/ellipse-2-14.svg)]"
                    type="check-selected"
                  />
                  <p className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-base text-center tracking-[0] leading-6">
                    Ďalšie služby <br />a osobné údaje
                  </p>
                </div>

                <div className="flex flex-col w-[195px] items-center gap-[29px] relative">
                  <ElementIconsDarkBig
                    className="bg-[url(/img/ellipse-1-3.svg)]"
                    type="four-selected"
                  />
                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-base text-center tracking-[0] leading-6">
                    Potvrdenie
                    <br />a platba
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {((screenWidth >= 1440 && screenWidth < 1728) || screenWidth < 744) && (
          <div
            className={`inline-flex items-center gap-2 justify-center absolute ${screenWidth < 744 ? "left-[98px]" : (screenWidth >= 1440 && screenWidth < 1728) ? "left-[569px]" : ""} ${screenWidth < 744 ? "top-[229px]" : (screenWidth >= 1440 && screenWidth < 1728) ? "top-[400px]" : ""} ${screenWidth < 744 ? "h-4" : (screenWidth >= 1440 && screenWidth < 1728) ? "h-8" : ""}`}
          >
            <div
              className={`w-fit text-colors-light-yellow-accent-700 whitespace-nowrap relative ${screenWidth < 744 ? "[font-family:'SF_Pro-ExpandedSemibold',Helvetica]" : (screenWidth >= 1440 && screenWidth < 1728) ? "font-desktop-titulok-40" : ""} ${screenWidth < 744 ? "tracking-[0]" : (screenWidth >= 1440 && screenWidth < 1728) ? "tracking-[var(--desktop-titulok-40-letter-spacing)]" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "[font-style:var(--desktop-titulok-40-font-style)]" : ""} ${screenWidth < 744 ? "text-xl" : (screenWidth >= 1440 && screenWidth < 1728) ? "text-[length:var(--desktop-titulok-40-font-size)]" : ""} ${screenWidth < 744 ? "font-normal" : (screenWidth >= 1440 && screenWidth < 1728) ? "font-[number:var(--desktop-titulok-40-font-weight)]" : ""} ${screenWidth < 744 ? "leading-7" : (screenWidth >= 1440 && screenWidth < 1728) ? "leading-[var(--desktop-titulok-40-line-height)]" : ""}`}
            >
              Platba kartou
            </div>
          </div>
        )}

        {screenWidth >= 1440 && screenWidth < 1728 && (
          <FaqRychlyKontakt
            className="!absolute !left-0 !top-[712px]"
            type="c"
          />
        )}

        {screenWidth >= 1728 && (
          <>
            <TypeCWrapper className="!absolute !left-0 !top-[712px]" type="c" />
            <div className="inline-flex h-8 items-center justify-center gap-2 absolute top-[400px] left-[713px]">
              <div className="relative w-fit font-desktop-titulok-40 font-[number:var(--desktop-titulok-40-font-weight)] text-colors-light-yellow-accent-700 text-[length:var(--desktop-titulok-40-font-size)] tracking-[var(--desktop-titulok-40-letter-spacing)] leading-[var(--desktop-titulok-40-line-height)] whitespace-nowrap [font-style:var(--desktop-titulok-40-font-style)]">
                Platba kartou
              </div>
            </div>
          </>
        )}

        {screenWidth < 744 && (
          <>
            <FooterMobile className="!absolute !left-0 !top-[365px]" type="c" />
            <Menu className="!absolute !left-0 !top-0" type="default" />
            <div className="absolute w-[344px] h-[77px] top-[88px] left-2">
              <div className="relative h-[77px]">
                <img
                  className="w-[177px] left-[39px] absolute h-0.5 top-[19px]"
                  alt="Line"
                  src="/img/line-14.svg"
                />

                <img
                  className="w-[90px] left-[214px] absolute h-0.5 top-[19px]"
                  alt="Line"
                  src="/img/line-15.svg"
                />

                <div className="flex w-[344px] items-start justify-between absolute top-0 left-0">
                  <div className="flex flex-col w-20 items-center gap-4 relative">
                    <ElementIconsDarkSmall
                      className="bg-[url(/img/ellipse-2-2.svg)]"
                      type="check-selected"
                    />
                    <div className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-[10px] text-center tracking-[0] leading-[14px]">
                      Ponuka <br />
                      vozidiel
                    </div>
                  </div>

                  <div className="flex flex-col w-20 items-center gap-4 relative">
                    <ElementIconsDarkSmall
                      className="bg-[url(/img/ellipse-2-3.svg)]"
                      type="check-selected"
                    />
                    <div className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-[10px] text-center tracking-[0] leading-[14px]">
                      BMW 440i
                    </div>
                  </div>

                  <div className="flex flex-col w-20 items-center gap-4 relative">
                    <ElementIconsDarkSmall
                      className="bg-[url(/img/ellipse-2-4.svg)]"
                      type="check-selected"
                    />
                    <div className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-[10px] text-center tracking-[0] leading-[14px]">
                      Ďalšie služby
                    </div>
                  </div>

                  <div className="flex flex-col w-20 items-center gap-4 relative">
                    <ElementIconsDarkSmall
                      className="bg-[url(/img/ellipse-2-5.svg)]"
                      type="check-selected"
                    />
                    <div className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-[10px] text-center tracking-[0] leading-[14px]">
                      Osobné údaje
                      <br />a platba
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
