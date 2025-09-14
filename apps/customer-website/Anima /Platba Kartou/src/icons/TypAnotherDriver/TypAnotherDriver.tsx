/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";

interface Props {
  color: string;
  className: any;
}

export const TypAnotherDriver = ({
  color = "#FAFAFF",
  className,
}: Props): JSX.Element => {
  return (
    <svg
      className={`${className}`}
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_9904_19867)">
        <path
          d="M5 1C5 0.447715 4.55228 0 4 0C3.44772 0 3 0.447715 3 1V3H1C0.447715 3 0 3.44772 0 4C0 4.55228 0.447715 5 1 5H3V7C3 7.55228 3.44772 8 4 8C4.55228 8 5 7.55228 5 7V5H7C7.55228 5 8 4.55228 8 4C8 3.44772 7.55228 3 7 3H5V1Z"
          fill={color}
        />

        <path
          clipRule="evenodd"
          d="M17.7219 15.7064C19.1098 14.6075 20.0002 12.9077 20.0002 11C20.0002 7.68629 17.3139 5 14.0002 5C10.6865 5 8.00024 7.68629 8.00024 11C8.00024 12.9076 8.89041 14.6074 10.2781 15.7064C7.21831 16.9087 4.8349 19.5383 4.03009 22.7575C3.89615 23.2933 4.22191 23.8362 4.7577 23.9701C5.2935 24.1041 5.83643 23.7783 5.97038 23.2425C6.86052 19.682 10.1815 17 13.9999 17C17.8184 17 21.14 19.6821 22.0301 23.2425C22.164 23.7783 22.707 24.1041 23.2428 23.9701C23.7786 23.8362 24.1043 23.2933 23.9704 22.7575C23.1656 19.5382 20.7818 16.9088 17.7219 15.7064ZM14.0002 7C11.7911 7 10.0002 8.79086 10.0002 11C10.0002 13.2092 11.7908 15 13.9999 15C16.2091 15 18.0002 13.209 18.0002 11C18.0002 8.79086 16.2094 7 14.0002 7Z"
          fill={color}
          fillRule="evenodd"
        />

        <path
          d="M14.0001 21C12.5355 21 11.2942 21.9935 10.9682 23.251C10.8296 23.7856 10.2839 24.1066 9.74928 23.968C9.21467 23.8294 8.89364 23.2836 9.03225 22.749C9.59514 20.5779 11.6574 19 14.0001 19C16.3427 19 18.4053 20.5778 18.9682 22.749C19.1068 23.2836 18.7858 23.8294 18.2512 23.968C17.7166 24.1066 17.1708 23.7856 17.0322 23.251C16.7063 21.9936 15.4647 21 14.0001 21Z"
          fill={color}
        />
      </g>

      <defs>
        <clipPath id="clip0_9904_19867">
          <rect fill="white" height="24" width="24" />
        </clipPath>
      </defs>
    </svg>
  );
};

TypAnotherDriver.propTypes = {
  color: PropTypes.string,
};
