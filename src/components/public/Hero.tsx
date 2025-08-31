'use client';

import { useTranslations } from '@/components/providers/TranslationProvider';
import { Trophy, MapPin, Calendar, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';

export default function Hero() {
  const t = useTranslations('hero');

  const stats = [
    { icon: Users, value: '120', label: t('competitors') },
    { icon: Trophy, value: '6', label: t('sectors') },
    { icon: Calendar, value: '7', label: t('hours') },
    { icon: MapPin, value: '1', label: t('location') },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 ocean-gradient opacity-90" />
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: 'url(https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1920)' }}
      />
      
      {/* Wave animation */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white/10 to-transparent backdrop-blur-sm" />

      <div className="relative container mx-auto px-4 py-20 lg:py-32">
        <div className="text-center text-white">
          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {t('title')}
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl mb-8 text-ocean-100 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            The most luxurious Surfcasting competition in the world
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => document.getElementById('classement-general')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('viewRankings')}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-ocean-600"
              onClick={() => document.getElementById('live-stream')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('watchLive')}
            </Button>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {stats.map((stat, index) => (
              <div key={index} className="glass rounded-lg p-6 text-center">
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-sand-300" />
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-ocean-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}