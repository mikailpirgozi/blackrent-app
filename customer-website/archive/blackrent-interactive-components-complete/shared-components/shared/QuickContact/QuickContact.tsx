import React from "react";
import { contactInfo, operatorAvatar } from "../constants/footerData";

interface QuickContactProps {
  className?: string;
  variant?: "mobile" | "tablet" | "desktop-1440" | "desktop-1728";
}

export const QuickContact: React.FC<QuickContactProps> = ({ 
  className = "", 
  variant = "desktop-1728" 
}) => {
  // Variant-specific styles
  const variantStyles = {
    mobile: {
      container: "flex flex-col w-[328px] items-center gap-6 p-6 bg-[#F0F0F5] rounded-2xl",
      avatar: "relative w-16 h-16 rounded-full p-1",
      statusIndicator: "absolute w-3 h-3 bottom-1 right-1 bg-[#3CEB82] rounded-full border border-solid border-[#F0F0F5]",
      title: "text-lg",
      subtitle: "text-sm",
      contactContainer: "flex flex-col items-center gap-3",
      contactItem: "flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200",
      iconSize: "w-5 h-5",
      textSize: "text-sm",
    },
    tablet: {
      container: "flex flex-col w-[680px] items-center gap-8 p-8 bg-[#F0F0F5] rounded-2xl",
      avatar: "relative w-20 h-20 rounded-full p-1",
      statusIndicator: "absolute w-4 h-4 bottom-1 right-1 bg-[#3CEB82] rounded-full border border-solid border-[#F0F0F5]",
      title: "text-xl",
      subtitle: "text-base",
      contactContainer: "flex items-center gap-6",
      contactItem: "flex items-center gap-3 px-6 py-3 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200",
      iconSize: "w-6 h-6",
      textSize: "text-base",
    },
    "desktop-1440": {
      container: "flex flex-col w-[1120px] items-center gap-10 p-12 bg-[#F0F0F5] rounded-2xl",
      avatar: "relative w-24 h-24 rounded-full p-1",
      statusIndicator: "absolute w-5 h-5 bottom-1 right-1 bg-[#3CEB82] rounded-full border border-solid border-[#F0F0F5]",
      title: "text-2xl",
      subtitle: "text-lg",
      contactContainer: "flex items-center gap-8",
      contactItem: "flex items-center gap-4 px-8 py-4 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200",
      iconSize: "w-6 h-6",
      textSize: "text-lg",
    },
    "desktop-1728": {
      container: "flex flex-col w-[1328px] items-center pt-24 pb-[72px] px-0 bg-[#F0F0F5] rounded-3xl",
      avatar: "absolute w-[104px] h-[104px] -top-12 left-[612px] rounded-[99px] p-2",
      statusIndicator: "absolute w-3 h-3 top-[30px] left-[698px] bg-[#3CEB82] rounded-full border border-solid border-[#F0F0F5]",
      title: "text-[32px]",
      subtitle: "text-base",
      contactContainer: "flex h-10 items-center justify-center gap-4 relative self-stretch w-full",
      contactItem: "",
      iconSize: "w-6 h-6",
      textSize: "text-xl",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={`${styles.container} relative ${className}`}>
      {/* Operator Avatar */}
      <div className={styles.avatar}>
        <img
          className="w-full h-full rounded-full object-cover"
          alt={operatorAvatar.alt}
          src={operatorAvatar.image}
        />
        {/* Online Status Indicator */}
        <div className={styles.statusIndicator} />
      </div>

      <div className="inline-flex flex-col items-center gap-10 relative flex-[0_0_auto]">
        <header className="inline-flex flex-col items-start gap-4 relative flex-[0_0_auto]">
          <h1 className={`relative w-[874px] h-6 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-[#283002] ${styles.title} text-center tracking-[0] leading-6 whitespace-nowrap`}>
            Potrebujete poradiť? Sme tu pre vás.
          </h1>

          <p className={`relative w-[874px] h-4 [font-family:'Poppins',Helvetica] font-medium text-[#A0A0A5] ${styles.subtitle} text-center tracking-[0] leading-6 whitespace-nowrap`}>
            {contactInfo.workingHours}
          </p>
        </header>

        <div className={styles.contactContainer}>
          {variant === "desktop-1728" ? (
            // Desktop 1728 specific layout
            <>
              <div className="inline-flex items-center justify-center gap-2 relative flex-[0_0_auto]">
                <img
                  className={`relative ${styles.iconSize}`}
                  alt="Phone icon"
                  src="/assets/icons/phone-icon.svg"
                />
                <div className="inline-flex flex-col items-start gap-4 relative flex-[0_0_auto]">
                  <a
                    className={`relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#646469] ${styles.textSize} tracking-[0] leading-6 whitespace-nowrap hover:text-[#283002] transition-colors duration-200`}
                    href={`tel:${contactInfo.phone}`}
                    aria-label={`Zavolajte nám na číslo ${contactInfo.phone}`}
                  >
                    {contactInfo.phone}
                  </a>
                </div>
              </div>

              <div className="relative self-stretch w-px bg-[#BEBEC3]" />

              <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                <img
                  className={`relative ${styles.iconSize}`}
                  alt="Email icon"
                  src="/assets/icons/email-icon.svg"
                />
                <div className="inline-flex flex-col items-start gap-4 relative flex-[0_0_auto]">
                  <a
                    className={`relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#646469] ${styles.textSize} tracking-[0] leading-6 whitespace-nowrap hover:text-[#283002] transition-colors duration-200`}
                    href={`mailto:${contactInfo.email}`}
                    aria-label={`Napíšte nám e-mail na ${contactInfo.email}`}
                  >
                    {contactInfo.email}
                  </a>
                </div>
              </div>
            </>
          ) : (
            // Other variants layout
            <>
              <a
                href={`tel:${contactInfo.phone}`}
                className={styles.contactItem}
                aria-label={`Zavolajte nám na číslo ${contactInfo.phone}`}
              >
                <img
                  className={`relative ${styles.iconSize}`}
                  alt="Phone icon"
                  src="/assets/icons/phone-icon.svg"
                />
                <span className={`[font-family:'Poppins',Helvetica] font-medium text-[#646469] ${styles.textSize} tracking-[0] leading-5`}>
                  {contactInfo.phone}
                </span>
              </a>

              {variant === "tablet" || variant === "desktop-1440" ? (
                <div className="w-px h-8 bg-[#BEBEC3]" />
              ) : null}

              <a
                href={`mailto:${contactInfo.email}`}
                className={styles.contactItem}
                aria-label={`Napíšte nám e-mail na ${contactInfo.email}`}
              >
                <img
                  className={`relative ${styles.iconSize}`}
                  alt="Email icon"
                  src="/assets/icons/email-icon.svg"
                />
                <span className={`[font-family:'Poppins',Helvetica] font-medium text-[#646469] ${styles.textSize} tracking-[0] leading-5`}>
                  {contactInfo.email}
                </span>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Background Pattern - len pre desktop-1728 */}
      {variant === "desktop-1728" && (
        <div className="absolute w-[304px] h-[304px] top-0 left-0 rounded-3xl overflow-hidden">
          <img
            className="absolute w-[294px] h-[660px] top-0 left-0"
            alt="Decorative background pattern"
            src="/assets/misc/pattern-2a-correct.svg"
          />
        </div>
      )}
    </div>
  );
};
