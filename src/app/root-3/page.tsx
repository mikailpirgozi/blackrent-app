import MenuRoot3 from '@/components/firejet/MenuRoot3'
import FrameRoot3 from '@/components/firejet/FrameRoot3'

export default function Root3Page() {
  return (
    <div className="min-h-screen bg-blackrent-dark">
      {/* Header s Menu komponentom */}
      <header className="fixed top-0 left-0 right-0 z-[1000] bg-blackrent-dark">
        <MenuRoot3 />
      </header>

      {/* Hero sekcia s Frame komponentom */}
      <main className="pt-[88px]">
        <section className="relative bg-blackrent-dark overflow-hidden">
          <div className="absolute top-[-400px] left-[250px] w-[800px] h-[800px] bg-blackrent-text-primary rounded-full opacity-10 blur-[500px] pointer-events-none"></div>
          <div className="pt-[168px] pb-[100px]">
            <FrameRoot3 />
          </div>
        </section>
      </main>
    </div>
  )
}
