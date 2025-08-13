import React from "react";

export default function Home() {
  return (
    <div className="w-full flex flex-col bg-[#05050a] relative overflow-x-hidden min-h-screen">
      {/* Background blur effect */}
      <div className="absolute w-[400px] md:w-[600px] lg:w-[800px] h-[400px] md:h-[600px] lg:h-[800px] top-0 left-1/2 transform -translate-x-1/2 bg-[#1e1e23] rounded-[200px] md:rounded-[300px] lg:rounded-[400px] blur-[150px] md:blur-[200px] lg:blur-[250px] opacity-50 z-0" />
      
      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            BlackRent
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Prenájom vozidiel na Slovensku
          </p>
          <div className="space-x-4">
            <a 
              href="/vozidla" 
              className="inline-block bg-[#F0FF98] text-black px-8 py-3 rounded-full font-semibold hover:bg-[#E4FF56] transition-colors"
            >
              Ponuka vozidiel
            </a>
            <a 
              href="/vozidla/ford-mustang" 
              className="inline-block border border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-black transition-colors"
            >
              Detail vozidla
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}