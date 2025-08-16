/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { TypAnotherDriver } from "../../icons/TypAnotherDriver";
import { TypBike } from "../../icons/TypBike";
import { TypKidCarSeat } from "../../icons/TypKidCarSeat";
import { IkonyAlIeSluBy } from "../IkonyAlIeSluBy";

interface Props {
  type: "al-vodi-defautl" | "bicykle-defautl" | "autoseda-ka-selected";
  className: any;
  vector: string;
  icon: JSX.Element;
}

export const AlIeSluBy = ({
  type,
  className,
  vector = "/img/vector-64-2.svg",
  icon = <TypKidCarSeat className="!relative !w-6 !h-6" color="#BEBEC3" />,
}: Props): JSX.Element => {
  return (
    <div
      className={`w-[238px] flex flex-col items-start pt-6 pb-4 px-4 h-[200px] overflow-hidden rounded-2xl justify-between bg-colors-black-300 relative ${className}`}
    >
      <div
        className={`w-full flex self-stretch flex-col items-start gap-4 pl-2 pr-0 py-0 relative ${["al-vodi-defautl", "bicykle-defautl"].includes(type) ? "flex-[0_0_auto]" : ""} ${type === "autoseda-ka-selected" ? "h-[78px]" : ""}`}
      >
        {["al-vodi-defautl", "bicykle-defautl"].includes(type) && (
          <>
            <div className="inline-flex items-start gap-2 flex-[0_0_auto] relative">
              {type === "al-vodi-defautl" && (
                <TypAnotherDriver
                  className="!relative !w-6 !h-6"
                  color="#BEBEC3"
                />
              )}

              {type === "bicykle-defautl" && (
                <TypBike className="!relative !w-6 !h-6" color="#BEBEC3" />
              )}
            </div>

            <div className="[font-family:'Poppins',Helvetica] self-stretch tracking-[0] text-xl text-colors-ligh-gray-800 font-medium leading-6 relative">
              {type === "al-vodi-defautl" && <>Ďalší vodič</>}

              {type === "bicykle-defautl" && <>Nosič na bicykle</>}
            </div>
          </>
        )}

        {type === "autoseda-ka-selected" && (
          <div className="flex flex-col h-[78px] items-start gap-4 pl-2 pr-0 py-0 relative self-stretch w-full">
            <div className="inline-flex items-start gap-2 relative flex-[0_0_auto]">
              {icon}
            </div>

            <div className="relative self-stretch [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-xl tracking-[0] leading-6">
              Detská autosedačka
            </div>
          </div>
        )}
      </div>

      <div className="w-full flex self-stretch flex-col items-start gap-4 flex-[0_0_auto] relative">
        <img
          className="w-full self-stretch mt-[-0.50px] object-cover h-px relative"
          alt="Vector"
          src={vector}
        />

        <div className="w-full flex self-stretch items-center flex-[0_0_auto] pl-2 pr-0 py-0 justify-between relative">
          <div
            className={`[font-family:'Poppins',Helvetica] w-fit tracking-[0] text-base text-colors-white-800 relative whitespace-nowrap leading-6 ${type === "al-vodi-defautl" ? "font-semibold" : "font-normal"}`}
          >
            {type === "al-vodi-defautl" && <>34€</>}

            {["autoseda-ka-selected", "bicykle-defautl"].includes(type) && (
              <>
                <span className="text-[#f0f0f5] font-semibold">
                  {type === "bicykle-defautl" && <>12€</>}

                  {type === "autoseda-ka-selected" && <>6€</>}
                </span>

                <p>
                  <span className="text-[#a0a0a5]">/deň</span>
                </p>
              </>
            )}
          </div>

          <IkonyAlIeSluBy
            type={
              type === "autoseda-ka-selected" ? "default-cancel" : "default-add"
            }
          />
        </div>
      </div>
    </div>
  );
};

AlIeSluBy.propTypes = {
  type: PropTypes.oneOf([
    "al-vodi-defautl",
    "bicykle-defautl",
    "autoseda-ka-selected",
  ]),
  vector: PropTypes.string,
};
