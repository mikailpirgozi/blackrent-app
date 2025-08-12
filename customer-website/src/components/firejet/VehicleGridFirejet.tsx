'use client'

import KartaVozidlaHomepage from './KartaVozidlaHomepage'
import Icon24Px from './assets/Icon24Px'

export default function VehicleGridFirejet({
  className = "",
}: VehicleGridFirejetProps) {
  // Sample vehicle data - v produkčnej verzii by to bolo z API
  const vehicles = [
    { id: 1, image: "/figma-assets/vehicle-placeholder.jpg", name: "BMW X5", specs: "250 kW • Benzín • Automatik • 4WD", price: "89" },
    { id: 2, image: "/figma-assets/vehicle-placeholder.jpg", name: "Audi A4", specs: "140 kW • Diesel • Manuál • FWD", price: "65" },
    { id: 3, image: "/figma-assets/vehicle-placeholder.jpg", name: "Tesla Model S", specs: "350 kW • Elektro • Automatik • AWD", price: "120" },
    { id: 4, image: "/figma-assets/vehicle-placeholder.jpg", name: "Mercedes C-Class", specs: "180 kW • Benzín • Automatik • RWD", price: "75" },
  ]

  return (
    <section className={`bg-blackrent-dark py-20 ${className}`}>
      <div className="container mx-auto px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-sf-pro text-4xl font-bold text-blackrent-accent mb-4">
            Naša ponuka vozidiel
          </h2>
          <p className="text-blackrent-text-secondary text-lg">
            Vyberte si z našej širokej ponuky kvalitných vozidiel
          </p>
        </div>

        {/* Vehicle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
          {vehicles.map((vehicle) => (
            <KartaVozidlaHomepage
              key={vehicle.id}
              className="transform hover:scale-105 transition-transform duration-300"
              attr1={vehicle.image}
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <button className="flex items-center gap-2 mx-auto bg-blackrent-accent text-blackrent-green-text font-poppins font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity">
            <span>Všetky vozidlá</span>
            <Icon24Px className="h-6 w-6" />
          </button>
        </div>
      </div>
    </section>
  )
}

interface VehicleGridFirejetProps {
  className?: string;
}
