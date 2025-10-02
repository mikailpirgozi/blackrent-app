import React from "react";
import { KartaVozidla } from "../../../../components/KartaVozidla";
import { Icon32Px44 } from "../../../../icons/Icon32Px44";

export const DivWrapper = (): JSX.Element => {
  return (
    <div className="flex flex-col w-[360px] items-center gap-6 absolute top-[824px] left-0">
      <KartaVozidla
        icon={
          <Icon32Px44
            className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
            color="#BEBEC3"
          />
        }
        nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-18.png)]"
        type="default"
      />
      <KartaVozidla
        className="!h-[unset] !flex-[0_0_auto] ![justify-content:unset]"
        frameClassName="!h-[360px] !flex-[unset] !grow-[unset]"
        icon={
          <Icon32Px44
            className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
            color="#D7FF14"
          />
        }
        nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-14.png)]"
        type="hover"
      />
      <KartaVozidla
        className="!h-[unset] !flex-[0_0_auto] ![justify-content:unset]"
        frameClassName="!h-[360px] !flex-[unset] !grow-[unset]"
        icon={
          <Icon32Px44
            className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
            color="#BEBEC3"
          />
        }
        type="tag-DPH"
      />
      <KartaVozidla
        className="!h-[unset] !flex-[0_0_auto] ![justify-content:unset]"
        frameClassName="!h-[360px] !flex-[unset] !grow-[unset]"
        icon={
          <Icon32Px44
            className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
            color="#BEBEC3"
          />
        }
        nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-18.png)]"
        type="default"
      />
      <KartaVozidla
        className="!h-[unset] !flex-[0_0_auto] ![justify-content:unset]"
        frameClassName="!h-[360px] !flex-[unset] !grow-[unset]"
        icon={
          <Icon32Px44
            className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
            color="#BEBEC3"
          />
        }
        type="tag-discount-DPH"
      />
      <KartaVozidla
        className="!h-[unset] !flex-[0_0_auto] ![justify-content:unset]"
        frameClassName="!h-[360px] !flex-[unset] !grow-[unset]"
        icon={
          <Icon32Px44
            className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
            color="#BEBEC3"
          />
        }
        nHAdVozidlaClassName="bg-[url(/img/n-h-ad-vozidla-18.png)]"
        type="default"
      />
    </div>
  );
};
