'use client'

import BlackrentLogo1 from './assets/BlackrentLogo1'

export default function FooterFirejet({
  className = "",
}: FooterFirejetProps) {
  return (
    <footer className={`bg-blackrent-surface border-t border-blackrent-card ${className}`}>
      <div className="container mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <BlackrentLogo1 className="h-8 w-52 mb-4" />
            <p className="text-blackrent-text-secondary mb-6 max-w-md">
              Autá pre každodennú potrebu, aj nezabudnuteľný zážitok. 
              Spolupracujeme s desiatkami preverených autopožičovní na Slovensku.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-poppins font-semibold text-blackrent-text-primary mb-4">
              Rýchle odkazy
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="#ponuka-vozidiel" className="text-blackrent-text-secondary hover:text-blackrent-accent transition-colors">
                  Ponuka vozidiel
                </a>
              </li>
              <li>
                <a href="#sluzby" className="text-blackrent-text-secondary hover:text-blackrent-accent transition-colors">
                  Naše služby
                </a>
              </li>
              <li>
                <a href="#o-nas" className="text-blackrent-text-secondary hover:text-blackrent-accent transition-colors">
                  O nás
                </a>
              </li>
              <li>
                <a href="#kontakt" className="text-blackrent-text-secondary hover:text-blackrent-accent transition-colors">
                  Kontakt
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-poppins font-semibold text-blackrent-text-primary mb-4">
              Právne informácie
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="#obchodne-podmienky" className="text-blackrent-text-secondary hover:text-blackrent-accent transition-colors">
                  Obchodné podmienky
                </a>
              </li>
              <li>
                <a href="#reklamacny-poriadok" className="text-blackrent-text-secondary hover:text-blackrent-accent transition-colors">
                  Reklamačný poriadok
                </a>
              </li>
              <li>
                <a href="#ochrana-udajov" className="text-blackrent-text-secondary hover:text-blackrent-accent transition-colors">
                  Ochrana osobných údajov
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blackrent-card mt-8 pt-8 text-center">
          <p className="text-blackrent-text-secondary">
            © 2024 BlackRent.sk. Všetky práva vyhradené.
          </p>
        </div>
      </div>
    </footer>
  )
}

interface FooterFirejetProps {
  className?: string;
}
