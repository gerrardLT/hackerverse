import { useTranslations } from 'next-intl';
import { HeroSection } from '@/components/home/hero-section'
import { FeaturedHackathons } from '@/components/home/featured-hackathons'
import { StatsSection } from '@/components/home/stats-section'

export default function HomePage() {
  return (
    <div className="flex flex-col w-full bg-background">
      <HeroSection />
      <StatsSection />
      <FeaturedHackathons />
    </div>
  )
}