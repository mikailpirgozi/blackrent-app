"use client";

import { Poppins } from 'next/font/google'
import './globals.css'
import '../styles/filter-animations.css'
import BurgerMenu from '@/components/figma/Menu/BurgerMenu'
import React, { useState } from 'react'
import Header from '@/components/figma/Menu/Header'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);

  const handleBurgerMenuToggle = (isOpen: boolean) => {
    setIsBurgerMenuOpen(isOpen);
  };

  return (
    <html lang="sk" className={poppins.variable}>
      <body className="antialiased">

        <div className="w-full flex flex-col bg-[#05050a] relative overflow-x-hidden min-h-screen">

          <Header onBurgerMenuToggle={handleBurgerMenuToggle} />

          {/* Mobile Menu Overlay - shows when burger menu is open */}
          {isBurgerMenuOpen ? (
            <BurgerMenu />
          ) : (
            <>
              {children}
            </>
          )}

        </div>
      </body>
    </html>
  )
}