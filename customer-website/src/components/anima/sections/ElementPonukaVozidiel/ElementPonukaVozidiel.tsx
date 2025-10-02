"use client";

import React, { useState } from "react";
import { useWindowWidth } from "../../../../hooks/useWindowWidth";
import { BackToTopButton } from "../../components/BackToTopButton/BackToTopButton";

import { Filtracia } from "../../components/Filtracia/Filtracia";
import { EnhancedFiltracia } from "../../components/Filtracia/EnhancedFiltracia";

import { IconPx } from "../../components/IconPx";
import { ArrowIcon } from "../../components/ArrowIcon";
import { KartaVozidlaHomepage744 } from "../../components/KartaVozidlaHomepage744";
import { KartaVozidlaPonuka } from "../../components/KartaVozidlaPonuka";
import { KartaVozidlaPonukaVozidiel1728 } from "../../components/KartaVozidlaPonukaVozidiel1728";
import { ResponsiveHeader } from "../../../shared/ResponsiveHeader";
import { NumberingDesktop } from "../../components/NumberingDesktop";
import { NumberingMobile } from "../../components/NumberingMobile";
import { TypeDefaultWrapper } from "../../components/TypeDefaultWrapper";
import { TypeVyplneneDniWrapper } from "../../components/TypeVyplneneDniWrapper";
import { Filtracia744Expanded } from "../../components/Filtracia744Expanded";
import { Filtracia360Expanded } from "../../components/Filtracia360Expanded";
import { DivWrapper } from "./sections/DivWrapper";

import { Frame } from "./sections/Frame";
import { FrameWrapper } from "./sections/FrameWrapper";
import { Group } from "./sections/Group";

export const ElementPonukaVozidiel = (): JSX.Element => {
  const screenWidth = useWindowWidth();
  const [isFilter744Open, setIsFilter744Open] = useState(false);
  const [isFilter360Open, setIsFilter360Open] = useState(false);

  return (
    <div
      className="w-screen grid [align-items:start] bg-[#05050a] justify-items-center"
      data-model-id="4043:7784"
    >
      <div
        className={`bg-colors-black-100 relative ${screenWidth < 744 ? "w-[360px]" : (screenWidth >= 744 && screenWidth < 1440) ? "w-[744px]" : screenWidth >= 1440 && screenWidth < 1728 ? "w-[1440px]" : screenWidth >= 1728 ? "w-[1728px]" : ""} ${screenWidth < 744 ? (isFilter360Open ? "h-[2567px]" : "h-[1767px]") : (screenWidth >= 744 && screenWidth < 1440) ? (isFilter744Open ? "h-[2670px]" : "h-[1970px]") : screenWidth >= 1440 && screenWidth < 1728 ? "h-[2747px]" : screenWidth >= 1728 ? "h-[2887px]" : ""}`}
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



          {((screenWidth >= 1440 && screenWidth < 1728) ||
            screenWidth >= 1728) && (
            <div
              className={`left-0 top-0 absolute ${screenWidth >= 1440 && screenWidth < 1728 ? "w-[1440px]" : (screenWidth >= 1728) ? "w-[1728px]" : ""} ${screenWidth >= 1440 && screenWidth < 1728 ? "h-[2307px]" : (screenWidth >= 1728) ? "h-[2211px]" : ""}`}
            >
              {screenWidth >= 1440 && screenWidth < 1728 && (
                <img
                  className="absolute w-[1440px] h-[1000px] top-0 left-0"
                  alt="Gradient background"
                  src="/assets/misc/gradient-background.png"
                />
              )}

              {screenWidth >= 1728 && (
                <div className="absolute w-[1728px] h-[1000px] top-0 left-0 bg-colors-black-100">
                  <div className="relative w-[800px] h-[800px] top-[-200px] left-[250px] bg-colors-black-400 rounded-[400px] blur-[250px]" />
                </div>
              )}

              <div className="absolute left-0 top-0 w-full">
                <ResponsiveHeader />
              </div>
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
                          ? "/assets/misc/frame-2608587-2.png"
                          : screenWidth >= 1728
                            ? "/assets/misc/frame-2608587-1.svg"
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
                        ? "/assets/misc/line-4-2.svg"
                        : screenWidth >= 1728
                          ? "/assets/misc/line-4-1.svg"
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
                        ? "/assets/misc/line-4-2.svg"
                        : screenWidth >= 1728
                          ? "/assets/misc/line-4-1.svg"
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
                        ? "/assets/misc/line-4-2.svg"
                        : screenWidth >= 1728
                          ? "/assets/misc/line-4-1.svg"
                          : undefined
                    }
                  />

                  <div className="[font-family:'Poppins',Helvetica] w-fit mt-[-1.00px] tracking-[0] text-base text-colors-ligh-gray-800 font-normal leading-6 relative">
                    1200 spokojných <br />
                    zákazníkov ročne
                  </div>
                </div>
              </div>



              {screenWidth >= 1728 && (
                <>
                  <KartaVozidlaPonukaVozidiel1728
                    className="!absolute !left-[540px] !top-[707px]"
                    nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-42@2x.png)]"
                    typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                    type="default"
                  />
                  <KartaVozidlaPonukaVozidiel1728
                    className="!left-[880px] !absolute !top-[707px]"
                    nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-42@2x.png)]"
                    typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                    type="default"
                  />
                  <KartaVozidlaPonukaVozidiel1728
                    className="!left-[1220px] !absolute !top-[707px]"
                    typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                    type="tag-DPH"
                  />
                  <EnhancedFiltracia
                    className="!absolute !left-[200px] !top-[643px] !w-[308px]"
                    type="default"
                    vehicles={[]}
                    onFilterChange={(filters) => console.log('Filters changed (1728px):', filters)}
                    onSearch={(filters) => console.log('Search with filters (1728px):', filters)}
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
                        src="/assets/misc/line-3-6.svg"
                      />

                      <div className="items-center gap-1 inline-flex relative flex-[0_0_auto]">
                        <IconPx
                          className="!relative !left-[unset] !top-[unset]"
                          typ="cancel"
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

                      <ArrowIcon
                        className="mt-[-2.00px] mb-[-2.00px]"
                        direction="down"
                        size={16}
                      />
                    </div>
                  </div>
                </>
              )}

              {screenWidth >= 1440 && screenWidth < 1728 && (
                <>
                  <KartaVozidlaPonuka
                    className="!absolute !left-[448px] !top-[707px]"
                    nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-54@2x.png)]"
                    property1="default"
                    typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                  />
                  <KartaVozidlaPonuka
                    className="!left-[736px] !absolute !top-[707px]"
                    nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-54@2x.png)]"
                    property1="default"
                    tlaTkoClassName="!bg-colors-black-400"
                    typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                  />
                  <KartaVozidlaPonuka
                    className="!left-[1024px] !absolute !top-[707px]"
                    nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-54@2x.png)]"
                    property1="default"
                    typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
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
                        src="/assets/misc/line-3-6.svg"
                      />

                      <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
                        <IconPx
                          className="!relative !left-[unset] !top-[unset]"
                          typ="cancel"
                          typCancel="/assets/misc/icon-16-px-57.png"
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

                      <ArrowIcon
                        className="mt-[-2.00px] mb-[-2.00px]"
                        direction="down"
                        size={16}
                      />
                    </div>
                  </div>

                  <EnhancedFiltracia
                    className="!absolute !left-40 !top-[643px]"
                    type="default"
                    vehicles={[]}
                    onFilterChange={(filters) => console.log('Filters changed:', filters)}
                    onSearch={(filters) => console.log('Search with filters:', filters)}
                  />
                </>
              )}
            </div>
          )}

          {screenWidth >= 1440 && screenWidth < 1728 && (
            <>
              <KartaVozidlaPonuka
                className="!left-[469px] !absolute !top-[1055px]"
                type="tag-discount-DPH"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
              />
              <KartaVozidlaPonuka
                className="!left-[448px] !absolute !top-[1395px]"
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-54@2x.png)]"
                property1="default"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
              />
              <KartaVozidlaPonuka
                className="!left-[448px] !absolute !top-[1739px]"
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-54@2x.png)]"
                property1="default"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
              />
              <KartaVozidlaPonuka
                className="!left-[736px] !absolute !top-[1051px]"
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-54@2x.png)]"
                property1="default"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
              />
              <KartaVozidlaPonuka
                className="!left-[736px] !absolute !top-[1395px]"
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-54@2x.png)]"
                property1="default"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
              />
              <KartaVozidlaPonuka
                className="!left-[736px] !absolute !top-[1739px]"
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-54@2x.png)]"
                property1="default"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
              />
              <KartaVozidlaPonuka
                className="!left-[1024px] !absolute !top-[1051px]"
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-54@2x.png)]"
                property1="default"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
              />
              <KartaVozidlaPonuka
                className="!left-[1024px] !absolute !top-[1395px]"
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-54@2x.png)]"
                property1="default"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
              />
              <KartaVozidlaPonuka
                className="!left-[1024px] !absolute !top-[1739px]"
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-54@2x.png)]"
                property1="default"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
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
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="tag-discount-DPH"
              />
              <KartaVozidlaPonukaVozidiel1728
                className="!left-[540px] !absolute !top-[1555px]"
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-42@2x.png)]"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="default"
              />
              <KartaVozidlaPonukaVozidiel1728
                className="!left-[540px] !absolute !top-[1979px]"
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-42@2x.png)]"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="default"
              />
              <KartaVozidlaPonukaVozidiel1728
                className="!left-[880px] !absolute !top-[1131px]"
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-42@2x.png)]"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="default"
              />
              <KartaVozidlaPonukaVozidiel1728
                className="!left-[880px] !absolute !top-[1555px]"
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-42@2x.png)]"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="default"
              />
              <KartaVozidlaPonukaVozidiel1728
                className="!left-[880px] !absolute !top-[1979px]"
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-42@2x.png)]"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="default"
              />
              <KartaVozidlaPonukaVozidiel1728
                className="!left-[1220px] !absolute !top-[1131px]"
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-42@2x.png)]"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="default"
              />
              <KartaVozidlaPonukaVozidiel1728
                className="!left-[1220px] !absolute !top-[1555px]"
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-42@2x.png)]"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="default"
              />
              <KartaVozidlaPonukaVozidiel1728
                className="!left-[1220px] !absolute !top-[1979px]"
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-42@2x.png)]"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="default"
              />
            </>
          )}

          {screenWidth < 744 && (
            <>
              <Frame />
              <FrameWrapper />
              <div className="absolute left-0 top-0 w-full">
                <ResponsiveHeader />
              </div>
            </>
          )}
        </div>

        {screenWidth < 744 && (
          <>
            <Group onFilterClick={() => setIsFilter360Open(!isFilter360Open)} />
            <DivWrapper isFilterOpen={isFilter360Open} />
            
            {/* Mobilná rozbaľovacia filtrácia */}
            <div className="absolute top-[700px] left-4">
              <Filtracia360Expanded
                isOpen={isFilter360Open}
                onClose={() => setIsFilter360Open(false)}
                onSearch={(filters) => {
                  console.log('Search with filters (360px):', filters);
                  setIsFilter360Open(false);
                }}
                onFilterChange={(filters) => console.log('Filters changed (360px):', filters)}
              />
            </div>
          </>
        )}

        {screenWidth >= 744 && screenWidth < 1440 && (
          <>
            <div className="inline-flex flex-col items-start gap-6 absolute top-[713px] left-8">
              <button 
                onClick={() => setIsFilter744Open(!isFilter744Open)}
                className="flex w-[680px] h-[72px] items-center justify-center gap-2 px-6 py-4 relative bg-colors-black-600 rounded-2xl hover:bg-colors-black-500 transition-colors duration-200 cursor-pointer"
              >
                <div className="relative w-6 h-6">
                  <img
                    className="absolute w-5 h-5 top-0.5 left-0.5"
                    alt="Vector stroke"
                    src="/assets/misc/vector--stroke-.svg"
                  />
                </div>

                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base text-center tracking-[0] leading-6 whitespace-nowrap">
                  Filtrácia {isFilter744Open ? '(otvorené)' : ''}
                </div>
              </button>

              {/* Rozbaľovacia filtrácia podľa Figma designu */}
              <Filtracia744Expanded
                isOpen={isFilter744Open}
                onClose={() => setIsFilter744Open(false)}
                onSearch={(filters) => {
                  console.log('Search with filters (744px):', filters);
                  setIsFilter744Open(false);
                }}
                onFilterChange={(filters) => console.log('Filters changed (744px):', filters)}
              />

              <div className={`flex w-[680px] h-16 items-center justify-between px-0 py-4 absolute left-8 ${isFilter744Open ? 'top-[2500px]' : 'top-[800px]'} transition-all duration-300`}>
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
                    src="/assets/misc/line-3-6.svg"
                  />

                  <div className="items-center gap-1 inline-flex relative flex-[0_0_auto]">
                    <IconPx
                      className="!relative !left-[unset] !top-[unset]"
                      typ="cancel"
                      typCancel="/assets/misc/icon-16-px-55.svg"
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

                  <IconPx
                    className="!mt-[-2.00px] !mb-[-2.00px] !relative !left-[unset] !top-[unset]"
                    typ="arrow-down"
                  />
                </div>
              </div>
            </div>

            <div className={`flex flex-wrap w-[680px] items-start gap-[32px_16px] absolute left-8 ${isFilter744Open ? 'top-[2600px]' : 'top-[897px]'} transition-all duration-300`}>
              <KartaVozidlaHomepage744
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-30@2x.png)]"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="default"
              />
              <KartaVozidlaHomepage744
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-30@2x.png)]"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-20.svg"
                type="hover"
              />
              <KartaVozidlaHomepage744
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-30@2x.png)]"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="default"
              />
              <KartaVozidlaHomepage744
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="tag-discount-DPH"
              />
              <KartaVozidlaHomepage744
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="tag-DPH"
              />
              <KartaVozidlaHomepage744
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-30@2x.png)]"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="default"
              />
              <KartaVozidlaHomepage744
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="tag-DPH"
              />
              <KartaVozidlaHomepage744
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-30@2x.png)]"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="default"
              />
              <KartaVozidlaHomepage744
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="tag-DPH"
              />
              <KartaVozidlaHomepage744
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-30@2x.png)]"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="default"
              />
              <KartaVozidlaHomepage744
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="tag-DPH"
              />
              <KartaVozidlaHomepage744
                nHAdVozidlaClassName="bg-[url(/assets/misc/n-h-ad-vozidla-30@2x.png)]"
                typArrowTopRightWrapperTypArrowTopRight="/assets/misc/icon-32-px-54.svg"
                type="default"
              />
            </div>
          </>
        )}

        {((screenWidth >= 744 && screenWidth < 1440) || screenWidth < 744) && (
          <div
            className={`w-[168px] h-[88px] absolute ${screenWidth < 744 ? "left-24" : (screenWidth >= 744 && screenWidth < 1440) ? "left-72" : ""} ${screenWidth < 744 ? (isFilter360Open ? "top-[4136px]" : "top-[3336px]") : (screenWidth >= 744 && screenWidth < 1440) ? (isFilter744Open ? "top-[5173px]" : "top-[3473px]") : ""}`}
          >
            <NumberingMobile
              className="!absolute !left-0 !top-0"
              type="default"
            />
            <BackToTopButton className="!absolute !left-[11px] !top-12" />
          </div>
        )}


      </div>
    </div>
  );
};
