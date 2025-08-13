import React from "react";
import { Card, CardContent } from "../../../../components/ui/card";

export const ReviewsSection = (): JSX.Element => {
  const decorativeElements = [
    {
      className:
        "absolute w-[202px] h-[72px] top-[304px] left-[1253px] shadow-[0px_4px_16px_#e6e6ea] bg-[url(https://c.animaapp.com/me95zzp7lVICYW/img/rectangle-962.svg)] bg-[100%_100%]",
      text: "Tisíce spokojných\nzákazníkov ročne!",
      emoji: "🤝",
      textClass:
        "absolute h-7 top-[13px] left-10 rotate-[0.10deg] [font-family:'Poppins',Helvetica] font-medium text-[#283002] text-sm tracking-[0] leading-[18px]",
      emojiClass:
        "absolute h-3.5 top-[30px] left-[170px] font-normal text-black text-xl leading-[18px] [font-family:'Poppins',Helvetica] tracking-[0] whitespace-nowrap",
    },
    {
      className:
        "absolute w-[66px] h-[61px] top-[280px] left-[1187px] shadow-[0px_4px_16px_#e6e6ea]",
      containerClass:
        "relative w-[70px] h-[60px] bg-[url(https://c.animaapp.com/me95zzp7lVICYW/img/rectangle-962-1.svg)] bg-[100%_100%]",
      emoji: "🔥🤓",
      emojiClass:
        "absolute h-[13px] top-[19px] left-3 rotate-[4deg] font-normal text-black text-lg leading-[18px] [font-family:'Poppins',Helvetica] tracking-[0] whitespace-nowrap",
    },
    {
      className:
        "absolute w-16 h-16 top-[920px] left-[200px] shadow-[0px_4px_16px_#e6e6ea]",
      containerClass:
        "relative w-[65px] h-16 -left-px bg-[url(https://c.animaapp.com/me95zzp7lVICYW/img/rectangle-962-2.svg)] bg-[100%_100%]",
      emoji: "😍",
      emojiClass:
        "absolute h-3.5 top-[30px] left-[19px] rotate-[-8deg] font-normal text-black text-xl leading-[18px] [font-family:'Poppins',Helvetica] tracking-[0] whitespace-nowrap",
    },
  ];

  const reviewCards = [
    {
      className:
        "items-center justify-center gap-2 px-1.5 py-4 shadow-[0px_32px_64px_#08080c33,0px_16px_32px_#08080c1a] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.2)_100%),url(https://c.animaapp.com/me95zzp7lVICYW/img/karta-recenzie-desktop-2.png)_50%_50%_/_cover] flex w-[308px] h-96 relative rounded-3xl overflow-hidden",
      topIcon: "https://c.animaapp.com/me95zzp7lVICYW/img/icon-32-px-6.svg",
      starIcon: "https://c.animaapp.com/me95zzp7lVICYW/img/icon-16-px.svg",
      name: "Lucia Dubecká",
      review:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    },
    {
      className:
        "flex-col items-end justify-between pt-4 pb-6 px-4 shadow-[0px_32px_64px_#05050a33,0px_16px_32px_#05050a1a] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.2)_100%)] flex w-[308px] h-96 relative rounded-3xl overflow-hidden",
      topIcon: "https://c.animaapp.com/me95zzp7lVICYW/img/icon-32-px-4.svg",
      frameImage: "https://c.animaapp.com/me95zzp7lVICYW/img/frame-491.svg",
      isFrameCard: true,
    },
    {
      className:
        "bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.2)_100%),url(https://c.animaapp.com/me95zzp7lVICYW/img/karta-recenzie-mobil.png)_50%_50%_/_cover] flex flex-col w-[308px] h-96 items-end justify-between pt-4 pb-6 px-4 relative rounded-3xl overflow-hidden shadow-[0px_32px_64px_#05050a33,0px_16px_32px_#05050a1a]",
      topIcon: "https://c.animaapp.com/me95zzp7lVICYW/img/icon-32-px-4.svg",
      starIcon: "https://c.animaapp.com/me95zzp7lVICYW/img/icon-16-px.svg",
      name: "Tibor Straka",
      review:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    },
    {
      className:
        "bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.2)_100%),url(https://c.animaapp.com/me95zzp7lVICYW/img/karta-recenzie-mobil-1.png)_50%_50%_/_cover] flex flex-col w-[308px] h-96 items-end justify-between pt-4 pb-6 px-4 relative rounded-3xl overflow-hidden shadow-[0px_32px_64px_#05050a33,0px_16px_32px_#05050a1a]",
      topIcon: "https://c.animaapp.com/me95zzp7lVICYW/img/icon-32-px-4.svg",
      starIcon: "https://c.animaapp.com/me95zzp7lVICYW/img/icon-16-px.svg",
      name: "Michal Stanko",
      review:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    },
    {
      className:
        "mr-[-172.00px] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.2)_100%),url(https://c.animaapp.com/me95zzp7lVICYW/img/karta-recenzie-mobil-2.png)_50%_50%_/_cover] flex flex-col w-[308px] h-96 items-end justify-between pt-4 pb-6 px-4 relative rounded-3xl overflow-hidden shadow-[0px_32px_64px_#05050a33,0px_16px_32px_#05050a1a]",
      topIcon: "https://c.animaapp.com/me95zzp7lVICYW/img/icon-32-px-4.svg",
      starIcon: "https://c.animaapp.com/me95zzp7lVICYW/img/icon-16-px.svg",
      name: "Ondrej",
      review:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      hasNegativeMargins: true,
    },
    {
      className:
        "mr-[-512.00px] flex w-[308px] h-96 items-center justify-center gap-2 px-1.5 py-4 relative rounded-3xl overflow-hidden shadow-[0px_32px_64px_#08080c33,0px_16px_32px_#08080c1a] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.2)_100%),url(https://c.animaapp.com/me95zzp7lVICYW/img/karta-recenzie-desktop-2.png)_50%_50%_/_cover]",
      topIcon: "https://c.animaapp.com/me95zzp7lVICYW/img/icon-32-px-6.svg",
      starIcon: "https://c.animaapp.com/me95zzp7lVICYW/img/icon-16-px.svg",
      name: "Lucia Dubecká",
      review:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      hasNegativeMargins: true,
      isDesktopCard: true,
    },
    {
      className:
        "mr-[-852.00px] flex w-[308px] h-96 items-center justify-center gap-2 px-1.5 py-4 relative rounded-3xl overflow-hidden shadow-[0px_32px_64px_#08080c33,0px_16px_32px_#08080c1a] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.2)_100%),url(https://c.animaapp.com/me95zzp7lVICYW/img/karta-recenzie-desktop-2.png)_50%_50%_/_cover]",
      topIcon: "https://c.animaapp.com/me95zzp7lVICYW/img/icon-32-px-6.svg",
      starIcon: "https://c.animaapp.com/me95zzp7lVICYW/img/icon-16-px.svg",
      name: "Lucia Dubecká",
      review:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      hasNegativeMargins: true,
      isDesktopCard: true,
    },
  ];

  return (
    <section className="w-full h-[1152px] bg-[#f0f0f5] relative">
      <div className="inline-flex flex-col items-center gap-12 absolute top-[200px] left-[603px]">
        <h2 className="w-[534px] h-[88px] mt-[-1.00px] [font-family:'SF_Pro-ExpandedHeavy',Helvetica] font-normal text-[#283002] text-5xl text-center tracking-[0] leading-[52px]">
          Skúsenosti našich <br />
          zákazníkov
        </h2>

        <p className="w-[437px] h-8 text-[#55555a] text-base text-center leading-6 [font-family:'Poppins',Helvetica] font-normal tracking-[0]">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore
        </p>
      </div>

      {decorativeElements.map((element, index) => (
        <div key={`decorative-${index}`} className={element.className}>
          {element.containerClass ? (
            <div className={element.containerClass}>
              <div className={element.emojiClass}>{element.emoji}</div>
            </div>
          ) : (
            <>
              <div className={element.textClass}>{element.text}</div>
              <div className={element.emojiClass}>{element.emoji}</div>
            </>
          )}
        </div>
      ))}

      <img
        className="absolute w-[227px] h-[97px] top-[340px] left-[127px]"
        alt="Bublina recenzie"
        src="https://c.animaapp.com/me95zzp7lVICYW/img/bublina-recenzie.png"
      />

      <div className="flex w-[1728px] items-start gap-8 pl-[200px] pr-8 py-0 absolute top-[488px] left-0">
        {reviewCards.map((card, index) => (
          <Card key={`review-card-${index}`} className={card.className}>
            <CardContent className="p-0 h-full">
              {card.isFrameCard ? (
                <>
                  <img className="w-8 h-8" alt="Icon px" src={card.topIcon} />
                  <img
                    className="mb-[-3.78px] flex-1 self-stretch w-full grow"
                    alt="Frame"
                    src={card.frameImage}
                  />
                </>
              ) : card.isDesktopCard ? (
                <div className="flex flex-col w-[260px] h-[336px] items-end gap-[148px]">
                  <img
                    className={`w-8 h-8 ${card.hasNegativeMargins ? "mb-[-6342.00px] mr-[-82214.00px]" : ""}`}
                    alt="Icon px"
                    src={card.topIcon}
                  />
                  <div className="flex flex-col h-[172px] items-start gap-2 self-stretch w-full mb-[-16.00px]">
                    <img
                      className={`w-4 h-4 ${card.hasNegativeMargins ? "mr-[-82198.00px] mb-[-6310.00px]" : ""}`}
                      alt="Icon px"
                      src={card.starIcon}
                    />
                    <div className="inline-flex flex-col items-start gap-6 flex-[0_0_auto] mr-[-1.00px]">
                      <div className="w-[261px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-[#fafaff] text-base tracking-[0] leading-6">
                        {card.name}
                      </div>
                      <div className="w-[261px] h-[104px] [font-family:'Poppins',Helvetica] font-normal text-[#fafaff] text-sm tracking-[0] leading-5">
                        {card.review}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <img
                    className={`w-8 h-8 ${card.hasNegativeMargins ? "mb-[-24.00px] mr-[-82546.00px]" : ""}`}
                    alt="Icon px"
                    src={card.topIcon}
                  />
                  <div
                    className={`flex flex-col items-start justify-end gap-2 pl-2 pr-0 py-0 flex-1 self-stretch w-full grow ${card.hasNegativeMargins ? "mt-[-6654px]" : ""}`}
                  >
                    <img
                      className="w-4 h-4"
                      alt="Icon px"
                      src={card.starIcon}
                    />
                    <div className="flex flex-col items-start justify-end gap-6 self-stretch w-full flex-[0_0_auto]">
                      <div className="w-[261px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-[#fafaff] text-base tracking-[0] leading-6">
                        {card.name}
                      </div>
                      <div className="w-[261px] text-[#fafaff] text-sm leading-5 [font-family:'Poppins',Helvetica] font-normal tracking-[0]">
                        {card.review}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
