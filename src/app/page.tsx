import Hero from '@/components/public/Hero';
import StatsDashboard from '@/components/public/StatsDashboard';
import BeachMap from '@/components/public/BeachMap';
import Sponsors from '@/components/public/Sponsors';
import LiveStream from '@/components/public/LiveStream';
import LiveRankings from '@/components/public/LiveRankings';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import dynamic from 'next/dynamic';

const LiveSectorRankings = dynamic(() => import('@/components/public/LiveSectorRankings'), { ssr: false });
const LiveGeneralRanking = dynamic(() => import('@/components/public/LiveGeneralRanking'), { ssr: false });
const ContentProtection = dynamic(() => import('@/components/security/ContentProtection'), { ssr: false });
const Watermark = dynamic(() => import('@/components/security/Watermark'), { ssr: false });

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sand-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <ContentProtection />
      <Watermark />
      <Header />
      
      <main>
        <Hero />
        <LiveSectorRankings />
        <LiveGeneralRanking />
        <StatsDashboard />
        <BeachMap />
        <LiveStream />
        <Sponsors />
      </main>
      
      <Footer />
    </div>
  );
}