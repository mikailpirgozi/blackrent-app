import React from "react";
import { Button } from "../../../ui/button";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "../../../ui/navigation-menu";

const navigationItems = [
  { label: "Ponuka vozidiel", href: "#" },
  { label: "Služby", href: "#" },
  { label: "Store", href: "#" },
  { label: "O nás", href: "#" },
  { label: "Kontakt", href: "#" }
] as const;

export const HeaderSection = (): JSX.Element => {
  return (
    <header className="flex w-full h-[88px] items-center justify-between px-8 py-0 bg-[#05050A]">
      {/* BlackRent Logo */}
      <div className="relative w-[214.4px] h-8">
        <img
          className="w-full h-full"
          alt="BlackRent Logo"
          src="https://c.animaapp.com/me95zzp7lVICYW/img/vector-2.svg"
        />
      </div>

      {/* Navigation Menu */}
      <nav className="inline-flex items-center justify-center relative flex-[0_0_auto]">
        <NavigationMenu>
          <NavigationMenuList className="inline-flex items-center justify-center gap-2 relative self-stretch flex-[0_0_auto]">
            {navigationItems.map((item, index) => (
              <NavigationMenuItem key={index} className="inline-flex h-10 items-center justify-center gap-2 p-2 relative flex-[0_0_auto]">
                <NavigationMenuLink 
                  href={item.href}
                  className="relative w-fit font-medium text-[#bebec3] text-sm leading-6 [font-family:'Poppins',Helvetica] tracking-[0] whitespace-nowrap hover:text-white transition-colors"
                >
                  {item.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side buttons */}
        <div className="inline-flex items-center justify-center gap-2 relative flex-[0_0_auto] ml-8">
          {/* Language selector */}
          <Button variant="ghost" className="inline-flex h-10 items-center justify-center gap-2 px-4 py-3 relative flex-[0_0_auto] rounded-lg hover:bg-transparent">
            <div className="relative w-6 h-6 mt-[-4.00px] mb-[-4.00px]">
              <img
                className="absolute w-5 h-5 top-0.5 left-0.5"
                alt="World icon"
                src="https://c.animaapp.com/me95zzp7lVICYW/img/union-2.svg"
              />
            </div>
            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[#bebec3] text-sm text-right tracking-[0] leading-6 whitespace-nowrap">
              SK
            </div>
          </Button>

          {/* Login button */}
          <Button className="inline-flex h-10 items-center justify-center gap-1.5 pl-5 pr-6 py-3 relative flex-[0_0_auto] bg-[#141900] rounded-[99px] hover:bg-[#1a1f00] h-auto">
            <img
              className="mt-[-4.00px] mb-[-4.00px] relative w-6 h-6"
              alt="Person icon"
              src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-11.svg"
            />
            <div className="font-medium text-[#d7ff14] text-sm relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
              Prihlásiť sa
            </div>
          </Button>
        </div>
      </nav>
    </header>
  );
};
