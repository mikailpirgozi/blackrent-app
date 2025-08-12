export default function FeaturedVehicle() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center">
            {/* Content */}
            <div className="p-8 lg:p-12">
              <div className="inline-block bg-accent text-black text-sm font-bold px-3 py-1 rounded-full mb-4">
                ODPORUČUJEME
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold text-black mb-4">
                TESLA Model S
              </h2>
              
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Zažite budúcnosť jazdy s najnovším modelom Tesla Model S. 
                Elektrická luxusná limuzína s neobmedzeným dojazdom a 
                najmodernejšími technológiami.
              </p>
              
              <div className="flex items-center space-x-4">
                <button className="bg-accent text-black font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-all">
                  Prenajať teraz
                </button>
                <div className="text-black">
                  <span className="text-3xl font-bold">€299</span>
                  <span className="text-gray-600 ml-1">/deň</span>
                </div>
              </div>
            </div>

            {/* Tesla Image */}
            <div className="relative h-80 lg:h-96 bg-gradient-to-br from-blue-100 to-blue-200">
              {/* Placeholder for Tesla image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-80 h-40 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">TESLA MODEL S</span>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-4 right-4 w-8 h-8 bg-yellow-400 rounded-full opacity-20" />
              <div className="absolute bottom-8 left-8 w-12 h-12 bg-blue-300 rounded-full opacity-30" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}