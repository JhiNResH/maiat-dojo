'use client';

import { useDarkMode } from '@/app/DarkModeContext';

export default function CheckoutCard() {
  const { isDark } = useDarkMode();
  const ink = isDark ? 'text-white' : 'text-[#1a1a1a]';
  const muted = isDark ? 'text-gray-500' : 'text-[#1a1a1a]/40';
  const faint = isDark ? 'text-gray-600' : 'text-[#1a1a1a]/30';
  const rule = isDark ? 'border-white/10' : 'border-[#1a1a1a]/15';
  const ruleLight = isDark ? 'border-white/[0.06]' : 'border-[#1a1a1a]/10';
  const topRule = isDark ? 'border-white/10' : 'border-[#1a1a1a]/20';

  return (
    <div className={`border-t border-dotted ${topRule} pt-4 mt-4`}>
      <div className="space-y-3">
        {/* Settlement section */}
        <div className={`font-mono text-[10px] ${muted} uppercase tracking-wider mb-1`}>
          Settlement
        </div>
        <div className={`border-t border-dotted ${rule} pt-2 space-y-0`}>
          {[
            { label: 'Network', value: 'BNB Smart Chain' },
            { label: 'Standard', value: 'ERC-8183' },
            { label: 'Payment', value: 'USDC per call' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className={`flex justify-between items-center py-1 border-b border-dotted ${ruleLight} last:border-b-0`}
            >
              <span className={`font-mono text-[10px] ${muted} uppercase tracking-wider`}>
                {label}
              </span>
              <span className={`font-mono text-[10px] ${ink} font-bold`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Revenue split section */}
        <div className={`font-mono text-[10px] ${muted} uppercase tracking-wider mt-3 mb-1`}>
          Revenue Split
        </div>
        <div className={`border-t border-dotted ${rule} pt-2 space-y-0`}>
          {[
            { label: 'Creator', value: '95%' },
            { label: 'Protocol', value: '5%' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className={`flex justify-between items-center py-1 border-b border-dotted ${ruleLight} last:border-b-0`}
            >
              <span className={`font-mono text-[10px] ${muted} uppercase tracking-wider`}>
                {label}
              </span>
              <span className={`font-mono text-[10px] ${ink} font-bold`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Footer line */}
        <div className={`font-mono text-[9px] ${faint} border-l-2 ${rule} pl-2 mt-2`}>
          Escrow: ERC-8183 · Settle: on PASS
        </div>
      </div>
    </div>
  );
}
