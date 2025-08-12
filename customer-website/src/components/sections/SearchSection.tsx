export default function SearchSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Search Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Pohľadajte si auto od dnes
          </h2>
        </div>

        {/* Search Form */}
        <div className="bg-surface rounded-2xl p-8 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Location */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">
                📍 Miesto vyzdvihnutia
              </label>
              <select className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-3 focus:border-yellow-400 focus:outline-none">
                <option>Bratislava</option>
                <option>Košice</option>
                <option>Žilina</option>
              </select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">
                📅 Dátum od
              </label>
              <input 
                type="date" 
                className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-3 focus:border-yellow-400 focus:outline-none"
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">
                📅 Dátum do
              </label>
              <input 
                type="date" 
                className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-3 focus:border-yellow-400 focus:outline-none"
              />
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button className="w-full bg-accent text-black font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-all">
                Hľadať
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}