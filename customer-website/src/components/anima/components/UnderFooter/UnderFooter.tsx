/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";

interface Props {
  property1?: "default";
}

export const UnderFooter = ({ property1 }: Props): JSX.Element => {
  return (
    <div className="flex w-[360px] h-20 items-center justify-center gap-2 px-4 py-2 relative bg-black">
      <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-black-1000 text-[10px] text-center tracking-[0] leading-[14px]">
        © 2024 blackrent.sk
        <br />| Obchodné podmienky | Pravidlá pre súbory cookies | Reklamačný
        poriadok |&nbsp;&nbsp;Ochrana osobných údajov
      </p>
    </div>
  );
};
