import React from 'react';
import Image from 'next/image';

interface ButtonSecondaryProps {
    /** Path to SVG icon to display on the left side of the button (e.g., '/assets/icons/user.svg') */
    iconPath: string;
    /** Alt text for the icon */
    iconAlt?: string;
    /** Text to display in the button */
    text: string;
    /** Optional click handler */
    onClick?: () => void;
    /** Optional additional CSS classes */
    className?: string;
}

export default function ButtonSecondary({
    iconPath,
    iconAlt = '',
    text,
    onClick,
    className = ''
}: ButtonSecondaryProps) {
    return (
        <button
            className={`bg-blackrent-accent box-border content-stretch flex gap-[6px] items-center justify-center pl-[20px] pr-[4px] py-[12px] relative rounded-[99px] h-[40px] transition-colors ${className}`}
            onClick={onClick}
            data-name="Secondary buttons 40 px +icon"
        >
            <div className="flex flex-col font-poppins font-medium justify-center leading-[0] not-italic relative shrink-0 text-blackrent-green-dark text-[14px] text-nowrap">
                <p className="leading-[24px] whitespace-pre">{text}</p>
            </div>
            {/* <div className="overflow-clip relative shrink-0 size-[32px]" data-name="Icon 24 px"> */}
                <div className="flex items-center justify-center w-[32px] h-[32px] rounded-full bg-blackrent-green-dark" data-name="Vector (Stroke)">
                    <div className='w-[24px] h-[24px]'>
                        <Image
                            src={iconPath}
                            alt={iconAlt}
                            width={10}
                            height={10}
                            className="size-full object-contain"
                        />
                    </div>
                </div>
            {/* </div> */}

        </button>
    );
}


// "use client";

// import React from 'react';
// import Image from 'next/image';
// import Link from 'next/link';

// interface ButtonLandingProps {
//   /** Text to display in the button */
//   text?: string;
//   /** Link destination */
//   href?: string;
//   /** Optional click handler */
//   onClick?: () => void;
//   /** Optional additional CSS classes */
//   className?: string;
// }

// export default function ButtonLanding({ 
//   text = "Ponuka vozidiel",
//   href = "/vozidla",
//   onClick,
//   className = ""
// }: ButtonLandingProps) {
//   const buttonContent = (
//     <div className={`backdrop-blur-[20px] backdrop-filter bg-[#f0ff98] box-border content-stretch flex gap-[8px] items-center pl-[24px] pr-[4px] py-[4px] relative rounded-[99px] size-full hover:bg-[#e6ff7a] transition-colors group ${className}`} data-name="Landing page button" data-node-id="18218:10003">
//       <div className="flex flex-col font-['Poppins:SemiBold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#141900] text-[14px] text-nowrap" data-node-id="I18218:10003;10174:19633">
//         <p className="leading-[32px] whitespace-pre">{text}</p>
//       </div>
//       <div className="bg-[#141900] box-border content-stretch flex gap-[8px] items-center justify-center overflow-clip px-[24px] py-[12px] relative rounded-[99px] shrink-0 size-[32px] group-hover:bg-[#2a2a00] transition-colors" data-name="Tlačítko" data-node-id="I18218:10003;10174:19634">
//         <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Icon 24 px uprava" data-node-id="I18218:10003;10174:19635">
//           <div className="absolute inset-[29.167%]" data-name="Vector" data-node-id="I18218:10003;10174:19635;18038:12113">
//             <Image 
//               src="/assets/icons/arrow-right.svg" 
//               alt="Arrow right" 
//               width={16} 
//               height={16} 
//               className="text-[#f0ff98]"
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   if (href) {
//     return (
//       <Link href={href} onClick={onClick}>
//         {buttonContent}
//       </Link>
//     );
//   }

//   return (
//     <button onClick={onClick} className="w-full">
//       {buttonContent}
//     </button>
//   );
// }
