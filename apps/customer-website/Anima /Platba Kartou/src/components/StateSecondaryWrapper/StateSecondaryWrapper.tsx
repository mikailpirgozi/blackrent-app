/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { useReducer } from "react";
import { Icon24Px72 } from "../../icons/Icon24Px72";

interface Props {
  stateProp: "secondary-hover-pressed" | "secondary";
  className: any;
  text: string;
}

export const StateSecondaryWrapper = ({
  stateProp,
  className,
  text = "Button",
}: Props): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, {
    state: stateProp || "secondary",
  });

  return (
    <div
      className={`inline-flex items-center gap-1.5 pl-5 pr-6 py-3 h-10 rounded-[99px] justify-center relative ${state.state === "secondary-hover-pressed" ? "bg-colors-dark-yellow-accent-200" : "bg-colors-dark-yellow-accent-100"} ${className}`}
      onMouseLeave={() => {
        dispatch("mouse_leave");
      }}
      onMouseEnter={() => {
        dispatch("mouse_enter");
      }}
    >
      <Icon24Px72 className="!relative !w-6 !h-6 !mt-[-4.00px] !mb-[-4.00px]" />
      <div className="[font-family:'Poppins',Helvetica] w-fit tracking-[0] text-sm text-colors-light-yellow-accent-100 font-medium leading-6 whitespace-nowrap relative">
        {text}
      </div>
    </div>
  );
};

function reducer(state: any, action: any) {
  switch (action) {
    case "mouse_enter":
      return {
        ...state,
        state: "secondary-hover-pressed",
      };

    case "mouse_leave":
      return {
        ...state,
        state: "secondary",
      };
  }

  return state;
}

StateSecondaryWrapper.propTypes = {
  stateProp: PropTypes.oneOf(["secondary-hover-pressed", "secondary"]),
  text: PropTypes.string,
};
