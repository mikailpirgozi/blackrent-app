'use client'

import VehicleGridRoot4 from '@/components/firejet/VehicleGridRoot4'

export default function VehicleGrid() {
  return (
    <section className="pt-[128px]">
      <VehicleGridRoot4 />
      {/* CTA Všetky vozidlá – presne pod gridom, vystredené */}
      <div className="text-center mt-12">
        <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blackrent-green text-blackrent-green-text font-poppins font-semibold hover:opacity-90 transition-opacity">
          Všetky vozidlá
          <span className="inline-block w-6 h-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </span>
        </button>
      </div>
    </section>
  )
}