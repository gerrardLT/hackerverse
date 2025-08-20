import { HeroSection } from '@/components/home/hero-section'
import { FeaturedHackathons } from '@/components/home/featured-hackathons'
import { StatsSection } from '@/components/home/stats-section'
import { HowItWorks } from '@/components/home/how-it-works'
import { CommunitySection } from '@/components/home/community-section'

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <FeaturedHackathons />
      <StatsSection />
      <HowItWorks />
      <CommunitySection />
    </div>
  )
}
