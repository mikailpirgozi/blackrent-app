'use client'

import KartaRecenzieMobil from './KartaRecenzieMobil'

export default function ReviewsSectionFirejet({
  className = "",
}: ReviewsSectionFirejetProps) {
  // Sample reviews data
  const reviews = [
    {
      id: 1,
      author: "Jakub B.",
      content: "Výborné služby, profesionálny prístup a kvalitné vozidlá. Určite odporúčam!",
      backgroundImage: "bg-gradient-to-br from-blue-600 to-blue-800"
    },
    {
      id: 2,
      author: "Mária K.",
      content: "Rýchle vybavenie, čisté auto a férové ceny. Budem určite využívať ich služby aj naďalej.",
      backgroundImage: "bg-gradient-to-br from-green-600 to-green-800"
    },
    {
      id: 3,
      author: "Peter S.",
      content: "Skvelá komunikácia, vozidlo v perfektnom stave. Prenájom prebehol bez problémov.",
      backgroundImage: "bg-gradient-to-br from-purple-600 to-purple-800"
    },
  ]

  return (
    <section className={`bg-blackrent-dark py-20 ${className}`}>
      <div className="container mx-auto px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-sf-pro text-4xl font-bold text-blackrent-accent mb-4">
            Recenzie našich zákazníkov
          </h2>
          <p className="text-blackrent-text-secondary text-lg">
            Čo o nás hovoria naši spokojní zákazníci
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review) => (
            <KartaRecenzieMobil
              key={review.id}
              className="transform hover:scale-105 transition-transform duration-300"
              container1={review.backgroundImage}
              text={review.author}
            />
          ))}
        </div>

        {/* View All Reviews Button */}
        <div className="text-center mt-12">
          <button className="px-6 py-3 bg-blackrent-accent text-blackrent-green-text rounded-full font-poppins font-semibold hover:opacity-90 transition-opacity">
            Zobraziť všetky recenzie
          </button>
        </div>
      </div>
    </section>
  )
}

interface ReviewsSectionFirejetProps {
  className?: string;
}
