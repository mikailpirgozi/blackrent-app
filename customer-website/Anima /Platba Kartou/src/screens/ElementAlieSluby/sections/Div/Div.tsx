import React from "react";
import { AlIeSluBy } from "../../../../components/AlIeSluBy";

export const Div = (): JSX.Element => {
  return (
    <div className="flex flex-col w-[328px] items-start gap-8 absolute top-[2409px] left-4">
      <div className="inline-flex h-4 items-center justify-center gap-2 px-4 py-0 relative">
        <div className="relative w-[159px] h-4 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
          Ďalšie služby
        </div>
      </div>

      <div className="flex flex-col h-[648px] items-start gap-6 relative self-stretch w-full">
        <AlIeSluBy
          className="!self-stretch !w-full"
          type="al-vodi-defautl"
          vector="/img/vector-64-5.svg"
        />
        <AlIeSluBy
          className="!self-stretch !w-full"
          type="autoseda-ka-selected"
          vector="/img/vector-64-5.svg"
        />
        <AlIeSluBy
          className="!self-stretch !h-[unset] !flex-1 !grow !w-full"
          type="bicykle-defautl"
          vector="/img/vector-64-5.svg"
        />
      </div>
    </div>
  );
};
