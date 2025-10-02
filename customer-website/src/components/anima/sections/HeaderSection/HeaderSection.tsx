import React from "react";
import Link from "next/link";

const navigationItems = [
  { label: "Ponuka vozidiel", href: "/vozidla" },
  { label: "Služby", href: "#" },
  { label: "Store", href: "#" },
  { label: "O nás", href: "#" },
  { label: "Kontakt", href: "#" }
] as const;

export const HeaderSection = (): JSX.Element => {
  return (
    <header className="flex w-full h-[88px] items-center justify-between px-8 py-0 bg-[#05050A]">
      {/* BlackRent Logo */}
      <Link href="/" className="relative w-[214.4px] h-8 cursor-pointer">
        <img
          className="w-full h-full brightness-0 invert"
          alt="BlackRent Logo"
          src="/assets/brands/blackrent-logo.svg"
        />
      </Link>

      {/* Navigation Menu */}
      <nav className="inline-flex items-center justify-center relative flex-[0_0_auto]">
        <div className="inline-flex items-center justify-center gap-2 relative self-stretch flex-[0_0_auto]">
          {navigationItems.map((item, index) => (
            <div key={index} className="inline-flex h-10 items-center justify-center gap-2 p-2 relative flex-[0_0_auto]">
              <Link 
                href={item.href}
                className="relative w-fit font-medium text-[#bebec3] text-sm leading-6 font-sf-pro tracking-[0] whitespace-nowrap hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            </div>
          ))}
        </div>

        {/* Right side buttons */}
        <div className="inline-flex items-center justify-center gap-2 relative flex-[0_0_auto] ml-8">
          {/* Language selector */}
          <button className="inline-flex h-10 items-center justify-center gap-2 px-4 py-3 relative flex-[0_0_auto] rounded-lg hover:bg-transparent">
            <div className="relative w-6 h-6 mt-[-4.00px] mb-[-4.00px]">
              <img
                className="w-6 h-6"
                alt="World icon"
                src="/assets/misc/icon-world-24px.svg"
              />
            </div>
            <div className="relative w-fit font-sf-pro font-medium text-[#bebec3] text-sm text-right tracking-[0] leading-6 whitespace-nowrap">
              SK
            </div>
          </button>

          {/* Login button */}
          <Link href="/prihlasenie" className="inline-flex h-10 items-center justify-center gap-1.5 pl-5 pr-6 py-3 relative flex-[0_0_auto] bg-[#141900] rounded-[99px] hover:bg-[#1a1f00] transition-colors">
            <img
              className="relative w-6 h-6"
              alt="Person icon"
              src="/assets/misc/icon-person-yellow-24px.svg"
            />
            <div className="font-medium text-[#d7ff14] text-sm relative w-fit font-sf-pro tracking-[0] leading-6 whitespace-nowrap">
              Prihlásiť sa
            </div>
          </Link>
        </div>
      </nav>
    </header>
  );
};
