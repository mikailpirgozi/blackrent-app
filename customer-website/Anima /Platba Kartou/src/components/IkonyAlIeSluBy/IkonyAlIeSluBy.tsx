/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { useReducer } from "react";
import { Icon24Px22 } from "../../icons/Icon24Px22";
import { Icon24Px101 } from "../../icons/Icon24Px101";

interface Props {
  type: "default-cancel" | "hover-add" | "default-add" | "hoverr-cancel";
}

export const IkonyAlIeSluBy = ({ type }: Props): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, {
    type: type || "default-add",
  });

  return (
    <div
      className={`w-12 flex items-center gap-2 p-2 h-12 rounded-[32px] justify-center relative ${state.type === "hover-add" ? "bg-colors-dark-yellow-accent-200" : (state.type === "default-cancel") ? "bg-colors-red-accent-100" : state.type === "hoverr-cancel" ? "bg-colors-red-accent-200" : "bg-colors-dark-yellow-accent-100"}`}
      onMouseLeave={() => {
        dispatch("mouse_leave");
      }}
      onMouseEnter={() => {
        dispatch("mouse_enter");
      }}
      onClick={() => {
        dispatch("click");
      }}
    >
      {["default-add", "hover-add"].includes(state.type) && (
        <Icon24Px101 className="!relative !w-6 !h-6" color="#D7FF14" />
      )}

      {["default-cancel", "hoverr-cancel"].includes(state.type) && (
        <Icon24Px22 className="!relative !w-6 !h-6" color="#FF505A" />
      )}
    </div>
  );
};

function reducer(state: any, action: any) {
  if (state.type === "default-add") {
    switch (action) {
      case "mouse_enter":
        return {
          type: "hover-add",
        };
    }
  }

  if (state.type === "hover-add") {
    switch (action) {
      case "mouse_leave":
        return {
          type: "default-add",
        };

      case "click":
        return {
          type: "default-cancel",
        };
    }
  }

  if (state.type === "default-cancel") {
    switch (action) {
      case "mouse_enter":
        return {
          type: "hoverr-cancel",
        };
    }
  }

  if (state.type === "hoverr-cancel") {
    switch (action) {
      case "mouse_leave":
        return {
          type: "default-cancel",
        };

      case "click":
        return {
          type: "default-add",
        };
    }
  }

  return state;
}

IkonyAlIeSluBy.propTypes = {
  type: PropTypes.oneOf([
    "default-cancel",
    "hover-add",
    "default-add",
    "hoverr-cancel",
  ]),
};
