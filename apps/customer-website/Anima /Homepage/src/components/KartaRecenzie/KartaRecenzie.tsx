/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { useReducer } from "react";
import { Icon16Px34 } from "../../icons/Icon16Px34";
import { Icon32Px33 } from "../../icons/Icon32Px33";

interface Props {
  type: "hover" | "default";
  icon: JSX.Element;
}

export const KartaRecenzie = ({
  type,
  icon = <Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />,
}: Props): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, {
    type: type || "default",
  });

  return (
    <div
      className="flex items-center shadow-[0px_32px_64px_#08080c33,0px_16px_32px_#08080c1a] px-1.5 py-4 bg-[50%_50%] relative w-[308px] bg-[url(/img/type-hover.png)] rounded-3xl bg-cover gap-2 h-96 overflow-hidden justify-center"
      onMouseEnter={() => {
        dispatch("mouse_enter");
      }}
      onMouseLeave={() => {
        dispatch("mouse_leave");
      }}
    >
      <div className="w-[260px] flex flex-col items-end gap-[148px] h-[336px] relative">
        <Icon32Px33
          className="!relative !w-8 !h-8"
          color={state.type === "hover" ? "#D7FF14" : "#FAFAFF"}
        />
        <div className="w-full flex self-stretch flex-col items-start gap-2 h-[172px] mb-[-16.00px] relative">
          {icon}
          <div className="inline-flex flex-col items-start mr-[-1.00px] gap-6 flex-[0_0_auto] relative">
            <div className="[font-family:'Poppins',Helvetica] w-[261px] mt-[-1.00px] tracking-[0] text-base text-colors-white-1000 font-semibold leading-6 relative">
              Lucia Dubecká
            </div>

            <p className="[font-family:'Poppins',Helvetica] w-[261px] tracking-[0] text-sm text-colors-white-1000 h-[104px] font-normal leading-5 relative">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet,
              consectetur adipiscing elit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function reducer(state: any, action: any) {
  switch (action) {
    case "mouse_enter":
      return {
        ...state,
        type: "hover",
      };

    case "mouse_leave":
      return {
        ...state,
        type: "default",
      };
  }

  return state;
}

KartaRecenzie.propTypes = {
  type: PropTypes.oneOf(["hover", "default"]),
};
