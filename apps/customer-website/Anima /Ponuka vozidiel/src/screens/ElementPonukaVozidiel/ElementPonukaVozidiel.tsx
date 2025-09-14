import React from "react";
import { useWindowWidth } from "../../breakpoints";
import { BackToTopButton } from "../../components/BackToTopButton";
import { FaqRychlyKontakt } from "../../components/FaqRychlyKontakt";
import { FaqRychlyKontaktFooter1728 } from "../../components/FaqRychlyKontaktFooter1728";
import { Filtracia } from "../../components/Filtracia";
import { FooterTablet } from "../../components/FooterTablet";
import { IconPx } from "../../components/IconPx";
import { KartaVozidlaHomepage744 } from "../../components/KartaVozidlaHomepage744";
import { KartaVozidlaPonuka } from "../../components/KartaVozidlaPonuka";
import { KartaVozidlaPonukaVozidiel1728 } from "../../components/KartaVozidlaPonukaVozidiel1728";
import { Menu } from "../../components/Menu";
import { Menu1 } from "../../components/Menu1";
import { NumberingDesktop } from "../../components/NumberingDesktop";
import { NumberingMobile } from "../../components/NumberingMobile";
import { TypeDefaultWrapper } from "../../components/TypeDefaultWrapper";
import { TypeVyplneneDniWrapper } from "../../components/TypeVyplneneDniWrapper";
import { Icon16Px35 } from "../../icons/Icon16Px35";
import { Icon16Px65 } from "../../icons/Icon16Px65";
import { Icon32Px44 } from "../../icons/Icon32Px44";
import { DivWrapper } from "./sections/DivWrapper";
import { FooterMobile } from "./sections/FooterMobile";
import { Frame } from "./sections/Frame";
import { FrameWrapper } from "./sections/FrameWrapper";
import { Group } from "./sections/Group";

export const ElementPonukaVozidiel = (): JSX.Element => {
  const screenWidth = useWindowWidth();

  return (
    <div
      className="w-screen grid [align-items:start] bg-[#05050a] justify-items-center"
      data-model-id="4043:7784"
    >
      <div
        className={`bg-colors-black-100 relative ${screenWidth < 744 ? "w-[360px]" : (screenWidth >= 744 && screenWidth < 1440) ? "w-[744px]" : screenWidth >= 1440 && screenWidth < 1728 ? "w-[1440px]" : screenWidth >= 1728 ? "w-[1728px]" : ""} ${screenWidth < 744 ? "h-[5767px]" : (screenWidth >= 744 && screenWidth < 1440) ? "h-[5970px]" : screenWidth >= 1440 && screenWidth < 1728 ? "h-[4747px]" : screenWidth >= 1728 ? "h-[4887px]" : ""}`}
      >
        <div
          className={`left-0 top-0 absolute ${screenWidth >= 744 && screenWidth < 1440 ? "w-[744px]" : (screenWidth >= 1440 && screenWidth < 1728) ? "w-[1440px]" : screenWidth >= 1728 ? "w-[1728px]" : screenWidth < 744 ? "w-[360px]" : ""} ${screenWidth >= 744 && screenWidth < 1440 ? "h-[673px]" : (screenWidth >= 1440 && screenWidth < 1728) ? "h-[2307px]" : screenWidth >= 1728 ? "h-[2371px]" : screenWidth < 744 ? "h-[600px]" : ""}`}
        >
          {((screenWidth >= 744 && screenWidth < 1440) ||
            screenWidth < 744) && (
            <div
              className={`left-0 top-0 h-[600px] bg-colors-black-100 absolute ${screenWidth < 744 ? "w-[360px]" : (screenWidth >= 744 && screenWidth < 1440) ? "w-[744px]" : ""}`}
            >
              <div
                className={`bg-colors-black-400 relative ${screenWidth < 744 ? "w-[318px]" : (screenWidth >= 744 && screenWidth < 1440) ? "w-[600px]" : ""} ${screenWidth < 744 ? "-top-20" : (screenWidth >= 744 && screenWidth < 1440) ? "top-[-200px]" : ""} ${screenWidth < 744 ? "blur-[100px]" : (screenWidth >= 744 && screenWidth < 1440) ? "blur-[150px]" : ""} ${screenWidth < 744 ? "h-[318px]" : (screenWidth >= 744 && screenWidth < 1440) ? "h-[600px]" : ""} ${screenWidth < 744 ? "rounded-[159px]" : (screenWidth >= 744 && screenWidth < 1440) ? "rounded-[300px]" : ""}`}
              />
            </div>
          )}

          {screenWidth >= 744 && screenWidth < 1440 && (
            <>
              <TypeDefaultWrapper
                className="!absolute !left-0 !top-0"
                type="default"
              />
              <div className="flex flex-col w-[680px] h-[328px] items-center gap-[35px] pt-10 pb-0 px-0 absolute top-[345px] left-8 bg-colors-white-1000 rounded-3xl overflow-hidden">
                <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                  <p className="relative self-stretch mt-[-1.00px] [font-family:'SF_Pro-ExpandedRegular',Helvetica] font-normal text-colors-black-800 text-[32px] text-center tracking-[0] leading-10">
                    Nové modely Tesla
                    <br />
                    aktuálne v ponuke
                  </p>

                  <p className="relative self-stretch h-4 [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                    Lorem ipsum text Lorem ipsum text 🔋
                  </p>
                </div>

                <img
                  className="absolute w-[560px] h-32 top-[152px] left-[120px]"
                  alt="Group"
                  src="/img/group-989-1.png"
                />

                <div className="inline-flex items-center justify-center gap-2 absolute top-[300px] left-[318px]">
                  <div className="relative w-3 h-3 bg-colors-ligh-gray-200 rounded-[99px]" />

                  <div className="relative w-2 h-2 bg-colors-ligh-gray-200 rounded-[99px]" />

                  <div className="relative w-2 h-2 bg-colors-ligh-gray-200 rounded-[99px]" />
                </div>
              </div>

              <div className="flex flex-col w-[616px] items-center gap-10 absolute top-[104px] left-16">
                <div className="flex flex-col items-center gap-6 relative self-stretch w-full flex-[0_0_auto]">
                  <p className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedMedium',Helvetica] font-medium text-colors-light-yellow-accent-700 text-[32px] text-center tracking-[0] leading-10">
                    Vyberte si z ponuky vyše <br />
                    1000+ vozidiel
                  </p>

                  <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                    <img
                      className="relative flex-[0_0_auto]"
                      alt="Frame"
                      src="/img/frame-2608587-2.png"
                    />

                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-center tracking-[0] leading-[64px] whitespace-nowrap">
                      4,85 hodnotení na Google
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-between relative self-stretch w-full flex-[0_0_auto]">
                  <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs tracking-[0] leading-[18px]">
                    Bezplatné zrušenie <br />
                    rezervácie
                  </div>

                  <img
                    className="relative self-stretch w-px mt-[-0.50px] mb-[-0.50px] object-cover"
                    alt="Line"
                    src="/img/line-5-6.svg"
                  />

                  <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs tracking-[0] leading-[18px]">
                    12 preverených
                    <br />
                    autopožičovní
                  </div>

                  <img
                    className="relative self-stretch w-px mt-[-0.50px] mb-[-0.50px] object-cover"
                    alt="Line"
                    src="/img/line-3-6.svg"
                  />

                  <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs tracking-[0] leading-[18px]">
                    36 odberných
                    <br />
                    miest na slovensku
                  </div>

                  <img
                    className="relative self-stretch w-px mt-[-0.50px] mb-[-0.50px] object-cover"
                    alt="Line"
                    src="/img/line-4-2.svg"
                  />

                  <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs tracking-[0] leading-[18px]">
                    1200 spokojných <br />
                    zákazníkov ročne
                  </div>
                </div>
              </div>
            </>
          )}

          {((screenWidth >= 1440 && screenWidth < 1728) ||
            screenWidth >= 1728) && (
            <div
              className={`left-0 top-0 absolute ${screenWidth >= 1440 && screenWidth < 1728 ? "w-[1440px]" : (screenWidth >= 1728) ? "w-[1728px]" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "h-[2307px]" : (screenWidth >= 1728) ? "h-[2211px]" : ""}`}
            >
              {screenWidth >= 1440 && screenWidth < 1728 && (
                <img
                  className="absolute w-[1440px] h-[1000px] top-0 left-0"
                  alt="Gradient background"
                  src="/img/gradient-background.png"
                />
              )}

              {screenWidth >= 1728 && (
                <div className="absolute w-[1728px] h-[1000px] top-0 left-0 bg-colors-black-100">
                  <div className="relative w-[800px] h-[800px] top-[-200px] left-[250px] bg-colors-black-400 rounded-[400px] blur-[250px]" />
                </div>
              )}

              <Menu1
                className={
                  screenWidth >= 1440 && screenWidth < 1728
                    ? "!absolute !left-0 !w-[1440px] !top-0"
                    : screenWidth >= 1728
                      ? "!absolute !left-0 !top-0"
                      : undefined
                }
                type="default"
              />
              <div
                className={`flex flex-col items-center top-[166px] gap-10 absolute ${screenWidth >= 1440 && screenWidth < 1728 ? "w-[1120px]" : (screenWidth >= 1728) ? "w-[1135px]" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "left-40" : (screenWidth >= 1728) ? "left-[280px]" : ""}`}
              >
                <div
                  className={`flex-col items-center gap-6 flex-[0_0_auto] relative ${screenWidth >= 1440 && screenWidth < 1728 ? "w-full" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "flex" : (screenWidth >= 1728) ? "inline-flex" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "self-stretch" : ""}`}
                >
                  <p className="[font-family:'SF_Pro-ExpandedMedium',Helvetica] w-fit mt-[-1.00px] tracking-[0] text-5xl text-colors-light-yellow-accent-700 font-medium text-center whitespace-nowrap leading-[64px] relative">
                    Vyberte si z ponuky vyše 1000+ vozidiel
                  </p>

                  <div className="inline-flex items-center gap-2 flex-[0_0_auto] relative">
                    <img
                      className="flex-[0_0_auto] relative"
                      alt="Frame"
                      src={
                        screenWidth >= 1440 && screenWidth < 1728
                          ? "/img/frame-2608587-2.png"
                          : screenWidth >= 1728
                            ? "/img/frame-2608587.svg"
                            : undefined
                      }
                    />

                    <div className="[font-family:'Poppins',Helvetica] w-fit tracking-[0] text-base text-colors-white-800 font-semibold text-center whitespace-nowrap leading-[64px] relative">
                      4,85 hodnotení na Google
                    </div>
                  </div>
                </div>

                <div
                  className={`flex items-start gap-10 flex-[0_0_auto] justify-center relative ${screenWidth >= 1440 && screenWidth < 1728 ? "w-full" : (screenWidth >= 1728) ? "w-[1135px]" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "self-stretch" : ""}`}
                >
                  <div className="[font-family:'Poppins',Helvetica] w-fit mt-[-1.00px] tracking-[0] text-base text-colors-ligh-gray-800 font-normal leading-6 relative">
                    Bezplatné zrušenie <br />
                    rezervácie
                  </div>

                  <img
                    className="w-px self-stretch mt-[-0.50px] object-cover mb-[-0.50px] relative"
                    alt="Line"
                    src={
                      screenWidth >= 1440 && screenWidth < 1728
                        ? "/img/line-4-1.svg"
                        : screenWidth >= 1728
                          ? "/img/line-4.svg"
                          : undefined
                    }
                  />

                  <div className="[font-family:'Poppins',Helvetica] w-fit mt-[-1.00px] tracking-[0] text-base text-colors-ligh-gray-800 font-normal leading-6 relative">
                    12 preverených
                    <br />
                    autopožičovní
                  </div>

                  <img
                    className="w-px self-stretch mt-[-0.50px] object-cover mb-[-0.50px] relative"
                    alt="Line"
                    src={
                      screenWidth >= 1440 && screenWidth < 1728
                        ? "/img/line-4-1.svg"
                        : screenWidth >= 1728
                          ? "/img/line-4.svg"
                          : undefined
                    }
                  />

                  <div className="[font-family:'Poppins',Helvetica] w-fit mt-[-1.00px] tracking-[0] text-base text-colors-ligh-gray-800 font-normal leading-6 relative">
                    36 odberných
                    <br />
                    miest na slovensku
                  </div>

                  <img
                    className="w-px self-stretch mt-[-0.50px] object-cover mb-[-0.50px] relative"
                    alt="Line"
                    src={
                      screenWidth >= 1440 && screenWidth < 1728
                        ? "/img/line-4-1.svg"
                        : screenWidth >= 1728
                          ? "/img/line-4.svg"
                          : undefined
                    }
                  />

                  <div className="[font-family:'Poppins',Helvetica] w-fit mt-[-1.00px] tracking-[0] text-base text-colors-ligh-gray-800 font-normal leading-6 relative">
                    1200 spokojných <br />
                    zákazníkov ročne
                  </div>
                </div>
              </div>

              <div
                className={`flex items-start top-[443px] pl-20 pr-0 py-0 h-40 overflow-hidden rounded-2xl bg-colors-white-1000 absolute ${screenWidth >= 1440 && screenWidth < 1728 ? "w-[1120px]" : (screenWidth >= 1728) ? "w-[1328px]" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "left-40" : (screenWidth >= 1728) ? "left-[200px]" : ""}`}
              >
                <div className="inline-flex self-stretch flex-col items-start gap-6 flex-[0_0_auto] justify-center relative">
                  <p className="[font-family:'SF_Pro-ExpandedRegular',Helvetica] w-fit tracking-[0] text-[32px] text-colors-black-800 font-normal leading-9 relative">
                    Nové modely Tesla <br />
                    aktuálne v ponuke
                  </p>

                  <p className="[font-family:'Poppins',Helvetica] self-stretch tracking-[0] text-sm text-colors-ligh-gray-200 font-normal leading-6 relative">
                    Lorem ipsum text Lorem ipsum text 🔋
                  </p>
                </div>

                <div
                  className={`inline-flex items-center top-[134px] gap-2 justify-center absolute ${screenWidth >= 1440 && screenWidth < 1728 ? "left-[541px]" : (screenWidth >= 1728) ? "left-[645px]" : ""}`}
                >
                  <div className="w-2.5 h-2.5 rounded-[99px] bg-colors-ligh-gray-200 relative" />

                  <div className="w-1.5 h-1.5 rounded-[99px] bg-colors-ligh-gray-800 relative" />

                  <div className="w-1.5 h-1.5 rounded-[99px] bg-colors-ligh-gray-800 relative" />
                </div>

                {screenWidth >= 1440 && screenWidth < 1728 && (
                  <img
                    className="absolute w-[614px] h-[152px] top-2 left-[506px]"
                    alt="Group"
                    src="/img/group-989.png"
                  />
                )}

                {screenWidth >= 1728 && (
                  <div className="absolute w-[873px] h-40 top-2 left-[639px]">
                    <div className="relative w-[689px] h-[152px]">
                      <img
                        className="w-[480px] left-0 absolute h-[152px] top-0"
                        alt="Obrazok"
                        src="/img/obrazok-3.png"
                      />

                      <img
                        className="w-[480px] left-40 absolute h-[152px] top-0"
                        alt="Obrazok"
                        src="/img/obrazok-4.png"
                      />

                      <img
                        className="w-80 left-[369px] absolute h-[152px] top-0"
                        alt="Obrazok"
                        src="/img/obrazok-5.png"
                      />
                    </div>
                  </div>
                )}
              </div>

              {screenWidth >= 1728 && (
                <>
                  <KartaVozidlaPonukaVozidiel1728
                    className="!absolute !left-[540px] !top-[707px]"
                    icon={
                      <Icon32Px44
                        className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                        color="#BEBEC3"
                      />
                    }
                    nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-30.png)]"
                    type="default"
                  />
                  <KartaVozidlaPonukaVozidiel1728
                    className="!left-[880px] !absolute !top-[707px]"
                    icon={
                      <Icon32Px44
                        className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                        color="#BEBEC3"
                      />
                    }
                    nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-30.png)]"
                    type="default"
                  />
                  <KartaVozidlaPonukaVozidiel1728
                    className="!left-[1220px] !absolute !top-[707px]"
                    icon={
                      <Icon32Px44
                        className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                        color="#BEBEC3"
                      />
                    }
                    type="tag-DPH"
                  />
                  <TypeVyplneneDniWrapper
                    className="!absolute !left-[200px] !top-[643px]"
                    frameClassName="!bg-colors-black-800"
                    type="vyplnene-dni-osa"
                  />
                  <div className="flex w-[988px] h-16 items-center justify-between px-0 py-4 absolute top-[643px] left-[540px]">
                    <div className="inline-flex h-4 items-center gap-2 relative flex-[0_0_auto]">
                      <div className="items-center gap-1 inline-flex relative flex-[0_0_auto]">
                        <div className="relative w-fit mt-[-1.00px] font-semibold text-colors-white-800 text-sm text-center [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                          12
                        </div>

                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          výsledky vyhľadávania
                        </div>
                      </div>

                      <img
                        className="relative w-px h-[15px] object-cover"
                        alt="Line"
                        src="/img/line-3-5.svg"
                      />

                      <div className="items-center gap-1 inline-flex relative flex-[0_0_auto]">
                        <Icon16Px65
                          className="!relative !w-4 !h-4"
                          color="#FF505A"
                        />
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-red-accent-300 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          zrušiť filter
                        </div>
                      </div>
                    </div>

                    <div className="inline-flex h-4 items-center gap-2 relative flex-[0_0_auto]">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm text-center tracking-[0] leading-6 whitespace-nowrap">
                        Zoradiť
                      </div>

                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Podľa obľúbenosi
                      </div>

                      <Icon16Px35 className="!relative !w-5 !h-5 !mt-[-2.00px] !mb-[-2.00px]" />
                    </div>
                  </div>
                </>
              )}

              {screenWidth >= 1440 && screenWidth < 1728 && (
                <>
                  <KartaVozidlaPonuka
                    className="!absolute !left-[448px] !top-[707px]"
                    icon={
                      <Icon32Px44
                        className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                        color="#BEBEC3"
                      />
                    }
                    nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-42.png)]"
                    property1="default"
                  />
                  <KartaVozidlaPonuka
                    className="!left-[736px] !absolute !top-[707px]"
                    icon={
                      <Icon32Px44
                        className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                        color="#BEBEC3"
                      />
                    }
                    nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-42.png)]"
                    property1="default"
                    tlaTkoClassName="!bg-colors-black-400"
                  />
                  <KartaVozidlaPonuka
                    className="!left-[1024px] !absolute !top-[707px]"
                    icon={
                      <Icon32Px44
                        className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                        color="#BEBEC3"
                      />
                    }
                    nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-42.png)]"
                    property1="default"
                  />
                  <div className="flex w-[832px] h-16 items-center justify-between px-0 py-4 absolute top-[643px] left-[448px]">
                    <div className="inline-flex h-4 items-center gap-2 relative flex-[0_0_auto]">
                      <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
                        <div className="relative w-fit mt-[-1.00px] font-semibold text-colors-white-800 text-sm text-center [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                          12
                        </div>

                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          výsledky vyhľadávania
                        </div>
                      </div>

                      <img
                        className="relative w-px h-[15px] object-cover"
                        alt="Line"
                        src="/img/line-3-5.svg"
                      />

                      <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
                        <IconPx typ="cancel" />
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-red-accent-300 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          zrušiť filter
                        </div>
                      </div>
                    </div>

                    <div className="inline-flex h-4 items-center gap-2 relative flex-[0_0_auto]">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm text-center tracking-[0] leading-6 whitespace-nowrap">
                        Zoradiť
                      </div>

                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Podľa obľúbenosi
                      </div>

                      <Icon16Px35 className="!relative !w-5 !h-5 !mt-[-2.00px] !mb-[-2.00px]" />
                    </div>
                  </div>

                  <Filtracia
                    className="!absolute !left-40 !top-[643px]"
                    icon={
                      <IconPx
                        typ="arrow-down"
                        typArrowDown="/img/icon-16-px-54.png"
                        typArrowDownClassName="!h-4 !relative !left-[unset] !w-4 !top-[unset]"
                      />
                    }
                    type="default"
                  />
                </>
              )}
            </div>
          )}

          {screenWidth >= 1440 && screenWidth < 1728 && (
            <>
              <KartaVozidlaPonuka
                className="!left-[469px] !absolute !top-[1055px]"
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-42.png)]"
                property1="default"
              />
              <KartaVozidlaPonuka
                className="!left-[448px] !absolute !top-[1395px]"
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-42.png)]"
                property1="default"
              />
              <KartaVozidlaPonuka
                className="!left-[448px] !absolute !top-[1739px]"
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-42.png)]"
                property1="default"
              />
              <KartaVozidlaPonuka
                className="!left-[736px] !absolute !top-[1051px]"
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-42.png)]"
                property1="default"
              />
              <KartaVozidlaPonuka
                className="!left-[736px] !absolute !top-[1395px]"
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-42.png)]"
                property1="default"
              />
              <KartaVozidlaPonuka
                className="!left-[736px] !absolute !top-[1739px]"
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-42.png)]"
                property1="default"
              />
              <KartaVozidlaPonuka
                className="!left-[1024px] !absolute !top-[1051px]"
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-42.png)]"
                property1="default"
              />
              <KartaVozidlaPonuka
                className="!left-[1024px] !absolute !top-[1395px]"
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-42.png)]"
                property1="default"
              />
              <KartaVozidlaPonuka
                className="!left-[1024px] !absolute !top-[1739px]"
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-42.png)]"
                property1="default"
              />
              <NumberingDesktop
                className="!absolute !left-[752px] !top-[2131px]"
                type="default"
              />
            </>
          )}

          {screenWidth >= 1728 && (
            <>
              <KartaVozidlaPonukaVozidiel1728
                className="!left-[540px] !absolute !top-[1131px]"
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                type="tag-discount-DPH"
              />
              <KartaVozidlaPonukaVozidiel1728
                className="!left-[540px] !absolute !top-[1555px]"
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-30.png)]"
                type="default"
              />
              <KartaVozidlaPonukaVozidiel1728
                className="!left-[540px] !absolute !top-[1979px]"
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-30.png)]"
                type="default"
              />
              <KartaVozidlaPonukaVozidiel1728
                className="!left-[880px] !absolute !top-[1131px]"
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-30.png)]"
                type="default"
              />
              <KartaVozidlaPonukaVozidiel1728
                className="!left-[880px] !absolute !top-[1555px]"
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-30.png)]"
                type="default"
              />
              <KartaVozidlaPonukaVozidiel1728
                className="!left-[880px] !absolute !top-[1979px]"
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-30.png)]"
                type="default"
              />
              <KartaVozidlaPonukaVozidiel1728
                className="!left-[1220px] !absolute !top-[1131px]"
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-30.png)]"
                type="default"
              />
              <KartaVozidlaPonukaVozidiel1728
                className="!left-[1220px] !absolute !top-[1555px]"
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-30.png)]"
                type="default"
              />
              <KartaVozidlaPonukaVozidiel1728
                className="!left-[1220px] !absolute !top-[1979px]"
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-30.png)]"
                type="default"
              />
            </>
          )}

          {screenWidth < 744 && (
            <>
              <Frame />
              <FrameWrapper />
              <Menu className="!absolute !left-0 !top-0" type="default" />
            </>
          )}
        </div>

        {screenWidth < 744 && (
          <>
            <Group />
            <DivWrapper />
          </>
        )}

        {screenWidth >= 744 && screenWidth < 1440 && (
          <>
            <div className="inline-flex flex-col items-start gap-6 absolute top-[713px] left-8">
              <div className="flex w-[680px] h-[72px] items-center justify-center gap-2 px-6 py-4 relative bg-colors-black-600 rounded-2xl">
                <div className="relative w-6 h-6">
                  <img
                    className="absolute w-5 h-5 top-0.5 left-0.5"
                    alt="Vector stroke"
                    src="/img/vector-stroke.svg"
                  />
                </div>

                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base text-center tracking-[0] leading-6 whitespace-nowrap">
                  Filtrácia
                </div>
              </div>

              <div className="flex w-[680px] h-16 items-center justify-between px-0 py-4 relative">
                <div className="inline-flex h-4 items-center gap-2 relative flex-[0_0_auto]">
                  <div className="items-center gap-1 inline-flex relative flex-[0_0_auto]">
                    <div className="mt-[-1.00px] font-semibold text-colors-white-800 relative w-fit [font-family:'Poppins',Helvetica] text-sm text-center tracking-[0] leading-6 whitespace-nowrap">
                      12
                    </div>

                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      výsledky vyhľadávania
                    </div>
                  </div>

                  <img
                    className="relative w-px h-[15px] object-cover"
                    alt="Line"
                    src="/img/line-3-5.svg"
                  />

                  <div className="items-center gap-1 inline-flex relative flex-[0_0_auto]">
                    <Icon16Px65
                      className="!relative !w-4 !h-4"
                      color="#FF505A"
                    />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-red-accent-300 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      zrušiť filter
                    </div>
                  </div>
                </div>

                <div className="inline-flex h-4 items-center gap-2 relative flex-[0_0_auto]">
                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm text-center tracking-[0] leading-6 whitespace-nowrap">
                    Zoradiť
                  </div>

                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                    Podľa obľúbenosi
                  </div>

                  <Icon16Px35 className="!relative !w-5 !h-5 !mt-[-2.00px] !mb-[-2.00px]" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap w-[680px] items-start gap-[32px_16px] absolute top-[897px] left-8">
              <KartaVozidlaHomepage744
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-54.png)]"
                type="default"
              />
              <KartaVozidlaHomepage744
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#D7FF14"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-54.png)]"
                type="hover"
              />
              <KartaVozidlaHomepage744
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-54.png)]"
                type="default"
              />
              <KartaVozidlaHomepage744
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                type="tag-discount-DPH"
              />
              <KartaVozidlaHomepage744
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                type="tag-DPH"
              />
              <KartaVozidlaHomepage744
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-54.png)]"
                type="default"
              />
              <KartaVozidlaHomepage744
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                type="tag-DPH"
              />
              <KartaVozidlaHomepage744
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-54.png)]"
                type="default"
              />
              <KartaVozidlaHomepage744
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                type="tag-DPH"
              />
              <KartaVozidlaHomepage744
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-54.png)]"
                type="default"
              />
              <KartaVozidlaHomepage744
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                type="tag-DPH"
              />
              <KartaVozidlaHomepage744
                icon={
                  <Icon32Px44
                    className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
                    color="#BEBEC3"
                  />
                }
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-54.png)]"
                type="default"
              />
            </div>
          </>
        )}

        {((screenWidth >= 744 && screenWidth < 1440) || screenWidth < 744) && (
          <div
            className={`w-[168px] h-[88px] absolute ${screenWidth < 744 ? "left-24" : (screenWidth >= 744 && screenWidth < 1440) ? "left-72" : ""} ${screenWidth < 744 ? "top-[3336px]" : (screenWidth >= 744 && screenWidth < 1440) ? "top-[3473px]" : ""}`}
          >
            <NumberingMobile
              className="!absolute !left-0 !top-0"
              type="default"
            />
            <BackToTopButton className="!absolute !left-[11px] !top-12" />
          </div>
        )}

        {screenWidth >= 744 && screenWidth < 1440 && (
          <FooterTablet
            className="!absolute !left-0 !top-[3641px]"
            href="tel:+421 910 666 949"
            type="a"
          />
        )}

        {screenWidth >= 1440 && screenWidth < 1728 && (
          <FaqRychlyKontakt
            className="!rounded-[40px_40px_0px_0px] !absolute !left-0 !top-[2547px]"
            href="tel:+421 910 666 949"
            type="a"
          />
        )}

        {screenWidth >= 1728 && (
          <>
            <FaqRychlyKontaktFooter1728
              className="!absolute !left-0 !top-[2743px]"
              href="tel:+421 910 666 949"
              type="a"
            />
            <NumberingDesktop
              className="!absolute !left-[922px] !top-[2451px]"
              type="default"
            />
          </>
        )}

        {screenWidth < 744 && <FooterMobile />}
      </div>
    </div>
  );
};
