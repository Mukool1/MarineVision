import Navbar from './Navbar'
import Hero from './Hero'
import Marquee from './Marquee'
import HowItWorks from './HowItWorks'
import DepthDive from './DepthDive'
import Showcase from './Showcase'
import Features from './Features'
import Stats from './Stats'
import { FinalCTA, Footer } from './Closing'

export default function LandingPage({ onLaunch }) {
  return (
    <div className="relative min-h-screen bg-[#030b12] text-slate-200">
      <Navbar onLaunch={onLaunch} />
      <main>
        <Hero onLaunch={onLaunch} />
        <Marquee />
        <HowItWorks />
        <DepthDive />
        <Showcase />
        <Features />
        <Stats />
        <FinalCTA onLaunch={onLaunch} />
      </main>
      <Footer />
    </div>
  )
}
