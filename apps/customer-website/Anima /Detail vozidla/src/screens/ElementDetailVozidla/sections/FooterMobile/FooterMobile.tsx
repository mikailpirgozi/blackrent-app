import React from "react";
import { TypeAWrapper } from "../../../../components/TypeAWrapper";
import { Icon24Px60 } from "../../../../icons/Icon24Px60";
import { Icon24Px61 } from "../../../../icons/Icon24Px61";
import { Icon24Px62 } from "../../../../icons/Icon24Px62";

export const FooterMobile = (): JSX.Element => {
  return (
    <TypeAWrapper
      className="!absolute !left-0 !top-[3770px]"
      componentBlackrentLogoClassName="bg-[url(/img/vector-34.svg)]"
      componentIcon={<Icon24Px61 className="!relative !w-6 !h-6" />}
      componentIcon1={<Icon24Px60 className="!relative !w-6 !h-6" />}
      componentVector="/img/vector-35.svg"
      href="tel:+421 910 666 949"
      override={<Icon24Px62 className="!relative !w-6 !h-6" />}
      rychlyKontaktMobilFotkaOperToraClassName="bg-[url(/img/fotka-oper-tora-8.png)]"
      rychlyKontaktMobilLine="/img/line-21-2.svg"
      rychlyKontaktMobilVector="/img/vector-36.svg"
      type="a"
    />
  );
};
