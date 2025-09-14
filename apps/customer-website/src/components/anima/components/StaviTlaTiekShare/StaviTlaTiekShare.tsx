/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

"use client";

import PropTypes from "prop-types";
import React from "react";
import { useReducer } from "react";

interface Props {
  detailVozidlaIkonyHornaLiTa: "hover" | "default";
  union: string;
}

export const StaviTlaTiekShare = ({
  detailVozidlaIkonyHornaLiTa,
  union = "/img/union-2.svg",
}: Props): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, {
    detailVozidlaIkonyHornaLiTa: detailVozidlaIkonyHornaLiTa || "default",
  });

  return (
    <div
      className={`items-center gap-2 p-2 h-10 rounded-lg justify-center relative ${state.detailVozidlaIkonyHornaLiTa === "default" ? "w-10" : ""} ${state.detailVozidlaIkonyHornaLiTa === "hover" ? "inline-flex" : "flex"} ${state.detailVozidlaIkonyHornaLiTa === "hover" ? "bg-colors-dark-yellow-accent-100" : ""}`}
      onMouseLeave={() => {
        dispatch("mouse_leave");
      }}
      onMouseEnter={() => {
        dispatch("mouse_enter");
      }}
    >
      <div className="w-6 h-6 relative">
        <img
          className="w-[22px] left-px top-0.5 h-5 absolute"
          alt="Union"
          src={
            state.detailVozidlaIkonyHornaLiTa === "hover"
              ? "/img/union-3.svg"
              : union
          }
        />
      </div>
    </div>
  );
};

function reducer(state: any, action: any) {
  switch (action) {
    case "mouse_enter":
      return {
        ...state,
        detailVozidlaIkonyHornaLiTa: "hover",
      };

    case "mouse_leave":
      return {
        ...state,
        detailVozidlaIkonyHornaLiTa: "default",
      };
  }

  return state;
}

StaviTlaTiekShare.propTypes = {
  detailVozidlaIkonyHornaLiTa: PropTypes.oneOf(["hover", "default"]),
  union: PropTypes.string,
};
