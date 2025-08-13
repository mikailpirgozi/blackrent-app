import React from "react";
import { KartaVozidla } from "../../../../components/KartaVozidla";

interface DivWrapperProps {
  isFilterOpen?: boolean;
}

export const DivWrapper = ({ isFilterOpen = false }: DivWrapperProps): JSX.Element => {
  return (
    <div className={`flex flex-col w-[360px] items-center gap-6 absolute left-0 transition-all duration-300 ${isFilterOpen ? 'top-[1600px]' : 'top-[824px]'}`}>
      <KartaVozidla
        className=""
        nHAdVozidlaClassName="bg-[url(https://c.animaapp.com/h23eak6p/img/n-h-ad-vozidla-18@2x.png)]"
        typArrowTopRightWrapperTypArrowTopRight="https://c.animaapp.com/h23eak6p/img/icon-32-px-54.svg"
        type="default"
      />
      <KartaVozidla
        className="!h-[unset] !flex-[0_0_auto] ![justify-content:unset]"
        frameClassName="!h-[360px] !flex-[unset] !grow-[unset]"
        nHAdVozidlaClassName="bg-[url(https://c.animaapp.com/h23eak6p/img/n-h-ad-vozidla-14@2x.png)]"
        typArrowTopRightWrapperTypArrowTopRight="https://c.animaapp.com/h23eak6p/img/icon-32-px-20.svg"
        type="hover"
      />
      <KartaVozidla
        className="!h-[unset] !flex-[0_0_auto] ![justify-content:unset]"
        frameClassName="!h-[360px] !flex-[unset] !grow-[unset]"
        typArrowTopRightWrapperTypArrowTopRight="https://c.animaapp.com/h23eak6p/img/icon-32-px-54.svg"
        type="tag-DPH"
      />
      <KartaVozidla
        className="!h-[unset] !flex-[0_0_auto] ![justify-content:unset]"
        frameClassName="!h-[360px] !flex-[unset] !grow-[unset]"
        nHAdVozidlaClassName="bg-[url(https://c.animaapp.com/h23eak6p/img/n-h-ad-vozidla-18@2x.png)]"
        typArrowTopRightWrapperTypArrowTopRight="https://c.animaapp.com/h23eak6p/img/icon-32-px-54.svg"
        type="default"
      />
      <KartaVozidla
        className="!h-[unset] !flex-[0_0_auto] ![justify-content:unset]"
        frameClassName="!h-[360px] !flex-[unset] !grow-[unset]"
        typArrowTopRightWrapperTypArrowTopRight="https://c.animaapp.com/h23eak6p/img/icon-32-px-54.svg"
        type="tag-discount-DPH"
      />
      <KartaVozidla
        className="!h-[unset] !flex-[0_0_auto] ![justify-content:unset]"
        frameClassName="!h-[360px] !flex-[unset] !grow-[unset]"
        nHAdVozidlaClassName="bg-[url(https://c.animaapp.com/h23eak6p/img/n-h-ad-vozidla-18@2x.png)]"
        typArrowTopRightWrapperTypArrowTopRight="https://c.animaapp.com/h23eak6p/img/icon-32-px-54.svg"
        type="default"
      />
    </div>
  );
};
