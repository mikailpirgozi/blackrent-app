'use client'

import { Icon } from '@/components/ui/Icon'

export default function ReviewsSection() {
  const reviews = [
    {
      id: 1,
      name: "Lucia Dubecká",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      backgroundImage: "url('/figma-assets/hero-image-1.jpg')"
    },
    {
      id: 2,
      name: "Jakub B.",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      backgroundImage: "url('/figma-assets/hero-image-2.jpg')"
    },
    {
      id: 3,
      name: "Tibor Straka",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      backgroundImage: "url('/figma-assets/hero-image-3.jpg')"
    },
    {
      id: 4,
      name: "Michal Stanko", 
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      backgroundImage: "url('/figma-assets/hero-image-4.jpg')"
    },
    {
      id: 5,
      name: "Ondrej",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      backgroundImage: "url('/figma-assets/hero-image-5.jpg')"
    }
  ]

  return (
    <section className="bg-blackrent-white-800">
      {/* Reviews Section Container - layout_RNS09M */}
      <div className="w-1728 h-[1152px] relative">
        {/* Header - layout_VN7OCV */}
        <div className="flex flex-col items-center pt-[200px] mx-auto w-fit">
          <div className="text-center flex flex-col items-center gap-12">
            <div className="font-sf-pro flex h-[88px] w-[534px] items-center justify-center text-5xl font-[870] leading-[52px] text-lime-950">
              <span className="text-center">
                <p>{"Skúsenosti našich "}</p>
                <p>zákazníkov</p>
              </span>
            </div>
            <div className="font-poppins flex h-8 w-[437px] items-center justify-center leading-6 text-zinc-600">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
            </div>
          </div>
        </div>

        {/* Review Bubbles */}
        {/* Bubble 1 - layout_DN7Z3Q (202x72, shadow-bubble, shrink-0) */}
        <div className="absolute top-[304px] right-[273px] w-[202px] h-[72px] shrink-0 bg-blackrent-yellow-light rounded-2xl shadow-bubble">
          <div className="px-5 py-3 flex">
            <p className="font-poppins font-medium text-sm leading-[1.29] text-blackrent-green-text">
              Tisíce spokojných zákazníkov ročne! 🤝
            </p>
          </div>
        </div>

        {/* Bubble 2 - layout_UZ2JGK */}
        <div className="absolute top-[352px] left-[143px] w-[202px] h-[72px] bg-blackrent-yellow-light rounded-2xl shadow-bubble">
          <div className="flex items-center gap-2 px-14 py-3.5 relative">
            <div className="absolute left-2.5 top-2 text-2xl">🌟</div>
            <div className="absolute right-7.5 top-7 text-xl">⭐️</div>
            <span className="text-lg ml-8">🤩</span>
            <p className="font-poppins font-medium text-sm leading-[1.29] text-blackrent-green-text ml-2">
              4,8 hodnotení na Google
            </p>
          </div>
        </div>

        {/* Bubble 3 - layout_S1HP26 */}
        <div className="absolute top-[280px] right-[541px] w-[66px] h-[61px] bg-blackrent-yellow-light rounded-2xl shadow-bubble">
          <div className="flex items-center justify-center h-full">
            <span className="text-lg">🔥🤓</span>
          </div>
        </div>

        {/* Bubble 4 - layout_JOYD8S */}
        <div className="absolute bottom-[168px] left-[200px] w-[64px] h-[64px] bg-blackrent-yellow-light rounded-2xl shadow-bubble">
          <div className="flex items-center justify-center h-full">
            <span className="text-xl">😍</span>
          </div>
        </div>

        {/* Reviews Carousel - layout_7DEWHX */}
        <div className="absolute top-[488px] left-0 w-1728 h-auto overflow-x-scroll">
          <div className="flex gap-8 px-[200px] pb-8">
            {/* Desktop Review Card */}
            <div
              className="relative cursor-pointer flex flex-col justify-between items-end gap-2 p-4 pr-4 pb-6 w-[308px] h-[384px] bg-gradient-to-b from-transparent to-black rounded-3xl shadow-review transform-gpu transition-transform duration-150 hover:scale-[1.02]"
              style={{ backgroundImage: reviews[0].backgroundImage, backgroundSize: 'cover', backgroundPosition: 'center', willChange: 'transform' }}
            >
              <Icon name="plus" className="absolute right-4 top-4 w-8 h-8 text-white" />
              <div className="flex flex-col justify-end gap-2 pl-2 flex-1 w-full">
                <Icon name="quote-marks" className="w-4 h-4 text-blackrent-green mb-2" />
                <div className="flex flex-col gap-6 w-full">
                  <h4 className="font-poppins font-semibold text-base leading-6 text-white w-[261px]">
                    {reviews[0].name}
                  </h4>
                  <p className="font-poppins font-normal text-sm leading-[1.43] text-white w-[261px] h-[104px]">
                    {reviews[0].text}
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Review Cards */}
            {reviews.slice(1).map((review, index) => (
              <div
                key={review.id}
                className="cursor-pointer flex flex-col justify-between items-end gap-2 p-4 pr-4 pb-6 w-[308px] h-[384px] bg-gradient-to-b from-transparent to-black rounded-3xl shadow-review transform-gpu transition-transform duration-150 hover:scale-[1.02]"
                style={{ backgroundImage: review.backgroundImage, backgroundSize: 'cover', backgroundPosition: 'center', willChange: 'transform' }}
              >
                <Icon name="plus" className="w-8 h-8 text-white stroke-2" />
                <div className="flex flex-col justify-end gap-2 pl-2 flex-1 w-full">
                  <Icon name="quote-marks" className="w-4 h-4 text-blackrent-green mb-2" />
                  <div className="flex flex-col justify-end gap-6 w-full">
                    <h4 className="font-poppins font-semibold text-base leading-6 text-white w-[261px]">
                      {review.name}
                    </h4>
                    <p className="font-poppins font-normal text-sm leading-6 text-white w-[261px]">
                      {review.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}