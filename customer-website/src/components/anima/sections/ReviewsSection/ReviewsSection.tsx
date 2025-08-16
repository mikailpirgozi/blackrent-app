"use client";

import React, { useState } from "react";
import { ReviewModal } from "./ReviewModal";

export const ReviewsSection = (): JSX.Element => {
  const [selectedReview, setSelectedReview] = useState<{
    name: string;
    text: string;
    backgroundImage: string;
    rating: number;
  } | null>(null);

  const reviews = [
    {
      name: "Lucia Dubecká",
      text: "Úžasná služba a profesionálny prístup! Vozidlá sú vždy čisté a v perfektnom technickom stave. Určite odporúčam! Prenájom prebehol bez akýchkoľvek problémov a personál bol veľmi ochotný a profesionálny. Autá sú moderne vybavené a v skvelom stave.",
      backgroundImage: "url('/assets/misc/desktop-card-lucia-1.png')",
      rating: 5
    },
    {
      name: "Marek Novák", 
      text: "Skvelý servis a profesionálny prístup. Autá sú vždy čisté a v perfektnom stave. Určite odporúčam! Celý proces bol rýchly a efektívny. Personál mi pomohol s výberom správneho vozidla a poskytol všetky potrebné informácie.",
      backgroundImage: "url('/assets/misc/review-bg-2.png')",
      rating: 5
    },
    {
      name: "Peter Kováč",
      text: "Fantastické vozidlá a rýchle vybavenie. Celý proces prenájmu bol bezproblémový. Vrelo odporúčam! Služba na najvyššej úrovni, autá v skvelom stave a ceny veľmi férové. Budem sa určite vracať pre ďalšie prenájmy.",
      backgroundImage: "url('/assets/misc/review-bg-3.png')",
      rating: 5
    }
  ];

  const handleCardClick = (review: typeof reviews[0]) => {
    setSelectedReview(review);
  };

  const closeModal = () => {
    setSelectedReview(null);
  };

  return (
    <section className="w-full bg-[#f0f0f5] relative overflow-hidden min-h-[1152px] max-w-[1728px] mx-auto"
      style={{ 
        width: '100%',
        maxWidth: '1728px',
        height: 'auto',
        minHeight: '1152px'
      }}>
      {/* Header Section */}
      <div className="flex flex-col items-center gap-12 absolute left-1/2 transform -translate-x-1/2 top-[200px] lg:left-[603px] lg:transform-none">
        <h2 className="w-[534px] h-[88px] [font-family:'SF_Pro',Helvetica] font-[870] text-[48px] leading-[52px] text-center text-[#283002] max-w-full px-4 lg:px-0">
          Skúsenosti našich zákazníkov
        </h2>
        <p className="w-[437px] h-8 [font-family:'Poppins',Helvetica] font-normal text-base leading-6 text-center text-[#55555a] max-w-full px-4 lg:px-0">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore 
        </p>
      </div>

      {/* Floating Bubbles - Hidden on smaller screens */}
      {/* Bubble 1 - Tisíce spokojných zákazníkov ročne! */}
      <div className="hidden xl:block absolute w-[202px] h-[72px] shadow-[0px_4px_16px_rgba(230,230,234,1)] cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-[0px_6px_24px_rgba(230,230,234,1.5)]" style={{ left: '1253px', top: '304px' }}>
        <img
          className="absolute top-0 left-0 w-[202px] h-[72px]"
          alt="Rectangle 962"
          src="/assets/misc/rectangle-962.svg"
        />
        <div className="absolute w-[126px] h-[28px] [font-family:'Poppins',Helvetica] font-medium text-sm leading-[18px] text-[#283002]" style={{ left: '40px', top: '14px' }}>
          Tisíce spokojných<br />zákazníkov ročne!
        </div>
        <div className="absolute w-[20px] h-[14px] [font-family:'Poppins',Helvetica] font-normal text-xl leading-[18px] text-black" style={{ left: '170px', top: '31px' }}>
          🤝
        </div>
      </div>

      {/* Bubble 2 - 4,8 hodnotení na Google */}
      <div className="hidden xl:block absolute w-[202px] h-[72px] shadow-[0px_4px_16px_rgba(230,230,234,1)] cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-[0px_6px_24px_rgba(230,230,234,1.5)]" style={{ left: '143px', top: '352px' }}>
        <img
          className="absolute top-0 left-0 w-[202px] h-[72px]"
          alt="Rectangle 962"
          src="/assets/misc/rectangle-962.svg"
        />
        <div className="absolute w-[18px] h-[13px] [font-family:'Poppins',Helvetica] font-normal text-lg leading-[18px] text-black" style={{ left: '135px', top: '33px' }}>
          🤩
        </div>
        <div className="absolute w-[101px] h-[28px] [font-family:'Poppins',Helvetica] font-medium text-sm leading-[18px] text-[#283002]" style={{ left: '57px', top: '14px' }}>
          4,8 hodnotení<br />na Google
        </div>
        <div className="absolute w-[28px] h-[23px] [font-family:'Poppins',Helvetica] font-normal text-2xl leading-6 text-black" style={{ left: '10px', top: '9px' }}>
          🌟
        </div>
        <div className="absolute w-[22px] h-[18px] [font-family:'Poppins',Helvetica] font-normal text-xl leading-6 text-black" style={{ left: '30px', top: '29px' }}>
          ⭐️
        </div>
      </div>

      {/* Small emoji bubble 1 */}
      <div className="hidden xl:block absolute w-[66px] h-[61px] shadow-[0px_4px_16px_rgba(230,230,234,1)] cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-[0px_6px_24px_rgba(230,230,234,1.5)]" style={{ left: '1187px', top: '280px' }}>
        <img
          className="absolute w-[70px] h-[60px]"
          alt="Rectangle 962"
          src="/assets/misc/rectangle-962.svg"
          style={{ left: '0px', top: '0px' }}
        />
        <div className="absolute w-[37px] h-[15px] [font-family:'Poppins',Helvetica] font-normal text-lg leading-[18px] text-black" style={{ left: '12px', top: '19px' }}>
          🔥🤓
        </div>
      </div>

      {/* Small emoji bubble 2 */}
      <div className="hidden xl:block absolute w-[64px] h-[64px] shadow-[0px_4px_16px_rgba(230,230,234,1)] cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-[0px_6px_24px_rgba(230,230,234,1.5)]" style={{ left: '200px', top: '920px' }}>
        <img
          className="absolute w-[65px] h-[64px] bg-[#faffdc]"
          alt="Rectangle 962"
          src="/assets/misc/rectangle-962.svg"
          style={{ left: '-1px', top: '0px' }}
        />
        <div className="absolute w-[22px] h-[17px] [font-family:'Poppins',Helvetica] font-normal text-xl leading-[17px] text-black" style={{ left: '17px', top: '30px' }}>
          😍
        </div>
      </div>

      {/* Reviews Cards - Horizontal Scroll */}
      <div className="absolute w-full flex overflow-x-auto gap-8 bg-white px-4 md:px-8 xl:px-[200px] scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ left: '0px', top: '488px' }}>
        {/* Desktop Card 1 - Lucia Dubecká */}
        <div 
          className="flex-shrink-0 w-[308px] h-[384px] flex justify-center items-center gap-2 px-1.5 py-4 rounded-3xl overflow-hidden shadow-[0px_32px_64px_rgba(8,8,12,0.2),0px_16px_32px_rgba(8,8,12,0.1)] relative cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-[0px_40px_80px_rgba(8,8,12,0.3),0px_20px_40px_rgba(8,8,12,0.15)]" 
          onClick={() => handleCardClick(reviews[0])}
          style={{
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%), url('/assets/misc/desktop-card-lucia-1.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}>
          <div className="flex flex-col w-[260px] h-[336px] items-end gap-[148px]">
            <img
              className="w-8 h-8 transition-transform duration-300 hover:rotate-90"
              alt="Plus icon"
              src="/assets/misc/icon-plus-circle-32px-alt.svg"
            />
            <div className="flex flex-col self-stretch gap-2 h-[172px]">
              <img
                className="w-4 h-4 transition-all duration-300 hover:scale-125"
                alt="Quote icon"
                src="/assets/misc/icon-quote-marks-16px.svg"
              />
              <div className="flex flex-col gap-6">
                <div className="w-[261px] [font-family:'Poppins',Helvetica] font-semibold text-base leading-6 text-[#fafaff]">
                  Lucia Dubecká
                </div>
                <div className="w-[261px] h-[104px] [font-family:'Poppins',Helvetica] font-normal text-sm leading-[20px] text-[#fafaff]">
                  Úžasná služba a profesionálny prístup! Vozidlá sú vždy čisté a v perfektnom technickom stave. Určite odporúčam!
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Desktop Card 2 - Marek Novák */}
        <div 
          className="flex-shrink-0 w-[308px] h-[384px] flex justify-center items-center gap-2 px-1.5 py-4 rounded-3xl overflow-hidden shadow-[0px_32px_64px_rgba(8,8,12,0.2),0px_16px_32px_rgba(8,8,12,0.1)] relative cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-[0px_40px_80px_rgba(8,8,12,0.3),0px_20px_40px_rgba(8,8,12,0.15)]" 
          onClick={() => handleCardClick(reviews[1])}
          style={{
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%), url('/assets/misc/review-bg-2.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}>
          <div className="flex flex-col w-[260px] h-[336px] items-end gap-[148px]">
            <img
              className="w-8 h-8 transition-transform duration-300 hover:rotate-90"
              alt="Plus icon"
              src="/assets/misc/icon-plus-circle-32px-alt.svg"
            />
            <div className="flex flex-col self-stretch gap-2 h-[172px]">
              <img
                className="w-4 h-4 transition-all duration-300 hover:scale-125"
                alt="Quote icon"
                src="/assets/misc/icon-quote-marks-16px.svg"
              />
              <div className="flex flex-col gap-6">
                <div className="w-[261px] [font-family:'Poppins',Helvetica] font-semibold text-base leading-6 text-[#fafaff]">
                  Marek Novák
                </div>
                <div className="w-[261px] h-[104px] [font-family:'Poppins',Helvetica] font-normal text-sm leading-[20px] text-[#fafaff]">
                  Skvelý servis a profesionálny prístup. Autá sú vždy čisté a v perfektnom stave. Určite odporúčam!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Card 3 - Peter Kováč */}
        <div 
          className="flex-shrink-0 w-[308px] h-[384px] flex justify-center items-center gap-2 px-1.5 py-4 rounded-3xl overflow-hidden shadow-[0px_32px_64px_rgba(8,8,12,0.2),0px_16px_32px_rgba(8,8,12,0.1)] relative cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-[0px_40px_80px_rgba(8,8,12,0.3),0px_20px_40px_rgba(8,8,12,0.15)]" 
          onClick={() => handleCardClick(reviews[2])}
          style={{
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%), url('/assets/misc/review-bg-3.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}>
          <div className="flex flex-col w-[260px] h-[336px] items-end gap-[148px]">
            <img
              className="w-8 h-8 transition-transform duration-300 hover:rotate-90"
              alt="Plus icon"
              src="/assets/misc/icon-plus-circle-32px-alt.svg"
            />
            <div className="flex flex-col self-stretch gap-2 h-[172px]">
              <img
                className="w-4 h-4 transition-all duration-300 hover:scale-125"
                alt="Quote icon"
                src="/assets/misc/icon-quote-marks-16px.svg"
              />
              <div className="flex flex-col gap-6">
                <div className="w-[261px] [font-family:'Poppins',Helvetica] font-semibold text-base leading-6 text-[#fafaff]">
                  Peter Kováč
                </div>
                <div className="w-[261px] h-[104px] [font-family:'Poppins',Helvetica] font-normal text-sm leading-[20px] text-[#fafaff]">
                  Fantastické vozidlá a rýchle vybavenie. Celý proces prenájmu bol bezproblémový. Vrelo odporúčam!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal 
        isOpen={selectedReview !== null}
        onClose={closeModal}
        review={selectedReview || reviews[0]}
      />

    </section>
  );
};