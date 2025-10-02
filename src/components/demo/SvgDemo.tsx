import React from 'react';

import CarIcon from '@/assets/icon-car.svg?react';
import samplePng from '@/assets/sample.png';
import ReactLogo from '@/logo.svg?react';

/**
 * Demo komponent pre testovanie SVG ako React komponenty a asset importov
 * Testuje:
 * - SVG import ako React komponent s ?react suffix
 * - PNG import z src/assets
 * - Public assets cez /public URL
 * - CSS/Tailwind styling
 */
export const SvgDemo: React.FC = () => {
  return (
    <div className="p-8 bg-gray-50 rounded-lg shadow-md max-w-md mx-auto my-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        SVG & Assets Demo
      </h2>

      {/* SVG ako React komponenty */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          SVG ako React komponenty:
        </h3>
        <div className="flex items-center space-x-4">
          <CarIcon className="w-8 h-8 text-blue-600" />
          <span className="text-sm text-gray-600">CarIcon (custom SVG)</span>
        </div>
        <div className="flex items-center space-x-4 mt-2">
          <ReactLogo className="w-8 h-8 text-blue-400" />
          <span className="text-sm text-gray-600">
            ReactLogo (existujúci SVG)
          </span>
        </div>
      </div>

      {/* PNG import z src/assets */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          PNG z src/assets:
        </h3>
        <div className="flex items-center space-x-4">
          <img
            src={samplePng}
            alt="Sample PNG"
            className="w-8 h-8 bg-red-200"
          />
          <span className="text-sm text-gray-600">
            sample.png (importovaný)
          </span>
        </div>
      </div>

      {/* Public assets */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Public assets:
        </h3>
        <div className="flex items-center space-x-4">
          <img src="/logo192.png" alt="Public Logo" className="w-8 h-8" />
          <span className="text-sm text-gray-600">logo192.png (z public/)</span>
        </div>
      </div>

      {/* CSS/Tailwind test */}
      <div className="bg-blue-100 p-4 rounded border-l-4 border-blue-500">
        <p className="text-blue-800 font-medium">
          ✅ Tailwind CSS funguje správne!
        </p>
        <p className="text-blue-600 text-sm mt-1">
          Gradient, padding, border a typography sú aplikované.
        </p>
      </div>
    </div>
  );
};

export default SvgDemo;
