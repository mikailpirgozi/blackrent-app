import React from "react";

interface Props {
  color?: string;
  className?: string;
}

export const TypSearch = ({
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
        d="M7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12C8.38768 12 9.64077 11.4649 10.5735 10.5735C11.4649 9.64077 12 8.38768 12 7C12 4.23858 9.76142 2 7 2ZM0 7C0 3.13401 3.13401 0 7 0C10.866 0 14 3.13401 14 7C14 8.57285 13.4816 10.0209 12.6063 11.1932L15.7071 14.2929C16.0976 14.6834 16.0976 15.3166 15.7071 15.7071C15.3166 16.0976 14.6834 16.0976 14.2929 15.7071L11.1932 12.6063C10.0209 13.4816 8.57285 14 7 14C3.13401 14 0 10.866 0 7Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};
