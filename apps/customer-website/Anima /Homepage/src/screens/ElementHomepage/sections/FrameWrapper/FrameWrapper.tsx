import React from "react";
import { PrimaryButtons } from "../../../../components/PrimaryButtons";
import { TlacitkoFilterMenu } from "../../../../components/TlacitkoFilterMenu";
import { Icon24Px20 } from "../../../../icons/Icon24Px20";
import { Icon24Px21 } from "../../../../icons/Icon24Px21";
import { TypSearch } from "../../../../icons/TypSearch";

export const FrameWrapper = (): JSX.Element => {
  return (
    <div className="flex flex-col w-[328px] items-center pt-6 pb-4 px-4 absolute top-96 left-4 rounded-2xl overflow-hidden border border-solid border-colors-black-600 bg-[linear-gradient(180deg,rgba(30,30,35,1)_0%,rgba(10,10,15,1)_100%)] bg-colors-black-200">
      <div className="flex flex-col items-center gap-6 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col h-[62px] items-center gap-2 px-4 py-0 relative self-stretch w-full">
          <div className="flex flex-col h-[62px] items-start justify-end gap-4 relative self-stretch w-full">
            <p className="relative w-[289px] mr-[-25.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xl tracking-[0] leading-7">
              Požičajte si auto už dnes
            </p>

            <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs tracking-[0] leading-[18px]">
              Rýchlo, jednoducho a bez <br />
              skyrytých poplatkov 🙈
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-end gap-6 p-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-400 rounded-lg">
          <div className="flex flex-col items-center justify-end gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <TlacitkoFilterMenu
              className="!self-stretch !h-12 !w-full"
              divClassName="!text-colors-ligh-gray-800 !text-sm"
              icon={
                <Icon24Px20 className="!relative !w-6 !h-6" color="#E4FF56" />
              }
              state="default"
              text="Miesto vyzdvihnutia"
            />
            <TlacitkoFilterMenu
              className="!self-stretch !h-12 !w-full"
              divClassName="!text-colors-ligh-gray-800 !text-sm"
              icon={
                <Icon24Px21 className="!relative !w-6 !h-6" color="#E4FF56" />
              }
              state="default"
              text="Dátum vyzdvihnutia"
            />
            <TlacitkoFilterMenu
              className="!self-stretch !h-12 !w-full"
              divClassName="!text-colors-ligh-gray-800 !text-sm"
              icon={
                <Icon24Px21 className="!relative !w-6 !h-6" color="#E4FF56" />
              }
              state="default"
              text="Dátum vrátenia"
            />
          </div>

          <PrimaryButtons
            className="!self-stretch !h-10 !justify-center !flex !w-full"
            override={
              <TypSearch className="!relative !w-6 !h-6" color="#141900" />
            }
            text="Vyhľadať"
            tlacitkoNaTmavem="normal"
          />
        </div>
      </div>
    </div>
  );
};
