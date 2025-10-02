import React from "react";

interface Props {
  color?: string;
  className?: string;
}

export const TypArrowDown = ({
  color = "#FAFAFF",
  className = "",
}: Props): JSX.Element => {
  return (
    <svg
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M8 3C8.55228 3 9 3.44772 9 4V9.58579L12.2929 6.29289C12.6834 5.90237 13.3166 5.90237 13.7071 6.29289C14.0976 6.68342 14.0976 7.31658 13.7071 7.70711L8.70711 12.7071C8.31658 13.0976 7.68342 13.0976 7.29289 12.7071L2.29289 7.70711C1.90237 7.31658 1.90237 6.68342 2.29289 6.29289C2.68342 5.90237 3.31658 5.90237 3.70711 6.29289L7 9.58579V4C7 3.44772 7.44772 3 8 3Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};
