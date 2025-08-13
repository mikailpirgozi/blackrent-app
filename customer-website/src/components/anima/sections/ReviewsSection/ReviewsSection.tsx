import React from "react";

export const ReviewsSection = (): JSX.Element => {
  return (
    <section className="w-full bg-[#f0f0f5] relative overflow-hidden py-16 md:py-24 lg:py-32">
      {/* Header Section */}
      <div className="flex flex-col items-center gap-8 lg:gap-12 px-4 md:px-8 max-w-7xl mx-auto mb-16 lg:mb-24">
        <h2 className="max-w-[534px] [font-family:'SF_Pro',Helvetica] font-[870] text-2xl md:text-4xl lg:text-[48px] leading-tight lg:leading-[52px] text-center text-[#283002]">
          Skúsenosti našich zákazníkov
        </h2>
        <p className="max-w-[437px] [font-family:'Poppins',Helvetica] font-normal text-sm md:text-base leading-6 text-center text-[#55555a]">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore 
        </p>
      </div>

      {/* Floating Bubbles - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:block">
        {/* Bubble 1 - Tisíce spokojných zákazníkov ročne! */}
        <div className="absolute top-[20%] right-[10%] w-[202px] h-[72px] shadow-[0px_4px_16px_rgba(230,230,234,1)]">
          <img
            className="absolute top-0 left-0 w-[202px] h-[72px]"
            alt="Rectangle 962"
            src="/figma-assets/rectangle-962.svg"
          />
          <div className="absolute top-[14px] left-[40px] w-[126px] h-[28px] [font-family:'Poppins',Helvetica] font-medium text-sm leading-[18px] text-[#283002]">
            Tisíce spokojných<br />zákazníkov ročne!
          </div>
          <div className="absolute top-[31px] left-[170px] w-[20px] h-[14px] [font-family:'Poppins',Helvetica] font-normal text-xl leading-[18px] text-black">
            🤝
          </div>
        </div>

        {/* Bubble 2 - 4,8 hodnotení na Google */}
        <div className="absolute top-[25%] left-[8%] w-[202px] h-[72px] shadow-[0px_4px_16px_rgba(230,230,234,1)]">
          <img
            className="absolute top-0 left-0 w-[202px] h-[72px]"
            alt="Rectangle 962"
            src="/figma-assets/rectangle-962.svg"
          />
          <div className="absolute top-[33px] left-[135px] w-[18px] h-[13px] [font-family:'Poppins',Helvetica] font-normal text-lg leading-[18px] text-black">
            🤩
          </div>
          <div className="absolute top-[14px] left-[57px] w-[101px] h-[28px] [font-family:'Poppins',Helvetica] font-medium text-sm leading-[18px] text-[#283002]">
            4,8 hodnotení<br />na Google
          </div>
          <div className="absolute top-[9px] left-[10px] w-[28px] h-[23px] [font-family:'Poppins',Helvetica] font-normal text-2xl leading-6 text-black">
            🌟
          </div>
          <div className="absolute top-[29px] left-[30px] w-[22px] h-[18px] [font-family:'Poppins',Helvetica] font-normal text-xl leading-6 text-black">
            ⭐️
          </div>
        </div>

        {/* Small emoji bubbles */}
        <div className="absolute top-[18%] right-[15%] w-[66px] h-[61px] shadow-[0px_4px_16px_rgba(230,230,234,1)]">
          <img
            className="absolute top-0 left-0 w-[70px] h-[60px]"
            alt="Rectangle 962"
            src="/figma-assets/rectangle-962.svg"
          />
          <div className="absolute top-[19px] left-[12px] w-[37px] h-[15px] [font-family:'Poppins',Helvetica] font-normal text-lg leading-[18px] text-black">
            🔥🤓
          </div>
        </div>

        <div className="absolute bottom-[10%] left-[12%] w-[64px] h-[64px] shadow-[0px_4px_16px_rgba(230,230,234,1)]">
          <div className="relative w-[65px] h-[64px] bg-[#faffdc] rounded-2xl">
            <div className="absolute top-[30px] left-[17px] w-[22px] h-[17px] [font-family:'Poppins',Helvetica] font-normal text-xl leading-[17px] text-black">
              😍
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Cards - Horizontal Scroll */}
      <div className="px-4 md:px-8">
        <div className="flex gap-6 lg:gap-8 overflow-x-auto pb-4 scroll-smooth [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Desktop Card 1 - Lucia Dubecká */}
          <div className="flex-shrink-0 w-[280px] md:w-[320px] lg:w-[360px] h-[384px] flex justify-center items-center gap-2 px-1.5 py-4 rounded-3xl overflow-hidden shadow-[0px_32px_64px_rgba(8,8,12,0.2),0px_16px_32px_rgba(8,8,12,0.1)] relative" style={{
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%), url('/figma-assets/desktop-card-lucia-1.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}>
            <div className="flex flex-col w-full h-[336px] items-end gap-[148px] px-4">
              <img
                className="w-8 h-8"
                alt="Plus icon"
                src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-32-px-6.svg"
              />
              <div className="flex flex-col self-stretch gap-2 h-[172px]">
                <img
                  className="w-4 h-4"
                  alt="Quote icon"
                  src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-16-px.svg"
                />
                <div className="flex flex-col gap-6">
                  <div className="[font-family:'Poppins',Helvetica] font-semibold text-base leading-6 text-[#fafaff]">
                    Lucia Dubecká
                  </div>
                  <div className="[font-family:'Poppins',Helvetica] font-normal text-sm leading-[20px] text-[#fafaff]">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Card 1 - Jakub B. */}
          <div className="flex-shrink-0 w-[280px] md:w-[320px] lg:w-[360px] h-[384px] flex flex-col justify-between items-end gap-2 px-4 pt-4 pb-6 rounded-3xl overflow-hidden shadow-[0px_32px_64px_rgba(5,5,10,0.2),0px_16px_32px_rgba(5,5,10,0.1)] relative" style={{
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%), url('/figma-assets/mobile-card-jakub.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}>
            <img
              className="w-8 h-8"
              alt="Plus icon"
              src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-32-px-6.svg"
            />
            <div className="flex flex-col gap-2 w-full">
              <img
                className="w-4 h-4"
                alt="Quote icon"
                src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-16-px.svg"
              />
              <div className="flex flex-col gap-6">
                <div className="[font-family:'Poppins',Helvetica] font-semibold text-base leading-6 text-[#fafaff]">
                  Jakub B.
                </div>
                <div className="[font-family:'Poppins',Helvetica] font-normal text-sm leading-[20px] text-[#fafaff]">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Card 2 - Michal K. */}
          <div className="flex-shrink-0 w-[280px] md:w-[320px] lg:w-[360px] h-[384px] flex flex-col justify-between items-end gap-2 px-4 pt-4 pb-6 rounded-3xl overflow-hidden shadow-[0px_32px_64px_rgba(5,5,10,0.2),0px_16px_32px_rgba(5,5,10,0.1)] relative" style={{
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%), url('/figma-assets/mobile-card-michal.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}>
            <img
              className="w-8 h-8"
              alt="Plus icon"
              src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-32-px-6.svg"
            />
            <div className="flex flex-col gap-2 w-full">
              <img
                className="w-4 h-4"
                alt="Quote icon"
                src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-16-px.svg"
              />
              <div className="flex flex-col gap-6">
                <div className="[font-family:'Poppins',Helvetica] font-semibold text-base leading-6 text-[#fafaff]">
                  Michal K.
                </div>
                <div className="[font-family:'Poppins',Helvetica] font-normal text-sm leading-[20px] text-[#fafaff]">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Card 3 - Ondrej S. */}
          <div className="flex-shrink-0 w-[280px] md:w-[320px] lg:w-[360px] h-[384px] flex flex-col justify-between items-end gap-2 px-4 pt-4 pb-6 rounded-3xl overflow-hidden shadow-[0px_32px_64px_rgba(5,5,10,0.2),0px_16px_32px_rgba(5,5,10,0.1)] relative" style={{
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%), url('/figma-assets/mobile-card-ondrej.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}>
            <img
              className="w-8 h-8"
              alt="Plus icon"
              src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-32-px-6.svg"
            />
            <div className="flex flex-col gap-2 w-full">
              <img
                className="w-4 h-4"
                alt="Quote icon"
                src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-16-px.svg"
              />
              <div className="flex flex-col gap-6">
                <div className="[font-family:'Poppins',Helvetica] font-semibold text-base leading-6 text-[#fafaff]">
                  Ondrej S.
                </div>
                <div className="[font-family:'Poppins',Helvetica] font-normal text-sm leading-[20px] text-[#fafaff]">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Review Cards - Only visible on mobile as horizontal scroll */}
      <div className="block md:hidden mt-12">
        <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide">
          {/* Additional mobile cards can be added here */}
          <div className="flex-shrink-0 w-[280px] h-[200px] bg-white rounded-2xl p-4 shadow-lg">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="text-lg">⭐️⭐️⭐️⭐️⭐️</div>
              </div>
              <div className="[font-family:'Poppins',Helvetica] font-semibold text-sm text-[#283002]">
                Tibor M.
              </div>
              <div className="[font-family:'Poppins',Helvetica] font-normal text-xs text-[#55555a] leading-4">
                Skvelá služba, rýchle vybavenie a profesionálny prístup. Určite odporúčam!
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 w-[280px] h-[200px] bg-white rounded-2xl p-4 shadow-lg">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="text-lg">⭐️⭐️⭐️⭐️⭐️</div>
              </div>
              <div className="[font-family:'Poppins',Helvetica] font-semibold text-sm text-[#283002]">
                Anna K.
              </div>
              <div className="[font-family:'Poppins',Helvetica] font-normal text-xs text-[#55555a] leading-4">
                Perfektné autá, čisté a v skvelom stave. Prenájom prebehol bez problémov.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};