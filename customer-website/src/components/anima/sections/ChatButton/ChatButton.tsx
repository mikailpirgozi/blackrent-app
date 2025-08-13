import React from "react";

export const ChatButton = (): JSX.Element => {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="inline-flex items-center gap-2 p-8">
        <div className="relative w-[58px] h-[60px]">
          <div className="relative w-[104px] h-28 -top-3 -left-3.5 bg-[url(https://c.animaapp.com/me95zzp7lVICYW/img/union-1.svg)] bg-[100%_100%]">
            <img
              className="absolute w-[54px] h-[54px] top-3 left-3.5 cursor-pointer hover:scale-105 transition-transform"
              alt="Chat button"
              src="https://c.animaapp.com/me95zzp7lVICYW/img/union.png"
            />
            <div className="absolute w-1.5 h-1.5 top-9 left-7 bg-[#ffffff80] rounded-[3px] shadow-[inset_0px_-2px_2px_#ffffff4c,inset_2px_2px_2px_#d7ff141a]" />
            <div className="absolute w-1.5 h-1.5 top-9 left-[38px] bg-[#ffffff80] rounded-[3px] shadow-[inset_0px_-2px_2px_#ffffff4c,inset_2px_2px_2px_#d7ff141a]" />
            <div className="absolute w-1.5 h-1.5 top-9 left-12 bg-[#ffffff80] rounded-[3px] shadow-[inset_0px_-2px_2px_#ffffff4c,inset_2px_2px_2px_#d7ff141a]" />
          </div>
        </div>
      </div>
    </div>
  );
};
