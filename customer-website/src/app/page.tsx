import Header from '@/components/layout/Header'
import HeroSection from '@/components/sections/HeroSection'
import FilterSection from '@/components/sections/FilterSection'
import VehicleGrid from '@/components/sections/VehicleGrid'
import BrandLogosFirejet from '@/components/firejet/BrandLogosFirejet'
import BannerStandard from '@/components/sections/BannerStandard'
import StoreSection from '@/components/sections/StoreSection'
import ReviewsSection from '@/components/sections/ReviewsSection'
import FAQSection from '@/components/sections/FAQSection'
import ContactSection from '@/components/sections/ContactSection'
import Footer from '@/components/layout/Footer'

export default function Home() {
  return (
    <main className="bg-blackrent-dark">
      <Header />
      <HeroSection />
      <FilterSection />
      <BrandLogosFirejet />
      <VehicleGrid />
      <BannerStandard />
      <StoreSection />
      <ReviewsSection />
      <FAQSection />
      <ContactSection />
      <Footer />
    </main>
  )
}