"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useWindowWidth } from "../../../../hooks/useWindowWidth";

interface Props {
  vehicleId: string;
}

interface FormField {
  id: string;
  label: string;
  value: string;
  options: string[];
}

interface TravelOption {
  id: string;
  label: string;
  description?: string;
  isSelected: boolean;
}

export const ElementDetailVozidla = ({ vehicleId }: Props): JSX.Element => {
  const screenWidth = useWindowWidth();

  // Form fields state
  const [formFields, setFormFields] = useState<FormField[]>([
    { 
      id: "pickup-location", 
      label: "Miesto vyzdvihnutia", 
      value: "", 
      options: ["Bratislava - Letisko", "Bratislava - Centrum", "Košice", "Žilina", "Prešov"] 
    },
    { 
      id: "return-location", 
      label: "Miesto vrátenia", 
      value: "", 
      options: ["Bratislava - Letisko", "Bratislava - Centrum", "Košice", "Žilina", "Prešov"] 
    },
    { 
      id: "pickup-date", 
      label: "Deň vyzdvihnutia", 
      value: "", 
      options: ["Dnes", "Zajtra", "Pozajtra", "Vybrať dátum..."] 
    },
    { 
      id: "return-date", 
      label: "Deň vrátenia", 
      value: "", 
      options: ["Zajtra", "Pozajtra", "Za 3 dni", "Vybrať dátum..."] 
    },
    { 
      id: "pickup-time", 
      label: "Čas vyzdvihnutia", 
      value: "", 
      options: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"] 
    },
    { 
      id: "return-time", 
      label: "Čas vrátenia", 
      value: "", 
      options: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"] 
    },
  ]);

  // Dropdown states
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  // Travel options state
  const [travelOptions, setTravelOptions] = useState<TravelOption[]>([
    {
      id: "basic",
      label: "Slovensko, Česko, Rakúsko",
      isSelected: true,
    },
    {
      id: "extended",
      label: "+Poľsko, Nemecko, Maďarsko",
      description: "(+30% depozit)",
      isSelected: false,
    },
    {
      id: "eu",
      label: "Celá EU okrem Rumunska",
      description: "(+60% depozit)",
      isSelected: false,
    },
    {
      id: "outside-eu",
      label: "Mimo EU",
      description: "(individuálne posúdenie, kontaktujte nás)",
      isSelected: false,
    },
  ]);

  // Promo code state
  const [isPromoExpanded, setIsPromoExpanded] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [email, setEmail] = useState("");

  // Share and Save state
  const [isVehicleSaved, setIsVehicleSaved] = useState(false);

  // FAQ state
  const [expandedFAQ, setExpandedFAQ] = useState<Record<number, boolean>>({});

  // Image modal state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Vehicle images array
  const vehicleImages = [
    {
      id: 1,
      url: "https://c.animaapp.com/nwqz0he8/img/frame-170@2x.png",
      thumbnailUrl: "https://c.animaapp.com/nwqz0he8/img/frame-170@2x.png",
      alt: "Ford Mustang - hlavný obrázok"
    },
    {
      id: 2,
      url: "https://c.animaapp.com/nwqz0he8/img/frame-170-3.png",
      thumbnailUrl: "https://c.animaapp.com/nwqz0he8/img/frame-170-3.png",
      alt: "Ford Mustang - detail interiéru"
    },
    {
      id: 3,
      url: "https://c.animaapp.com/nwqz0he8/img/frame-169-2@2x.png",
      thumbnailUrl: "https://c.animaapp.com/nwqz0he8/img/frame-169-2@2x.png",
      alt: "Ford Mustang - bočný pohľad"
    },
    {
      id: 4,
      url: "https://c.animaapp.com/nwqz0he8/img/frame-170-6@2x.png",
      thumbnailUrl: "https://c.animaapp.com/nwqz0he8/img/frame-170-6@2x.png",
      alt: "Ford Mustang - zadný pohľad"
    },
    {
      id: 5,
      url: "https://c.animaapp.com/nwqz0he8/img/frame-167-2@2x.png",
      thumbnailUrl: "https://c.animaapp.com/nwqz0he8/img/frame-167-2@2x.png",
      alt: "Ford Mustang - motor"
    },
    {
      id: 6,
      url: "https://c.animaapp.com/nwqz0he8/img/frame-168-2@2x.png",
      thumbnailUrl: "https://c.animaapp.com/nwqz0he8/img/frame-168-2@2x.png",
      alt: "Ford Mustang - koleso"
    },
    {
      id: 7,
      url: "https://c.animaapp.com/nwqz0he8/img/frame-170-4@2x.png",
      thumbnailUrl: "https://c.animaapp.com/nwqz0he8/img/frame-170-4@2x.png",
      alt: "Ford Mustang - prístrojová doska"
    },
    {
      id: 8,
      url: "https://c.animaapp.com/nwqz0he8/img/frame-167-1@2x.png",
      thumbnailUrl: "https://c.animaapp.com/nwqz0he8/img/frame-167-1@2x.png",
      alt: "Ford Mustang - sedadlá"
    }
  ];

  // Refs for click outside
  const formRef = useRef<HTMLFormElement>(null);

  // Handler functions
  const toggleDropdown = (fieldId: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Newsletter subscription:", email);
    setEmail("");
  };

  // Share and Save handlers
  const handleShareVehicle = async () => {
    const vehicleUrl = window.location.href;
    const vehicleTitle = "Ford Mustang - BlackRent";
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: vehicleTitle,
          text: "Pozrite si toto úžasné vozidlo na prenájom!",
          url: vehicleUrl,
        });
        console.log("Vehicle shared successfully");
      } catch (error) {
        console.log("Error sharing:", error);
        // Fallback to clipboard
        handleCopyToClipboard(vehicleUrl);
      }
    } else {
      // Fallback to clipboard for browsers that don't support Web Share API
      handleCopyToClipboard(vehicleUrl);
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      console.log("Link copied to clipboard");
    } catch (error) {
      console.log("Failed to copy to clipboard:", error);
    }
  };

  const handleSaveVehicle = () => {
    setIsVehicleSaved(!isVehicleSaved);
    console.log(isVehicleSaved ? "Vehicle removed from saved" : "Vehicle saved");
    // Here you could also save to localStorage or send to backend
    if (!isVehicleSaved) {
      localStorage.setItem("savedVehicles", JSON.stringify([...JSON.parse(localStorage.getItem("savedVehicles") || "[]"), "ford-mustang"]));
    } else {
      const saved = JSON.parse(localStorage.getItem("savedVehicles") || "[]");
      localStorage.setItem("savedVehicles", JSON.stringify(saved.filter((id: string) => id !== "ford-mustang")));
    }
  };

  // Image modal handlers
  const handleImageClick = (imageIndex: number) => {
    setSelectedImageIndex(imageIndex);
    setIsImageModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsImageModalOpen(false);
  };

  const handlePreviousImage = () => {
    setSelectedImageIndex(prev => 
      prev === 0 ? vehicleImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex(prev => 
      prev === vehicleImages.length - 1 ? 0 : prev + 1
    );
  };

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isImageModalOpen) return;
      
      switch (event.key) {
        case 'Escape':
          handleCloseModal();
          break;
        case 'ArrowLeft':
          handlePreviousImage();
          break;
        case 'ArrowRight':
          handleNextImage();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen, handleCloseModal, handlePreviousImage, handleNextImage]);

  // Footer data from Anima
  const navigationLinks = [
    { label: "Ponuka vozidiel", href: "/vozidla", active: false },
    { label: "Služby", href: "/services", active: false },
    { label: "Store", href: "/store", active: false },
    { label: "Kontakt", href: "/contact", active: false },
    { label: "O nás", href: "/about", active: true },
    { label: "Prihlásenie a Registrácia", href: "/auth", active: false },
  ];

  const socialMediaLinks = [
    {
      icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-133.svg",
      href: "https://facebook.com/blackrent",
      alt: "Facebook",
    },
    {
      icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-134.svg", 
      href: "https://instagram.com/blackrent",
      alt: "Instagram",
    },
    {
      icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-135.svg",
      href: "https://tiktok.com/@blackrent",
      alt: "TikTok",
    },
  ];

  const footerLinks = [
    "Obchodné podmienky",
    "Pravidlá pre súbory cookies", 
    "Reklamačný poriadok",
    "Ochrana osobných údajov",
  ];

  const selectOption = (fieldId: string, option: string) => {
    setFormFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, value: option } : field
    ));
    setOpenDropdowns(prev => ({ ...prev, [fieldId]: false }));
  };

  const handleTravelOptionChange = (optionId: string) => {
    setTravelOptions(prev => prev.map(option => ({
      ...option,
      isSelected: option.id === optionId,
    })));
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setOpenDropdowns({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdowns on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdowns({});
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Handle booking form submission
  const handleBookingSubmit = () => {
    console.log('Booking submitted with data:', formFields);
    // TODO: Implement actual booking submission logic
  };

  return (
    <div
      className="w-screen grid [align-items:start] bg-colors-black-100 justify-items-center"
      data-model-id="10778:32619"
    >
      <div
        className={`bg-colors-black-100 relative ${
          screenWidth < 744 
            ? "w-[360px] h-[3950px]" 
            : screenWidth >= 744 && screenWidth < 1440
              ? "w-[744px] h-[2300px]" 
              : screenWidth >= 1440 && screenWidth < 1680 
                ? "w-[1440px] h-[3800px] overflow-hidden" 
                : screenWidth >= 1680 
                  ? "w-[1728px] h-[3200px]" 
                  : ""
        }`}
      >
        {/* Mobile Version - 360px */}
        {screenWidth < 744 && (
          <>
            {/* Hero Image */}
            <div 
              className="flex w-[328px] h-64 items-end justify-end gap-2 p-4 absolute top-48 left-4 rounded-2xl overflow-hidden bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-170@2x.png)] bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200"
              onClick={() => handleImageClick(0)}
              role="button"
              aria-label="Zobraziť obrázok vozidla v plnej veľkosti"
            >
              <div className="inline-flex items-center gap-1 px-4 py-2 relative flex-[0_0_auto] bg-[#00000080] rounded-lg">
                <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-65.svg)] bg-cover bg-[50%_50%]" />
                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
                  16
                </div>
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="flex w-[360px] h-16 items-center justify-between px-4 py-0 absolute left-0 top-0">
              <Link href="/">
                <div className="h-5 bg-[url(https://c.animaapp.com/nwqz0he8/img/vector-25.svg)] bg-cover bg-[50%_50%] relative w-[134px] cursor-pointer" />
              </Link>
              <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-65.svg)] bg-cover bg-[50%_50%]" />
            </div>

            {/* Vehicle Title and Info */}
            <div className="flex flex-col w-[328px] items-start gap-6 absolute top-[432px] left-4">
              <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                <div className="relative self-stretch h-8 mt-[-1.00px] [font-family:'SF_Pro-ExpandedMedium',Helvetica] font-medium text-colors-light-yellow-accent-700 text-[32px] tracking-[0] leading-[40px] whitespace-nowrap">
                  Ford Mustang
                </div>
              </div>

              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                {/* Vehicle Specs */}
                <div className="items-start gap-2 inline-flex relative flex-[0_0_auto]">
                  <div className="inline-flex items-center relative flex-[0_0_auto]">
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-4.svg)] bg-cover bg-[50%_50%]" />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      123 kW
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-5.svg)] bg-cover bg-[50%_50%]" />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      Benzín
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-6.svg)] bg-cover bg-[50%_50%]" />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      Automatická
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-7.svg)] bg-cover bg-[50%_50%]" />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      4×4
                    </div>
                  </div>
                </div>

                {/* Rating and Actions */}
                <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                  <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                    <img
                      className="relative w-[107.2px] h-4"
                      alt="Vector"
                      src="https://c.animaapp.com/nwqz0he8/img/vector-30.svg"
                    />
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-102.svg)] bg-cover bg-[50%_50%]" />
                  </div>

                  <img
                    className="relative w-px h-[25px] object-cover"
                    alt="Line"
                    src="https://c.animaapp.com/nwqz0he8/img/line-3-3.svg"
                  />

                  <div className="inline-flex items-start gap-1 relative flex-[0_0_auto]">
                    <div className="flex w-8 h-8 items-center justify-center gap-2 p-2 relative rounded-lg">
                      <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-74.svg)] bg-cover bg-[50%_50%]" />
                    </div>
                    <div className="flex w-8 h-8 items-center justify-center gap-2 p-2 relative rounded-lg">
                      <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-75.svg)] bg-cover bg-[50%_50%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Table - Mobile */}
            <div className="flex flex-col w-[328px] items-start gap-6 px-4 py-8 absolute top-[1552px] left-4 bg-colors-black-300 rounded-2xl">
              <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                Cenové relácie
              </div>

              <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                {/* Table Header */}
                <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                  <div className="flex w-32 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      Počet dní
                    </div>
                  </div>
                  <div className="flex w-20 items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm text-right tracking-[0] leading-6 whitespace-nowrap">
                      km/deň
                    </div>
                  </div>
                  <div className="flex w-20 items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm text-right tracking-[0] leading-6 whitespace-nowrap">
                      €/deň
                    </div>
                  </div>
                </div>

                {/* Table Rows */}
                {[
                  { days: "0–1 dní", km: "300 km", price: "200 €" },
                  { days: "2–3 dní", km: "250 km", price: "175 €" },
                  { days: "4–7 dní", km: "210 km", price: "150 €" },
                  { days: "8–14 dní", km: "170 km", price: "130 €" },
                  { days: "15–22 dní", km: "150 km", price: "120 €" },
                  { days: "23–30 dní", km: "130 km", price: "110 €" },
                  { days: "31+ dní", km: "115 km", price: "100 €" },
                ].map((row, index) => (
                  <div key={index} className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                    <div className="flex w-32 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        {row.days}
                      </div>
                    </div>
                    <div className="flex w-20 items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="w-fit text-colors-white-800 text-sm text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                        {row.km}
                      </div>
                    </div>
                    <div className="flex w-20 items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm text-right tracking-[0] leading-6 whitespace-nowrap">
                        {row.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle Gallery - Mobile */}
            <div className="flex flex-col w-[328px] items-start gap-6 absolute top-[560px] left-4">
              <div 
                className="w-[328px] h-[220px] rounded-2xl bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-170-3.png)] relative bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200" 
                onClick={() => handleImageClick(1)}
                role="button"
                aria-label="Zobraziť detail interiéru vozidla"
              />
              
              <div className="flex flex-wrap w-[328px] items-center gap-2 relative flex-[0_0_auto]">
                <div 
                  className="relative flex-1 grow h-16 rounded-lg bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-169-2@2x.png)] bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200" 
                  onClick={() => handleImageClick(2)}
                  role="button"
                  aria-label="Zobraziť bočný pohľad na vozidlo"
                />
                <div 
                  className="flex-1 grow h-16 rounded-lg bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-170-6@2x.png)] relative bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200" 
                  onClick={() => handleImageClick(3)}
                  role="button"
                  aria-label="Zobraziť zadný pohľad na vozidlo"
                />
                <div 
                  className="relative flex-1 grow h-16 rounded-lg bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-167-2@2x.png)] bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200" 
                  onClick={() => handleImageClick(4)}
                  role="button"
                  aria-label="Zobraziť motor vozidla"
                />
                <div 
                  className="relative flex-1 grow h-16 rounded-lg overflow-hidden bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-168-2@2x.png)] bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200"
                  onClick={() => handleImageClick(5)}
                  role="button"
                  aria-label="Zobraziť všetky obrázky vozidla"
                >
                  <div className="inline-flex items-center justify-center gap-1 relative top-6 left-6">
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-1000 text-xs tracking-[0] leading-6 whitespace-nowrap">
                      viac
                    </div>
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-121.svg)] bg-cover bg-[50%_50%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Description - Mobile */}
            <div className="flex flex-col w-[328px] items-start gap-6 absolute top-[880px] left-4">
              <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                Predstavenie vozidla
              </div>

              <div className="relative w-[328px] h-[200px]">
                <p className="absolute w-[328px] top-0 left-0 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                  Zažite skutočnú jazdu plnú luxusu a výkonu s naším novým prírastkom do flotily - BMW M440i xDrive. Tento výnimočný model z roku 2022 a má výkon 275 kW.
                </p>

                <p className="absolute w-[280px] top-[80px] left-[24px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                  Čo robí tento model ešte výnimočnejším, je jeho matná šedá farba. Táto farba dodáva vozidlu elegantný vzhľad.
                </p>

                <p className="absolute w-[280px] top-[140px] left-[24px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-[22px]">
                  BMW M440i je jednoznačne tou správnou voľbou pre moderné technológie a prvotriedne materiály.
                </p>

                <img
                  className="absolute w-[20px] h-0.5 top-[145px] left-[4px]"
                  alt="Vector"
                  src="https://c.animaapp.com/nwqz0he8/img/vector-22-3.svg"
                />

                <img
                  className="absolute w-[20px] h-0.5 top-[85px] left-[4px]"
                  alt="Vector"
                  src="https://c.animaapp.com/nwqz0he8/img/vector-23-3.svg"
                />
              </div>
            </div>

            {/* Technical Specifications - Mobile */}
            <div className="flex flex-col w-[328px] items-start gap-6 absolute top-[1140px] left-4">
              <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                Technické parametre
              </div>

              <div className="flex flex-col w-[328px] items-start gap-4 relative flex-[0_0_auto]">
                {[
                  { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-122.svg", label: "Karoséria:", value: "SUV" },
                  { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-123.svg", label: "Počet dverí:", value: "4+1" },
                  { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-124.svg", label: "Výkon:", value: "275 kw" },
                  { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-125.svg", label: "Objem valcov:", value: "2998 cm3" },
                  { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-126.svg", label: "Spotreba:", value: "5.4l/100km" },
                  { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-127.svg", label: "Palivo:", value: "Benzín" },
                  { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-128.svg", label: "Prevodovka:", value: "Automatická" },
                  { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-129.svg", label: "Náhon:", value: "4×4" },
                  { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-130.svg", label: "Rok výroby:", value: "2016" },
                  { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-131.svg", label: "Nájazd km:", value: "91000 km" }
                ].map((spec, index) => (
                  <div key={index} className="flex h-8 items-center gap-2 px-2 py-0 relative self-stretch w-full">
                    <div className="relative w-6 h-6 bg-cover bg-[50%_50%]" style={{backgroundImage: `url(${spec.icon})`}} />
                    <div className="flex items-center gap-2 relative flex-1 grow">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        {spec.label}
                      </div>
                      <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6">
                        {spec.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle Equipment - Mobile */}
            <div className="flex flex-col w-[328px] items-start gap-6 absolute top-[1480px] left-4">
              <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                Výbava vozidla
              </div>

              <div className="flex flex-wrap w-[328px] items-center gap-2 relative flex-[0_0_auto]">
                {[
                  "Bluetooth", "USB vstup", "Klimatizácia", "GPS", "Tempomat", "4×4",
                  "Parkovacie senzory", "Apple carplay", "Kožené sedadlá", "Vyhrieva­nie sedadiel"
                ].map((feature, index) => (
                  <div key={index} className="inline-flex h-8 items-center justify-center gap-2 px-3 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
                      {feature}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What's Included Section - Mobile */}
            <div className="flex flex-col w-[328px] items-start gap-6 px-4 py-6 absolute top-[1720px] left-4 bg-colors-black-300 rounded-2xl">
              <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                <div className="relative w-[60px] h-[60px] bg-[url(https://c.animaapp.com/nwqz0he8/img/union-18.svg)] bg-cover bg-[50%_50%]" />
                <div className="flex flex-col items-start gap-4 relative flex-1 grow">
                  <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-lg tracking-[0] leading-6 whitespace-nowrap">
                    V cene je zahrnuté
                  </div>

                  <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                    {[
                      "Slovenská dialničná známka",
                      "Havaríjne poistenie", 
                      "Dane a poplatky",
                      "Poistenie zodpovednosti za škody",
                      "Letné a zimné pneumatiky",
                      "Servisné náklady"
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="inline-flex items-start flex-[0_0_auto] gap-1 p-1.5 rounded-[99px] bg-colors-dark-yellow-accent-200 relative">
                          <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-118.svg)] bg-cover bg-[50%_50%]" />
                        </div>
                        <div className="[font-family:'Poppins',Helvetica] tracking-[0] text-sm flex-1 text-colors-white-800 font-normal leading-5 relative">
                          {item}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section - Mobile */}
            <div className="flex flex-col w-[328px] items-start gap-6 absolute top-[2080px] left-4">
              <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                Časté otázky
              </div>

              <div className="flex flex-col gap-3 relative self-stretch w-full flex-[0_0_auto]">
                {[
                  "Čo je zahrnuté v cene prenájmu?",
                  "V akom stave je vozidlo pri odovzdaní?",
                  "Do ktorých krajín môžem vycestovať?",
                  "Môžem cestovať mimo Európskej Únie?",
                  "Ako môžem platiť za prenájom?",
                  "Majú vozidlá diaľničnú známku?",
                  "Je možná preprava zvierat?",
                  "Čo ak dostanem pokutu?"
                ].map((question, index) => (
                  <div key={index} className="flex flex-col items-start gap-2 p-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                    <button
                      type="button"
                      onClick={() => toggleFAQ(index)}
                      className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto] cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-5 text-left">
                        {question}
                      </div>
                      <div className={`relative w-5 h-5 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-filled-120.svg)] bg-cover bg-[50%_50%] transition-transform duration-200 ${expandedFAQ[index] ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {expandedFAQ[index] && (
                      <div className="relative self-stretch w-full mt-2 pt-2 border-t border-colors-black-500">
                        <div className="[font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm leading-5">
                          {index === 0 && "V cene prenájmu je zahrnuté základné poistenie, slovenská diaľničná známka, dane a poplatky."}
                          {index === 1 && "Vozidlo je odovzdané v čistom stave s plnou nádržou paliva a kompletnou výbavou."}
                          {index === 2 && "Môžete cestovať do krajín EÚ podľa zvoleného balíčka. Základný balíček pokrýva Slovensko, Česko a Rakúsko."}
                          {index === 3 && "Cestovanie mimo EÚ je možné po individuálnom posúdení. Kontaktujte nás pre viac informácií."}
                          {index === 4 && "Akceptujeme platby kartou, bankovým prevodom alebo hotovosťou pri prevzatí."}
                          {index === 5 && "Áno, všetky naše vozidlá majú platnú slovenskú diaľničnú známku."}
                          {index === 6 && "Preprava zvierat je možná po predchádzajúcej dohode a za dodržania hygienických podmienok."}
                          {index === 7 && "Pokuty sú účtované nájomcovi spolu s administratívnym poplatkom."}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rychly kontakt - Mobile */}
            <div className="flex flex-col w-[328px] items-center gap-6 p-6 absolute top-[2400px] left-4 bg-[#F0F0F5] rounded-2xl">
              {/* Operator Avatar */}
              <div className="relative w-16 h-16 rounded-full border border-solid border-[#F0F0F5] bg-[url(/operator-avatar-728c4b.jpg)] bg-cover bg-[50%_50%]">
                {/* Online Status Indicator */}
                <div className="absolute w-3 h-3 bottom-1 right-1 bg-[#3CEB82] rounded-full border border-solid border-[#F0F0F5]" />
              </div>

              <div className="flex flex-col items-center gap-4 relative">
                <div className="flex flex-col items-center gap-2 relative">
                  <h3 className="relative [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-[#283002] text-lg text-center tracking-[0] leading-6">
                    Potrebujete poradiť? Sme tu pre vás.
                  </h3>
                  <p className="relative [font-family:'Poppins',Helvetica] font-medium text-[#A0A0A5] text-sm text-center tracking-[0] leading-5">
                    Sme na príjme Po–Pia 08:00–17:00
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3 relative">
                  <a
                    href="tel:+421910666949"
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    aria-label="Zavolajte nám na číslo +421 910 666 949"
                  >
                    <img
                      className="relative w-5 h-5"
                      alt="Phone icon"
                      src="/figma-assets/Icon 24 px.svg"
                    />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#646469] text-sm tracking-[0] leading-5">
                      +421 910 666 949
                    </span>
                  </a>

                  <a
                    href="mailto:info@blackrent.sk"
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    aria-label="Napíšte nám e-mail na info@blackrent.sk"
                  >
                    <img
                      className="relative w-5 h-5"
                      alt="Email icon"
                      src="/figma-assets/Icon 24 px.svg"
                    />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#646469] text-sm tracking-[0] leading-5">
                      info@blackrent.sk
                    </span>
                  </a>
                </div>
              </div>
            </div>

            {/* Booking Sidebar - Mobile */}
            <div className="flex flex-col w-[328px] items-center gap-6 absolute top-[2750px] left-4 bg-colors-black-200 rounded-2xl overflow-hidden border border-solid border-colors-black-600">
              <div className="flex flex-col items-start gap-6 px-4 py-6 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-400">
                <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-lg tracking-[0] leading-6 whitespace-nowrap">
                  Prenájom vozidla
                </div>

                <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
                    {/* Pickup Location Dropdown */}
                    <div className="relative self-stretch w-full">
                      <div 
                        className="flex h-10 items-center gap-0.5 pl-3 pr-2 py-0 relative self-stretch w-full bg-colors-black-600 rounded-lg cursor-pointer hover:bg-colors-black-500 transition-colors duration-200"
                        onClick={() => toggleDropdown("pickup-location")}
                        role="button"
                        aria-expanded={openDropdowns["pickup-location"]}
                        aria-haspopup="listbox"
                      >
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            {formFields.find(f => f.id === "pickup-location")?.value || "Miesto vyzdvihnutia"}
                          </div>
                        </div>
                        <div className={`relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-109.svg)] bg-cover bg-[50%_50%] transition-transform duration-200 ${openDropdowns["pickup-location"] ? 'rotate-180' : ''}`} />
                      </div>
                      
                      {/* Dropdown Options */}
                      {openDropdowns["pickup-location"] && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-colors-black-600 rounded-lg shadow-lg border border-colors-black-500 z-10 max-h-48 overflow-y-auto">
                          {formFields.find(f => f.id === "pickup-location")?.options.map((option, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 hover:bg-colors-black-500 cursor-pointer transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                              onClick={() => {
                                setFormFields(prev => prev.map(field => 
                                  field.id === "pickup-location" ? { ...field, value: option } : field
                                ));
                                toggleDropdown("pickup-location");
                              }}
                            >
                              <div className="[font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm">
                                {option}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Return Location Dropdown */}
                    <div className="relative self-stretch w-full">
                      <div 
                        className="flex h-10 items-center gap-0.5 pl-3 pr-2 py-0 relative self-stretch w-full bg-colors-black-600 rounded-lg cursor-pointer hover:bg-colors-black-500 transition-colors duration-200"
                        onClick={() => toggleDropdown("return-location")}
                        role="button"
                        aria-expanded={openDropdowns["return-location"]}
                        aria-haspopup="listbox"
                      >
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            {formFields.find(f => f.id === "return-location")?.value || "Miesto vrátenia"}
                          </div>
                        </div>
                        <div className={`relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-109.svg)] bg-cover bg-[50%_50%] transition-transform duration-200 ${openDropdowns["return-location"] ? 'rotate-180' : ''}`} />
                      </div>
                      
                      {/* Dropdown Options */}
                      {openDropdowns["return-location"] && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-colors-black-600 rounded-lg shadow-lg border border-colors-black-500 z-10 max-h-48 overflow-y-auto">
                          {formFields.find(f => f.id === "return-location")?.options.map((option, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 hover:bg-colors-black-500 cursor-pointer transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                              onClick={() => {
                                setFormFields(prev => prev.map(field => 
                                  field.id === "return-location" ? { ...field, value: option } : field
                                ));
                                toggleDropdown("return-location");
                              }}
                            >
                              <div className="[font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm">
                                {option}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
                    {/* Pickup Date Dropdown */}
                    <div className="relative self-stretch w-full">
                      <div 
                        className="flex h-10 items-center gap-0.5 pl-3 pr-2 py-0 relative self-stretch w-full bg-colors-black-600 rounded-lg cursor-pointer hover:bg-colors-black-500 transition-colors duration-200"
                        onClick={() => toggleDropdown("pickup-date")}
                        role="button"
                        aria-expanded={openDropdowns["pickup-date"]}
                        aria-haspopup="listbox"
                      >
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            {formFields.find(f => f.id === "pickup-date")?.value || "Deň vyzdvihnutia"}
                          </div>
                        </div>
                        <div className={`relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-109.svg)] bg-cover bg-[50%_50%] transition-transform duration-200 ${openDropdowns["pickup-date"] ? 'rotate-180' : ''}`} />
                      </div>
                      
                      {/* Dropdown Options */}
                      {openDropdowns["pickup-date"] && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-colors-black-600 rounded-lg shadow-lg border border-colors-black-500 z-10 max-h-48 overflow-y-auto">
                          {formFields.find(f => f.id === "pickup-date")?.options.map((option, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 hover:bg-colors-black-500 cursor-pointer transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                              onClick={() => {
                                setFormFields(prev => prev.map(field => 
                                  field.id === "pickup-date" ? { ...field, value: option } : field
                                ));
                                toggleDropdown("pickup-date");
                              }}
                            >
                              <div className="[font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm">
                                {option}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Return Date Dropdown */}
                    <div className="relative self-stretch w-full">
                      <div 
                        className="flex h-10 items-center gap-0.5 pl-3 pr-2 py-0 relative self-stretch w-full bg-colors-black-600 rounded-lg cursor-pointer hover:bg-colors-black-500 transition-colors duration-200"
                        onClick={() => toggleDropdown("return-date")}
                        role="button"
                        aria-expanded={openDropdowns["return-date"]}
                        aria-haspopup="listbox"
                      >
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            {formFields.find(f => f.id === "return-date")?.value || "Deň vrátenia"}
                          </div>
                        </div>
                        <div className={`relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-109.svg)] bg-cover bg-[50%_50%] transition-transform duration-200 ${openDropdowns["return-date"] ? 'rotate-180' : ''}`} />
                      </div>
                      
                      {/* Dropdown Options */}
                      {openDropdowns["return-date"] && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-colors-black-600 rounded-lg shadow-lg border border-colors-black-500 z-10 max-h-48 overflow-y-auto">
                          {formFields.find(f => f.id === "return-date")?.options.map((option, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 hover:bg-colors-black-500 cursor-pointer transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                              onClick={() => {
                                setFormFields(prev => prev.map(field => 
                                  field.id === "return-date" ? { ...field, value: option } : field
                                ));
                                toggleDropdown("return-date");
                              }}
                            >
                              <div className="[font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm">
                                {option}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 px-6 py-3 relative self-stretch w-full flex-[0_0_auto] bg-colors-light-yellow-accent-700 rounded-lg">
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-black-100 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      Rezervovať
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Section - Mobile */}
            <div className="flex flex-col items-center w-[360px] absolute left-0 top-[3350px] bg-colors-black-100">
              <div className="flex flex-col items-start w-[328px] px-0 py-12 relative flex-[0_0_auto]">
                <div className="relative w-[160px] h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/blackrent-logo-10.svg)] bg-cover bg-[50%_50%] mb-8" />
                
                <div className="flex flex-col items-start gap-8 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-lg tracking-[0] leading-6 whitespace-nowrap">
                        Newsletter
                      </div>
                      <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-400 text-sm tracking-[0] leading-5">
                        Prihláste sa na newsletter a získajte 5€ voucher.
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 px-3 py-2 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-[99px]">
                      <div className="flex items-center gap-1 relative flex-1 grow">
                        <div className="relative w-5 h-5 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-132.svg)] bg-cover bg-[50%_50%]" />
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Váš e-mail
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-1 px-4 py-2 relative flex-[0_0_auto] bg-colors-light-yellow-accent-700 rounded-[99px]">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-black-100 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          OK
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-6 relative flex-[0_0_auto]">
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-lg tracking-[0] leading-6 whitespace-nowrap">
                      Kontakt
                    </div>
                    <div className="flex flex-col items-start gap-3 relative flex-[0_0_auto]">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-400 text-sm tracking-[0] leading-5 whitespace-nowrap">
                        Rozmarínová 211/3
                      </div>
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-400 text-sm tracking-[0] leading-5 whitespace-nowrap">
                        91101 Trenčín
                      </div>
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-400 text-sm tracking-[0] leading-5 whitespace-nowrap">
                        +421 910 666 949
                      </div>
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-400 text-sm tracking-[0] leading-5 whitespace-nowrap">
                        info@blackrent.sk
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 relative flex-[0_0_auto]">
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-lg tracking-[0] leading-6 whitespace-nowrap">
                      Sledujte nás
                    </div>
                    <div className="flex items-start gap-3 relative flex-[0_0_auto]">
                      <div className="relative w-5 h-5 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-133.svg)] bg-cover bg-[50%_50%]" />
                      <div className="relative w-5 h-5 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-134.svg)] bg-cover bg-[50%_50%]" />
                      <div className="relative w-5 h-5 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-135.svg)] bg-cover bg-[50%_50%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Copyright */}
              <div className="flex items-center justify-center w-[360px] h-16 px-4 py-0 relative flex-[0_0_auto] bg-colors-black-200">
                <p className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs tracking-[0] leading-4 text-center">
                  © 2024 blackrent.sk
                </p>
              </div>
            </div>
          </>
        )}

        {/* Tablet Version - 744px */}
        {screenWidth >= 744 && screenWidth < 1440 && (
          <>
            {/* Navigation - Tablet */}
            <div className="flex w-[744px] h-20 items-center justify-between px-8 py-0 absolute left-0 top-0">
              <Link href="/">
                <div className="h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/vector-25.svg)] bg-cover bg-[50%_50%] relative w-40 cursor-pointer" />
              </Link>
              <div className="flex items-center gap-8">
                <Link href="/vozidla">
                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap cursor-pointer hover:text-colors-light-yellow-accent-700 transition-colors">
                    Ponuka vozidiel
                  </div>
                </Link>
                <Link href="/services">
                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap cursor-pointer hover:text-colors-light-yellow-accent-700 transition-colors">
                    Služby
                  </div>
                </Link>
                <Link href="/store">
                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap cursor-pointer hover:text-colors-light-yellow-accent-700 transition-colors">
                    Store
                  </div>
                </Link>
                <Link href="/about">
                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap cursor-pointer hover:text-colors-light-yellow-accent-700 transition-colors">
                    O nás
                  </div>
                </Link>
                <Link href="/contact">
                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap cursor-pointer hover:text-colors-light-yellow-accent-700 transition-colors">
                    Kontakt
                  </div>
                </Link>
              </div>
            </div>

            {/* Vehicle Title and Info - Tablet */}
            <div className="flex flex-col w-[680px] items-start gap-2 absolute top-[104px] left-8">
              <div className="relative w-[375px] h-8 mt-[-1.00px] [font-family:'SF_Pro-ExpandedMedium',Helvetica] font-medium text-colors-light-yellow-accent-700 text-[40px] tracking-[0] leading-[64px] whitespace-nowrap">
                Ford Mustang
              </div>

              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                {/* Vehicle Specs */}
                <div className="items-start gap-4 inline-flex relative flex-[0_0_auto]">
                  <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-98.svg)] bg-cover bg-[50%_50%]" />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      275 kW
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-99.svg)] bg-cover bg-[50%_50%]" />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      Benzín
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-100.svg)] bg-cover bg-[50%_50%]" />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      Automatická
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-101.svg)] bg-cover bg-[50%_50%]" />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      4×4
                    </div>
                  </div>
                </div>

                {/* Rating and Actions */}
                <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                  <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                    <img
                      className="relative w-[107.2px] h-4"
                      alt="Vector"
                      src="https://c.animaapp.com/nwqz0he8/img/vector-36.svg"
                    />
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-102.svg)] bg-cover bg-[50%_50%]" />
                  </div>

                  <img
                    className="relative w-px h-[25px] object-cover"
                    alt="Line"
                    src="https://c.animaapp.com/nwqz0he8/img/line-3-3.svg"
                  />

                  <div className="inline-flex items-start gap-1 relative flex-[0_0_auto]">
                    <div className="flex w-8 h-8 items-center justify-center gap-2 p-2 relative rounded-lg">
                      <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-74.svg)] bg-cover bg-[50%_50%]" />
                    </div>
                    <div className="flex w-8 h-8 items-center justify-center gap-2 p-2 relative rounded-lg">
                      <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-75.svg)] bg-cover bg-[50%_50%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Gallery - Tablet */}
            <div className="flex flex-col w-[680px] items-start gap-8 absolute top-[240px] left-8">
              <div 
                className="w-[680px] h-[380px] rounded-2xl bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-170-3.png)] relative bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200" 
                onClick={() => handleImageClick(1)}
                role="button"
                aria-label="Zobraziť detail interiéru vozidla"
              />
              
              <div className="flex flex-wrap w-[680px] items-center gap-4 relative flex-[0_0_auto]">
                <div 
                  className="relative flex-1 grow h-20 rounded-lg bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-169-2@2x.png)] bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200" 
                  onClick={() => handleImageClick(2)}
                  role="button"
                  aria-label="Zobraziť bočný pohľad na vozidlo"
                />
                <div 
                  className="flex-1 grow h-20 rounded-lg bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-170-6@2x.png)] relative bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200" 
                  onClick={() => handleImageClick(3)}
                  role="button"
                  aria-label="Zobraziť zadný pohľad na vozidlo"
                />
                <div 
                  className="relative flex-1 grow h-20 rounded-lg bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-167-2@2x.png)] bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200" 
                  onClick={() => handleImageClick(4)}
                  role="button"
                  aria-label="Zobraziť motor vozidla"
                />
                <div 
                  className="relative flex-1 grow h-20 rounded-lg overflow-hidden bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-168-2@2x.png)] bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200"
                  onClick={() => handleImageClick(5)}
                  role="button"
                  aria-label="Zobraziť všetky obrázky vozidla"
                >
                  <div className="inline-flex items-center justify-center gap-1 relative top-8 left-16">
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-1000 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      viac
                    </div>
                    <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-121.svg)] bg-cover bg-[50%_50%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Description - Tablet */}
            <div className="flex flex-col w-[680px] items-start gap-8 absolute top-[720px] left-8">
              <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                Predstavenie vozidla
              </div>

              <div className="relative w-[680px] h-[306px]">
                <p className="absolute w-[680px] top-0 left-0 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                  Zažite skutočnú jazdu plnú luxusu a výkonu s naším novým prírastkom do flotily - BMW M440i xDrive. Tento výnimočný model z roku 2022 a má výkon 275 kW. Je poháňaný benzínom, čo vám zaručuje adrenalínovú jazdu vždy, keď sadnete za volant.
                </p>

                <p className="absolute w-[546px] top-[120px] left-[49px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                  Čo robí tento model ešte výnimočnejším, je jeho matná šedá farba. Táto farba dodáva vozidlu elegantný a sofistikovaný vzhľad, ktorý zaujme na každej ceste.
                </p>

                <p className="absolute w-[546px] top-[217px] left-[49px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                  Ak hľadáte auto na prenájom, ktoré kombinuje štýl, výkon a moderné technológie, BMW M440i je jednoznačne tou správnou voľbou. Moderné technológie a prvotriedne materiály vytvárajú interiér, ktorý je rovnako pohodlný ako atraktívny.
                </p>

                <img
                  className="absolute w-[25px] h-0.5 top-[222px] left-2"
                  alt="Vector"
                  src="https://c.animaapp.com/nwqz0he8/img/vector-23-1.svg"
                />

                <img
                  className="absolute w-[25px] h-0.5 top-[125px] left-2"
                  alt="Vector"
                  src="https://c.animaapp.com/nwqz0he8/img/vector-23-1.svg"
                />
              </div>
            </div>

            {/* Pricing Table - Tablet */}
            <div className="flex flex-col w-[680px] items-start gap-6 px-8 py-10 absolute left-8 top-[1106px] bg-colors-black-300 rounded-2xl">
              <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                Cenové relácie
              </div>

              <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                {/* Table Header */}
                <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                  <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                      Počet dní prenájmu
                    </div>
                  </div>
                  <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                      Nájazd km/deň
                    </div>
                  </div>
                  <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                      Cena prenájmu/deň
                    </div>
                  </div>
                </div>

                {/* Table Rows */}
                {[
                  { days: "0–1 dní", km: "300 km", price: "200 €" },
                  { days: "2–3 dní", km: "250 km", price: "175 €" },
                  { days: "4–7 dní", km: "210 km", price: "150 €" },
                  { days: "8–14 dní", km: "170 km", price: "130 €" },
                  { days: "15–22 dní", km: "150 km", price: "120 €" },
                  { days: "23–30 dní", km: "130 km", price: "110 €" },
                  { days: "31 a viac dní", km: "115 km", price: "100 €" }
                ].map((row, index) => (
                  <div key={index} className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                    <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        {row.days}
                      </div>
                    </div>
                    <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                        {row.km}
                      </div>
                    </div>
                    <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                        {row.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Specifications - Tablet */}
            <div className="flex flex-col w-[680px] items-start gap-8 absolute top-[1500px] left-8">
              <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                Technické parametre
              </div>

              <div className="flex w-[680px] items-start justify-between relative flex-[0_0_auto]">
                {/* Left Column */}
                <div className="flex flex-col items-start gap-2 relative flex-1 grow">
                  {[
                    { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-122.svg", label: "Karoséria:", value: "SUV" },
                    { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-123.svg", label: "Počet dverí:", value: "4+1" },
                    { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-124.svg", label: "Výkon:", value: "275 kw" },
                    { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-125.svg", label: "Objem valcov:", value: "2998 cm3" },
                    { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-126.svg", label: "Spotreba:", value: "5.4l/100km" }
                  ].map((spec, index) => (
                    <div key={index} className="flex h-8 items-center gap-2 px-2 py-0 relative self-stretch w-full rounded-lg">
                      <div className="relative w-6 h-6 bg-cover bg-[50%_50%]" style={{backgroundImage: `url(${spec.icon})`}} />
                      <div className="flex items-center gap-1 relative flex-1 grow">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          {spec.label}
                        </div>
                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6">
                          {spec.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column */}
                <div className="flex flex-col items-start gap-2 relative flex-1 grow">
                  {[
                    { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-127.svg", label: "Palivo:", value: "Benzín" },
                    { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-128.svg", label: "Prevodovka:", value: "Automatická" },
                    { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-129.svg", label: "Náhon:", value: "4×4" },
                    { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-130.svg", label: "Rok výroby:", value: "2016" },
                    { icon: "https://c.animaapp.com/nwqz0he8/img/icon-24-px-131.svg", label: "Nájazd km:", value: "91000 km" }
                  ].map((spec, index) => (
                    <div key={index} className="flex h-8 items-center gap-2 px-2 py-0 relative self-stretch w-full rounded-lg">
                      <div className="relative w-6 h-6 bg-cover bg-[50%_50%]" style={{backgroundImage: `url(${spec.icon})`}} />
                      <div className="flex items-center gap-1 relative flex-1 grow">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          {spec.label}
                        </div>
                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6">
                          {spec.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vehicle Equipment - Tablet */}
            <div className="flex flex-col w-[680px] items-start gap-8 absolute top-[1740px] left-8">
              <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                Výbava vozidla
              </div>

              <div className="flex flex-wrap w-[680px] items-center gap-4 relative flex-[0_0_auto]">
                {[
                  "Bluetooth", "USB vstup", "Klimatizácia", "GPS", "Tempomat", "4×4",
                  "Parkovacie senzory", "Apple carplay", "Kožené sedadlá", "Vyhrieva­nie sedadiel",
                  "Automatické svetlá", "Bezdrôtové nabíjanie", "Panoramatická strecha", "Adaptívny tempomat"
                ].map((feature, index) => (
                  <div key={index} className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      {feature}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Section - Tablet */}
            <div className="flex flex-col w-[680px] items-start gap-8 absolute top-[1200px] left-8">
              <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-2xl tracking-[0] leading-7 whitespace-nowrap">
                Časté otázky
              </div>

              <div className="flex flex-col gap-4 relative self-stretch w-full flex-[0_0_auto]">
                {[
                  "Čo je zahrnuté v cene prenájmu?",
                  "V akom stave je vozidlo pri odovzdaní?",
                  "Do ktorých krajín môžem vycestovať?",
                  "Môžem cestovať mimo Európskej Únie?",
                  "Ako môžem platiť za prenájom?",
                  "Majú vozidlá diaľničnú známku?",
                  "Je možná preprava zvierat?",
                  "Čo ak dostanem pokutu?"
                ].map((question, index) => (
                  <div key={index} className="flex flex-col items-start gap-3 p-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                    <button
                      type="button"
                      onClick={() => toggleFAQ(index + 100)} // offset for tablet
                      className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto] cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 text-left">
                        {question}
                      </div>
                      <div className={`relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-filled-120.svg)] bg-cover bg-[50%_50%] transition-transform duration-200 ${expandedFAQ[index + 100] ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {expandedFAQ[index + 100] && (
                      <div className="relative self-stretch w-full mt-2 pt-2 border-t border-colors-black-500">
                        <div className="[font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-base leading-6">
                          {index === 0 && "V cene prenájmu je zahrnuté základné poistenie, slovenská diaľničná známka, dane a poplatky."}
                          {index === 1 && "Vozidlo je odovzdané v čistom stave s plnou nádržou paliva a kompletnou výbavou."}
                          {index === 2 && "Môžete cestovať do krajín EÚ podľa zvoleného balíčka. Základný balíček pokrýva Slovensko, Česko a Rakúsko."}
                          {index === 3 && "Cestovanie mimo EÚ je možné po individuálnom posúdení. Kontaktujte nás pre viac informácií."}
                          {index === 4 && "Akceptujeme platby kartou, bankovým prevodom alebo hotovosťou pri prevzatí."}
                          {index === 5 && "Áno, všetky naše vozidlá majú platnú slovenskú diaľničnú známku."}
                          {index === 6 && "Preprava zvierat je možná po predchádzajúcej dohode a za dodržania hygienických podmienok."}
                          {index === 7 && "Pokuty sú účtované nájomcovi spolu s administratívnym poplatkom."}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Sidebar - Tablet 744px */}
            <div className="flex flex-col w-[328px] items-center gap-6 absolute top-[1400px] left-[408px] bg-colors-black-200 rounded-2xl overflow-hidden border border-solid border-colors-black-600">
              <div className="flex flex-col items-start gap-6 px-4 py-6 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-400">
                <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-lg tracking-[0] leading-6 whitespace-nowrap">
                  Prenájom vozidla
                </div>

                <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
                    {/* Pickup Location Dropdown */}
                    <div className="relative self-stretch w-full flex-[0_0_auto]">
                      <div 
                        className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative self-stretch w-full bg-[#1E1E23] rounded-lg cursor-pointer hover:bg-[#28282D] transition-colors duration-200"
                        onClick={() => toggleDropdown("pickup-location-744")}
                        role="button"
                        aria-expanded={openDropdowns["pickup-location-744"]}
                        aria-haspopup="listbox"
                      >
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap">
                            {formFields.find(f => f.id === "pickup-location")?.value || "Miesto vyzdvihnutia"}
                          </div>
                        </div>
                        <img
                          className={`relative w-5 h-5 transition-transform duration-200 ${openDropdowns["pickup-location-744"] ? 'rotate-180' : ''}`}
                          alt="Arrow Down"
                          src="/figma-assets/icon-16px-arrow-down.svg"
                        />
                      </div>
                      
                      {/* Dropdown Options */}
                      {openDropdowns["pickup-location-744"] && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E1E23] rounded-lg shadow-lg border border-[#28282D] z-10 max-h-48 overflow-y-auto">
                          {formFields.find(f => f.id === "pickup-location")?.options.map((option, index) => (
                            <div
                              key={index}
                              className="px-4 py-2 hover:bg-[#28282D] cursor-pointer transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                              onClick={() => {
                                setFormFields(prev => prev.map(field => 
                                  field.id === "pickup-location" ? { ...field, value: option } : field
                                ));
                                toggleDropdown("pickup-location-744");
                              }}
                            >
                              <div className="[font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm">
                                {option}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Return Location Dropdown */}
                    <div className="relative self-stretch w-full flex-[0_0_auto]">
                      <div 
                        className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative self-stretch w-full bg-[#1E1E23] rounded-lg cursor-pointer hover:bg-[#28282D] transition-colors duration-200"
                        onClick={() => toggleDropdown("return-location-744")}
                        role="button"
                        aria-expanded={openDropdowns["return-location-744"]}
                        aria-haspopup="listbox"
                      >
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap">
                            {formFields.find(f => f.id === "return-location")?.value || "Miesto vrátenia"}
                          </div>
                        </div>
                        <img
                          className={`relative w-5 h-5 transition-transform duration-200 ${openDropdowns["return-location-744"] ? 'rotate-180' : ''}`}
                          alt="Arrow Down"
                          src="/figma-assets/icon-16px-arrow-down.svg"
                        />
                      </div>
                      
                      {/* Dropdown Options */}
                      {openDropdowns["return-location-744"] && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E1E23] rounded-lg shadow-lg border border-[#28282D] z-10 max-h-48 overflow-y-auto">
                          {formFields.find(f => f.id === "return-location")?.options.map((option, index) => (
                            <div
                              key={index}
                              className="px-4 py-2 hover:bg-[#28282D] cursor-pointer transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                              onClick={() => {
                                setFormFields(prev => prev.map(field => 
                                  field.id === "return-location" ? { ...field, value: option } : field
                                ));
                                toggleDropdown("return-location-744");
                              }}
                            >
                              <div className="[font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm">
                                {option}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
                    {/* Pickup Date Dropdown */}
                    <div className="relative flex-1 grow">
                      <div 
                        className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-[#1E1E23] rounded-lg cursor-pointer hover:bg-[#28282D] transition-colors duration-200"
                        onClick={() => toggleDropdown("pickup-date-744")}
                        role="button"
                        aria-expanded={openDropdowns["pickup-date-744"]}
                        aria-haspopup="listbox"
                      >
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap">
                            {formFields.find(f => f.id === "pickup-date")?.value || "Deň vyzdvihnutia"}
                          </div>
                        </div>
                        <img
                          className={`relative w-5 h-5 transition-transform duration-200 ${openDropdowns["pickup-date-744"] ? 'rotate-180' : ''}`}
                          alt="Arrow Down"
                          src="/figma-assets/icon-16px-arrow-down.svg"
                        />
                      </div>
                      
                      {/* Dropdown Options */}
                      {openDropdowns["pickup-date-744"] && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E1E23] rounded-lg shadow-lg border border-[#28282D] z-10 max-h-48 overflow-y-auto">
                          {formFields.find(f => f.id === "pickup-date")?.options.map((option, index) => (
                            <div
                              key={index}
                              className="px-4 py-2 hover:bg-[#28282D] cursor-pointer transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                              onClick={() => {
                                setFormFields(prev => prev.map(field => 
                                  field.id === "pickup-date" ? { ...field, value: option } : field
                                ));
                                toggleDropdown("pickup-date-744");
                              }}
                            >
                              <div className="[font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm">
                                {option}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Return Date Dropdown */}
                    <div className="relative flex-1 grow">
                      <div 
                        className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-[#1E1E23] rounded-lg cursor-pointer hover:bg-[#28282D] transition-colors duration-200"
                        onClick={() => toggleDropdown("return-date-744")}
                        role="button"
                        aria-expanded={openDropdowns["return-date-744"]}
                        aria-haspopup="listbox"
                      >
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap">
                            {formFields.find(f => f.id === "return-date")?.value || "Deň vrátenia"}
                          </div>
                        </div>
                        <img
                          className={`relative w-5 h-5 transition-transform duration-200 ${openDropdowns["return-date-744"] ? 'rotate-180' : ''}`}
                          alt="Arrow Down"
                          src="/figma-assets/icon-16px-arrow-down.svg"
                        />
                      </div>
                      
                      {/* Dropdown Options */}
                      {openDropdowns["return-date-744"] && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E1E23] rounded-lg shadow-lg border border-[#28282D] z-10 max-h-48 overflow-y-auto">
                          {formFields.find(f => f.id === "return-date")?.options.map((option, index) => (
                            <div
                              key={index}
                              className="px-4 py-2 hover:bg-[#28282D] cursor-pointer transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                              onClick={() => {
                                setFormFields(prev => prev.map(field => 
                                  field.id === "return-date" ? { ...field, value: option } : field
                                ));
                                toggleDropdown("return-date-744");
                              }}
                            >
                              <div className="[font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm">
                                {option}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
                    {/* Pickup Time Dropdown */}
                    <div className="relative flex-1 grow">
                      <div 
                        className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-[#1E1E23] rounded-lg cursor-pointer hover:bg-[#28282D] transition-colors duration-200"
                        onClick={() => toggleDropdown("pickup-time-744")}
                        role="button"
                        aria-expanded={openDropdowns["pickup-time-744"]}
                        aria-haspopup="listbox"
                      >
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap">
                            {formFields.find(f => f.id === "pickup-time")?.value || "Čas vyzdvihnutia"}
                          </div>
                        </div>
                        <img
                          className={`relative w-5 h-5 transition-transform duration-200 ${openDropdowns["pickup-time-744"] ? 'rotate-180' : ''}`}
                          alt="Arrow Down"
                          src="/figma-assets/icon-16px-arrow-down.svg"
                        />
                      </div>
                      
                      {/* Dropdown Options */}
                      {openDropdowns["pickup-time-744"] && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E1E23] rounded-lg shadow-lg border border-[#28282D] z-10 max-h-48 overflow-y-auto">
                          {formFields.find(f => f.id === "pickup-time")?.options.map((option, index) => (
                            <div
                              key={index}
                              className="px-4 py-2 hover:bg-[#28282D] cursor-pointer transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                              onClick={() => {
                                setFormFields(prev => prev.map(field => 
                                  field.id === "pickup-time" ? { ...field, value: option } : field
                                ));
                                toggleDropdown("pickup-time-744");
                              }}
                            >
                              <div className="[font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm">
                                {option}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Return Time Dropdown */}
                    <div className="relative flex-1 grow">
                      <div 
                        className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-[#1E1E23] rounded-lg cursor-pointer hover:bg-[#28282D] transition-colors duration-200"
                        onClick={() => toggleDropdown("return-time-744")}
                        role="button"
                        aria-expanded={openDropdowns["return-time-744"]}
                        aria-haspopup="listbox"
                      >
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap">
                            {formFields.find(f => f.id === "return-time")?.value || "Čas vrátenia"}
                          </div>
                        </div>
                        <img
                          className={`relative w-5 h-5 transition-transform duration-200 ${openDropdowns["return-time-744"] ? 'rotate-180' : ''}`}
                          alt="Arrow Down"
                          src="/figma-assets/icon-16px-arrow-down.svg"
                        />
                      </div>
                      
                      {/* Dropdown Options */}
                      {openDropdowns["return-time-744"] && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E1E23] rounded-lg shadow-lg border border-[#28282D] z-10 max-h-48 overflow-y-auto">
                          {formFields.find(f => f.id === "return-time")?.options.map((option, index) => (
                            <div
                              key={index}
                              className="px-4 py-2 hover:bg-[#28282D] cursor-pointer transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                              onClick={() => {
                                setFormFields(prev => prev.map(field => 
                                  field.id === "return-time" ? { ...field, value: option } : field
                                ));
                                toggleDropdown("return-time-744");
                              }}
                            >
                              <div className="[font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm">
                                {option}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-6 px-4 py-6 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                    Celková cena
                  </div>
                  <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                    €89
                  </div>
                </div>

                <button 
                  className="flex w-full h-12 items-center justify-center gap-2 px-6 py-3 relative bg-colors-light-yellow-accent-700 rounded-lg hover:bg-colors-light-yellow-accent-600 transition-colors duration-200"
                  onClick={handleBookingSubmit}
                  aria-label="Rezervovať vozidlo"
                >
                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-black-100 text-base tracking-[0] leading-6 whitespace-nowrap">
                    Rezervovať
                  </div>
                </button>
              </div>
            </div>

            {/* Rychly kontakt - Tablet */}
            <div className="flex flex-col w-[680px] items-center gap-8 p-8 absolute top-[1800px] left-8 bg-[#F0F0F5] rounded-2xl">
              {/* Operator Avatar */}
              <div className="relative w-20 h-20 rounded-full border border-solid border-[#F0F0F5] bg-[url(/operator-avatar-728c4b.jpg)] bg-cover bg-[50%_50%]">
                {/* Online Status Indicator */}
                <div className="absolute w-4 h-4 bottom-1 right-1 bg-[#3CEB82] rounded-full border border-solid border-[#F0F0F5]" />
              </div>

              <div className="flex flex-col items-center gap-6 relative">
                <div className="flex flex-col items-center gap-3 relative">
                  <h3 className="relative [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-[#283002] text-xl text-center tracking-[0] leading-7">
                    Potrebujete poradiť? Sme tu pre vás.
                  </h3>
                  <p className="relative [font-family:'Poppins',Helvetica] font-medium text-[#A0A0A5] text-base text-center tracking-[0] leading-6">
                    Sme na príjme Po–Pia 08:00–17:00
                  </p>
                </div>

                <div className="flex items-center gap-6 relative">
                  <a
                    href="tel:+421910666949"
                    className="flex items-center gap-3 px-6 py-3 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    aria-label="Zavolajte nám na číslo +421 910 666 949"
                  >
                    <img
                      className="relative w-6 h-6"
                      alt="Phone icon"
                      src="/figma-assets/Icon 24 px.svg"
                    />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#646469] text-base tracking-[0] leading-6">
                      +421 910 666 949
                    </span>
                  </a>

                  <a
                    href="mailto:info@blackrent.sk"
                    className="flex items-center gap-3 px-6 py-3 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    aria-label="Napíšte nám e-mail na info@blackrent.sk"
                  >
                    <img
                      className="relative w-6 h-6"
                      alt="Email icon"
                      src="/figma-assets/Icon 24 px.svg"
                    />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#646469] text-base tracking-[0] leading-6">
                      info@blackrent.sk
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Desktop Version - 1440px */}
        {screenWidth >= 1440 && screenWidth < 1680 && (
          <>
            {/* Navigation - 1440px */}
            <div className="flex w-[1440px] h-[88px] items-center justify-between px-8 py-0 absolute left-0 top-0">
              <Link href="/">
                <div className="h-8 bg-[url(https://c.animaapp.com/nwqz0he8/img/vector-25.svg)] bg-cover bg-[50%_50%] relative w-[214px] cursor-pointer hover:opacity-80 transition-opacity" />
              </Link>
              <div className="flex items-center gap-8">
                <Link href="/vozidla">
                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap cursor-pointer hover:text-colors-light-yellow-accent-700 transition-colors">
                    Ponuka vozidiel
                  </div>
                </Link>
                <Link href="/services">
                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap cursor-pointer hover:text-colors-light-yellow-accent-700 transition-colors">
                    Služby
                  </div>
                </Link>
                <Link href="/store">
                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap cursor-pointer hover:text-colors-light-yellow-accent-700 transition-colors">
                    Store
                  </div>
                </Link>
                <Link href="/about">
                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap cursor-pointer hover:text-colors-light-yellow-accent-700 transition-colors">
                    O nás
                  </div>
                </Link>
                <Link href="/contact">
                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap cursor-pointer hover:text-colors-light-yellow-accent-700 transition-colors">
                    Kontakt
                  </div>
                </Link>
              </div>
            </div>

            {/* Vehicle Title and Info - Desktop 1440px */}
            <div className="flex flex-col w-[1120px] items-start gap-2 absolute top-[168px] left-40">
              <div className="relative w-[375px] h-10 mt-[-1.00px] [font-family:'SF_Pro-ExpandedMedium',Helvetica] font-medium text-colors-light-yellow-accent-700 text-5xl tracking-[0] leading-[64px] whitespace-nowrap">
                Ford Mustang
              </div>

              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                {/* Vehicle Specs - Desktop 1440px */}
                <div className="items-start gap-2 inline-flex relative flex-[0_0_auto]">
                  <div className="inline-flex items-center relative flex-[0_0_auto]">
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-98.svg)] bg-cover bg-[50%_50%]" />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      123 kW
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-99.svg)] bg-cover bg-[50%_50%]" />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      Benzín
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-100.svg)] bg-cover bg-[50%_50%]" />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      Automatická
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-101.svg)] bg-cover bg-[50%_50%]" />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      4×4
                    </div>
                  </div>
                </div>

                {/* Rating and Actions - Desktop 1440px */}
                <div className="inline-flex items-center justify-center gap-2 relative flex-[0_0_auto]">
                  <div className="inline-flex items-center justify-center gap-1.5 relative flex-[0_0_auto]">
                    <img
                      className="relative w-[107.2px] h-4"
                      alt="Vector"
                      src="https://c.animaapp.com/nwqz0he8/img/vector-30.svg"
                    />
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-102.svg)] bg-cover bg-[50%_50%]" />
                  </div>

                  <img
                    className="relative w-px h-[25px] object-cover"
                    alt="Line"
                    src="https://c.animaapp.com/nwqz0he8/img/line-3-3.svg"
                  />

                  <div className="inline-flex items-start gap-1 relative flex-[0_0_auto]">
                    <div className="flex w-8 h-8 items-center justify-center gap-2 p-2 relative rounded-lg">
                      <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-74.svg)] bg-cover bg-[50%_50%]" />
                    </div>
                    <div className="flex w-8 h-8 items-center justify-center gap-2 p-2 relative rounded-lg">
                      <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-75.svg)] bg-cover bg-[50%_50%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Gallery - Desktop 1440px */}
            <div className="inline-flex flex-col items-start gap-20 absolute left-40 top-[280px]">
              <div className="inline-flex flex-col items-start gap-10 relative flex-[0_0_auto]">
                <div className="inline-flex flex-col items-start gap-8 relative flex-[0_0_auto]">
                  {/* Main Image */}
                  <div 
                    className="w-[640px] h-[432px] rounded-2xl bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-170-3.png)] relative bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200" 
                    onClick={() => handleImageClick(1)}
                    role="button"
                    aria-label="Zobraziť detail interiéru vozidla"
                  />

                  {/* Thumbnail Gallery */}
                  <div className="flex flex-wrap w-[640px] items-center gap-[36px_24px] relative flex-[0_0_auto]">
                    <div 
                      className="relative flex-1 grow h-24 rounded-lg bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-169-1@2x.png)] bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200" 
                      onClick={() => handleImageClick(2)}
                      role="button"
                      aria-label="Zobraziť bočný pohľad na vozidlo"
                    />
                    <div 
                      className="flex-1 grow h-24 rounded-lg bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-170-4@2x.png)] relative bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200" 
                      onClick={() => handleImageClick(6)}
                      role="button"
                      aria-label="Zobraziť prístrojovú dosku vozidla"
                    />
                    <div 
                      className="relative flex-1 grow h-24 rounded-lg bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-167-1@2x.png)] bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200" 
                      onClick={() => handleImageClick(7)}
                      role="button"
                      aria-label="Zobraziť sedadlá vozidla"
                    />
                    <div 
                      className="relative flex-1 grow h-24 rounded-lg overflow-hidden bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-168-2@2x.png)] bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200"
                      onClick={() => handleImageClick(5)}
                      role="button"
                      aria-label="Zobraziť všetky obrázky vozidla"
                    >
                      <div className="inline-flex items-center justify-center gap-1 relative top-9 left-[57px]">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-1000 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          viac
                        </div>
                        <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-89.png)] bg-cover bg-[50%_50%]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider Line */}
                <img
                  className="object-cover relative w-[640px] h-px ml-[-0.50px] mr-[-0.50px]"
                  alt="Line"
                  src="https://c.animaapp.com/nwqz0he8/img/line-8-3.svg"
                />

                {/* Vehicle Description */}
                <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex w-[260px] h-4 items-center relative">
                    <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                      Predstavenie vozidla
                    </div>
                  </div>

                  <div className="relative self-stretch w-full h-[306px] mr-[-6.00px]">
                    <p className="absolute w-[640px] top-0 left-0 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                      Zažite skutočnú jazdu plnú luxusu a výkonu s naším novým
                      prírastkom do flotily - BMW M440i xDrive. Tento
                      výnimočný model z roku 2022 a má výkon 275 kW. Je
                      poháňaný benzínom, čo vám zaručuje adrenalínovú jazdu
                      vždy, keď sadnete za volant.
                    </p>

                    <p className="absolute w-[567px] top-[120px] left-[51px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                      Čo robí tento model ešte výnimočnejším, je jeho matná
                      šedá farba. Táto farba dodáva vozidlu elegantný a
                      sofistikovaný vzhľad, ktorý zaujme na každej ceste.
                    </p>

                    <p className="absolute w-[567px] top-[217px] left-[51px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                      Ak hľadáte auto na prenájom, ktoré kombinuje štýl, výkon
                      a moderné technológie, BMW M440i je jednoznačne tou
                      správnou voľbou. Moderné technológie a prvotriedne
                      materiály vytvárajú interiér, ktorý je rovnako pohodlný
                      ako atraktívny.
                    </p>

                    <img
                      className="absolute w-[26px] h-0.5 top-[222px] left-[9px]"
                      alt="Vector"
                      src="https://c.animaapp.com/nwqz0he8/img/vector-23-2.svg"
                    />

                    <img
                      className="absolute w-[26px] h-0.5 top-[125px] left-[9px]"
                      alt="Vector"
                      src="https://c.animaapp.com/nwqz0he8/img/vector-23-2.svg"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Table - Desktop 1440px */}
              <div className="flex flex-col w-[640px] items-start gap-6 px-8 py-10 relative flex-[0_0_auto] bg-colors-black-300 rounded-2xl">
                <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                  Cenové relácie
                </div>

                <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                  {/* Table Header */}
                  <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                    <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        Počet dní prenájmu
                      </div>
                    </div>
                    <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                        Nájazd km/deň
                      </div>
                    </div>
                    <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                        Cena prenájmu/deň
                      </div>
                    </div>
                  </div>

                  {/* Table Rows */}
                  {[
                    { days: "0–1 dní", km: "300 km", price: "200 €" },
                    { days: "2–3 dní", km: "250 km", price: "175 €" },
                    { days: "4–7 dní", km: "210 km", price: "150 €" },
                    { days: "8–14 dní", km: "170 km", price: "130 €" },
                    { days: "15–22 dní", km: "150 km", price: "120 €" },
                    { days: "23–30 dní", km: "130 km", price: "110 €" },
                    { days: "31 a viac dní", km: "115 km", price: "100 €" },
                  ].map((row, index) => (
                    <div key={index} className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                      <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                          {row.days}
                        </div>
                      </div>
                      <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                          {row.km}
                        </div>
                      </div>
                      <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                          {row.price}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vehicle Description - Desktop 1440px */}
            <div className="flex flex-col items-start gap-10 absolute left-40 top-[752px] w-[640px]">
              <div className="flex w-[260px] h-4 items-center relative">
                <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                  Predstavenie vozidla
                </div>
              </div>

              <div className="relative w-[640px] h-[306px]">
                <p className="absolute w-[640px] top-0 left-0 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                  Zažite skutočnú jazdu plnú luxusu a výkonu s naším novým prírastkom do flotily - BMW M440i xDrive. Tento výnimočný model z roku 2022 a má výkon 275 kW. Je poháňaný benzínom, čo vám zaručuje adrenalínovú jazdu vždy, keď sadnete za volant. 
                </p>

                <p className="absolute w-[567px] top-[120px] left-[51px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                  Čo robí tento model ešte výnimočnejším, je jeho matná šedá farba. Táto farba dodáva vozidlu elegantný a sofistikovaný vzhľad, ktorý zaujme na každej ceste.
                </p>

                <p className="absolute w-[567px] top-[217px] left-[51px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                  Ak hľadáte auto na prenájom, ktoré kombinuje štýl, výkon a moderné technológie, BMW M440i je jednoznačne tou správnou voľbou. Moderné technológie a prvotriedne materiály vytvárajú interiér, ktorý je rovnako pohodlný ako atraktívny.
                </p>

                <img
                  className="absolute w-[26px] h-0.5 top-[223px] left-[9px]"
                  alt="Vector"
                  src="https://c.animaapp.com/nwqz0he8/img/vector-22-3.svg"
                />

                <img
                  className="absolute w-[26px] h-0.5 top-[126px] left-[9px]"
                  alt="Vector"
                  src="https://c.animaapp.com/nwqz0he8/img/vector-23-3.svg"
                />
              </div>
            </div>

            {/* Pricing Table - Desktop 1440px */}
            <div className="flex flex-col w-[640px] items-start gap-6 px-8 py-10 absolute left-40 top-[1138px] bg-colors-black-300 rounded-2xl">
              <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                Cenové relácie
              </div>

              <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                {/* Table Header */}
                <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                  <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                      Počet dní prenájmu
                    </div>
                  </div>
                  <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                      Nájazd km/deň
                    </div>
                  </div>
                  <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                      Cena prenájmu/deň
                    </div>
                  </div>
                </div>

                {/* Table Rows */}
                {[
                  { days: "0–1 dní", km: "300 km", price: "200 €" },
                  { days: "2–3 dní", km: "250 km", price: "175 €" },
                  { days: "4–7 dní", km: "210 km", price: "150 €" },
                  { days: "8–14 dní", km: "170 km", price: "130 €" },
                  { days: "15–22 dní", km: "150 km", price: "120 €" },
                  { days: "23–30 dní", km: "130 km", price: "110 €" },
                  { days: "31 a viac dní", km: "115 km", price: "100 €" }
                ].map((row, index) => (
                  <div key={index} className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                    <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        {row.days}
                      </div>
                    </div>
                    <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                        {row.km}
                      </div>
                    </div>
                    <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                        {row.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Specifications - Desktop 1440px */}
            <div className="flex flex-col items-start gap-10 absolute left-40 top-[1658px] w-[640px]">
              <div className="inline-flex h-4 items-center justify-center gap-2 px-0 py-4 relative">
                <div className="relative w-fit mt-[-16.00px] mb-[-14.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                  Technické parametre
                </div>
              </div>

              <div className="flex w-[640px] items-start justify-between relative flex-[0_0_auto]">
                {/* Left Column */}
                <div className="flex flex-col items-start gap-2 relative flex-1 grow">
                  <div className="flex h-8 items-center gap-2 px-2 py-0 relative self-stretch w-full rounded-lg">
                    <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-122.svg)] bg-cover bg-[50%_50%]" />
                    <div className="flex items-center gap-1 relative flex-1 grow">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Karoséria:
                      </div>
                      <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                        SUV
                      </div>
                    </div>
                  </div>

                  <div className="flex h-8 items-center gap-2 px-2 py-0 relative self-stretch w-full rounded-lg">
                    <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-123.svg)] bg-cover bg-[50%_50%]" />
                    <div className="flex items-center gap-1 relative flex-1 grow">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Počet dverí:
                      </div>
                      <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                        4+1
                      </div>
                    </div>
                  </div>

                  <div className="flex h-8 items-center gap-2 px-2 py-0 relative self-stretch w-full rounded-lg">
                    <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-124.svg)] bg-cover bg-[50%_50%]" />
                    <div className="flex items-center gap-1 relative flex-1 grow">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Výkon:
                      </div>
                      <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                        275 kw
                      </div>
                    </div>
                  </div>

                  <div className="px-2 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                    <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-125.svg)] bg-cover bg-[50%_50%]" />
                    <div className="flex items-center gap-1 relative flex-1 grow">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Objem valcov:
                      </div>
                      <div className="flex-1 text-colors-ligh-gray-400 text-sm overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                        2998 cm3
                      </div>
                    </div>
                  </div>

                  <div className="flex h-8 items-center gap-2 px-2 py-0 relative self-stretch w-full rounded-lg">
                    <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-126.svg)] bg-cover bg-[50%_50%]" />
                    <div className="flex items-center gap-1 relative flex-1 grow">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Spotreba:
                      </div>
                      <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                        5.4l/100km
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col items-start gap-2 relative flex-1 grow">
                  <div className="flex h-8 items-center gap-2 px-2 py-0 relative self-stretch w-full rounded-lg">
                    <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-127.svg)] bg-cover bg-[50%_50%]" />
                    <div className="flex items-center gap-1 relative flex-1 grow">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Palivo:
                      </div>
                      <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                        Benzín
                      </div>
                    </div>
                  </div>

                  <div className="flex h-8 items-center gap-2 px-2 py-0 relative self-stretch w-full rounded-lg">
                    <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-128.svg)] bg-cover bg-[50%_50%]" />
                    <div className="flex items-center gap-1 relative flex-1 grow">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Prevodovka:
                      </div>
                      <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                        Automatická
                      </div>
                    </div>
                  </div>

                  <div className="flex h-8 items-center gap-2 px-2 py-0 relative self-stretch w-full rounded-lg">
                    <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-129.svg)] bg-cover bg-[50%_50%]" />
                    <div className="flex items-center gap-1 relative flex-1 grow">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Náhon:
                      </div>
                      <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                        4×4
                      </div>
                    </div>
                  </div>

                  <div className="flex h-8 items-center gap-2 pl-2 pr-3.5 py-4 relative self-stretch w-full rounded-lg">
                    <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-130.svg)] bg-cover bg-[50%_50%]" />
                    <div className="flex items-center gap-1 relative flex-1 grow mt-[-5.00px] mb-[-5.00px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Rok výroby:
                      </div>
                      <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                        2016
                      </div>
                    </div>
                  </div>

                  <div className="flex h-8 items-center gap-2 pl-2 pr-3.5 py-4 relative self-stretch w-full rounded-lg">
                    <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-131.svg)] bg-cover bg-[50%_50%]" />
                    <div className="flex items-center gap-1 relative flex-1 grow mt-[-5.00px] mb-[-5.00px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Nájazd km:
                      </div>
                      <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                        91000 km
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider Line - Desktop 1440px */}
            <img
              className="object-cover absolute w-[640px] h-px ml-[-0.50px] mr-[-0.50px] left-40 top-[1878px]"
              alt="Line"
              src="https://c.animaapp.com/nwqz0he8/img/line-8-3.svg"
            />

            {/* Vehicle Equipment - Desktop 1440px */}
            <div className="flex flex-col w-[640px] items-start gap-10 absolute left-40 top-[1918px]">
              <div className="inline-flex flex-col h-4 items-start gap-2 relative">
                <div className="inline-flex items-center justify-center gap-2 relative flex-[0_0_auto]">
                  <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                    Výbava vozidla
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap w-[640px] items-center gap-[16px_16px] relative flex-[0_0_auto]">
                {[
                  "Bluetooth", "USB vstup", "Klimatizácia", "GPS", "Tempomat", "4×4",
                  "Parkovacie senzory", "Apple carplay", "Kožené sedadlá", "Vyhrieva­nie sedadiel",
                  "Automatické svetlá", "Bezdrôtové nabíjanie", "Panoramatická strecha", "Adaptívny tempomat"
                ].map((feature, index) => (
                  <div key={index} className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      {feature}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What's Included Section - Desktop 1440px */}
            <div className="flex flex-col w-[1120px] items-start gap-8 px-16 py-12 absolute left-40 top-[2058px] bg-colors-black-300 rounded-2xl">
              <div className="flex items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
                <div className="relative w-[92px] h-[88px] bg-[url(https://c.animaapp.com/nwqz0he8/img/union-18.svg)] bg-cover bg-[50%_50%]" />
                <div className="flex flex-col items-start grow gap-4 flex-1 relative">
                  <div className="inline-flex items-center gap-2 h-[88px] justify-center relative">
                    <div className="[font-family:'SF_Pro-ExpandedSemibold',Helvetica] w-fit tracking-[0] text-2xl text-colors-light-yellow-accent-700 font-normal leading-7 whitespace-nowrap relative">
                      V cene je zahrnuté
                    </div>
                  </div>

                  <div className="w-full flex self-stretch items-start flex-[0_0_auto] justify-between relative">
                    {/* Left Column */}
                    <div className="flex flex-col items-start grow gap-8 flex-1 relative">
                      <div className="w-full flex self-stretch items-center gap-4 flex-[0_0_auto] relative">
                        <div className="inline-flex items-start flex-[0_0_auto] gap-2 p-2 rounded-[99px] bg-colors-dark-yellow-accent-200 relative">
                          <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-118.svg)] bg-cover bg-[50%_50%]" />
                        </div>
                        <div className="[font-family:'Poppins',Helvetica] tracking-[0] text-base flex-1 text-colors-white-800 font-normal leading-6 relative">
                          Slovenská&nbsp;&nbsp;
                          <br />
                          dialničná známka
                        </div>
                      </div>

                      <div className="w-full flex self-stretch items-center gap-4 flex-[0_0_auto] relative">
                        <div className="inline-flex items-start flex-[0_0_auto] gap-2 p-2 rounded-[99px] bg-colors-dark-yellow-accent-200 relative">
                          <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-118.svg)] bg-cover bg-[50%_50%]" />
                        </div>
                        <div className="[font-family:'Poppins',Helvetica] tracking-[0] text-base flex-1 text-colors-white-800 font-normal leading-6 relative">
                          Havaríjne poistenie
                        </div>
                      </div>
                    </div>

                    {/* Middle Column */}
                    <div className="flex flex-col items-start grow gap-8 flex-1 relative">
                      <div className="w-full flex self-stretch items-center gap-4 flex-[0_0_auto] relative">
                        <div className="inline-flex items-start flex-[0_0_auto] gap-2 p-2 rounded-[99px] bg-colors-dark-yellow-accent-200 relative">
                          <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-103.svg)] bg-cover bg-[50%_50%]" />
                        </div>
                        <div className="[font-family:'Poppins',Helvetica] tracking-[0] text-base flex-1 text-colors-white-800 font-normal leading-6 relative">
                          Dane a poplatky
                        </div>
                      </div>

                      <div className="w-full flex self-stretch items-center gap-4 flex-[0_0_auto] relative">
                        <div className="inline-flex items-start flex-[0_0_auto] gap-2 p-2 rounded-[99px] bg-colors-dark-yellow-accent-200 relative">
                          <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-103.svg)] bg-cover bg-[50%_50%]" />
                        </div>
                        <div className="[font-family:'Poppins',Helvetica] tracking-[0] text-base flex-1 text-colors-white-800 font-normal leading-6 relative">
                          Poistenie
                          <br />
                          zodpovednosti za škody
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col items-start grow gap-8 flex-1 relative">
                      <div className="w-full flex self-stretch items-center gap-4 flex-[0_0_auto] relative">
                        <div className="inline-flex items-start flex-[0_0_auto] gap-2 p-2 rounded-[99px] bg-colors-dark-yellow-accent-200 relative">
                          <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-105.svg)] bg-cover bg-[50%_50%]" />
                        </div>
                        <div className="[font-family:'Poppins',Helvetica] tracking-[0] text-base flex-1 text-colors-white-800 font-normal leading-6 relative">
                          Letné a zimné
                          <br />
                          pneumatiky
                        </div>
                      </div>

                      <div className="w-full flex self-stretch items-center gap-4 flex-[0_0_auto] relative">
                        <div className="inline-flex items-start flex-[0_0_auto] gap-2 p-2 rounded-[99px] bg-colors-dark-yellow-accent-200 relative">
                          <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-105.svg)] bg-cover bg-[50%_50%]" />
                        </div>
                        <div className="[font-family:'Poppins',Helvetica] tracking-[0] text-base flex-1 text-colors-white-800 font-normal leading-6 relative">
                          Servisné náklady
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section - Desktop 1440px */}
            <div className="flex flex-col w-[1120px] items-center gap-30 px-8 py-50 absolute left-40 top-[2378px] bg-colors-black-300 rounded-t-20">
              <div className="flex flex-col items-center gap-30 relative self-stretch w-full flex-[0_0_auto]">
                <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-[40px] tracking-[0] leading-6 whitespace-nowrap">
                  Časté otázky
                </div>

                <div className="flex items-start gap-8 relative self-stretch w-full flex-[0_0_auto]">
                  {/* Left Column */}
                  <div className="flex flex-col gap-4 relative flex-1 grow">
                    <div className="flex flex-col items-start gap-2 p-6 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <button
                        type="button"
                        onClick={() => toggleFAQ(200)} // offset for 1440px
                        className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto] cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <div className="flex items-center gap-2 relative flex-1 grow">
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Čo je zahrnuté v cene prenájmu?
                          </div>
                        </div>
                        <div className={`relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-filled-120.svg)] bg-cover bg-[50%_50%] transition-transform duration-200 ${expandedFAQ[200] ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {expandedFAQ[200] && (
                        <div className="relative self-stretch w-full mt-2 pt-2 border-t border-colors-black-500">
                          <div className="[font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm leading-6">
                            V cene prenájmu je zahrnuté základné poistenie, slovenská diaľničná známka, dane a poplatky.
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-start gap-2 p-6 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex items-center gap-2 relative flex-1 grow">
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            V akom stave je vozidlo pri odovzdaní nájomcovi?
                          </div>
                        </div>
                        <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-filled-120.svg)] bg-cover bg-[50%_50%]" />
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 p-6 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex items-center gap-2 relative flex-1 grow">
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Do ktorých krajín môžem s vozidlom vycestovať?
                          </div>
                        </div>
                        <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-filled-120.svg)] bg-cover bg-[50%_50%]" />
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 p-6 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex items-center gap-2 relative flex-1 grow">
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Môžem cestovať aj do krajín mimo Európskej Únie?
                          </div>
                        </div>
                        <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-filled-120.svg)] bg-cover bg-[50%_50%]" />
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 p-6 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex items-center gap-2 relative flex-1 grow">
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Môžem vozidlo prevziať / odovzdať aj mimo otváracích hodín?
                          </div>
                        </div>
                        <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-filled-120.svg)] bg-cover bg-[50%_50%]" />
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 p-6 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex items-center gap-2 relative flex-1 grow">
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Ako môžem platiť za prenájom vozidla?
                          </div>
                        </div>
                        <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-filled-120.svg)] bg-cover bg-[50%_50%]" />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="flex flex-col gap-4 relative flex-1 grow">
                    <div className="flex flex-col items-start gap-2 p-6 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex items-center gap-2 relative flex-1 grow">
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Majú vozidlá diaľničnú známku?
                          </div>
                        </div>
                        <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-filled-120.svg)] bg-cover bg-[50%_50%]" />
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 p-6 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex items-center gap-2 relative flex-1 grow">
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Je možná preprava zvierat?
                          </div>
                        </div>
                        <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-filled-120.svg)] bg-cover bg-[50%_50%]" />
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 p-6 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex items-center gap-2 relative flex-1 grow">
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Ako mám postupovať keď viem, že budem meškať?
                          </div>
                        </div>
                        <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-filled-120.svg)] bg-cover bg-[50%_50%]" />
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 p-6 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex items-center gap-2 relative flex-1 grow">
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Čo znamená jeden deň prenájmu?
                          </div>
                        </div>
                        <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-filled-120.svg)] bg-cover bg-[50%_50%]" />
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 p-6 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
                      <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex items-center gap-2 relative flex-1 grow">
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Čo ak dostanem pokutu?
                          </div>
                        </div>
                        <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-filled-120.svg)] bg-cover bg-[50%_50%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rychly kontakt - Desktop 1440px */}
            <div className="flex flex-col w-[1120px] items-center gap-10 p-12 absolute left-40 top-[2900px] bg-[#F0F0F5] rounded-2xl">
              {/* Operator Avatar */}
              <div className="relative w-24 h-24 rounded-full border border-solid border-[#F0F0F5] bg-[url(/operator-avatar-728c4b.jpg)] bg-cover bg-[50%_50%]">
                {/* Online Status Indicator */}
                <div className="absolute w-5 h-5 bottom-1 right-1 bg-[#3CEB82] rounded-full border border-solid border-[#F0F0F5]" />
              </div>

              <div className="flex flex-col items-center gap-8 relative">
                <div className="flex flex-col items-center gap-4 relative">
                  <h3 className="relative [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-[#283002] text-2xl text-center tracking-[0] leading-7">
                    Potrebujete poradiť? Sme tu pre vás.
                  </h3>
                  <p className="relative [font-family:'Poppins',Helvetica] font-medium text-[#A0A0A5] text-lg text-center tracking-[0] leading-6">
                    Sme na príjme Po–Pia 08:00–17:00
                  </p>
                </div>

                <div className="flex items-center gap-8 relative">
                  <a
                    href="tel:+421910666949"
                    className="flex items-center gap-4 px-8 py-4 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    aria-label="Zavolajte nám na číslo +421 910 666 949"
                  >
                    <img
                      className="relative w-6 h-6"
                      alt="Phone icon"
                      src="/figma-assets/Icon 24 px.svg"
                    />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#646469] text-lg tracking-[0] leading-6">
                      +421 910 666 949
                    </span>
                  </a>

                  <div className="w-px h-8 bg-[#BEBEC3]" />

                  <a
                    href="mailto:info@blackrent.sk"
                    className="flex items-center gap-4 px-8 py-4 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    aria-label="Napíšte nám e-mail na info@blackrent.sk"
                  >
                    <img
                      className="relative w-6 h-6"
                      alt="Email icon"
                      src="/figma-assets/Icon 24 px.svg"
                    />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#646469] text-lg tracking-[0] leading-6">
                      info@blackrent.sk
                    </span>
                  </a>
                </div>
              </div>
            </div>

            {/* Footer Section - Desktop 1440px */}
            <div className="flex flex-col items-center w-[1440px] absolute left-0 top-[3200px] bg-colors-black-100">
              {/* Newsletter Section */}
              <div className="flex items-start justify-between w-[1120px] px-0 py-20 relative flex-[0_0_auto]">
                <div className="relative w-[214px] h-8 bg-[url(https://c.animaapp.com/nwqz0he8/img/blackrent-logo-10.svg)] bg-cover bg-[50%_50%]" />
                
                <div className="flex items-start gap-10 relative flex-[0_0_auto]">
                  <div className="flex flex-col items-start gap-10 relative flex-[0_0_auto]">
                    <div className="flex flex-col items-start gap-10 relative w-[422px]">
                      <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xl tracking-[0] leading-6 whitespace-nowrap">
                          Newsletter
                        </div>
                        <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-400 text-sm tracking-[0] leading-5">
                          Prihláste sa na newsletter a získajte 5€ voucher na prenájom vozidla z našej autopožičovňe.
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 px-4 py-2 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-[99px]">
                        <div className="flex items-center gap-1 relative flex-1 grow">
                          <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-132.svg)] bg-cover bg-[50%_50%]" />
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Váš e-mail
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 px-5 py-2 relative flex-[0_0_auto] bg-colors-light-yellow-accent-700 rounded-[99px]">
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-black-100 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Potvrdiť
                          </div>
                          <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-103.svg)] bg-cover bg-[50%_50%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-10 relative flex-[0_0_auto]">
                    <div className="flex flex-col items-start gap-8 relative flex-[0_0_auto]">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xl tracking-[0] leading-6 whitespace-nowrap">
                        Mapa stránok
                      </div>
                      <div className="flex flex-col items-start gap-6 relative flex-[0_0_auto]">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Ponuka vozidiel
                        </div>
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Služby
                        </div>
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Store
                        </div>
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Kontakt
                        </div>
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          O nás
                        </div>
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Prihlásenie a Registrácia
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-10 relative flex-[0_0_auto]">
                      <div className="flex flex-col items-start gap-8 relative flex-[0_0_auto]">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xl tracking-[0] leading-6 whitespace-nowrap">
                          Sídlo spoločnosti
                        </div>
                        <div className="flex flex-col items-start gap-4 relative flex-[0_0_auto]">
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-400 text-sm tracking-[0] leading-5 whitespace-nowrap">
                            Rozmarínová 211/3
                          </div>
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-400 text-sm tracking-[0] leading-5 whitespace-nowrap">
                            91101 Trenčín
                          </div>
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-400 text-sm tracking-[0] leading-5 whitespace-nowrap">
                            +421 910 666 949
                          </div>
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-400 text-sm tracking-[0] leading-5 whitespace-nowrap">
                            info@blackrent.sk
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-4 relative flex-[0_0_auto]">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xl tracking-[0] leading-6 whitespace-nowrap">
                          Sledujte nás
                        </div>
                        <div className="flex items-start gap-4 relative flex-[0_0_auto]">
                          <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-133.svg)] bg-cover bg-[50%_50%]" />
                          <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-134.svg)] bg-cover bg-[50%_50%]" />
                          <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-135.svg)] bg-cover bg-[50%_50%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Copyright */}
              <div className="flex items-center justify-center w-[1440px] h-24 px-40 py-0 relative flex-[0_0_auto] bg-colors-black-200">
                <p className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
                  © 2024 blackrent.sk | Obchodné podmienky | Pravidlá pre súbory cookies | Reklamačný poriadok | Ochrana osobných údajov
                </p>
              </div>
            </div>

            {/* Booking Sidebar - Desktop 1440px */}
            <div className="flex flex-col w-[448px] items-center gap-6 absolute top-[293px] left-[807px] bg-colors-black-200 rounded-3xl overflow-hidden border border-solid border-colors-black-600">
              <div className="flex flex-col items-start gap-8 px-6 py-8 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-400">
                <div className="relative w-[206px] h-4 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                  Prenájom vozidla
                </div>

                <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      {/* Pickup Location Dropdown */}
                      <div className="relative flex-1 grow">
                        <div 
                          className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-[#1E1E23] rounded-lg cursor-pointer hover:bg-[#28282D] transition-colors duration-200"
                          onClick={() => toggleDropdown("pickup-location-1728")}
                          role="button"
                          aria-expanded={openDropdowns["pickup-location-1728"]}
                          aria-haspopup="listbox"
                        >
                          <div className="flex items-center gap-1 relative flex-1 grow">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap">
                              {formFields.find(f => f.id === "pickup-location")?.value || "Miesto vyzdvihnutia"}
                            </div>
                          </div>
                          <img
                            className={`relative w-5 h-5 transition-transform duration-200 ${openDropdowns["pickup-location-1728"] ? 'rotate-180' : ''}`}
                            alt="Arrow Down"
                            src="/figma-assets/icon-16px-arrow-down.svg"
                          />
                        </div>
                        
                        {/* Dropdown Options */}
                        {openDropdowns["pickup-location-1728"] && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E1E23] rounded-lg shadow-lg border border-[#28282D] z-10 max-h-48 overflow-y-auto">
                            {formFields.find(f => f.id === "pickup-location")?.options.map((option, index) => (
                              <div
                                key={index}
                                className="px-4 py-2 hover:bg-[#28282D] cursor-pointer transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                                onClick={() => {
                                  setFormFields(prev => prev.map(field => 
                                    field.id === "pickup-location" ? { ...field, value: option } : field
                                  ));
                                  toggleDropdown("pickup-location-1728");
                                }}
                              >
                                <div className="[font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm">
                                  {option}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      {/* Return Location Dropdown */}
                      <div className="relative flex-1 grow">
                        <div 
                          className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-[#1E1E23] rounded-lg cursor-pointer hover:bg-[#28282D] transition-colors duration-200"
                          onClick={() => toggleDropdown("return-location-1728")}
                          role="button"
                          aria-expanded={openDropdowns["return-location-1728"]}
                          aria-haspopup="listbox"
                        >
                          <div className="flex items-center gap-1 relative flex-1 grow">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap">
                              {formFields.find(f => f.id === "return-location")?.value || "Miesto vrátenia"}
                            </div>
                          </div>
                          <img
                            className={`relative w-5 h-5 transition-transform duration-200 ${openDropdowns["return-location-1728"] ? 'rotate-180' : ''}`}
                            alt="Arrow Down"
                            src="/figma-assets/icon-16px-arrow-down.svg"
                          />
                        </div>
                        
                        {/* Dropdown Options */}
                        {openDropdowns["return-location-1728"] && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E1E23] rounded-lg shadow-lg border border-[#28282D] z-10 max-h-48 overflow-y-auto">
                            {formFields.find(f => f.id === "return-location")?.options.map((option, index) => (
                              <div
                                key={index}
                                className="px-4 py-2 hover:bg-[#28282D] cursor-pointer transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                                onClick={() => {
                                  setFormFields(prev => prev.map(field => 
                                    field.id === "return-location" ? { ...field, value: option } : field
                                  ));
                                  toggleDropdown("return-location-1728");
                                }}
                              >
                                <div className="[font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm">
                                  {option}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      {/* Pickup Date Dropdown */}
                      <div className="relative flex-1 grow">
                        <div 
                          className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-[#1E1E23] rounded-lg cursor-pointer hover:bg-[#28282D] transition-colors duration-200"
                          onClick={() => toggleDropdown("pickup-date-1728")}
                          role="button"
                          aria-expanded={openDropdowns["pickup-date-1728"]}
                          aria-haspopup="listbox"
                        >
                          <div className="flex items-center gap-1 relative flex-1 grow">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap">
                              {formFields.find(f => f.id === "pickup-date")?.value || "Deň vyzdvihnutia"}
                            </div>
                          </div>
                          <img
                            className={`relative w-5 h-5 transition-transform duration-200 ${openDropdowns["pickup-date-1728"] ? 'rotate-180' : ''}`}
                            alt="Arrow Down"
                            src="/figma-assets/icon-16px-arrow-down.svg"
                          />
                        </div>
                        
                        {/* Dropdown Options */}
                        {openDropdowns["pickup-date-1728"] && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E1E23] rounded-lg shadow-lg border border-[#28282D] z-10 max-h-48 overflow-y-auto">
                            {formFields.find(f => f.id === "pickup-date")?.options.map((option, index) => (
                              <div
                                key={index}
                                className="px-4 py-2 hover:bg-[#28282D] cursor-pointer transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                                onClick={() => {
                                  setFormFields(prev => prev.map(field => 
                                    field.id === "pickup-date" ? { ...field, value: option } : field
                                  ));
                                  toggleDropdown("pickup-date-1728");
                                }}
                              >
                                <div className="[font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm">
                                  {option}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      {/* Return Date Dropdown */}
                      <div className="relative flex-1 grow">
                        <div 
                          className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-[#1E1E23] rounded-lg cursor-pointer hover:bg-[#28282D] transition-colors duration-200"
                          onClick={() => toggleDropdown("return-date-1728")}
                          role="button"
                          aria-expanded={openDropdowns["return-date-1728"]}
                          aria-haspopup="listbox"
                        >
                          <div className="flex items-center gap-1 relative flex-1 grow">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap">
                              {formFields.find(f => f.id === "return-date")?.value || "Deň vrátenia"}
                            </div>
                          </div>
                          <img
                            className={`relative w-5 h-5 transition-transform duration-200 ${openDropdowns["return-date-1728"] ? 'rotate-180' : ''}`}
                            alt="Arrow Down"
                            src="/figma-assets/icon-16px-arrow-down.svg"
                          />
                        </div>
                        
                        {/* Dropdown Options */}
                        {openDropdowns["return-date-1728"] && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E1E23] rounded-lg shadow-lg border border-[#28282D] z-10 max-h-48 overflow-y-auto">
                            {formFields.find(f => f.id === "return-date")?.options.map((option, index) => (
                              <div
                                key={index}
                                className="px-4 py-2 hover:bg-[#28282D] cursor-pointer transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                                onClick={() => {
                                  setFormFields(prev => prev.map(field => 
                                    field.id === "return-date" ? { ...field, value: option } : field
                                  ));
                                  toggleDropdown("return-date-1728");
                                }}
                              >
                                <div className="[font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm">
                                  {option}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      {/* Pickup Time Dropdown */}
                      <div className="relative flex-1 grow">
                        <div 
                          className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-[#1E1E23] rounded-lg cursor-pointer hover:bg-[#28282D] transition-colors duration-200"
                          onClick={() => toggleDropdown("pickup-time-1728")}
                          role="button"
                          aria-expanded={openDropdowns["pickup-time-1728"]}
                          aria-haspopup="listbox"
                        >
                          <div className="flex items-center gap-1 relative flex-1 grow">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap">
                              {formFields.find(f => f.id === "pickup-time")?.value || "Čas vyzdvihnutia"}
                            </div>
                          </div>
                          <img
                            className={`relative w-5 h-5 transition-transform duration-200 ${openDropdowns["pickup-time-1728"] ? 'rotate-180' : ''}`}
                            alt="Arrow Down"
                            src="/figma-assets/icon-16px-arrow-down.svg"
                          />
                        </div>
                        
                        {/* Dropdown Options */}
                        {openDropdowns["pickup-time-1728"] && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E1E23] rounded-lg shadow-lg border border-[#28282D] z-10 max-h-48 overflow-y-auto">
                            {formFields.find(f => f.id === "pickup-time")?.options.map((option, index) => (
                              <div
                                key={index}
                                className="px-4 py-2 hover:bg-[#28282D] cursor-pointer transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                                onClick={() => {
                                  setFormFields(prev => prev.map(field => 
                                    field.id === "pickup-time" ? { ...field, value: option } : field
                                  ));
                                  toggleDropdown("pickup-time-1728");
                                }}
                              >
                                <div className="[font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm">
                                  {option}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      {/* Return Time Dropdown */}
                      <div className="relative flex-1 grow">
                        <div 
                          className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-[#1E1E23] rounded-lg cursor-pointer hover:bg-[#28282D] transition-colors duration-200"
                          onClick={() => toggleDropdown("return-time-1728")}
                          role="button"
                          aria-expanded={openDropdowns["return-time-1728"]}
                          aria-haspopup="listbox"
                        >
                          <div className="flex items-center gap-1 relative flex-1 grow">
                            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap">
                              {formFields.find(f => f.id === "return-time")?.value || "Čas vrátenia"}
                            </div>
                          </div>
                          <img
                            className={`relative w-5 h-5 transition-transform duration-200 ${openDropdowns["return-time-1728"] ? 'rotate-180' : ''}`}
                            alt="Arrow Down"
                            src="/figma-assets/icon-16px-arrow-down.svg"
                          />
                        </div>
                        
                        {/* Dropdown Options */}
                        {openDropdowns["return-time-1728"] && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E1E23] rounded-lg shadow-lg border border-[#28282D] z-10 max-h-48 overflow-y-auto">
                            {formFields.find(f => f.id === "return-time")?.options.map((option, index) => (
                              <div
                                key={index}
                                className="px-4 py-2 hover:bg-[#28282D] cursor-pointer transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                                onClick={() => {
                                  setFormFields(prev => prev.map(field => 
                                    field.id === "return-time" ? { ...field, value: option } : field
                                  ));
                                  toggleDropdown("return-time-1728");
                                }}
                              >
                                <div className="[font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm">
                                  {option}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="inline-flex items-center justify-center gap-2 px-6 py-3 relative flex-[0_0_auto] bg-colors-light-yellow-accent-700 rounded-lg">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-black-100 text-base tracking-[0] leading-6 whitespace-nowrap">
                        Rezervovať vozidlo
                      </div>
                    </div>

                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm text-center tracking-[0] leading-6 whitespace-nowrap">
                      Bezplatné zrušenie do 24 hodín
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Summary */}
              <div className="flex flex-col items-start gap-6 p-8 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full">
                    <div className="flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        Počet dní prenájmu
                      </div>
                      <div className="mt-[-1.00px] mr-[-1.00px] font-semibold text-colors-white-800 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                        3 dni
                      </div>
                    </div>
                  </div>

                  <div className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full">
                    <div className="flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        Počet povolených km
                      </div>
                      <div className="mt-[-1.00px] mr-[-1.00px] font-semibold text-colors-white-800 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                        750 km
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col h-8 items-start justify-around gap-2 p-4 relative self-stretch w-full">
                    <div className="self-stretch w-full flex-[0_0_auto] mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        Cena prenájmu
                      </div>
                      <div className="mt-[-1.00px] mr-[-1.00px] font-semibold text-colors-white-800 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                        525 €
                      </div>
                    </div>
                  </div>

                  <div className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full">
                    <div className="flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                      <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        <span className="font-semibold">Poistenie </span>
                        <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                          (základné)
                        </span>
                      </p>
                      <div className="mt-[-1.00px] mr-[-1.00px] font-semibold text-colors-white-800 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                        0 €
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mám promokód - Mobile */}
                <div className={`flex-col items-start justify-center gap-4 p-4 self-stretch w-full bg-colors-black-600 rounded-lg flex relative transition-all duration-300 ${isPromoExpanded ? 'h-auto' : 'h-10'}`}>
                  <button
                    type="button"
                    onClick={() => setIsPromoExpanded(!isPromoExpanded)}
                    className="items-center gap-1.5 self-stretch w-full flex-[0_0_auto] flex relative hover:opacity-80 transition-opacity"
                  >
                    <div className={`relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-110.svg)] bg-cover bg-[50%_50%] transition-transform ${isPromoExpanded ? 'rotate-45' : ''}`} />
                    <div className="flex-1 grow flex items-center justify-between relative">
                      <div className="relative w-fit mt-[-0.50px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                        Mám promokód
                      </div>
                    </div>
                  </button>
                  
                  {isPromoExpanded && (
                    <div className="flex flex-col gap-2 self-stretch w-full mt-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Zadajte promokód"
                        className="w-full px-3 py-2 bg-colors-black-700 text-colors-white-800 text-sm rounded-md border border-colors-black-800 focus:border-colors-light-yellow-accent-700 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        className="w-full px-4 py-2 bg-colors-light-yellow-accent-700 text-colors-black-100 text-sm font-medium rounded-md hover:bg-colors-light-yellow-accent-600 transition-colors"
                      >
                        Použiť
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="h-8 justify-between px-4 py-0 flex items-center relative self-stretch w-full">
                    <div className="flex items-center gap-2 relative flex-1 grow">
                      <p className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        <span className="font-semibold">Depozit</span>
                        <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                          {" "}
                          (vratná záloha)
                        </span>
                      </p>
                      <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-83.svg)] bg-cover bg-[50%_50%]" />
                    </div>
                    <div className="mr-[-1.00px] font-semibold text-colors-white-800 text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                      1500 €
                    </div>
                  </div>

                  {/* Radio Options - Mobile */}
                  {travelOptions.map((option, index) => (
                    <div key={option.id} className="justify-around pl-4 pr-0 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                      <div className="flex items-center gap-1.5 relative flex-1 grow">
                        <button
                          type="button"
                          onClick={() => handleTravelOptionChange(option.id)}
                          className="relative w-4 h-4 cursor-pointer hover:scale-105 transition-transform"
                        >
                          {option.isSelected ? (
                            <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-84.svg)] bg-cover bg-[50%_50%]" />
                          ) : (
                            <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-85.svg)] bg-cover bg-[50%_50%] hover:opacity-80 transition-opacity" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTravelOptionChange(option.id)}
                          className="relative flex-1 text-left cursor-pointer hover:text-colors-light-yellow-accent-700 transition-colors"
                        >
                          <p className="[font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                            <span className={option.isSelected ? "font-medium" : "font-medium"}>
                              {option.label}
                              {option.description && " "}
                            </span>
                            {option.description && (
                              <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
                                {option.description}
                              </span>
                            )}
                          </p>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Large Desktop Version - 1680px+ */}
        {screenWidth >= 1680 && (
          <>
            {/* Navigation - Desktop 1728px */}
            <div className="relative w-[1728px] h-[88px] flex items-center absolute left-0 top-0" style={{paddingLeft: '32px', paddingRight: '32px'}}>
              {/* Logo */}
              <Link href="/">
                <div className="h-8 bg-[url(https://c.animaapp.com/nwqz0he8/img/vector-25.svg)] bg-cover bg-[50%_50%] relative w-[214.4px] cursor-pointer hover:opacity-80 transition-opacity" />
              </Link>
              
              {/* Center Navigation Menu - Positioned in center */}
              <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                <div className="flex items-center justify-center gap-2" style={{gap: '8px'}}>
                  {/* Ponuka vozidiel */}
                  <Link href="/vozidla">
                    <div className="flex items-center justify-center gap-2 h-10 relative [font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap cursor-pointer hover:text-colors-light-yellow-accent-700 transition-colors" style={{padding: '8px'}}>
                      Ponuka vozidiel
                    </div>
                  </Link>
                  
                  {/* Služby */}
                  <div className="flex items-center justify-center gap-2 h-10 relative [font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap cursor-pointer hover:text-colors-light-yellow-accent-700 transition-colors" style={{padding: '8px'}}>
                    Služby
                  </div>
                  
                  {/* Store */}
                  <div className="flex items-center justify-center gap-2 h-10 relative [font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap cursor-pointer hover:text-colors-light-yellow-accent-700 transition-colors" style={{padding: '8px'}}>
                    Store
                  </div>
                  
                  {/* O nás */}
                  <div className="flex items-center justify-center gap-2 h-10 relative [font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap cursor-pointer hover:text-colors-light-yellow-accent-700 transition-colors" style={{padding: '8px'}}>
                    O nás
                  </div>
                  
                  {/* Kontakt */}
                  <div className="flex items-center justify-center gap-2 h-10 relative [font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap cursor-pointer hover:text-colors-light-yellow-accent-700 transition-colors" style={{padding: '8px'}}>
                    Kontakt
                  </div>
                </div>
              </div>

              {/* Right Side - Language & Login */}
              <div className="absolute right-0 flex items-center justify-center gap-2" style={{gap: '8px'}}>
                {/* Language Selector - Store Component */}
                <div className="flex items-center justify-center gap-2 h-10 bg-transparent rounded-lg border-0 cursor-pointer hover:bg-colors-black-700 transition-colors" style={{padding: '12px 16px', gap: '8px'}}>
                  {/* World Icon */}
                  <div className="relative w-6 h-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="9" stroke="#BEBEC3" strokeWidth="2"/>
                      <path d="M12 3c2.5 0 4.9 3.5 4.9 9s-2.4 9-4.9 9-4.9-3.5-4.9-9 2.4-9 4.9-9z" stroke="#BEBEC3" strokeWidth="2"/>
                      <path d="M3 12h18" stroke="#BEBEC3" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[#BEBEC3] text-sm text-right tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap">
                    SK
                  </div>
                </div>
                
                {/* Login Button - Secondary Button */}
                <div className="flex items-center justify-center h-10 bg-[#141900] rounded-[99px] cursor-pointer hover:bg-[#1a1f00] transition-colors" style={{padding: '12px 24px 12px 20px', gap: '6px'}}>
                  {/* Person Icon */}
                  <div className="relative w-6 h-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#D7FF14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="#D7FF14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[#D7FF14] text-sm tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap">
                    Prihlásiť sa
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Title and Info - Desktop */}
            <div className="flex flex-col w-[1328px] items-start gap-2 absolute top-[168px] left-[200px]">
              <div className="relative w-[375px] h-10 mt-[-1.00px] [font-family:'SF_Pro-ExpandedMedium',Helvetica] font-medium text-colors-light-yellow-accent-700 text-5xl tracking-[0] leading-[64px] whitespace-nowrap">
                Ford Mustang
              </div>

              {/* Vehicle Specs and Provider Info */}
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                {/* Left Side - Vehicle Specs */}
                <div className="flex items-start gap-2 relative flex-[0_0_auto]">
                  <div className="flex items-center relative flex-[0_0_auto]">
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-98.svg)] bg-cover bg-[50%_50%]" />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      123 kW
                    </div>
                  </div>

                  <div className="flex items-center gap-1 relative flex-[0_0_auto]">
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-99.svg)] bg-cover bg-[50%_50%]" />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      Benzín
                    </div>
                  </div>

                  <div className="flex items-center gap-1 relative flex-[0_0_auto]">
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-100.svg)] bg-cover bg-[50%_50%]" />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      Automat
                    </div>
                  </div>

                  <div className="flex items-center gap-1 relative flex-[0_0_auto]">
                    <div className="relative w-4 h-4 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-16-px-101.svg)] bg-cover bg-[50%_50%]" />
                    <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      Predný
                    </div>
                  </div>
                </div>

                {/* Right Side - Poskytovateľ vozidla */}
                <div className="flex items-center justify-center gap-2 relative flex-[0_0_auto]" style={{gap: '8px'}}>
                  {/* Provider Info */}
                  <div className="flex items-center justify-center gap-1.5 relative flex-[0_0_auto]" style={{gap: '6px'}}>
                    {/* AVIS Logo */}
                    <div className="relative w-[52.43px] h-4">
                      <img
                        className="relative w-[52.43px] h-4"
                        alt="AVIS Logo"
                        src="/figma-assets/Vector.svg"
                      />
                    </div>
                    {/* Info Icon */}
                    <div className="relative w-4 h-4">
                      <img
                        className="relative w-4 h-4"
                        alt="Info Icon"
                        src="/figma-assets/Icon 16 px (1).svg"
                      />
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div className="relative w-0.5 h-6">
                    <img
                      className="relative w-0.5 h-6"
                      alt="Divider Line"
                      src="/figma-assets/Line 3.svg"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-center gap-1 relative flex-[0_0_auto]" style={{gap: '4px'}}>
                    {/* Share Button */}
                    <button
                      type="button"
                      onClick={handleShareVehicle}
                      className="flex w-10 h-10 items-center justify-center gap-2 relative rounded-lg cursor-pointer hover:bg-colors-black-700 transition-colors"
                      style={{padding: '8px'}}
                      aria-label="Zdieľať vozidlo"
                    >
                      <div className="relative w-6 h-6">
                        <img
                          className="relative w-6 h-6"
                          alt="Share Icon"
                          src="/figma-assets/Icon 24 px (1).svg"
                        />
                      </div>
                    </button>
                    {/* Heart Button */}
                    <button
                      type="button"
                      onClick={handleSaveVehicle}
                      className="flex w-10 h-10 items-center justify-center gap-2 relative rounded-lg cursor-pointer hover:bg-colors-black-700 transition-colors"
                      style={{padding: '8px'}}
                      aria-label={isVehicleSaved ? "Odstrániť z obľúbených" : "Pridať do obľúbených"}
                    >
                      <div className="relative w-6 h-6">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path 
                            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
                            stroke={isVehicleSaved ? "#F0FF98" : "#BEBEC3"} 
                            fill={isVehicleSaved ? "#F0FF98" : "none"}
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            className="transition-colors duration-200"
                          />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Gallery - Desktop 1728px */}
            <div className="inline-flex flex-col items-start gap-20 absolute left-[200px] top-[280px]">
              <div className="inline-flex flex-col items-start gap-10 relative flex-[0_0_auto]">
                <div className="inline-flex flex-col items-start gap-8 relative flex-[0_0_auto]">
                  {/* Main Image */}
                  <div 
                    className="w-[761px] h-[432px] rounded-2xl bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-170-5.png)] relative bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200" 
                    onClick={() => handleImageClick(0)}
                    role="button"
                    aria-label="Zobraziť hlavný obrázok vozidla"
                  />

                  {/* Thumbnail Gallery */}
                  <div className="flex flex-wrap w-[761px] items-center gap-[36px_24px] relative flex-[0_0_auto]">
                    <div 
                      className="relative flex-1 grow h-24 rounded-lg bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-169-2@2x.png)] bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200" 
                      onClick={() => handleImageClick(2)}
                      role="button"
                      aria-label="Zobraziť bočný pohľad na vozidlo"
                    />
                    <div 
                      className="flex-1 grow h-24 rounded-lg bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-170-6@2x.png)] relative bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200" 
                      onClick={() => handleImageClick(3)}
                      role="button"
                      aria-label="Zobraziť zadný pohľad na vozidlo"
                    />
                    <div 
                      className="relative flex-1 grow h-24 rounded-lg bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-167-2@2x.png)] bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200" 
                      onClick={() => handleImageClick(4)}
                      role="button"
                      aria-label="Zobraziť motor vozidla"
                    />
                    <div 
                      className="relative flex-1 grow h-24 rounded-lg overflow-hidden bg-[url(https://c.animaapp.com/nwqz0he8/img/frame-168-2@2x.png)] bg-cover bg-[50%_50%] cursor-pointer hover:opacity-90 transition-opacity duration-200"
                      onClick={() => handleImageClick(5)}
                      role="button"
                      aria-label="Zobraziť všetky obrázky vozidla"
                    >
                      <div className="inline-flex items-center justify-center gap-1 relative top-9 left-[57px]">
                        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-1000 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          viac
                        </div>
                        <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-121.svg)] bg-cover bg-[50%_50%]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider Line */}
                <img
                  className="object-cover relative w-[762px] h-px ml-[-0.50px] mr-[-0.50px]"
                  alt="Line"
                  src="https://c.animaapp.com/nwqz0he8/img/line-8-5.svg"
                />

                {/* Vehicle Description */}
                <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex w-[260px] h-4 items-center relative">
                    <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                      Predstavenie vozidla
                    </div>
                  </div>

                  <div className="relative w-[725px] h-[274px]">
                    <p className="absolute w-[719px] top-0 left-0 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                      Zažite skutočnú jazdu plnú luxusu a výkonu s naším novým
                      prírastkom do flotily - BMW M440i xDrive. Tento
                      výnimočný model z roku 2022 a má výkon 275 kW. Je
                      poháňaný benzínom, čo vám zaručuje adrenalínovú jazdu
                      vždy, keď sadnete za volant.
                    </p>

                    <p className="absolute w-[638px] top-[120px] left-[58px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                      Čo robí tento model ešte výnimočnejším, je jeho matná
                      šedá farba. Táto farba dodáva vozidlu elegantný a
                      sofistikovaný vzhľad, ktorý zaujme na každej ceste.
                    </p>

                    <p className="absolute w-[638px] top-[185px] left-[58px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-[26px]">
                      Ak hľadáte auto na prenájom, ktoré kombinuje štýl, výkon
                      a moderné technológie, BMW M440i je jednoznačne tou
                      správnou voľbou. Moderné technológie a prvotriedne
                      materiály vytvárajú interiér, ktorý je rovnako pohodlný
                      ako atraktívny.
                    </p>

                    <img
                      className="absolute w-[29px] h-0.5 top-[190px] left-2.5"
                      alt="Vector"
                      src="https://c.animaapp.com/nwqz0he8/img/vector-23-3.svg"
                    />

                    <img
                      className="absolute w-[29px] h-0.5 top-[125px] left-2.5"
                      alt="Vector"
                      src="https://c.animaapp.com/nwqz0he8/img/vector-23-3.svg"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Table - Desktop 1728px */}
              <div className="flex flex-col w-[761px] items-start gap-6 px-8 py-10 relative flex-[0_0_auto] bg-colors-black-300 rounded-2xl">
                <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                  Cenové relácie
                </div>

                <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                  {/* Table Header */}
                  <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                    <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        Počet dní prenájmu
                      </div>
                    </div>
                    <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                        Nájazd km/deň
                      </div>
                    </div>
                    <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                        Cena prenájmu/deň
                      </div>
                    </div>
                  </div>

                  {/* Table Rows */}
                  {[
                    { days: "0–1 dní", km: "300 km", price: "200 €" },
                    { days: "2–3 dní", km: "250 km", price: "175 €" },
                    { days: "4–7 dní", km: "210 km", price: "150 €" },
                    { days: "8–14 dní", km: "170 km", price: "130 €" },
                    { days: "15–22 dní", km: "150 km", price: "120 €" },
                    { days: "23–30 dní", km: "130 km", price: "110 €" },
                    { days: "31 a viac dní", km: "115 km", price: "100 €" },
                  ].map((row, index) => (
                    <div key={index} className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
                      <div className="flex w-44 items-center gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                          {row.days}
                        </div>
                      </div>
                      <div className="flex w-[142px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="w-fit text-colors-white-800 text-base text-right whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                          {row.km}
                        </div>
                      </div>
                      <div className="flex w-[183px] items-center justify-end gap-2 p-2 relative mt-[-9.50px] mb-[-9.50px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                          {row.price}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Specifications - Desktop 1728px */}
              <div className="inline-flex flex-col items-start gap-10 relative flex-[0_0_auto]">
                <div className="inline-flex h-4 items-center justify-center gap-2 px-0 py-4 relative">
                  <div className="relative w-fit mt-[-16.00px] mb-[-14.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                    Technické parametre
                  </div>
                </div>

                <div className="flex w-[761px] items-start justify-between relative flex-[0_0_auto]">
                  <div className="flex flex-col items-start gap-2 relative flex-1 grow">
                    <div className="px-2 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                      <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-122.svg)] bg-cover bg-[50%_50%]" />
                      <div className="flex items-center gap-1 relative flex-1 grow">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Karoséria:
                        </div>
                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                          SUV
                        </div>
                      </div>
                    </div>

                    <div className="px-2 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                      <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-123.svg)] bg-cover bg-[50%_50%]" />
                      <div className="flex items-center gap-1 relative flex-1 grow">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Počet dverí:
                        </div>
                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                          4+1
                        </div>
                      </div>
                    </div>

                    <div className="px-2 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                      <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-124.svg)] bg-cover bg-[50%_50%]" />
                      <div className="flex items-center gap-1 relative flex-1 grow">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Výkon:
                        </div>
                        <div className="flex-1 text-colors-ligh-gray-800 text-sm overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                          275 kW
                        </div>
                      </div>
                    </div>

                    <div className="px-2 py-0 flex h-8 items-center gap-2 relative self-stretch w-full">
                      <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-125.svg)] bg-cover bg-[50%_50%]" />
                      <div className="flex items-center gap-1 relative flex-1 grow">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Objem valcov:
                        </div>
                        <div className="flex-1 text-colors-ligh-gray-400 text-sm overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                          2998 cm3
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2 relative flex-1 grow">
                    <div className="flex h-8 items-center gap-2 px-2 py-0 relative self-stretch w-full rounded-lg">
                      <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-126.svg)] bg-cover bg-[50%_50%]" />
                      <div className="flex items-center gap-1 relative flex-1 grow">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Spotreba:
                        </div>
                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                          5.4l/100km
                        </div>
                      </div>
                    </div>

                    <div className="flex h-8 items-center gap-2 px-2 py-0 relative self-stretch w-full rounded-lg">
                      <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-127.svg)] bg-cover bg-[50%_50%]" />
                      <div className="flex items-center gap-1 relative flex-1 grow">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Palivo:
                        </div>
                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                          Benzín
                        </div>
                      </div>
                    </div>

                    <div className="flex h-8 items-center gap-2 px-2 py-0 relative self-stretch w-full rounded-lg">
                      <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-128.svg)] bg-cover bg-[50%_50%]" />
                      <div className="flex items-center gap-1 relative flex-1 grow">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Prevodovka:
                        </div>
                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                          Automatická
                        </div>
                      </div>
                    </div>

                    <div className="flex h-8 items-center gap-2 px-2 py-0 relative self-stretch w-full rounded-lg">
                      <div className="relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-129.svg)] bg-cover bg-[50%_50%]" />
                      <div className="flex items-center gap-1 relative flex-1 grow">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Náhon:
                        </div>
                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                          4×4
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2 relative flex-1 grow">
                    <div className="flex h-8 items-center gap-2 pl-2 pr-3.5 py-4 relative self-stretch w-full rounded-lg">
                      <div className="mt-[-12.00px] mb-[-12.00px] relative w-6 h-6 bg-[url(https://c.animaapp.com/nwqz0he8/img/icon-24-px-130.svg)] bg-cover bg-[50%_50%]" />
                      <div className="flex items-center gap-1 relative flex-1 grow mt-[-5.00px] mb-[-5.00px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Rok výroby:
                        </div>
                        <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                          2016
                        </div>
                      </div>
                    </div>

                    <div className="flex h-8 items-center gap-2 pl-2 pr-3.5 py-4 relative self-stretch w-full rounded-lg">
                      <div className="mt-[-12.00px] mb-[-12.00px] relative w-6 h-6">
                        <img
                          className="absolute w-5 h-5 top-0.5 left-0.5"
                          alt="Vector stroke"
                          src="https://c.animaapp.com/nwqz0he8/img/vector-24--stroke-.png"
                        />
                      </div>
                      <div className="flex items-center gap-1 relative flex-1 grow mt-[-5.00px] mb-[-5.00px]">
                        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          Nájazd km:
                        </div>
                        <div className="flex-1 text-colors-ligh-gray-800 text-sm overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                          91000 km
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Equipment - Desktop 1728px */}
              <div className="inline-flex flex-col items-start gap-10 relative flex-[0_0_auto]">
                <div className="inline-flex h-4 items-center justify-center gap-2 px-0 py-4 relative">
                  <div className="relative w-fit mt-[-16.00px] mb-[-14.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                    Výbava vozidla
                  </div>
                </div>

                <div className="flex flex-wrap w-[761px] items-center gap-4 relative flex-[0_0_auto]">
                  {[
                    "Bluetooth", "USB vstup", "Klimatizácia", "GPS", "Tempomat", "4×4",
                    "Lorem ipsum", "Parkovacie senzory", "Apple carplay", "Lorem ipsum",
                    "Lorem ipsum", "Lorem ipsum", "Lorem ipsum", "Lorem ipsum", "Lorem ipsum"
                  ].map((feature, index) => (
                    <div key={index} className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-[#1E1E23] rounded-lg">
                      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-[#F0F0F5] text-sm tracking-[0] leading-[1.7142857142857142em] whitespace-nowrap">
                        {feature}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* What's Included Section */}
              <div className="flex flex-col w-[761px] items-start gap-8 px-8 py-10 relative flex-[0_0_auto] bg-colors-black-300 rounded-2xl">
                <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                  V cene prenájmu je zahrnuté
                </div>

                <div className="flex items-start justify-between pl-2 pr-0 py-0 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col items-start gap-8 relative flex-1 grow">
                    <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-start gap-2 p-2 relative flex-[0_0_auto] bg-colors-dark-yellow-accent-200 rounded-[99px]">
                        <img
                          className="relative w-6 h-6"
                          alt="Icon px"
                          src="https://c.animaapp.com/nwqz0he8/img/icon-24-px-118.svg"
                        />
                      </div>
                      <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6">
                        Slovenská dialničná známka
                      </div>
                    </div>

                    <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-start gap-2 p-2 relative flex-[0_0_auto] bg-colors-dark-yellow-accent-200 rounded-[99px]">
                        <img
                          className="relative w-6 h-6"
                          alt="Icon px"
                          src="https://c.animaapp.com/nwqz0he8/img/icon-24-px-118.svg"
                        />
                      </div>
                      <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6">
                        Havaríjne poistenie
                      </div>
                    </div>

                    <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-start gap-2 p-2 relative flex-[0_0_auto] bg-colors-dark-yellow-accent-200 rounded-[99px]">
                        <img
                          className="relative w-6 h-6"
                          alt="Icon px"
                          src="https://c.animaapp.com/nwqz0he8/img/icon-24-px-118.svg"
                        />
                      </div>
                      <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6">
                        Letné a zimné pneumatiky
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-8 relative flex-1 grow">
                    <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-start gap-2 p-2 relative flex-[0_0_auto] bg-colors-dark-yellow-accent-200 rounded-[99px]">
                        <img
                          className="relative w-6 h-6"
                          alt="Icon px"
                          src="https://c.animaapp.com/nwqz0he8/img/icon-24-px-118.svg"
                        />
                      </div>
                      <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6">
                        Dane a poplatky
                      </div>
                    </div>

                    <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-start gap-2 p-2 relative flex-[0_0_auto] bg-colors-dark-yellow-accent-200 rounded-[99px]">
                        <img
                          className="relative w-6 h-6"
                          alt="Icon px"
                          src="https://c.animaapp.com/nwqz0he8/img/icon-24-px-118.svg"
                        />
                      </div>
                      <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6">
                        Poistenie zodpovednosti za škody
                      </div>
                    </div>

                    <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-start gap-2 p-2 relative flex-[0_0_auto] bg-colors-dark-yellow-accent-200 rounded-[99px]">
                        <img
                          className="relative w-6 h-6"
                          alt="Icon px"
                          src="https://c.animaapp.com/nwqz0he8/img/icon-24-px-118.svg"
                        />
                      </div>
                      <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6">
                        Servisné náklady
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>





            {/* V cene je zahrnuté - Desktop 1728px */}
            <div className="flex flex-col w-[1328px] items-start gap-2 px-28 py-20 absolute top-[2464px] left-[200px] bg-[#0F0F14] rounded-2xl">
              <div className="flex items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
                <div className="relative w-[92px] h-[88px]">
                  <img
                    className="relative w-[92px] h-[88px]"
                    alt="3D Check Icon"
                    src="/figma-assets/3D icons dark big.svg"
                  />
                </div>
                <div className="flex flex-col items-start gap-4 relative flex-1 grow">
                  <div className="inline-flex items-center gap-2 h-[88px] justify-center relative">
                    <div className="[font-family:'SF_Pro',Helvetica] w-fit tracking-[0] text-2xl text-[#F0FF98] font-[650] leading-[1.1666666666666667em] whitespace-nowrap relative">
                      V cene je zahrnuté
                    </div>
                  </div>

                  <div className="flex items-start justify-stretch self-stretch gap-24 relative w-full flex-[0_0_auto]">
                    {/* Left Column */}
                    <div className="flex flex-col items-start gap-8 relative flex-1 grow">
                      <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="inline-flex items-start gap-2 p-2 relative flex-[0_0_auto] bg-[#283002] rounded-[99px]">
                          <img
                            className="relative w-6 h-6"
                            alt="Check Icon"
                            src="/figma-assets/Icon 24 px.svg"
                          />
                        </div>
                        <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-[#F0F0F5] text-base tracking-[0] leading-[1.5em]">
                          Slovenská dialničná známka
                        </div>
                      </div>

                      <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="inline-flex items-start gap-2 p-2 relative flex-[0_0_auto] bg-[#283002] rounded-[99px]">
                          <img
                            className="relative w-6 h-6"
                            alt="Check Icon"
                            src="/figma-assets/Icon 24 px.svg"
                          />
                        </div>
                        <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-[#F0F0F5] text-base tracking-[0] leading-[1.5em]">
                          Dane a poplatky
                        </div>
                      </div>

                      <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="inline-flex items-start gap-2 p-2 relative flex-[0_0_auto] bg-[#283002] rounded-[99px]">
                          <img
                            className="relative w-6 h-6"
                            alt="Check Icon"
                            src="/figma-assets/Icon 24 px.svg"
                          />
                        </div>
                        <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-[#F0F0F5] text-base tracking-[0] leading-[1.5em]">
                          Letné a zimné pneumatiky
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col items-start gap-8 relative flex-1 grow">
                      <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="inline-flex items-start gap-2 p-2 relative flex-[0_0_auto] bg-[#283002] rounded-[99px]">
                          <img
                            className="relative w-6 h-6"
                            alt="Check Icon"
                            src="/figma-assets/Icon 24 px.svg"
                          />
                        </div>
                        <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-[#F0F0F5] text-base tracking-[0] leading-[1.5em]">
                          Havaríjne poistenie
                        </div>
                      </div>

                      <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="inline-flex items-start gap-2 p-2 relative flex-[0_0_auto] bg-[#283002] rounded-[99px]">
                          <img
                            className="relative w-6 h-6"
                            alt="Check Icon"
                            src="/figma-assets/Icon 24 px.svg"
                          />
                        </div>
                        <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-[#F0F0F5] text-base tracking-[0] leading-[1.5em]">
                          Poistenie zodpovednosti za škody
                        </div>
                      </div>

                      <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="inline-flex items-start gap-2 p-2 relative flex-[0_0_auto] bg-[#283002] rounded-[99px]">
                          <img
                            className="relative w-6 h-6"
                            alt="Check Icon"
                            src="/figma-assets/Icon 24 px.svg"
                          />
                        </div>
                        <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-[#F0F0F5] text-base tracking-[0] leading-[1.5em]">
                          Servisné náklady
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Sidebar - Desktop 1728px */}
            <div className="flex flex-col w-[536px] items-center gap-6 absolute top-[280px] left-[993px] bg-colors-black-600 rounded-3xl overflow-hidden">
              <form ref={formRef} className="flex-col items-start gap-8 px-6 py-8 self-stretch w-full flex-[0_0_auto] bg-colors-black-400 rounded-3xl overflow-hidden flex relative">
                <h1 className="relative w-[206px] h-4 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
                  Prenájom vozidla
                </h1>

                <div className="flex-col items-start gap-6 self-stretch w-full flex-[0_0_auto] flex relative">
                  <fieldset className="flex-col items-start gap-4 self-stretch w-full flex-[0_0_auto] flex relative">
                    <legend className="sr-only">Rental details</legend>

                    <div className="items-start gap-4 self-stretch w-full flex-[0_0_auto] flex relative">
                      {/* Miesto vyzdvihnutia */}
                      <div className="relative flex-1 grow">
                        <button
                          type="button"
                          onClick={() => toggleDropdown(formFields[0].id)}
                          className="h-10 items-center gap-0.5 pl-4 pr-3 py-0 w-full bg-colors-black-600 rounded-lg flex relative hover:bg-colors-black-700 transition-colors"
                        >
                          <div className="items-center gap-1 flex-1 grow flex relative">
                            <span className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              {formFields[0].value || formFields[0].label}
                            </span>
                          </div>
                          <img
                            className={`relative w-5 h-5 transition-transform ${openDropdowns[formFields[0].id] ? 'rotate-180' : ''}`}
                            alt="Dropdown icon"
                            src="https://c.animaapp.com/LjmxlyCT/img/icon-16-px-5.svg"
                          />
                        </button>
                        {openDropdowns[formFields[0].id] && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-colors-black-600 rounded-lg border border-colors-black-700 shadow-lg z-10">
                            {formFields[0].options.map((option, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => selectOption(formFields[0].id, option)}
                                className="w-full px-4 py-2 text-left text-sm text-colors-ligh-gray-800 hover:bg-colors-black-700 hover:text-colors-white-800 transition-colors first:rounded-t-lg last:rounded-b-lg"
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Miesto vrátenia */}
                      <div className="relative flex-1 grow">
                        <button
                          type="button"
                          onClick={() => toggleDropdown(formFields[1].id)}
                          className="h-10 items-center gap-0.5 pl-4 pr-3 py-0 w-full bg-colors-black-600 rounded-lg flex relative hover:bg-colors-black-700 transition-colors"
                        >
                          <div className="items-center gap-1 flex-1 grow flex relative">
                            <span className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              {formFields[1].value || formFields[1].label}
                            </span>
                          </div>
                          <img
                            className={`relative w-5 h-5 transition-transform ${openDropdowns[formFields[1].id] ? 'rotate-180' : ''}`}
                            alt="Dropdown icon"
                            src="https://c.animaapp.com/LjmxlyCT/img/icon-16-px-5.svg"
                          />
                        </button>
                        {openDropdowns[formFields[1].id] && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-colors-black-600 rounded-lg border border-colors-black-700 shadow-lg z-10">
                            {formFields[1].options.map((option, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => selectOption(formFields[1].id, option)}
                                className="w-full px-4 py-2 text-left text-sm text-colors-ligh-gray-800 hover:bg-colors-black-700 hover:text-colors-white-800 transition-colors first:rounded-t-lg last:rounded-b-lg"
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="items-start gap-4 self-stretch w-full flex-[0_0_auto] flex relative">
                      {/* Deň vyzdvihnutia */}
                      <div className="relative flex-1 grow">
                        <button
                          type="button"
                          onClick={() => toggleDropdown(formFields[2].id)}
                          className="h-10 items-center gap-0.5 pl-4 pr-3 py-0 w-full bg-colors-black-600 rounded-lg flex relative hover:bg-colors-black-700 transition-colors"
                        >
                          <div className="items-center gap-1 flex-1 grow flex relative">
                            <span className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              {formFields[2].value || formFields[2].label}
                            </span>
                          </div>
                          <img
                            className={`relative w-5 h-5 transition-transform ${openDropdowns[formFields[2].id] ? 'rotate-180' : ''}`}
                            alt="Dropdown icon"
                            src="https://c.animaapp.com/LjmxlyCT/img/icon-16-px-5.svg"
                          />
                        </button>
                        {openDropdowns[formFields[2].id] && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-colors-black-600 rounded-lg border border-colors-black-700 shadow-lg z-10">
                            {formFields[2].options.map((option, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => selectOption(formFields[2].id, option)}
                                className="w-full px-4 py-2 text-left text-sm text-colors-ligh-gray-800 hover:bg-colors-black-700 hover:text-colors-white-800 transition-colors first:rounded-t-lg last:rounded-b-lg"
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Deň vrátenia */}
                      <div className="relative flex-1 grow">
                        <button
                          type="button"
                          onClick={() => toggleDropdown(formFields[3].id)}
                          className="h-10 items-center gap-0.5 pl-4 pr-3 py-0 w-full bg-colors-black-600 rounded-lg flex relative hover:bg-colors-black-700 transition-colors"
                        >
                          <div className="items-center gap-1 flex-1 grow flex relative">
                            <span className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              {formFields[3].value || formFields[3].label}
                            </span>
                          </div>
                          <img
                            className={`relative w-5 h-5 transition-transform ${openDropdowns[formFields[3].id] ? 'rotate-180' : ''}`}
                            alt="Dropdown icon"
                            src="https://c.animaapp.com/LjmxlyCT/img/icon-16-px-5.svg"
                          />
                        </button>
                        {openDropdowns[formFields[3].id] && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-colors-black-600 rounded-lg border border-colors-black-700 shadow-lg z-10">
                            {formFields[3].options.map((option, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => selectOption(formFields[3].id, option)}
                                className="w-full px-4 py-2 text-left text-sm text-colors-ligh-gray-800 hover:bg-colors-black-700 hover:text-colors-white-800 transition-colors first:rounded-t-lg last:rounded-b-lg"
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="items-start gap-4 self-stretch w-full flex-[0_0_auto] flex relative">
                      {/* Čas vyzdvihnutia */}
                      <div className="relative flex-1 grow">
                        <button
                          type="button"
                          onClick={() => toggleDropdown(formFields[4].id)}
                          className="h-10 items-center gap-0.5 pl-4 pr-3 py-0 w-full bg-colors-black-600 rounded-lg flex relative hover:bg-colors-black-700 transition-colors"
                        >
                          <div className="items-center gap-1 flex-1 grow flex relative">
                            <span className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              {formFields[4].value || formFields[4].label}
                            </span>
                          </div>
                          <img
                            className={`relative w-5 h-5 transition-transform ${openDropdowns[formFields[4].id] ? 'rotate-180' : ''}`}
                            alt="Dropdown icon"
                            src="https://c.animaapp.com/LjmxlyCT/img/icon-16-px-5.svg"
                          />
                        </button>
                        {openDropdowns[formFields[4].id] && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-colors-black-600 rounded-lg border border-colors-black-700 shadow-lg z-10 max-h-40 overflow-y-auto">
                            {formFields[4].options.map((option, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => selectOption(formFields[4].id, option)}
                                className="w-full px-4 py-2 text-left text-sm text-colors-ligh-gray-800 hover:bg-colors-black-700 hover:text-colors-white-800 transition-colors first:rounded-t-lg last:rounded-b-lg"
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Čas vrátenia */}
                      <div className="relative flex-1 grow">
                        <button
                          type="button"
                          onClick={() => toggleDropdown(formFields[5].id)}
                          className="h-10 items-center gap-0.5 pl-4 pr-3 py-0 w-full bg-colors-black-600 rounded-lg flex relative hover:bg-colors-black-700 transition-colors"
                        >
                          <div className="items-center gap-1 flex-1 grow flex relative">
                            <span className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                              {formFields[5].value || formFields[5].label}
                            </span>
                          </div>
                          <img
                            className={`relative w-5 h-5 transition-transform ${openDropdowns[formFields[5].id] ? 'rotate-180' : ''}`}
                            alt="Dropdown icon"
                            src="https://c.animaapp.com/LjmxlyCT/img/icon-16-px-5.svg"
                          />
                        </button>
                        {openDropdowns[formFields[5].id] && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-colors-black-600 rounded-lg border border-colors-black-700 shadow-lg z-10 max-h-40 overflow-y-auto">
                            {formFields[5].options.map((option, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => selectOption(formFields[5].id, option)}
                                className="w-full px-4 py-2 text-left text-sm text-colors-ligh-gray-800 hover:bg-colors-black-700 hover:text-colors-white-800 transition-colors first:rounded-t-lg last:rounded-b-lg"
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </fieldset>

                  <section className="flex-col items-center gap-4 self-stretch w-full flex-[0_0_auto] flex relative">
                    <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                      {/* Počet povolených km */}
                      <div className="h-8 items-center justify-around gap-2 p-4 self-stretch w-full flex relative">
                        <div className="flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            Počet povolených km
                          </div>
                        </div>
                      </div>

                      {/* Cena prenájmu */}
                      <div className="flex-col h-8 items-start justify-around gap-2 p-4 self-stretch w-full flex relative">
                        <div className="self-stretch w-full flex-[0_0_auto] mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            Cena prenájmu
                          </div>
                        </div>
                      </div>

                      {/* Poistenie (základné) */}
                      <div className="h-8 items-center justify-around gap-2 p-4 self-stretch w-full flex relative">
                        <div className="flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                          <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            <span className="font-semibold">Poistenie </span>
                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                              (základné)
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Mám promokód */}
                    <div className={`flex-col items-start justify-center gap-4 p-4 self-stretch w-full bg-colors-black-600 rounded-lg flex relative transition-all duration-300 ${isPromoExpanded ? 'h-auto' : 'h-10'}`}>
                      <button
                        type="button"
                        onClick={() => setIsPromoExpanded(!isPromoExpanded)}
                        className="items-center gap-1.5 self-stretch w-full flex-[0_0_auto] flex relative hover:opacity-80 transition-opacity"
                      >
                        <img
                          className={`relative w-4 h-4 transition-transform ${isPromoExpanded ? 'rotate-45' : ''}`}
                          alt="Promo code icon"
                          src="https://c.animaapp.com/LjmxlyCT/img/icon-16-px-6.svg"
                        />
                        <div className="flex-1 grow flex items-center justify-between relative">
                          <div className="relative w-fit mt-[-0.50px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Mám promokód
                          </div>
                        </div>
                      </button>
                      
                      {isPromoExpanded && (
                        <div className="flex items-center gap-2 self-stretch w-full mt-2">
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder="Zadajte promokód"
                            className="flex-1 px-3 py-2 bg-colors-black-700 text-colors-white-800 text-sm rounded-md border border-colors-black-800 focus:border-colors-light-yellow-accent-700 focus:outline-none transition-colors"
                          />
                          <button
                            type="button"
                            className="px-4 py-2 bg-colors-light-yellow-accent-700 text-colors-black-100 text-sm font-medium rounded-md hover:bg-colors-light-yellow-accent-600 transition-colors"
                          >
                            Použiť
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Depozit (vratná záloha) */}
                    <fieldset className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                      <legend className="flex h-8 items-center justify-between px-4 py-0 relative self-stretch w-full">
                        <div className="items-center gap-2 flex-1 grow flex relative">
                          <p className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                            <span className="font-semibold">Depozit</span>
                            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                              {" "}
                              (vratná záloha)
                            </span>
                          </p>
                          <img
                            className="relative w-4 h-4"
                            alt="Info icon"
                            src="https://c.animaapp.com/LjmxlyCT/img/icon-16-px-7.svg"
                          />
                        </div>
                      </legend>

                      {/* Radio Options */}
                      {travelOptions.map((option, index) => (
                        <div key={option.id} className="h-8 items-center justify-around gap-2 pl-4 pr-0 py-0 self-stretch w-full flex relative">
                          <div className="items-center gap-1.5 flex-1 grow flex relative">
                            <button
                              type="button"
                              onClick={() => handleTravelOptionChange(option.id)}
                              className="relative w-6 h-6 cursor-pointer hover:scale-105 transition-transform"
                            >
                              {option.isSelected ? (
                                <div className="relative w-6 h-6">
                                  <div className="relative w-5 h-5 top-0.5 left-0.5 bg-colors-dark-yellow-accent-300 rounded-[10px]">
                                    <div className="relative w-3 h-3 top-1 left-1 bg-colors-light-yellow-accent-100 rounded-md" />
                                  </div>
                                </div>
                              ) : (
                                <div className="relative w-5 h-5 top-0.5 left-0.5 rounded-[10px] border-2 border-solid border-colors-dark-gray-900 hover:border-colors-ligh-gray-800 transition-colors" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTravelOptionChange(option.id)}
                              className="relative flex-1 text-left cursor-pointer hover:text-colors-light-yellow-accent-700 transition-colors"
                            >
                              <p className="[font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                                <span className={option.isSelected ? "font-medium" : "font-medium"}>
                                  {option.label}
                                  {option.description && " "}
                                </span>
                                {option.description && (
                                  <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
                                    {option.description}
                                  </span>
                                )}
                              </p>
                            </button>
                          </div>
                        </div>
                      ))}
                    </fieldset>
                  </section>
                </div>
              </form>
            </div>

                          {/* FAQ + Footer Section - Desktop 1728px */}
              <div className="flex flex-col w-[1728px] items-center gap-2 pt-[200px] pb-0 px-2 absolute left-0 top-[3048px] bg-colors-black-300 rounded-t-[40px]">
              
              {/* FAQ Section - Frame 359 - NAVRCHU */}
              <div className="flex flex-col items-center gap-[120px] relative">
                {/* FAQ Title */}
                <div className="relative w-[300px] h-6 [font-family:'SF_Pro',Helvetica] font-[650] text-[40px] leading-[0.6em] text-center text-[#F0FF98]">
                  Časté otázky
                </div>
                
                {/* FAQ Content - Frame 358 */}
                <div className="flex gap-8 relative">
                  {/* Left Column */}
                  <div className="flex flex-col gap-4 w-[567px]">
                    {[
                      {
                        question: "Čo je zahrnuté v cene prenájmu?",
                        answer: "V cene prenájmu je zahrnuté základné poistenie vozidla, neobmedzené kilometre v rámci Slovenska a základná technická podpora. Nie sú zahrnuté palivá, diaľničné známky a dodatočné poistenie."
                      },
                      {
                        question: "V akom stave je vozidlo pri odovzdaní nájomcovi?",
                        answer: "Všetky vozidlá sú pred odovzdaním dôkladne vyčistené a technicky skontrolované. Vozidlo dostanete s plnou nádržou paliva a v bezchybnom technickom stave."
                      },
                      {
                        question: "Do ktorých krajín môžem s vozidlom vycestovať?",
                        answer: "Základný balík umožňuje cestovanie po Slovensku, Česku a Rakúsku. Za príplatok môžete rozšíriť na ďalšie krajiny EÚ."
                      },
                      {
                        question: "Môžem cestovať aj do krajín mimo Európskej Únie?",
                        answer: "Cestovanie mimo EÚ je možné po individuálnom posúdení a schválení. Kontaktujte nás pre viac informácií o podmienkach."
                      },
                      {
                        question: "Môžem vozidlo prevziať / odovzdať aj mimo otváracích hodín?",
                        answer: "Áno, ponúkame službu prevzatia a odovzdania vozidla mimo otváracích hodín za príplatok 20€. Službu je potrebné dohodnúť vopred."
                      },
                      {
                        question: "Ako môžem platiť za prenájom vozidla?",
                        answer: "Akceptujeme platby kreditnou kartou, bankovým prevodom alebo hotovosťou. Depozit je možné zložiť len kreditnou kartou."
                      }
                    ].map((faq, index) => (
                      <div key={index} className="flex flex-col justify-center items-stretch gap-2 pt-4 pr-4 pb-4 pl-6 bg-[#1E1E23] rounded-lg">
                        <div 
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() => toggleFAQ(index)}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-sm leading-[1.7142857142857142em] whitespace-nowrap overflow-hidden text-ellipsis">
                              {faq.question}
                            </div>
                          </div>
                          <div className="w-6 h-6 flex items-center justify-center">
                            <img 
                              src="/figma-assets/Icon 24 px filled.svg" 
                              alt="Toggle FAQ"
                              className={`w-6 h-6 transition-transform duration-200 ${
                                expandedFAQ[index] ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </div>
                        {expandedFAQ[index] && (
                          <div className="mt-4 pt-4 border-t border-[#37373C]">
                            <p className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm leading-[1.4285714285714286em]">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Right Column */}
                  <div className="flex flex-col gap-4 w-[567px]">
                    {[
                      {
                        question: "Majú vozidlá diaľničnú známku?",
                        answer: "Áno, všetky naše vozidlá majú platnú diaľničnú známku pre Slovensko. Pre ostatné krajiny si diaľničné známky zabezpečte sami."
                      },
                      {
                        question: "Je možná preprava zvierat?",
                        answer: "Preprava zvierat je povolená za dodržania hygienických podmienok. Za dodatočné čistenie vozidla účtujeme poplatok 50€."
                      },
                      {
                        question: "Ako mám postupovať keď viem, že budem meškať?",
                        answer: "Okamžite nás kontaktujte na +421 910 666 949. Meškanie do 1 hodiny je bez poplatku, každá ďalšia hodina je spoplatnená 10€."
                      },
                      {
                        question: "Čo znamená jeden deň prenájmu?",
                        answer: "Jeden deň prenájmu predstavuje 24-hodinové obdobie od času prevzatia vozidla. Prekročenie času je spoplatnené ako ďalší deň."
                      },
                      {
                        question: "Čo ak dostanem pokutu?",
                        answer: "Všetky pokuty a poplatky počas prenájmu znáša nájomca. Administratívny poplatok za vybavenie pokuty je 25€."
                      },
                      {
                        question: "Aké sú podmienky stornácie rezervácie?",
                        answer: "Rezerváciu môžete zrušiť do 24 hodín pred začiatkom prenájmu bez poplatku. Pri neskoršom zrušení účtujeme 50% z ceny prenájmu."
                      }
                    ].map((faq, index) => (
                      <div key={index + 6} className="flex flex-col justify-center items-stretch gap-2 pt-4 pr-4 pb-4 pl-6 bg-[#1E1E23] rounded-lg">
                        <div 
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() => toggleFAQ(index + 6)}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-sm leading-[1.7142857142857142em] whitespace-nowrap overflow-hidden text-ellipsis">
                              {faq.question}
                            </div>
                          </div>
                          <div className="w-6 h-6 flex items-center justify-center">
                            <img 
                              src="/figma-assets/Icon 24 px filled.svg" 
                              alt="Toggle FAQ"
                              className={`w-6 h-6 transition-transform duration-200 ${
                                expandedFAQ[index + 6] ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </div>
                        {expandedFAQ[index + 6] && (
                          <div className="mt-4 pt-4 border-t border-[#37373C]">
                            <p className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm leading-[1.4285714285714286em]">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rychly kontakt 1728 new - POD FAQ */}
              <div className="flex flex-col w-[1328px] items-center pt-24 pb-[72px] px-0 relative mt-20 bg-[#F0F0F5] rounded-3xl">
                {/* Operator Avatar */}
                <div className="absolute w-[104px] h-[104px] -top-12 left-[612px] rounded-[99px] border border-solid border-[#F0F0F5] bg-[url(/operator-avatar-728c4b.jpg)] bg-cover bg-[50%_50%]" />

                {/* Online Status Indicator */}
                <div className="absolute w-3.5 h-3.5 top-[29px] left-[697px] bg-[#3CEB82] rounded-[7px] border border-solid border-[#F0F0F5]" />

                <div className="inline-flex flex-col items-center gap-10 relative flex-[0_0_auto]">
                  <header className="inline-flex flex-col items-start gap-4 relative flex-[0_0_auto]">
                    <h1 className="relative w-[874px] h-6 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-[#283002] text-[32px] text-center tracking-[0] leading-6 whitespace-nowrap">
                      Potrebujete poradiť? Sme tu pre vás.
                    </h1>

                    <p className="relative w-[874px] h-4 [font-family:'Poppins',Helvetica] font-medium text-[#A0A0A5] text-base text-center tracking-[0] leading-6 whitespace-nowrap">
                      Sme na príjme Po–Pia 08:00–17:00
                    </p>
                  </header>

                  <div className="flex h-10 items-center justify-center gap-4 relative self-stretch w-full">
                    <div className="inline-flex items-center justify-center gap-2 relative flex-[0_0_auto]">
                      <img
                        className="relative w-6 h-6"
                        alt="Phone icon"
                        src="/figma-assets/Icon 24 px.svg"
                      />

                      <div className="inline-flex flex-col items-start gap-4 relative flex-[0_0_auto]">
                        <a
                          className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#646469] text-xl tracking-[0] leading-6 whitespace-nowrap hover:text-[#283002] transition-colors duration-200"
                          href="tel:+421910666949"
                          aria-label="Zavolajte nám na číslo +421 910 666 949"
                        >
                          +421 910 666 949
                        </a>
                      </div>
                    </div>

                    <img
                      className="relative self-stretch w-px mt-[-0.50px] mb-[-0.50px]"
                      alt="Divider line"
                      src="/figma-assets/Line.svg"
                    />

                    <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                      <img
                        className="relative w-6 h-6"
                        alt="Email icon"
                        src="/figma-assets/Icon 24 px.svg"
                      />

                      <div className="inline-flex flex-col items-start gap-4 relative flex-[0_0_auto]">
                        <a
                          className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#646469] text-xl tracking-[0] leading-6 whitespace-nowrap hover:text-[#283002] transition-colors duration-200"
                          href="mailto:info@blackrent.sk"
                          aria-label="Napíšte nám e-mail na info@blackrent.sk"
                        >
                          info@blackrent.sk
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background Pattern */}
                <div className="absolute w-[304px] h-[304px] top-0 left-0 rounded-3xl overflow-hidden">
                  <div className="relative w-[294px] h-[660px]">
                    <img
                      className="absolute w-[294px] h-[304px] top-0 left-0"
                      alt="Decorative background vector"
                      src="/figma-assets/Frame.svg"
                    />
                  </div>
                </div>
              </div>

                              {/* Footer Content - Frame 2608550 - posunuté nižšie pod Rychly kontakt */}
                <div className="flex flex-col gap-20 relative mt-20 w-[1328px]">
                  {/* Logo */}
                  <img
                    className="relative w-[214.4px] h-8"
                    alt="BlackRent company logo"
                    src="/brands/blackrent-logo.svg"
                  />

                  {/* Frame 2608546 */}
                  <div className="flex gap-[258px] w-[1328px]">
                    {/* Newsletter Section - Frame 1028 */}
                    <div className="flex flex-col gap-10 w-[422px]">
                      <div className="flex flex-col gap-8 self-stretch">
                        <h3 className="w-[109px] h-4 [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xl tracking-[0] leading-6 whitespace-nowrap">
                          Newsletter
                        </h3>
                        <p className="self-stretch h-8 [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm tracking-[0] leading-5">
                          <span className="[font-family:'Poppins',Helvetica] font-normal text-[#a0a0a5] text-sm tracking-[0] leading-5">
                            Prihláste sa na newsletter a získajte{" "}
                          </span>
                          <span className="font-semibold">5€ voucher </span>
                          <span className="[font-family:'Poppins',Helvetica] font-normal text-[#a0a0a5] text-sm tracking-[0] leading-5">
                            na prenájom vozidla z našej autopožičovňe.
                          </span>
                        </p>
                      </div>

                      <form
                        onSubmit={handleNewsletterSubmit}
                        className="flex w-[422px] items-center justify-between pl-4 pr-2 py-2 bg-colors-black-600 rounded-[99px] overflow-hidden"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <img
                            className="relative w-6 h-6"
                            alt="Email icon"
                            src="/figma-assets/Icon 24 px.svg"
                          />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Váš e-mail"
                            required
                            className="flex-1 [font-family:'Poppins',Helvetica] font-medium text-colors-dark-gray-900 text-sm tracking-[0] leading-6 bg-transparent border-none outline-none placeholder:text-colors-dark-gray-900"
                            aria-label="Zadajte váš e-mail pre newsletter"
                          />
                        </div>
                        <button
                          type="submit"
                          className="inline-flex h-10 items-center justify-center gap-1.5 pl-5 pr-4 py-2 bg-colors-light-yellow-accent-100 rounded-[99px] hover:bg-colors-light-yellow-accent-200 transition-colors duration-200"
                          aria-label="Potvrdiť prihlásenie na newsletter"
                        >
                          <span className="[font-family:'Poppins',Helvetica] font-semibold text-colors-dark-yellow-accent-100 text-sm tracking-[0] leading-6 whitespace-nowrap">
                            Potvrdiť
                          </span>
                          <img
                            className="relative w-4 h-4"
                            alt="Submit arrow icon"
                            src="/figma-assets/arrow-small-down.svg"
                          />
                        </button>
                      </form>
                    </div>

                    {/* Frame 2608547 */}
                    <div className="flex justify-between gap-8 flex-1">
                      {/* Mapa stránok - Frame 504 */}
                      <div className="flex flex-col gap-8 w-[195px]">
                        <h3 className="h-4 [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xl tracking-[0] leading-6">
                          Mapa stránok
                        </h3>
                        <nav aria-label="Site navigation">
                          <div className="[font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6">
                            {navigationLinks.map((link, index) => (
                              <div key={index} className="mb-1">
                                <a
                                  href={link.href}
                                  className={`hover:underline transition-colors duration-200 ${
                                    link.active
                                      ? "text-[#f0ff98] font-medium"
                                      : "text-[#FAFAFF] hover:text-colors-white-800"
                                  }`}
                                >
                                  {link.label}
                                </a>
                              </div>
                            ))}
                          </div>
                        </nav>
                      </div>

                      {/* Frame 2608548 */}
                      <div className="flex flex-col gap-10 w-[195px]">
                        {/* Sídlo spoločnosti - Frame 1030 */}
                        <div className="flex flex-col gap-8">
                          <h3 className="h-4 [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xl tracking-[0] leading-6">
                            Sídlo spoločnosti
                          </h3>
                          <address className="[font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm tracking-[0] leading-6 not-italic">
                            <p className="m-0">Rozmarínová 211/3</p>
                            <p className="m-0">91101 Trenčín</p>
                            <p className="m-0">
                              <a
                                href="tel:+421910666949"
                                className="text-colors-ligh-gray-200 hover:text-colors-white-800 transition-colors duration-200"
                              >
                                +421 910 666 949
                              </a>
                            </p>
                            <p className="m-0">
                              <a
                                href="mailto:info@blackrent.sk"
                                className="text-colors-ligh-gray-200 hover:text-colors-white-800 transition-colors duration-200"
                              >
                                info@blackrent.sk
                              </a>
                            </p>
                          </address>
                        </div>

                        {/* Frame 2608549 */}
                        <div className="flex flex-col gap-8">
                          {/* Sledujte nás - Frame 1032 */}
                          <div className="flex flex-col gap-10">
                            <h3 className="h-4 [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xl tracking-[0] leading-6">
                              Sledujte nás
                            </h3>
                          </div>
                          {/* Frame 296 */}
                          <div className="inline-flex gap-4" role="list">
                            {socialMediaLinks.map((social, index) => (
                              <a
                                key={index}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:opacity-80 transition-opacity duration-200"
                                aria-label={`Sledujte nás na ${social.alt}`}
                                role="listitem"
                              >
                                <img
                                  className="relative w-6 h-6"
                                  alt={`${social.alt} icon`}
                                  src={social.icon}
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Copyright */}
                <div className="flex w-[1728px] h-24 items-center gap-2 px-[200px] py-0 relative bg-black">
                  <p className="relative w-[855px] h-2 [font-family:'Poppins',Helvetica] font-normal text-colors-black-1000 text-xs tracking-[0] leading-6 whitespace-nowrap">
                    © 2024 blackrent.sk | {footerLinks.join(" | ")}
                  </p>
                </div>
              </div>


          </>
        )}

        {/* Image Modal */}
        {isImageModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95"
            onClick={handleCloseModal}
          >
            {/* Modal Content */}
            <div 
              className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute -top-12 right-0 z-10 w-10 h-10 flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all duration-200"
                aria-label="Zavrieť galériu"
              >
                <svg 
                  className="w-6 h-6 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </button>

              {/* Image Counter */}
              <div className="absolute -top-12 left-0 z-10 text-white text-sm font-medium">
                {selectedImageIndex + 1} / {vehicleImages.length}
              </div>

              {/* Main Image */}
              <div className="relative">
                <img
                  src={vehicleImages[selectedImageIndex].url}
                  alt={vehicleImages[selectedImageIndex].alt}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />

                {/* Navigation Arrows */}
                {vehicleImages.length > 1 && (
                  <>
                    {/* Previous Button */}
                    <button
                      onClick={handlePreviousImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all duration-200"
                      aria-label="Predchádzajúci obrázok"
                    >
                      <svg 
                        className="w-6 h-6 text-white" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M15 19l-7-7 7-7" 
                        />
                      </svg>
                    </button>

                    {/* Next Button */}
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all duration-200"
                      aria-label="Ďalší obrázok"
                    >
                      <svg 
                        className="w-6 h-6 text-white" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9 5l7 7-7 7" 
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Image Description */}
              <div className="mt-4 text-center">
                <p className="text-white text-sm font-medium">
                  {vehicleImages[selectedImageIndex].alt}
                </p>
              </div>

              {/* Thumbnail Navigation */}
              <div className="flex gap-2 mt-6 max-w-full overflow-x-auto px-4">
                {vehicleImages.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      index === selectedImageIndex 
                        ? 'border-[#F0FF98] opacity-100' 
                        : 'border-transparent opacity-60 hover:opacity-80'
                    }`}
                    aria-label={`Zobraziť ${image.alt}`}
                  >
                    <img
                      src={image.thumbnailUrl}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
