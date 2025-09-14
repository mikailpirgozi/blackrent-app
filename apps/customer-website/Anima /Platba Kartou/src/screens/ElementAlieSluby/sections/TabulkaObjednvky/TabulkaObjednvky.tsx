import React from "react";
import { TabulkaObjednVky } from "../../../../components/TabulkaObjednVky";
import { Icon24Px69 } from "../../../../icons/Icon24Px69";

export const TabulkaObjednvky = (): JSX.Element => {
  return (
    <TabulkaObjednVky
      className="!absolute !left-0 !top-[3185px]"
      primaryButtons={
        <Icon24Px69 className="!relative !w-6 !h-6" color="#141900" />
      }
      type="po-vyplnen-short"
    />
  );
};
