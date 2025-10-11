import React from "react";
import { useWindowWidth } from "../../breakpoints";
import { BannerStandard } from "../../components/BannerStandard";
import { ElementIconsDarkMedium } from "../../components/ElementIconsDarkMedium";
import { FaqRychlyKontakt } from "../../components/FaqRychlyKontakt";
import { FaqRychlyKontaktFooter1728 } from "../../components/FaqRychlyKontaktFooter1728";
import { FooterTablet } from "../../components/FooterTablet";
import { IconPx } from "../../components/IconPx";
import { KartaRecenzie } from "../../components/KartaRecenzie";
import { KartaRecenzieMobil } from "../../components/KartaRecenzieMobil";
import { KartaVozidlaHomepage744 } from "../../components/KartaVozidlaHomepage744";
import { KartaVozidlaHomepage1440 } from "../../components/KartaVozidlaHomepage1440";
import { LandingPageButton } from "../../components/LandingPageButton";
import { LogaAut } from "../../components/LogaAut";
import { LogaAut2 } from "../../components/LogaAut2";
import { LogaAutAnimation } from "../../components/LogaAutAnimation";
import { LogaAutAnimationWrapper } from "../../components/LogaAutAnimationWrapper";
import { Menu } from "../../components/Menu";
import { Menu1 } from "../../components/Menu1";
import { PrimaryButtons } from "../../components/PrimaryButtons";
import { PrimaryButtons40PxIcon } from "../../components/PrimaryButtons40PxIcon";
import { Recenzie } from "../../components/Recenzie";
import { StatePrimaryDefWrapper } from "../../components/StatePrimaryDefWrapper";
import { TlacitkoFilterMenu } from "../../components/TlacitkoFilterMenu";
import { TypeDefaultWrapper } from "../../components/TypeDefaultWrapper";
import { Icon16Px34 } from "../../icons/Icon16Px34";
import { Icon16Px40 } from "../../icons/Icon16Px40";
import { Icon16Px43 } from "../../icons/Icon16Px43";
import { Icon24Px20 } from "../../icons/Icon24Px20";
import { Icon24Px21 } from "../../icons/Icon24Px21";
import { Icon24Px80 } from "../../icons/Icon24Px80";
import { Icon24Px91 } from "../../icons/Icon24Px91";
import { Icon24Px101 } from "../../icons/Icon24Px101";
import { Icon24Px106 } from "../../icons/Icon24Px106";
import { Icon24Px107 } from "../../icons/Icon24Px107";
import { Icon24Px108 } from "../../icons/Icon24Px108";
import { Icon24Px111 } from "../../icons/Icon24Px111";
import { Icon32Px30 } from "../../icons/Icon32Px30";
import { Icon32Px43 } from "../../icons/Icon32Px43";
import { LogaAut7 } from "../../icons/LogaAut7";
import { LogaAut54 } from "../../icons/LogaAut54";
import { LogaAut61 } from "../../icons/LogaAut61";
import { LogaAut63 } from "../../icons/LogaAut63";
import { LogaAut68 } from "../../icons/LogaAut68";
import { LogaAut70 } from "../../icons/LogaAut70";
import { LogaAut72 } from "../../icons/LogaAut72";
import { LogaAut74 } from "../../icons/LogaAut74";
import { LogoAutaMercedes100 } from "../../icons/LogoAutaMercedes100";
import { TypArrowRight } from "../../icons/TypArrowRight";
import { TypSearch } from "../../icons/TypSearch";
import { Div } from "./sections/Div";
import { DivWrapper } from "./sections/DivWrapper";
import { FooterMobile } from "./sections/FooterMobile";
import { Frame } from "./sections/Frame";
import { Frame1 } from "./sections/Frame1";
import { FrameWrapper } from "./sections/FrameWrapper";
import { SectionComponentNode } from "./sections/SectionComponentNode";

export const ElementHomepage = (): JSX.Element => {
  const screenWidth = useWindowWidth();

  return (
    <div
      className="w-screen grid [align-items:start] bg-[#05050a] justify-items-center"
      data-model-id="10752:23289"
    >
      <div
        className={`bg-colors-black-100 ${screenWidth < 744 ? "w-[360px]" : (screenWidth >= 744 && screenWidth < 1440) ? "w-[744px]" : screenWidth >= 1440 && screenWidth < 1728 ? "w-[1440px]" : screenWidth >= 1728 ? "w-[1728px]" : ""} ${screenWidth < 744 ? "h-[8232px]" : (screenWidth >= 744 && screenWidth < 1440) ? "h-[7751px]" : screenWidth >= 1440 && screenWidth < 1728 ? "h-[7976px]" : screenWidth >= 1728 ? "h-[8088px]" : ""} ${(screenWidth >= 1440 && screenWidth < 1728) || (screenWidth >= 744 && screenWidth < 1440) ? "overflow-hidden" : ""} ${(screenWidth >= 1440 && screenWidth < 1728) || screenWidth >= 1728 || screenWidth < 744 ? "relative" : ""}`}
      >
        {((screenWidth >= 1440 && screenWidth < 1728) ||
          screenWidth >= 1728 ||
          screenWidth < 744) && (
          <div
            className={`left-0 absolute ${screenWidth >= 1440 && screenWidth < 1728 ? "w-[1440px]" : (screenWidth >= 1728) ? "w-[1528px]" : screenWidth < 744 ? "w-[360px]" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "top-[-200px]" : (screenWidth >= 1728) ? "top-[2272px]" : screenWidth < 744 ? "top-0" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "h-[800px]" : (screenWidth >= 1728) ? "h-[712px]" : screenWidth < 744 ? "h-[782px]" : ""}`}
          >
            {screenWidth >= 1440 && screenWidth < 1728 && (
              <>
                <div className="absolute w-[800px] h-[800px] top-0 left-[154px] bg-colors-black-600 rounded-[400px] blur-[250px]" />

                <Menu1
                  className="!absolute !left-0 !w-[1440px] !top-[200px]"
                  type="default"
                />
                <div className="flex flex-col w-[800px] items-center gap-10 absolute top-[408px] left-80">
                  <div className="inline-flex flex-col items-center gap-10 relative flex-[0_0_auto]">
                    <p className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedMedium',Helvetica] font-medium text-colors-light-yellow-accent-700 text-5xl text-center tracking-[0] leading-[64px]">
                      Autá pre každodennú potrebu,
                      <br />
                      aj nezabudnuteľný zážitok
                    </p>

                    <p className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-base text-center tracking-[0] leading-6">
                      Združujme desiatky preverených autopožičovní na slovensku
                      <br />s ponukou vyše 1000+ vozidiel
                    </p>
                  </div>

                  <div className="inline-flex items-start gap-6 relative flex-[0_0_auto]">
                    <StatePrimaryDefWrapper
                      className="!flex-[0_0_auto]"
                      stateProp="primary-def"
                    />
                    <StatePrimaryDefWrapper
                      className="!flex-[0_0_auto]"
                      stateProp="oo"
                    />
                  </div>
                </div>
              </>
            )}

            {screenWidth >= 1728 && (
              <>
                <div className="absolute w-[1528px] h-[712px] top-0 left-0">
                  <div className="absolute w-[480px] h-[660px] top-0 left-0">
                    <div className="absolute w-[200px] h-[250px] top-0 left-0 bg-[url(/img/vector-55.svg)] bg-[100%_100%]" />

                    <div className="absolute w-[200px] h-[250px] top-20 left-[280px] bg-[url(/img/vector-55.svg)] bg-[100%_100%]" />

                    <div className="absolute w-[200px] h-[250px] top-[330px] left-0 bg-[url(/img/vector-55.svg)] bg-[100%_100%]" />

                    <div className="absolute w-[200px] h-[250px] top-[410px] left-[280px] bg-[url(/img/vector-55.svg)] bg-[100%_100%]" />
                  </div>

                  <div className="flex w-[1328px] h-[424px] items-center justify-between pl-[113px] pr-0 py-0 absolute top-72 left-[200px] bg-colors-white-1000 rounded-3xl overflow-hidden">
                    <div className="flex flex-col w-[454px] items-start justify-center gap-12 relative">
                      <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-dark-gray-100 text-xl tracking-[0] leading-6 whitespace-nowrap">
                          🔥 Obľúbené u nás
                        </div>

                        <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedHeavy',Helvetica] font-normal text-colors-black-600 text-[40px] tracking-[0] leading-6 whitespace-nowrap">
                            TESLA Model S
                          </div>

                          <p className="relative w-[461px] mr-[-7.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-dark-gray-900 text-base tracking-[0] leading-6">
                            Ako jedna z mála autopožičovní na slovensku� máme v
                            ponuke 2 Tesly Model S. Tesly sú �dostupné k prenájmu
                            už od jedného dňa. �Či už ste priaznovcom
                            elektromobility �alebo nie, vyskúšajte si jazdu v
                            najznámejšom �elektromobile sveta.
                          </p>
                        </div>
                      </div>

                      <PrimaryButtons
                        divClassName="!text-colors-dark-yellow-accent-200"
                        override={
                          <Icon24Px111
                            className="!relative !w-6 !h-6"
                            color="#141900"
                          />
                        }
                        text="Detail ponuky"
                        tlacitkoNaTmavem="normal"
                      />
                    </div>

                    <div className="relative flex-1 self-stretch grow rounded-[32px] bg-blend-multiply bg-[url(/img/frame-968-1.png)] bg-cover bg-[50%_50%]" />

                    <div className="inline-flex items-center justify-center gap-2 absolute top-[396px] left-[642px]">
                      <div className="relative w-3 h-3 bg-colors-ligh-gray-200 rounded-[99px]" />

                      <div className="relative w-2 h-2 bg-colors-ligh-gray-800 rounded-[99px]" />

                      <div className="relative w-2 h-2 bg-colors-ligh-gray-800 rounded-[99px]" />
                    </div>
                  </div>
                </div>

                <PrimaryButtons
                  className="!absolute !left-[768px] !top-0"
                  override={
                    <Icon24Px111
                      className="!relative !w-6 !h-6"
                      color="#141900"
                    />
                  }
                  text="Všetky vozidlá"
                  tlacitkoNaTmavem="normal"
                />
              </>
            )}

            {screenWidth < 744 && (
              <>
                <div className="absolute w-[360px] h-[600px] top-4 left-0 bg-colors-black-100">
                  <div className="absolute w-[318px] h-[318px] -top-20 left-0 bg-colors-black-400 rounded-[159px] blur-[100px]" />

                  <img
                    className="absolute w-[130px] h-[216px] top-[248px] left-0"
                    alt="Group"
                    src="/img/group-984.png"
                  />

                  <img
                    className="absolute w-[130px] h-[216px] top-[248px] left-[230px]"
                    alt="Group"
                    src="/img/group-985.png"
                  />
                </div>

                <Frame />
                <FrameWrapper />
                <Menu className="!absolute !left-0 !top-0" type="default" />
              </>
            )}
          </div>
        )}

        {screenWidth < 744 && (
          <>
            <DivWrapper />
            <LogaAutAnimation
              className="!absolute !left-0 !overflow-hidden !w-[360px] !top-[846px]"
              gradientZPravaClassName="!left-80"
              icon={<LogaAut54 className="!w-6 !relative !h-[60px]" />}
              icon1={<LogaAut logoAuta="mustang-100" />}
              icon2={<LogaAut logoAuta="opel-100" />}
              icon3={<LogaAut logoAuta="skoda-100" />}
              icon4={<LogaAut logoAuta="tesla-100" />}
              icon5={<LogaAut logoAuta="volkswagen-100" />}
              icon6={<LogaAut logoAuta="audi-100" />}
              icon7={<LogaAut logoAuta="chevrolet-100" />}
              logaAut="default-mobil"
              override={<LogaAut logoAuta="mercedes-100" />}
            />
            <Div />
            <SectionComponentNode />
          </>
        )}

        {screenWidth >= 744 && screenWidth < 1440 && (
          <div className="relative w-[844px] h-[7747px] left-[-45px]">
            <div className="absolute w-[744px] h-[600px] top-0 left-[45px] bg-colors-black-100">
              <div className="relative w-[600px] h-[600px] top-[-200px] bg-colors-black-400 rounded-[300px] blur-[150px]" />
            </div>

            <div className="absolute w-[217px] h-80 top-32 left-[627px]">
              <div className="absolute w-[89px] h-[89px] top-[231px] left-32 bg-colors-red-accent-300 rounded-lg" />

              <div className="w-[113px] h-[113px] top-[103px] left-[103px] absolute bg-colors-red-accent-300 rounded-lg" />

              <div className="w-[89px] h-[89px] top-0 left-32 absolute bg-colors-red-accent-300 rounded-lg" />

              <div className="w-16 h-16 top-[79px] left-[25px] absolute bg-colors-red-accent-300 rounded-lg" />

              <div className="w-[89px] h-[89px] top-[158px] left-0 absolute bg-colors-red-accent-300 rounded-lg" />
            </div>

            <div className="absolute w-[217px] h-80 top-32 left-0">
              <div className="w-[89px] h-[89px] top-[231px] left-0 absolute bg-colors-red-accent-300 rounded-lg" />

              <div className="w-[113px] h-[113px] top-[103px] left-0 absolute bg-colors-red-accent-300 rounded-lg" />

              <div className="w-[89px] h-[89px] top-0 left-0 absolute bg-colors-red-accent-300 rounded-lg" />

              <div className="w-16 h-16 top-[175px] left-32 absolute bg-colors-red-accent-300 rounded-lg" />

              <div className="w-[89px] h-[89px] top-[73px] left-32 absolute bg-colors-red-accent-300 rounded-lg" />
            </div>

            <TypeDefaultWrapper
              className="!absolute !left-[45px] !top-0"
              type="default"
            />
            <div className="flex flex-col w-[504px] items-center gap-10 absolute top-32 left-[165px]">
              <div className="inline-flex flex-col items-center gap-6 relative flex-[0_0_auto]">
                <p className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedMedium',Helvetica] font-medium text-colors-light-yellow-accent-700 text-2xl text-center tracking-[0] leading-8">
                  Autá pre každodennú potrebu,
                  <br />
                  aj nezabudnuteľný zážitok
                </p>

                <p className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm text-center tracking-[0] leading-5">
                  Združujme desiatky preverených autopožičovní <br />
                  na slovensku s ponukou vyše 1000+ vozidiel
                </p>
              </div>

              <LandingPageButton
                icon={<Icon16Px40 className="!w-4 !relative !h-4" />}
                property1="default"
              />
            </div>

            <div className="absolute w-[744px] h-[7315px] top-[432px] left-[45px]">
              <div className="absolute w-[712px] h-[2064px] top-[508px] left-0">
                <img
                  className="w-[277px] h-[357px] top-[1197px] absolute left-0"
                  alt="Vector"
                  src="/img/vector-35.svg"
                />

                <PrimaryButtons
                  className="!absolute !left-[276px] !top-[1336px]"
                  divClassName="!text-colors-dark-yellow-accent-200"
                  override={
                    <Icon24Px111
                      className="!relative !w-6 !h-6"
                      color="#141900"
                    />
                  }
                  text="Všetky vozidlá"
                  tlacitkoNaTmavem="normal"
                />
                <div className="flex flex-wrap w-[680px] items-start gap-[32px_16px] absolute top-0 left-8">
                  <KartaVozidlaHomepage744
                    icon={
                      <Icon32Px43
                        className="!mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px] !relative !w-8 !h-8"
                        color="#BEBEC3"
                      />
                    }
                    nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-24.png)]"
                    type="default"
                  />
                  <KartaVozidlaHomepage744
                    icon={
                      <Icon32Px43
                        className="!mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px] !relative !w-8 !h-8"
                        color="#D7FF14"
                      />
                    }
                    nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-24.png)]"
                    type="hover"
                  />
                  <KartaVozidlaHomepage744
                    icon={
                      <Icon32Px43
                        className="!mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px] !relative !w-8 !h-8"
                        color="#BEBEC3"
                      />
                    }
                    nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-24.png)]"
                    type="default"
                  />
                  <KartaVozidlaHomepage744
                    icon={
                      <Icon32Px43
                        className="!mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px] !relative !w-8 !h-8"
                        color="#BEBEC3"
                      />
                    }
                    type="tag-discount-DPH"
                  />
                  <KartaVozidlaHomepage744
                    icon={
                      <Icon32Px43
                        className="!mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px] !relative !w-8 !h-8"
                        color="#BEBEC3"
                      />
                    }
                    type="tag-DPH"
                  />
                  <KartaVozidlaHomepage744
                    icon={
                      <Icon32Px43
                        className="!mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px] !relative !w-8 !h-8"
                        color="#BEBEC3"
                      />
                    }
                    nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-24.png)]"
                    type="default"
                  />
                </div>

                <div className="flex flex-col w-[680px] h-[560px] items-start pt-16 pb-0 px-0 absolute top-[1504px] left-8 bg-colors-white-1000 rounded-[32px] overflow-hidden">
                  <div className="flex flex-col items-start justify-center gap-8 px-16 py-0 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col items-start gap-8 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-dark-gray-100 text-base tracking-[0] leading-6 whitespace-nowrap">
                        🔥 Obľúbené u nás
                      </div>

                      <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedHeavy',Helvetica] font-normal text-colors-black-600 text-[40px] tracking-[0] leading-6 whitespace-nowrap">
                          TESLA Model S
                        </div>

                        <p className="relative self-stretch font-mobil-text-mobil-14-reg font-[number:var(--mobil-text-mobil-14-reg-font-weight)] text-colors-dark-gray-900 text-[length:var(--mobil-text-mobil-14-reg-font-size)] tracking-[var(--mobil-text-mobil-14-reg-letter-spacing)] leading-[var(--mobil-text-mobil-14-reg-line-height)] [font-style:var(--mobil-text-mobil-14-reg-font-style)]">
                          Ako jedna z mála autopožičovní na slovensku� máme v
                          ponuke 2 Tesly Model S. Tesly sú �dostupné k prenájmu
                          už od jedného dňa. �Či už ste priaznovcom
                          elektromobility �alebo nie, vyskúšajte si jazdu v
                          najznámejšom �elektromobile sveta.
                        </p>
                      </div>
                    </div>

                    <div className="pl-6 pr-5 py-2 inline-flex h-10 items-center justify-center gap-1.5 relative bg-colors-light-yellow-accent-100 rounded-[99px]">
                      <button className="all-[unset] box-border text-colors-dark-yellow-accent-100 text-base relative w-fit [font-family:'Poppins',Helvetica] font-semibold tracking-[0] leading-6 whitespace-nowrap">
                        Detail ponuky
                      </button>

                      <Icon24Px111
                        className="!relative !w-6 !h-6"
                        color="#141900"
                      />
                    </div>
                  </div>

                  <div className="inline-flex items-center justify-center gap-2 absolute top-[532px] left-[314px]">
                    <div className="relative w-3 h-3 bg-colors-ligh-gray-200 rounded-[99px]" />

                    <div className="relative w-2 h-2 bg-colors-ligh-gray-200 rounded-[99px]" />

                    <div className="relative w-2 h-2 bg-colors-ligh-gray-200 rounded-[99px]" />
                  </div>

                  <img
                    className="absolute w-[680px] h-[259px] top-[301px] left-0 bg-blend-multiply"
                    alt="Frame"
                    src="/img/frame-969-1.png"
                  />
                </div>
              </div>

              <div className="flex flex-col w-[538px] items-center gap-6 pt-8 pb-6 px-6 absolute top-0 left-[103px] rounded-3xl overflow-hidden border border-solid border-colors-black-600 backdrop-blur-[30px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(30px)_brightness(100%)] bg-[linear-gradient(180deg,rgba(30,30,35,1)_0%,rgba(10,10,15,1)_100%)] bg-colors-black-200">
                <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                  <p className="relative self-stretch h-4 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-2xl tracking-[0] leading-6 whitespace-nowrap">
                    Požičajte si auto už dnes
                  </p>

                  <p className="relative self-stretch h-4 [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                    Rýchlo, jednoducho a bez skyrytých poplatkov 🙈
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-[16px_8px] p-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-400 rounded-lg">
                  <div className="flex flex-col items-center justify-center gap-4 relative flex-1 grow">
                    <div className="flex items-center justify-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <TlacitkoFilterMenu
                        className="!flex-1 !grow !w-[unset]"
                        divClassName="!text-colors-ligh-gray-800 !text-sm"
                        icon={
                          <Icon24Px20
                            className="!relative !w-6 !h-6"
                            color="#E4FF56"
                          />
                        }
                        state="default"
                        text="Miesto vyzdvihnutia"
                      />
                      <TlacitkoFilterMenu
                        className="!flex-1 !grow !w-[unset]"
                        divClassName="!text-colors-ligh-gray-800 !text-sm"
                        icon={
                          <Icon24Px21
                            className="!relative !w-6 !h-6"
                            color="#E4FF56"
                          />
                        }
                        state="default"
                        text="Dátum vyzdvihnutia"
                      />
                    </div>

                    <div className="flex items-center justify-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <TlacitkoFilterMenu
                        className="!flex-1 !grow !w-[unset]"
                        divClassName="!text-colors-ligh-gray-800 !text-sm"
                        icon={
                          <Icon24Px21
                            className="!relative !w-6 !h-6"
                            color="#E4FF56"
                          />
                        }
                        state="default"
                        text="Dátum vrátenia"
                      />
                      <PrimaryButtons
                        className="!flex-1 !justify-center !flex !grow"
                        override={
                          <Icon24Px80 className="!relative !w-6 !h-6" />
                        }
                        text="Vyhľadať"
                        tlacitkoNaTmavem="normal"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col w-[744px] items-center gap-20 pt-[120px] pb-40 px-0 absolute top-[2772px] left-0 bg-colors-white-1000 rounded-[40px_40px_0px_0px] overflow-hidden">
                <div className="h-[571px] top-[575px] left-0 bg-[url(/img/vector-36.svg)] bg-[100%_100%] absolute w-[277px]" />

                <div className="flex flex-col w-[680px] items-center gap-10 relative flex-[0_0_auto]">
                  <div className="relative self-stretch h-10 mt-[-1.00px] [font-family:'SF_Pro-ExpandedHeavy',Helvetica] font-normal text-colors-black-600 text-5xl text-center tracking-[0] leading-[48px] whitespace-nowrap">
                    Blackrent store
                  </div>

                  <p className="relative w-[650px] h-10 [font-family:'Poppins',Helvetica] font-normal text-colors-dark-gray-900 text-xl text-center tracking-[0] leading-7">
                    Vyber si svoj kúsok z našej štýlovej&nbsp;&nbsp;kolekcie
                    oblečenia <br />
                    alebo venuj darčekový poukaz 😎
                  </p>
                </div>

                <div className="relative w-[506px] h-[538px]">
                  <div className="absolute w-[157px] h-[156px] top-[63px] left-12 bg-colors-ligh-gray-800 rounded-2xl" />

                  <div className="absolute w-[281px] h-[281px] top-[257px] left-0 bg-colors-ligh-gray-800 rounded-2xl" />

                  <div className="absolute w-[219px] h-[219px] top-0 left-[242px] bg-colors-ligh-gray-800 rounded-2xl" />

                  <div className="absolute w-[187px] h-[187px] top-[294px] left-[319px] bg-colors-ligh-gray-800 rounded-2xl" />
                </div>

                <PrimaryButtons
                  override={<Icon24Px91 className="!relative !w-6 !h-6" />}
                  text="Všetky produkty"
                  tlacitkoNaTmavem="normal"
                />
              </div>

              <div className="absolute w-[744px] h-[3397px] top-[3918px] left-0">
                <div className="flex flex-col w-[744px] items-start gap-10 pt-[120px] pb-40 px-8 absolute top-0 left-0 bg-colors-white-800 overflow-hidden">
                  <div className="flex flex-col w-[680px] items-center gap-10 relative flex-[0_0_auto]">
                    <div className="flex flex-col items-center gap-10 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="relative self-stretch h-[88px] mt-[-1.00px] [font-family:'SF_Pro-ExpandedHeavy',Helvetica] font-normal text-colors-dark-yellow-accent-200 text-5xl text-center tracking-[0] leading-[48px]">
                        Skúsenosti našich <br />
                        zákazníkov
                      </div>

                      <p className="self-stretch h-10 text-colors-dark-gray-900 text-base text-center leading-6 relative [font-family:'Poppins',Helvetica] font-normal tracking-[0]">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,{" "}
                        <br />
                        sed do eiusmod tempor incididunt ut labore
                      </p>
                    </div>

                    <div className="relative w-[268px] h-24">
                      <div className="absolute w-[202px] h-[72px] top-6 left-[66px] shadow-[0px_4px_16px_#e6e6ea]">
                        <div className="relative w-[195px] h-[65px] left-[7px] bg-[url(/img/rectangle-962-4.svg)] bg-[100%_100%]">
                          <div className="absolute h-7 top-[13px] left-[33px] rotate-[0.10deg] [font-family:'Poppins',Helvetica] font-medium text-colors-dark-yellow-accent-200 text-sm tracking-[0] leading-[18px]">
                            Tisíce spokojných
                            <br />
                            zákazníkov ročne!
                          </div>

                          <div className="absolute h-3.5 top-[30px] left-[163px] font-normal text-black text-xl leading-[18px] [font-family:'Poppins',Helvetica] tracking-[0] whitespace-nowrap">
                            🤝
                          </div>
                        </div>
                      </div>

                      <div className="absolute w-[66px] h-[61px] top-0 left-0 shadow-[0px_4px_16px_#e6e6ea]">
                        <div className="relative w-[62px] h-14 top-px left-px bg-[url(/img/rectangle-962-5.svg)] bg-[100%_100%]">
                          <div className="absolute h-[13px] top-[19px] left-[11px] rotate-[4.00deg] font-normal text-black text-lg leading-[18px] [font-family:'Poppins',Helvetica] tracking-[0] whitespace-nowrap">
                            🔥🤓
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="inline-flex items-start gap-8 relative flex-[0_0_auto] mr-[-988.00px]">
                    <KartaRecenzieMobil
                      className="!h-96 !w-[308px]"
                      frameClassName="!self-stretch !mr-[unset] !flex !w-full"
                      text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                      text1="Lucia Dubecká"
                      type="mobile"
                    />
                    <KartaRecenzieMobil
                      className="!h-96 bg-[url(/img/karta-recenzie-mobil-13.png)] !w-[308px]"
                      frameClassName="!self-stretch !mr-[unset] !flex !w-full"
                      text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                      text1="Jakub B."
                      type="mobile"
                    />
                    <KartaRecenzieMobil
                      className="!h-96 bg-[url(/img/karta-recenzie-mobil-14.png)] !w-[308px]"
                      frameClassName="!self-stretch !mr-[unset] !flex !w-full"
                      frameClassNameOverride="!mt-[-7176px]"
                      icon={<Icon16Px43 className="!w-2 !relative !h-4" />}
                      text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                      text1="Tibor Straka"
                      type="mobile"
                    />
                    <KartaRecenzieMobil
                      className="!h-96 bg-[url(/img/karta-recenzie-mobil-15.png)] !w-[308px]"
                      frameClassName="!self-stretch !mr-[unset] !flex !w-full"
                      frameClassNameOverride="!mt-[-7176px]"
                      text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                      text1="Michal Stanko"
                      type="mobile"
                    />
                    <KartaRecenzieMobil
                      className="!h-96 bg-[url(/img/karta-recenzie-mobil-16.png)] !w-[308px]"
                      frameClassName="!self-stretch !mr-[unset] !flex !w-full"
                      frameClassNameOverride="!mt-[-7176px]"
                      text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                      text1="Ondrej"
                      type="mobile"
                    />
                  </div>

                  <div className="relative w-16 h-16 shadow-[0px_4px_16px_#e6e6ea]">
                    <div className="relative w-[54px] h-[58px] top-[5px] left-px bg-[url(/img/rectangle-962-19.svg)] bg-[100%_100%]">
                      <div className="absolute h-3.5 top-[25px] left-[17px] rotate-[-8.00deg] font-normal text-black text-xl leading-[18px] [font-family:'Poppins',Helvetica] tracking-[0] whitespace-nowrap">
                        😍
                      </div>
                    </div>
                  </div>
                </div>

                <FooterTablet
                  className="!absolute !left-0 !top-[1072px]"
                  href="tel:+421 910 666 949"
                  propertyDefaultWrapperEMailNewsletterPrimaryButtons40PxIconIcon={
                    <TypArrowRight
                      className="!w-4 !relative !h-4"
                      color="#141900"
                    />
                  }
                  type="a"
                />
              </div>

              <LogaAutAnimation
                className="!absolute !left-0 !overflow-hidden !w-[744px] !top-96"
                gradientZPravaClassName="!left-[704px]"
                icon={<LogaAut68 className="!relative !w-[60px] !h-[60px]" />}
                icon1={<LogaAut61 className="!relative !w-[60px] !h-[60px]" />}
                icon2={<LogaAut7 className="!relative !w-[60px] !h-[60px]" />}
                icon3={<LogaAut63 className="!relative !w-[60px] !h-[60px]" />}
                icon4={<LogaAut logoAuta="tesla-100" />}
                icon5={<LogaAut logoAuta="volkswagen-100" />}
                icon6={<LogaAut logoAuta="audi-100" />}
                icon7={<LogaAut logoAuta="chevrolet-100" />}
                logaAut="default-mobil"
                override={
                  <LogoAutaMercedes100 className="!relative !w-[60px] !h-[60px]" />
                }
              />
            </div>
          </div>
        )}

        {screenWidth >= 1440 && screenWidth < 1728 && (
          <>
            <div className="flex flex-col w-[928px] h-[232px] items-center justify-end pt-10 pb-6 px-10 absolute top-[640px] left-64 rounded-3xl overflow-hidden border border-solid border-colors-black-600 backdrop-blur-[30px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(30px)_brightness(100%)] bg-[linear-gradient(180deg,rgba(30,30,35,1)_0%,rgba(10,10,15,1)_100%),linear-gradient(180deg,rgba(20,20,25,1)_0%,rgba(10,10,15,1)_100%)] bg-colors-black-200">
              <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto] mt-[-1.00px]">
                <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                  <p className="relative self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-[32px] tracking-[0] leading-6">
                    Požičajte si auto už dnes
                  </p>

                  <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-base tracking-[0] leading-6">
                    Rýchlo, jednoducho a bez skyrytých poplatkov 🙈
                  </p>
                </div>

                <div className="flex items-center gap-4 p-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-400 rounded-2xl">
                  <div className="flex items-center justify-center gap-4 relative flex-1 grow">
                    <TlacitkoFilterMenu
                      className="!flex-1 !grow !w-[unset]"
                      divClassName="!text-colors-ligh-gray-800"
                      icon={<Icon24Px101 className="!relative !w-6 !h-6" />}
                      state="default"
                      text="Miesto vyzdvihnutia"
                    />
                    <TlacitkoFilterMenu
                      className="!flex-1 !grow !w-[unset]"
                      divClassName="!text-colors-ligh-gray-800"
                      icon={
                        <Icon24Px21
                          className="!relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                      }
                      state="default"
                      text="Dátum vyzdvihnutia"
                    />
                    <TlacitkoFilterMenu
                      className="!flex-1 !grow !w-[unset]"
                      divClassName="!text-colors-ligh-gray-800"
                      icon={
                        <Icon24Px21
                          className="!relative !w-6 !h-6"
                          color="#E4FF56"
                        />
                      }
                      state="default"
                      text="Dátum vrátenia"
                    />
                  </div>

                  <div className="flex w-12 justify-center relative h-12 items-center bg-colors-light-yellow-accent-100 rounded-[99px]">
                    <TypSearch
                      className="!relative !w-6 !h-6"
                      color="#141900"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Recenzie
              className="!h-[1152px] !fixed !left-0 !top-[4664px]"
              overlapClassName="bg-[url(/img/rectangle-962-19.svg)]"
              override={
                <Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />
              }
              recenzieDesktopKartaRecenzieIcon={<IconPx typ="quote-marks" />}
              recenzieDesktopKartaRecenzieIcon1={<IconPx typ="quote-marks" />}
              recenzieDesktopKartaRecenzieMobilFrameClassName="!mt-[-6838px]"
              recenzieDesktopKartaRecenzieMobilFrameClassNameOverride="!mt-[-6838px]"
              recenzieDesktopKartaRecenzieMobilIcon={
                <Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />
              }
              recenzieDesktopKartaRecenzieMobilIcon1={
                <Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />
              }
              type="a"
            />
            <FaqRychlyKontakt
              className="!fixed !left-0 !top-[5776px]"
              footerBlackrentLogoClassName="bg-[url(/img/vector-50.svg)]"
              footerEMailNewsletterPrimaryButtons40PxIconIcon={
                <TypArrowRight
                  className="!relative !w-4 !h-4"
                  color="#141900"
                />
              }
              footerIcon={<Icon24Px106 className="!relative !w-6 !h-6" />}
              footerIcon1={<Icon24Px108 className="!relative !w-6 !h-6" />}
              footerVector="/img/vector-49.svg"
              href="tel:+421 910 666 949"
              override={<Icon24Px107 className="!relative !w-6 !h-6" />}
              rychlyKontaktFotkaOperToraClassName="bg-[url(/img/fotka-oper-tora-11.png)]"
              rychlyKontaktLine="/img/line-9-8.svg"
              rychlyKontaktVector="/img/vector-51.svg"
              type="a"
            />
          </>
        )}

        {((screenWidth >= 1440 && screenWidth < 1728) || screenWidth < 744) && (
          <div
            className={`left-0 ${screenWidth >= 1440 && screenWidth < 1728 ? "w-[480px]" : (screenWidth < 744) ? "w-[360px]" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "top-[2113px]" : (screenWidth < 744) ? "top-[5074px]" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "h-[660px]" : (screenWidth < 744) ? "h-[3158px]" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "fixed" : (screenWidth < 744) ? "absolute" : ""}`}
          >
            {screenWidth >= 1440 && screenWidth < 1728 && (
              <>
                <div className="absolute w-[200px] h-[250px] top-0 left-0 bg-[url(/img/vector-55.svg)] bg-[100%_100%]" />

                <div className="absolute w-[200px] h-[250px] top-20 left-[280px] bg-[url(/img/vector-55.svg)] bg-[100%_100%]" />

                <div className="absolute w-[200px] h-[250px] top-[330px] left-0 bg-[url(/img/vector-55.svg)] bg-[100%_100%]" />

                <div className="absolute w-[200px] h-[250px] top-[410px] left-[280px] bg-[url(/img/vector-55.svg)] bg-[100%_100%]" />
              </>
            )}

            {screenWidth < 744 && (
              <>
                <Frame1 />
                <FooterMobile />
              </>
            )}
          </div>
        )}

        {screenWidth >= 1440 && screenWidth < 1728 && (
          <>
            <LogaAutAnimationWrapper
              className="!fixed !left-0 !overflow-hidden !w-[1440px] !top-[992px]"
              gradientZPravaClassName="!left-[1272px]"
              icon={<LogaAut70 className="!w-[100px] !relative !h-[100px]" />}
              icon1={<LogaAut74 className="!w-[34px] !relative !h-[100px]" />}
              icon2={
                <LogaAut2
                  logoAuta="audi-100"
                  logoAutaAudi="/img/loga-aut.png"
                  logoAutaAudiClassName="!mr-[-82364.00px] !mb-[-10996.06px] !relative !left-[unset] !top-[unset]"
                />
              }
              icon3={
                <LogaAut2
                  logoAuta="chevrolet-100"
                  logoAutaAudiClassName="!mr-[-82512.00px] !mb-[-10996.06px] !relative !left-[unset] !top-[unset]"
                  logoAutaChevrolet="/img/image.png"
                />
              }
              override={
                <LogaAut72 className="!w-[100px] !relative !h-[100px]" />
              }
            />
            <div className="fixed w-[1120px] h-[848px] top-[1176px] left-40">
              <KartaVozidlaHomepage1440
                className="!absolute !left-0 !top-0"
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-30.png)]"
                type="default"
              />
              <KartaVozidlaHomepage1440
                className="!left-96 !absolute !top-0"
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-30.png)]"
                type="default"
              />
              <KartaVozidlaHomepage1440
                className="!left-[768px] !absolute !top-0"
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-30.png)]"
                type="default"
              />
              <KartaVozidlaHomepage1440
                className="!left-0 !absolute !top-[456px]"
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-30.png)]"
                type="default"
              />
              <KartaVozidlaHomepage1440
                className="!left-96 !absolute !top-[456px]"
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-30.png)]"
                type="default"
              />
              <KartaVozidlaHomepage1440
                className="!left-[768px] !absolute !top-[456px]"
                nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-30.png)]"
                type="default"
              />
            </div>

            <PrimaryButtons
              className="!fixed !left-[624px] !top-[2144px]"
              override={
                <Icon24Px111 className="!relative !w-6 !h-6" color="#141900" />
              }
              text="Všetky vozidlá"
              tlacitkoNaTmavem="normal"
            />
          </>
        )}

        {((screenWidth >= 1440 && screenWidth < 1728) ||
          screenWidth >= 1728) && (
          <div
            className={`left-0 h-[1568px] overflow-hidden rounded-[40px_40px_0px_0px] bg-colors-white-1000 ${screenWidth >= 1728 ? "w-[1728px]" : (screenWidth >= 1440 && screenWidth < 1728) ? "w-[1440px]" : ""} ${screenWidth >= 1728 ? "top-[3264px]" : (screenWidth >= 1440 && screenWidth < 1728) ? "top-[3096px]" : ""} ${screenWidth >= 1728 ? "absolute" : (screenWidth >= 1440 && screenWidth < 1728) ? "fixed" : ""}`}
          >
            {screenWidth >= 1728 && (
              <div className="absolute w-[476px] h-[982px] top-[586px] left-0 bg-[url(/img/vector-44.svg)] bg-[100%_100%]" />
            )}

            {screenWidth >= 1440 && screenWidth < 1728 && (
              <div className="absolute w-[1044px] h-[1120px] top-[448px] left-0">
                <div className="absolute w-[1044px] h-[1120px] top-0 left-0">
                  <div className="absolute w-[476px] h-[982px] top-[138px] left-0 bg-[url(/img/vector-56.svg)] bg-[100%_100%]" />

                  <img
                    className="absolute w-[648px] h-[688px] top-0 left-[396px]"
                    alt="Group"
                    src="/img/group-996-1.png"
                  />
                </div>

                <PrimaryButtons
                  className="!absolute !left-[616px] !top-[872px]"
                  override={<Icon24Px91 className="!relative !w-6 !h-6" />}
                  text="Všetky produkty"
                  tlacitkoNaTmavem="normal"
                />
              </div>
            )}

            <div
              className={`w-[1084px] flex flex-col items-center top-[200px] gap-12 absolute ${screenWidth >= 1728 ? "left-[322px]" : (screenWidth >= 1440 && screenWidth < 1728) ? "left-[178px]" : ""}`}
            >
              <div className="[font-family:'SF_Pro-ExpandedHeavy',Helvetica] w-[439px] mt-[-1.00px] tracking-[0] text-5xl text-colors-black-600 h-8 font-normal text-center whitespace-nowrap leading-[48px] relative">
                Blackrent store
              </div>

              <p className="[font-family:'Poppins',Helvetica] w-[650px] tracking-[0] text-2xl text-colors-dark-gray-900 h-12 font-normal text-center leading-8 relative">
                Vyber si svoj kúsok z našej štýlovej&nbsp;&nbsp;kolekcie
                oblečenia <br />
                alebo venuj darčekový poukaz 😎
              </p>
            </div>

            {screenWidth >= 1728 && (
              <>
                <PrimaryButtons
                  className="!absolute !left-[760px] !top-[1320px]"
                  override={<Icon24Px91 className="!relative !w-6 !h-6" />}
                  text="Všetky produkty"
                  tlacitkoNaTmavem="normal"
                />
                <img
                  className="absolute w-[648px] h-[688px] top-[448px] left-[540px]"
                  alt="Group"
                  src="/img/group-996.png"
                />
              </>
            )}
          </div>
        )}

        {screenWidth >= 1440 && screenWidth < 1728 && (
          <>
            <BannerStandard
              className="!fixed !left-40 !top-[2392px]"
              frameClassName="!rounded-[40px] !bg-[50%_50%] bg-[url(/img/frame-968-2.png)] !bg-cover"
              primaryButtons={
                <Icon24Px111 className="!relative !w-6 !h-6" color="#141900" />
              }
              type="two"
            />
            <ElementIconsDarkMedium
              className="!fixed !left-[1373px] !top-[817px]"
              overlapGroupClassName="bg-[url(/img/union-5.svg)] !w-[81px]"
              type="message-hover"
              union="/img/union-6.svg"
            />
          </>
        )}

        {screenWidth >= 1728 && (
          <>
            <div className="absolute w-[1728px] h-[3256px] top-[4832px] left-0">
              <div className="h-[1152px] top-0 bg-colors-white-800 absolute w-[1728px] left-0">
                <div className="inline-flex flex-col items-center gap-12 absolute top-[200px] left-[603px]">
                  <div className="relative w-[534px] h-[88px] mt-[-1.00px] [font-family:'SF_Pro-ExpandedHeavy',Helvetica] font-normal text-colors-dark-yellow-accent-200 text-5xl text-center tracking-[0] leading-[52px]">
                    Skúsenosti našich <br />
                    zákazníkov
                  </div>

                  <p className="w-[437px] h-8 text-colors-dark-gray-600 text-base text-center leading-6 relative [font-family:'Poppins',Helvetica] font-normal tracking-[0]">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore
                  </p>
                </div>

                <div className="absolute w-[202px] h-[72px] top-[304px] left-[1253px] shadow-[0px_4px_16px_#e6e6ea]">
                  <div className="relative w-[195px] h-[65px] left-[7px] bg-[url(/img/rectangle-962-4.svg)] bg-[100%_100%]">
                    <div className="absolute h-7 top-[13px] left-[33px] rotate-[0.10deg] [font-family:'Poppins',Helvetica] font-medium text-colors-dark-yellow-accent-200 text-sm tracking-[0] leading-[18px]">
                      Tisíce spokojných
                      <br />
                      zákazníkov ročne!
                    </div>

                    <div className="h-3.5 top-[30px] left-[163px] text-xl absolute [font-family:'Poppins',Helvetica] font-normal text-black tracking-[0] leading-[18px] whitespace-nowrap">
                      🤝
                    </div>
                  </div>
                </div>

                <img
                  className="absolute w-[227px] h-[97px] top-[340px] left-[127px]"
                  alt="Bublina recenzie"
                  src="/img/bublina-recenzie-1.png"
                />

                <div className="absolute w-[66px] h-[61px] top-[280px] left-[1187px] shadow-[0px_4px_16px_#e6e6ea]">
                  <div className="relative w-[62px] h-14 top-px left-px bg-[url(/img/rectangle-962-5.svg)] bg-[100%_100%]">
                    <div className="h-[13px] top-[19px] left-[11px] rotate-[4.00deg] text-lg absolute [font-family:'Poppins',Helvetica] font-normal text-black tracking-[0] leading-[18px] whitespace-nowrap">
                      🔥🤓
                    </div>
                  </div>
                </div>

                <div className="absolute w-16 h-16 top-[920px] left-[200px] shadow-[0px_4px_16px_#e6e6ea]">
                  <div className="relative w-[54px] h-[58px] top-[5px] left-px bg-[url(/img/rectangle-962-19.svg)] bg-[100%_100%]">
                    <div className="h-3.5 top-[25px] left-[17px] rotate-[-8.00deg] text-xl absolute [font-family:'Poppins',Helvetica] font-normal text-black tracking-[0] leading-[18px] whitespace-nowrap">
                      😍
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-8 pl-[200px] pr-8 py-0 top-[488px] overflow-x-scroll absolute w-[1728px] left-0">
                  <KartaRecenzie
                    icon={
                      <Icon16Px34
                        className="!relative !w-4 !h-4"
                        color="#D7FF14"
                      />
                    }
                    type="default"
                  />
                  <div className="bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.2)_100%)] flex flex-col w-[308px] h-96 items-end justify-between pt-4 pb-6 px-4 relative rounded-3xl overflow-hidden shadow-[0px_32px_64px_#05050a33,0px_16px_32px_#05050a1a]">
                    <Icon32Px30 className="!relative !w-8 !h-8" />
                    <img
                      className="flex-1 grow mb-[-3.78px] relative self-stretch w-full"
                      alt="Frame"
                      src="/img/frame-491.svg"
                    />
                  </div>

                  <KartaRecenzieMobil
                    className="!h-96 bg-[url(/img/karta-recenzie-mobil-14.png)] !w-[308px]"
                    frameClassName="!self-stretch !mr-[unset] !flex !w-full"
                    icon={
                      <Icon16Px34
                        className="!relative !w-4 !h-4"
                        color="#D7FF14"
                      />
                    }
                    text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    text1="Tibor Straka"
                    type="mobile"
                  />
                  <KartaRecenzieMobil
                    className="!h-96 bg-[url(/img/karta-recenzie-mobil-15.png)] !w-[308px]"
                    frameClassName="!self-stretch !mr-[unset] !flex !w-full"
                    icon={
                      <Icon16Px34
                        className="!relative !w-4 !h-4"
                        color="#D7FF14"
                      />
                    }
                    text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    text1="Michal Stanko"
                    type="mobile"
                  />
                  <KartaRecenzieMobil
                    className="!h-96 bg-[url(/img/karta-recenzie-mobil-16.png)] !w-[308px]"
                    frameClassName="!self-stretch !mr-[unset] !flex !w-full"
                    frameClassNameOverride="!mt-[-6670px]"
                    icon={
                      <Icon16Px34
                        className="!relative !w-4 !h-4"
                        color="#D7FF14"
                      />
                    }
                    text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    text1="Ondrej"
                    type="mobile"
                  />
                  <KartaRecenzie
                    icon={<IconPx typ="quote-marks" />}
                    type="default"
                  />
                  <KartaRecenzie
                    icon={<IconPx typ="quote-marks" />}
                    type="default"
                  />
                </div>
              </div>

              <FaqRychlyKontaktFooter1728
                className="!absolute !left-0 !top-[1112px]"
                footerWrapperEMailNewsletterPrimaryButtons40PxIconIcon={
                  <TypArrowRight
                    className="!relative !w-4 !h-4"
                    color="#141900"
                  />
                }
                href="tel:+421 910 666 949"
                type="a"
              />
              <div className="flex flex-col w-[298px] items-start gap-4 p-4 absolute top-[1187px] left-[54px] bg-colors-light-yellow-accent-1000 rounded-lg border-2 border-solid border-colors-light-yellow-accent-100">
                <a
                  className="relative w-fit mt-[-2.00px] [font-family:'Inter',Helvetica] font-normal text-colors-black-600 text-xs tracking-[0] leading-[normal] underline whitespace-nowrap"
                  href="https://turo.com/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  https://turo.com/
                </a>

                <p className="relative self-stretch [font-family:'Inter',Helvetica] font-normal text-colors-black-600 text-xs tracking-[0] leading-[normal]">
                  Časté otázky zobrazenie podľa webu Turo
                </p>
              </div>

              <div className="top-[1187px] left-[390px] bg-colors-red-accent-300 flex flex-col w-[298px] items-start gap-4 p-4 absolute rounded-lg border-2 border-solid border-colors-red-accent-300">
                <p className="relative self-stretch mt-[-2.00px] [font-family:'Inter',Helvetica] font-bold text-colors-white-1000 text-xs tracking-[0] leading-[normal]">
                  Poznámka z 2. 8. 2024
                  <br />
                  <br />
                  23. 8. 2024 – Nieje opravené
                </p>
              </div>

              <div className="top-[2225px] left-[1396px] bg-colors-red-accent-300 flex flex-col w-[298px] items-start gap-4 p-4 absolute rounded-lg border-2 border-solid border-colors-red-accent-300">
                <p className="relative self-stretch mt-[-2.00px] [font-family:'Inter',Helvetica] font-bold text-colors-white-1000 text-xs tracking-[0] leading-[normal]">
                  Pattern v pätičke (call) z 2. 8. 2024
                  <br />
                  <br />
                  23. 8. 2024 – Nieje opravené
                </p>
              </div>

              <div className="top-10 left-[35px] bg-colors-light-yellow-accent-1000 border-colors-light-yellow-accent-100 flex flex-col w-[298px] items-start gap-4 p-4 absolute rounded-lg border-2 border-solid">
                <a
                  className="relative w-fit mt-[-2.00px] [font-family:'Inter',Helvetica] font-normal text-black text-xs tracking-[0] leading-[normal] underline whitespace-nowrap"
                  href="https://www.visitestonia.com/en"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  https://www.visitestonia.com/en
                </a>

                <div className="relative self-stretch [font-family:'Inter',Helvetica] font-normal text-colors-black-600 text-xs tracking-[0] leading-[normal]">
                  Posuvník Referencie
                </div>
              </div>
            </div>

            <div className="absolute w-[1728px] h-[2592px] top-[-400px] left-0">
              <div className="absolute w-[800px] h-[800px] top-0 left-[250px] bg-colors-black-600 rounded-[400px] blur-[250px]" />

              <img
                className="absolute w-[1728px] h-[2192px] top-[400px] left-0"
                alt="Group"
                src="/img/group-1025.png"
              />
            </div>
          </>
        )}

        {screenWidth < 744 && (
          <PrimaryButtons40PxIcon
            className="!absolute !left-[99px] !top-[3482px]"
            icon={
              <TypArrowRight className="!relative !w-4 !h-4" color="#141900" />
            }
            text="Všetky vozidlá"
            tlacitkoNaTmavemem40="tlacitko-na-tmavemem-403"
          />
        )}
      </div>
    </div>
  );
};
