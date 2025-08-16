/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { useReducer } from "react";
import { Icon24Px27 } from "../../icons/Icon24Px27";

interface Props {
  secondaryBig: "secondary-hover-pressed" | "secondary";
  className: any;
  text: string;
  icon24Px27StyleOverrideClassName: any;
  divClassName: any;
}

export const SecondaryButtons = ({
  secondaryBig,
  className,
  text = "Button",
  icon24Px27StyleOverrideClassName,
  divClassName,
}: Props): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, {
    secondaryBig: secondaryBig || "secondary",
  });

  return (
    <div
      className={`inline-flex items-center gap-1.5 pl-5 pr-6 py-3 h-12 rounded-[99px] justify-center relative ${state.secondaryBig === "secondary-hover-pressed" ? "bg-colors-dark-yellow-accent-200" : "bg-colors-dark-yellow-accent-100"} ${className}`}
      onMouseLeave={() => {
        dispatch("mouse_leave");
      }}
      onMouseEnter={() => {
        dispatch("mouse_enter");
      }}
    >
      <Icon24Px27
        className={icon24Px27StyleOverrideClassName}
        color="#D7FF14"
      />
      <div
        className={`[font-family:'Poppins',Helvetica] w-fit tracking-[0] text-sm text-colors-light-yellow-accent-100 font-medium leading-6 whitespace-nowrap relative ${divClassName}`}
      >
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
        secondaryBig: "secondary-hover-pressed",
      };

    case "mouse_leave":
      return {
        ...state,
        secondaryBig: "secondary",
      };
  }

  return state;
}

SecondaryButtons.propTypes = {
  secondaryBig: PropTypes.oneOf(["secondary-hover-pressed", "secondary"]),
  text: PropTypes.string,
};
