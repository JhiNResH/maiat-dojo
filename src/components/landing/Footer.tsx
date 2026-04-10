'use client';

import Link from 'next/link';
import { Github, Twitter } from 'lucide-react';
import { useDarkMode } from '@/app/DarkModeContext';

export function Footer() {
  const { isDark } = useDarkMode();

  return (
    <footer
      className="pt-32 pb-12 px-8 border-t"
      style={{
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        background: isDark
          ? '#0A0A0A'
          : 'linear-gradient(180deg, #ffffff 0%, #f5f0e8 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-16 mb-32">
        <div className="col-span-2">
          <div className="flex items-center gap-3 mb-8">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                isDark ? 'bg-white text-black' : 'bg-black text-white'
              }`}
            >
              道
            </div>
            <span
              className={`font-sans font-semibold text-xl tracking-wide ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              dojo
            </span>
          </div>
          <p className="mb-8 max-w-xs leading-relaxed text-gray-400">
            The skill marketplace for AI agents. On-chain trust, paid per call.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://twitter.com/0xmaiat"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-lg border transition-opacity hover:opacity-70 ${
                isDark ? 'border-white/10 text-gray-400' : 'border-black/10 text-gray-500'
              }`}
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/JhiNResH/maiat-dojo"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-lg border transition-opacity hover:opacity-70 ${
                isDark ? 'border-white/10 text-gray-400' : 'border-black/10 text-gray-500'
              }`}
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div>
          <h4
            className={`text-[11px] font-bold uppercase tracking-[3px] mb-8 ${
              isDark ? 'text-white' : 'text-black'
            }`}
          >
            Marketplace
          </h4>
          <ul className="space-y-4 text-sm font-medium text-gray-400">
            <li>
              <Link href="/" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-black'}`}>
                Browse skills
              </Link>
            </li>
            <li>
              <Link
                href="/leaderboard"
                className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-black'}`}
              >
                Leaderboard
              </Link>
            </li>
            <li>
              <Link
                href="/create"
                className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-black'}`}
              >
                List a skill
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4
            className={`text-[11px] font-bold uppercase tracking-[3px] mb-8 ${
              isDark ? 'text-white' : 'text-black'
            }`}
          >
            Developers
          </h4>
          <ul className="space-y-4 text-sm font-medium text-gray-400">
            <li>
              <a
                href="https://github.com/JhiNResH/maiat-dojo"
                target="_blank"
                rel="noopener noreferrer"
                className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-black'}`}
              >
                GitHub
              </a>
            </li>
            <li>
              <Link
                href="/demo"
                className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-black'}`}
              >
                Demo
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4
            className={`text-[11px] font-bold uppercase tracking-[3px] mb-8 ${
              isDark ? 'text-white' : 'text-black'
            }`}
          >
            Trust layer
          </h4>
          <p className="text-sm leading-relaxed text-gray-400 mb-6">
            Every skill call settles on BSC. Trust scores are public and on-chain.
          </p>
          <a
            href="https://maiat.io"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-medium border transition-opacity hover:opacity-70 w-full ${
              isDark
                ? 'text-white border-white/20 bg-white/5'
                : 'text-black border-black/10 bg-white'
            }`}
          >
            Maiat Protocol
          </a>
        </div>
      </div>

      <div
        className={`max-w-7xl mx-auto pt-12 border-t flex flex-col md:flex-row items-center justify-between text-[10px] font-bold uppercase tracking-widest gap-6 ${
          isDark ? 'border-white/10 text-gray-600' : 'border-black/5 text-gray-400'
        }`}
      >
        <p>© 2026 The Dojo · Maiat Protocol · BSC</p>
        <div className="flex items-center gap-4">
          <span>MIT License</span>
          <a
            href="https://github.com/JhiNResH/maiat-dojo"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-70"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
