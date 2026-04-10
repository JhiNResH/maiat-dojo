'use client';

export default function CheckoutCard() {
  return (
    <div className="border-t border-dotted border-[#1a1a1a]/20 pt-4 mt-4">
      <div className="space-y-3">
        {/* Settlement section */}
        <div className="font-mono text-[10px] text-[#1a1a1a]/40 uppercase tracking-wider mb-1">
          Settlement
        </div>
        <div className="border-t border-dotted border-[#1a1a1a]/15 pt-2 space-y-0">
          {[
            { label: 'Network', value: 'BNB Smart Chain' },
            { label: 'Standard', value: 'ERC-8183' },
            { label: 'Payment', value: 'USDC per call' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex justify-between items-center py-1 border-b border-dotted border-[#1a1a1a]/10 last:border-b-0"
            >
              <span className="font-mono text-[10px] text-[#1a1a1a]/40 uppercase tracking-wider">
                {label}
              </span>
              <span className="font-mono text-[10px] text-[#1a1a1a] font-bold">{value}</span>
            </div>
          ))}
        </div>

        {/* Revenue split section */}
        <div className="font-mono text-[10px] text-[#1a1a1a]/40 uppercase tracking-wider mt-3 mb-1">
          Revenue Split
        </div>
        <div className="border-t border-dotted border-[#1a1a1a]/15 pt-2 space-y-0">
          {[
            { label: 'Creator', value: '95%' },
            { label: 'Protocol', value: '5%' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex justify-between items-center py-1 border-b border-dotted border-[#1a1a1a]/10 last:border-b-0"
            >
              <span className="font-mono text-[10px] text-[#1a1a1a]/40 uppercase tracking-wider">
                {label}
              </span>
              <span className="font-mono text-[10px] text-[#1a1a1a] font-bold">{value}</span>
            </div>
          ))}
        </div>

        {/* Footer line */}
        <div className="font-mono text-[9px] text-[#1a1a1a]/30 border-l-2 border-[#1a1a1a]/15 pl-2 mt-2">
          Escrow: ERC-8183 · Settle: on PASS
        </div>
      </div>
    </div>
  );
}
