'use client';

import { motion } from 'framer-motion';
import { useDarkMode } from '@/app/DarkModeContext';

export function BackgroundEffect() {
  const { isDark } = useDarkMode();

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div
        animate={{ scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-1000 ${
          isDark ? 'bg-blue-900/20' : 'bg-blue-100/30'
        }`}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], x: [0, -30, 0], y: [0, 30, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] transition-colors duration-1000 ${
          isDark ? 'bg-purple-900/10' : 'bg-orange-50/40'
        }`}
      />
    </div>
  );
}
