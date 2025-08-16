// Shared footer data extracted from ElementDetailVozidla
export const navigationLinks = [
  { label: "Ponuka vozidiel", href: "/vozidla", active: false },
  { label: "Služby", href: "/services", active: false },
  { label: "Store", href: "/store", active: false },
  { label: "Kontakt", href: "/contact", active: false },
  { label: "O nás", href: "/about", active: true },
  { label: "Prihlásenie a Registrácia", href: "/auth", active: false },
];

export const socialMediaLinks = [
  {
    icon: "/assets/icons/facebook-icon.svg",
    href: "https://facebook.com/blackrent",
    alt: "Facebook",
  },
  {
    icon: "/assets/icons/instagram-icon.svg", 
    href: "https://instagram.com/blackrent",
    alt: "Instagram",
  },
  {
    icon: "/assets/icons/tiktok-icon.svg",
    href: "https://tiktok.com/@blackrent",
    alt: "TikTok",
  },
];

export const footerLinks = [
  "Obchodné podmienky",
  "Pravidlá pre súbory cookies", 
  "Reklamačný poriadok",
  "Ochrana osobných údajov",
];

export const contactInfo = {
  phone: "+421 910 666 949",
  email: "info@blackrent.sk",
  address: {
    street: "Rozmarínová 211/3",
    city: "91101 Trenčín",
  },
  workingHours: "Sme na príjme Po–Pia 08:00–17:00",
};

export const operatorAvatar = {
  image: "/assets/misc/operator-avatar-728c4b.png",
  alt: "Operátor BlackRent",
};
