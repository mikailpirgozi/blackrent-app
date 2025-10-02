/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { useReducer } from "react";
import { Icon24Px100 } from "../../icons/Icon24Px100";

interface Props {
  stateProp: "pp" | "state-4" | "primary-def" | "oo";
  className: any;
}

export const StatePrimaryDefWrapper = ({
  stateProp,
  className,
}: Props): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, {
    state: stateProp || "primary-def",
  });

  return (
    <div
      className={`inline-flex items-center rounded-[99px] [-webkit-backdrop-filter:blur(20px)_brightness(100%)] backdrop-blur-[20px] backdrop-brightness-[100%] relative ${["oo", "pp"].includes(state.state) ? "gap-2.5" : "gap-2"} ${["oo", "pp"].includes(state.state) ? "px-6 py-1" : "pl-6 pr-1 py-1"} ${["oo", "pp"].includes(state.state) ? "h-10" : ""} ${state.state === "state-4" ? "bg-colors-light-yellow-accent-400" : (state.state === "oo") ? "bg-colors-black-800" : state.state === "pp" ? "bg-colors-black-1000" : "bg-colors-light-yellow-accent-700"} ${className}`}
      onMouseLeave={() => {
        dispatch("mouse_leave");
      }}
      onMouseEnter={() => {
        dispatch("mouse_enter");
      }}
    >
      <div
        className={`[font-family:'Poppins',Helvetica] w-fit tracking-[0] text-sm relative whitespace-nowrap leading-8 ${["primary-def", "state-4"].includes(state.state) ? "text-colors-dark-yellow-accent-100" : "text-colors-white-800"} ${["primary-def", "state-4"].includes(state.state) ? "font-semibold" : "font-medium"}`}
      >
        {["oo", "pp"].includes(state.state) && <>Naše služby</>}

        {["primary-def", "state-4"].includes(state.state) && (
          <>Ponuka vozidiel</>
        )}
      </div>

      {["primary-def", "state-4"].includes(state.state) && (
        <div className="w-8 flex items-center gap-2 px-6 py-3 h-8 overflow-hidden rounded-[99px] justify-center bg-colors-dark-yellow-accent-100 relative">
          <Icon24Px100
            className="!relative !w-6 !h-6 !mt-[-8.00px] !mb-[-8.00px] !ml-[-20.00px] !mr-[-20.00px]"
            color={state.state === "state-4" ? "#E4FF56" : "#F0FF98"}
          />
        </div>
      )}
    </div>
  );
};

function reducer(state: any, action: any) {
  if (state.state === "primary-def") {
    switch (action) {
      case "mouse_enter":
        return {
          state: "state-4",
        };
    }
  }

  if (state.state === "state-4") {
    switch (action) {
      case "mouse_leave":
        return {
          state: "primary-def",
        };
    }
  }

  if (state.state === "oo") {
    switch (action) {
      case "mouse_enter":
        return {
          state: "pp",
        };
    }
  }

  if (state.state === "pp") {
    switch (action) {
      case "mouse_leave":
        return {
          state: "oo",
        };
    }
  }

  return state;
}

StatePrimaryDefWrapper.propTypes = {
  stateProp: PropTypes.oneOf(["pp", "state-4", "primary-def", "oo"]),
};
